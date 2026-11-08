import type { ConfigService } from '@nestjs/config';
import { CaptchaService } from './captcha.service';

const configWith = (values: Record<string, string>) =>
  ({ get: (key: string) => values[key] }) as unknown as ConfigService;

describe('CaptchaService', () => {
  const fetchMock = jest.fn();

  beforeEach(() => {
    fetchMock.mockReset();
    global.fetch = fetchMock;
  });

  it('skips the check in development when no secret key is set', async () => {
    const service = new CaptchaService(configWith({}));

    await expect(service.assertHuman('any-token')).resolves.toBeUndefined();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('refuses to start in production without a secret key', () => {
    expect(() => new CaptchaService(configWith({ NODE_ENV: 'production' }))).toThrow('TURNSTILE_SECRET_KEY');
  });

  describe('with a secret key', () => {
    const service = new CaptchaService(configWith({ TURNSTILE_SECRET_KEY: 'secret' }));

    it('sends the token, the secret and the IP to Cloudflare and accepts a success', async () => {
      fetchMock.mockResolvedValue({ json: async () => ({ success: true }) });

      await expect(service.assertHuman('token-1', '1.2.3.4')).resolves.toBeUndefined();
      expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual({
        secret: 'secret',
        response: 'token-1',
        remoteip: '1.2.3.4',
      });
    });

    it('rejects a failed check with a message on the captcha field', async () => {
      fetchMock.mockResolvedValue({
        json: async () => ({ success: false, 'error-codes': ['invalid-input-response'] }),
      });

      await expect(service.assertHuman('bad')).rejects.toMatchObject({
        response: { errors: { captchaToken: expect.stringContaining('anti-robot a échoué') } },
      });
    });

    it('refuses rather than letting bots through when Cloudflare is unreachable', async () => {
      fetchMock.mockRejectedValue(new Error('timeout'));

      await expect(service.assertHuman('token')).rejects.toMatchObject({
        response: { errors: { captchaToken: expect.stringContaining('indisponible') } },
      });
    });
  });
});
