import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createTransport, type Transporter } from 'nodemailer';

export type MailMessage = {
  to: string;
  subject: string;
  html: string;
  text: string;
};

/**
 * Sends e-mails through SMTP.
 * - Local development: defaults to Mailpit (localhost:1026), every e-mail is visible on http://localhost:8025
 * - Production: any SMTP provider (Brevo, Resend, Mailgun…) via the SMTP_* variables
 *
 * Sending never throws: a mail server problem must not cancel a reservation that is already saved.
 */
@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private readonly transporter: Transporter;
  private readonly from: string;

  constructor(config: ConfigService) {
    const isProduction = config.get('NODE_ENV') === 'production';
    const host = config.get<string>('SMTP_HOST') ?? (isProduction ? undefined : 'localhost');
    if (!host) {
      throw new Error('SMTP_HOST manquant : impossible d’envoyer les e-mails de confirmation en production.');
    }

    const user = config.get<string>('SMTP_USER');
    this.transporter = createTransport({
      host,
      port: Number(config.get('SMTP_PORT') ?? 1026),
      secure: config.get('SMTP_SECURE') === 'true', // true for port 465, false for 587/1026
      auth: user ? { user, pass: config.get<string>('SMTP_PASS') } : undefined,
    });
    this.from = config.get<string>('MAIL_FROM') ?? 'Maquis 18 <reservations@maquis18.fr>';
  }

  /** Returns true when the e-mail was accepted by the SMTP server */
  async send(message: MailMessage): Promise<boolean> {
    try {
      await this.transporter.sendMail({ from: this.from, ...message });
      return true;
    } catch (error) {
      this.logger.warn(`E-mail non envoyé à ${message.to} : ${(error as Error).message}`);
      return false;
    }
  }
}
