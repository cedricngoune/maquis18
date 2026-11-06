import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { ApiErrorResponse } from '@maquis18/shared';

const VERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';

type TurnstileResponse = { success: boolean; 'error-codes'?: string[] };

/**
 * Checks the Cloudflare Turnstile token sent by the reservation form.
 * Turnstile is free, privacy-friendly and usually invisible for humans.
 */
@Injectable()
export class CaptchaService {
  private readonly logger = new Logger(CaptchaService.name);
  private readonly secretKey?: string;

  constructor(config: ConfigService) {
    this.secretKey = config.get<string>('TURNSTILE_SECRET_KEY');

    if (!this.secretKey) {
      if (config.get('NODE_ENV') === 'production') {
        throw new Error('TURNSTILE_SECRET_KEY manquant : le formulaire public serait sans protection anti-robot.');
      }
      this.logger.warn('TURNSTILE_SECRET_KEY absent : vérification anti-robot désactivée (développement uniquement).');
    }
  }

  async assertHuman(token: string, ip?: string): Promise<void> {
    if (!this.secretKey) return;

    let result: TurnstileResponse;
    try {
      const response = await fetch(VERIFY_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ secret: this.secretKey, response: token, remoteip: ip }),
      });
      result = (await response.json()) as TurnstileResponse;
    } catch (error) {
      // Cloudflare unreachable: we refuse rather than let bots through
      this.logger.error(`Vérification Turnstile impossible : ${(error as Error).message}`);
      this.fail('La vérification anti-robot est momentanément indisponible. Merci de réessayer.');
    }

    if (!result.success) {
      this.logger.warn(`Captcha refusé (${result['error-codes']?.join(', ') ?? 'sans code'})`);
      this.fail('La vérification anti-robot a échoué. Merci de réessayer.');
    }
  }

  private fail(message: string): never {
    const body: ApiErrorResponse = { statusCode: 400, message, errors: { captchaToken: message } };
    throw new BadRequestException(body);
  }
}
