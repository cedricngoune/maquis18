import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { maskPhone, toFrenchE164 } from './phone';

type SmsProvider = 'log' | 'twilio' | 'textbee';

const PROVIDERS: SmsProvider[] = ['log', 'twilio', 'textbee'];

/**
 * Sends SMS. The provider is chosen with SMS_PROVIDER:
 * - "log" (default): the SMS is only written in the API logs
 * - "textbee": sent from your own Android phone through textbee.dev (free plan: 300 SMS/month, 50/day)
 * - "twilio": sent through the Twilio REST API (a trial account only accepts Twilio's predefined templates)
 *
 * Like MailService, sending never throws: an SMS problem must not cancel a saved reservation.
 */
@Injectable()
export class SmsService {
  private readonly logger = new Logger(SmsService.name);
  private readonly provider: SmsProvider;

  constructor(private readonly config: ConfigService) {
    const provider = (config.get<string>('SMS_PROVIDER') ?? 'log') as SmsProvider;
    if (!PROVIDERS.includes(provider)) {
      throw new Error(`SMS_PROVIDER inconnu : "${provider}". Valeurs possibles : ${PROVIDERS.join(', ')}.`);
    }
    this.provider = provider;

    const required: Record<SmsProvider, string[]> = {
      log: [],
      textbee: ['TEXTBEE_API_KEY'],
      twilio: ['TWILIO_ACCOUNT_SID', 'TWILIO_AUTH_TOKEN', 'TWILIO_FROM'],
    };
    const missing = required[provider].filter((key) => !config.get(key));
    if (missing.length) {
      throw new Error(`SMS_PROVIDER=${provider} : ${missing.join(', ')} obligatoire(s).`);
    }
    if (provider === 'log' && config.get('NODE_ENV') === 'production') {
      this.logger.warn('SMS_PROVIDER=log en production : aucun SMS ne sera réellement envoyé.');
    }
  }

  /** Returns true when the provider accepted the message (accepted ≠ delivered) */
  async send(phone: string, body: string): Promise<boolean> {
    const to = toFrenchE164(phone);

    if (this.provider === 'log') {
      this.logger.log(`SMS (non envoyé, SMS_PROVIDER=log) à ${maskPhone(to)} : ${body}`);
      return true;
    }

    try {
      const response =
        this.provider === 'textbee' ? await this.sendWithTextbee(to, body) : await this.sendWithTwilio(to, body);

      if (!response.ok) {
        const details = await this.readError(response);
        this.logger.warn(
          `SMS refusé par ${this.provider} pour ${maskPhone(to)} (HTTP ${response.status}) : ${details}`,
        );
        return false;
      }
      return true;
    } catch (error) {
      this.logger.warn(`SMS non envoyé à ${maskPhone(to)} via ${this.provider} : ${(error as Error).message}`);
      return false;
    }
  }

  /**
   * textbee: the message is queued, then sent by the Android phone linked to the account.
   * HTTP 400 = no enabled phone · 401 = bad API key · 429 = plan limit reached
   */
  private sendWithTextbee(to: string, body: string): Promise<Response> {
    const deviceId = this.config.get<string>('TEXTBEE_DEVICE_ID'); // optional: textbee picks the enabled phone
    return fetch('https://api.textbee.dev/api/v1/gateway/send-sms', {
      method: 'POST',
      headers: { 'x-api-key': this.config.get<string>('TEXTBEE_API_KEY')!, 'Content-Type': 'application/json' },
      body: JSON.stringify({ recipients: [to], message: body, ...(deviceId && { deviceId }) }),
    });
  }

  /** Twilio: form-encoded body, Basic auth with the Account SID and Auth Token */
  private sendWithTwilio(to: string, body: string): Promise<Response> {
    const accountSid = this.config.get<string>('TWILIO_ACCOUNT_SID')!;
    const credentials = Buffer.from(`${accountSid}:${this.config.get<string>('TWILIO_AUTH_TOKEN')}`).toString('base64');
    return fetch(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`, {
      method: 'POST',
      headers: { Authorization: `Basic ${credentials}`, 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ To: to, From: this.config.get<string>('TWILIO_FROM')!, Body: body }),
    });
  }

  /** Both providers answer errors in JSON, with different shapes */
  private async readError(response: Response): Promise<string> {
    const data = (await response.json().catch(() => null)) as {
      code?: number;
      message?: string | string[];
      error?: string;
    } | null;
    if (!data) return 'réponse illisible';
    const message = Array.isArray(data.message) ? data.message.join(', ') : (data.message ?? data.error ?? '');
    return data.code ? `code ${data.code} — ${message}` : message;
  }
}
