import type { ConfigService } from '@nestjs/config';
import { SmsService } from './sms.service';

const configWith = (values: Record<string, string>) =>
  ({ get: (key: string) => values[key] }) as unknown as ConfigService;

const okResponse = () => ({ ok: true, status: 200, json: async () => ({}) }) as Response;

describe('SmsService', () => {
  const fetchMock = jest.fn();

  beforeEach(() => {
    fetchMock.mockReset();
    global.fetch = fetchMock;
  });

  describe('configuration', () => {
    it('defaults to "log" and sends nothing over the network', async () => {
      const service = new SmsService(configWith({}));

      await expect(service.send('0612345678', 'Bonjour')).resolves.toBe(true);
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it('refuses to start with an unknown provider', () => {
      expect(() => new SmsService(configWith({ SMS_PROVIDER: 'carrier-pigeon' }))).toThrow('SMS_PROVIDER inconnu');
    });

    it.each([
      ['textbee', 'TEXTBEE_API_KEY'],
      ['twilio', 'TWILIO_ACCOUNT_SID'],
    ])('refuses to start "%s" without %s', (provider, missingKey) => {
      expect(() => new SmsService(configWith({ SMS_PROVIDER: provider }))).toThrow(missingKey);
    });
  });

  describe('textbee', () => {
    const service = new SmsService(configWith({ SMS_PROVIDER: 'textbee', TEXTBEE_API_KEY: 'key-123' }));

    it('sends JSON with the API key and the number in international format', async () => {
      fetchMock.mockResolvedValue(okResponse());

      await expect(service.send('06 12 34 56 78', 'Bonjour')).resolves.toBe(true);

      const [url, init] = fetchMock.mock.calls[0];
      expect(url).toBe('https://api.textbee.dev/api/v1/gateway/send-sms');
      expect(init.headers['x-api-key']).toBe('key-123');
      expect(JSON.parse(init.body)).toEqual({ recipients: ['+33612345678'], message: 'Bonjour' });
    });

    it('adds the device id when one is configured', async () => {
      fetchMock.mockResolvedValue(okResponse());
      const withDevice = new SmsService(
        configWith({ SMS_PROVIDER: 'textbee', TEXTBEE_API_KEY: 'k', TEXTBEE_DEVICE_ID: 'device-1' }),
      );

      await withDevice.send('0612345678', 'x');

      expect(JSON.parse(fetchMock.mock.calls[0][1].body).deviceId).toBe('device-1');
    });
  });

  describe('twilio', () => {
    const service = new SmsService(
      configWith({
        SMS_PROVIDER: 'twilio',
        TWILIO_ACCOUNT_SID: 'AC123',
        TWILIO_AUTH_TOKEN: 'tok',
        TWILIO_FROM: '+15005550006',
      }),
    );

    it('sends a form with Basic authentication', async () => {
      fetchMock.mockResolvedValue(okResponse());

      await service.send('0612345678', 'Bonjour');

      const [url, init] = fetchMock.mock.calls[0];
      expect(url).toBe('https://api.twilio.com/2010-04-01/Accounts/AC123/Messages.json');
      expect(init.headers.Authorization).toBe(`Basic ${Buffer.from('AC123:tok').toString('base64')}`);
      expect(Object.fromEntries(init.body)).toEqual({ To: '+33612345678', From: '+15005550006', Body: 'Bonjour' });
    });
  });

  describe('failures never throw (a saved reservation must stay valid)', () => {
    const service = new SmsService(configWith({ SMS_PROVIDER: 'textbee', TEXTBEE_API_KEY: 'k' }));

    it('returns false when the provider refuses the message', async () => {
      fetchMock.mockResolvedValue({ ok: false, status: 429, json: async () => ({ error: 'Daily limit reached' }) });

      await expect(service.send('0612345678', 'x')).resolves.toBe(false);
    });

    it('returns false when the network fails', async () => {
      fetchMock.mockRejectedValue(new Error('ECONNRESET'));

      await expect(service.send('0612345678', 'x')).resolves.toBe(false);
    });
  });
});
