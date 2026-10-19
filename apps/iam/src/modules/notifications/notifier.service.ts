import { HttpStatus, Inject, Injectable, Logger } from '@nestjs/common';
import type { OtpPurpose } from '@dreamlab/contracts';
import { AppException } from '@lib/common';
import { CONFIG } from '@lib/config';
import type { IamConfig } from '../../config';
import type { InvitationMessage, Notifier, OtpMessage } from './interfaces/notifier.interface';
import type { EmailSender } from './providers/email-sender.interface';
import type { SmsSender } from './providers/sms-sender.interface';
import { escapeHtml } from './utils/escape-html';

export const NOTIFIER = Symbol('NOTIFIER');
export const EMAIL_SENDER = Symbol('EMAIL_SENDER');
export const SMS_SENDER = Symbol('SMS_SENDER');

const PURPOSE_TEXT: Record<OtpPurpose, { subject: string; line: string }> = {
  verify: { subject: 'Your Dream Lab verification code', line: 'Use this code to verify your account' },
  login: { subject: 'Your Dream Lab sign-in code', line: 'Use this code to sign in' },
  reset: { subject: 'Your Dream Lab password reset code', line: 'Use this code to reset your password' },
};

@Injectable()
export class ChannelNotifier implements Notifier {
  private readonly logger = new Logger('Notifier');

  constructor(
    @Inject(EMAIL_SENDER) private readonly email: EmailSender,
    @Inject(SMS_SENDER) private readonly smsSender: SmsSender,
    @Inject(CONFIG) private readonly config: IamConfig,
  ) {}

  async sendOtp(m: OtpMessage): Promise<void> {
    const minutes = Math.round(m.expiresInSeconds / 60);
    const t = PURPOSE_TEXT[m.purpose];
    if (m.channel !== 'email') {
      return this.sms(m.destination, `The African Dream Lab: ${t.line.toLowerCase()}: ${m.code}. It expires in ${minutes} minutes. Never share it.`, m.channel);
    }
    await this.deliver({
      to: m.destination,
      subject: t.subject,
      text: `${t.line}: ${m.code}\n\nIt expires in ${minutes} minutes. If you did not ask for it, ignore this email. Never share this code.`,
      html: `<p>${t.line}:</p><p style="font-size:28px;font-weight:700;letter-spacing:6px">${m.code}</p><p>It expires in ${minutes} minutes. If you did not ask for it, ignore this email. Never share this code.</p>`,
    });
  }

  async sendInvitation(m: InvitationMessage): Promise<void> {
    const who = m.inviterName ? `${m.inviterName} invited you` : 'You have been invited';
    const line = `${who} to join ${m.orgName} on Dream Lab.`;
    if (m.channel === 'sms') return this.sms(m.destination, `${line} Accept: ${m.acceptUrl}`, 'sms');
    await this.deliver({
      to: m.destination,
      subject: `Join ${m.orgName} on Dream Lab`,
      text: `${line}\n\nAccept the invitation: ${m.acceptUrl}\n\nIt expires on ${m.expiresAt.toUTCString()}.`,
      html: `<p>${escapeHtml(line)}</p><p><a href="${escapeHtml(m.acceptUrl)}">Accept the invitation</a></p><p>It expires on ${escapeHtml(m.expiresAt.toUTCString())}.</p>`,
    });
  }

  private async deliver(message: Parameters<EmailSender['send']>[0]): Promise<void> {
    try {
      await this.email.send(message);
    } catch (err) {
      this.logger.error(`Email via ${this.email.name} failed: ${err instanceof Error ? err.message : String(err)}`);
      throw new AppException(HttpStatus.BAD_GATEWAY, 'delivery_failed', 'We could not send the message. Please try again shortly.');
    }
  }

  /** SMS or WhatsApp through Termii (IAM-20); logged instead in development without credentials. */
  private async sms(destination: string, text: string, channel: 'sms' | 'whatsapp'): Promise<void> {
    if (this.smsSender.name === 'console' && this.config.NODE_ENV === 'production') {
      // Never put codes in production logs.
      throw new AppException(HttpStatus.SERVICE_UNAVAILABLE, 'sms_unavailable', 'Phone verification is not available yet. Use your email address.');
    }
    try {
      await this.smsSender.send({ to: destination, text, channel });
    } catch (err) {
      this.logger.error(`${channel.toUpperCase()} via ${this.smsSender.name} failed: ${err instanceof Error ? err.message : String(err)}`);
      throw new AppException(HttpStatus.BAD_GATEWAY, 'delivery_failed', 'We could not send the message. Please try again shortly.');
    }
  }
}
