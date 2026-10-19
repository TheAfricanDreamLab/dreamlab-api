import { Global, HttpStatus, Inject, Injectable, Logger, Module } from '@nestjs/common';
import type { OtpPurpose } from '@dreamlab/contracts';
import { AppException } from '@lib/common';
import { CONFIG } from '@lib/config';
import { emailProvider, IamConfig } from '../../config';
import { ConsoleEmailSender, EmailSender, escapeHtml, ResendEmailSender, ZeptoMailEmailSender } from './email';

export const NOTIFIER = Symbol('NOTIFIER');
export const EMAIL_SENDER = Symbol('EMAIL_SENDER');

export interface OtpMessage {
  channel: 'email' | 'sms';
  destination: string;
  code: string;
  purpose: OtpPurpose;
  expiresInSeconds: number;
}

export interface InvitationMessage {
  channel: 'email' | 'sms';
  destination: string;
  orgName: string;
  inviterName: string | null;
  acceptUrl: string;
  expiresAt: Date;
}

/** Outbound messages IAM sends. notify-hub (push → WhatsApp → SMS → email) replaces this later. */
export interface Notifier {
  sendOtp(message: OtpMessage): Promise<void>;
  sendInvitation(message: InvitationMessage): Promise<void>;
}

const PURPOSE_TEXT: Record<OtpPurpose, { subject: string; line: string }> = {
  verify: { subject: 'Your Dream Lab verification code', line: 'Use this code to verify your account' },
  login: { subject: 'Your Dream Lab sign-in code', line: 'Use this code to sign in' },
  reset: { subject: 'Your Dream Lab password reset code', line: 'Use this code to reset your password' },
};

@Injectable()
export class ChannelNotifier implements Notifier {
  private readonly logger = new Logger('Notifier');

  constructor(@Inject(EMAIL_SENDER) private readonly email: EmailSender) {}

  async sendOtp(m: OtpMessage): Promise<void> {
    const minutes = Math.round(m.expiresInSeconds / 60);
    const t = PURPOSE_TEXT[m.purpose];
    if (m.channel === 'sms') return this.sms(m.destination, `${t.line}: ${m.code}. It expires in ${minutes} minutes. Never share it.`);
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
    if (m.channel === 'sms') return this.sms(m.destination, `${line} Accept: ${m.acceptUrl}`);
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

  /** SMS goes through notify-hub (Termii) in a later slice; until then it is only logged. */
  private async sms(destination: string, text: string): Promise<void> {
    this.logger.warn(`[dev only, SMS not sent] to=${destination}: ${text}`);
  }
}

@Global()
@Module({
  providers: [
    {
      provide: EMAIL_SENDER,
      inject: [CONFIG],
      useFactory: (config: IamConfig): EmailSender => {
        const provider = emailProvider(config);
        new Logger('Notifier').log(`Email provider: ${provider}`);
        if (provider === 'resend') {
          if (!config.RESEND_API_KEY) throw new Error('EMAIL_PROVIDER=resend needs RESEND_API_KEY');
          return new ResendEmailSender(config.RESEND_API_KEY, config.EMAIL_FROM);
        }
        if (provider === 'zeptomail') {
          if (!config.ZEPTOMAIL_TOKEN) throw new Error('EMAIL_PROVIDER=zeptomail needs ZEPTOMAIL_TOKEN');
          return new ZeptoMailEmailSender(config.ZEPTOMAIL_TOKEN, config.EMAIL_FROM, config.ZEPTOMAIL_API_URL);
        }
        if (config.NODE_ENV === 'production') throw new Error('No email provider configured: set RESEND_API_KEY or ZEPTOMAIL_TOKEN');
        return new ConsoleEmailSender();
      },
    },
    { provide: NOTIFIER, useClass: ChannelNotifier },
  ],
  exports: [NOTIFIER],
})
export class NotificationsModule {}

/** a***@mail.com, +234******678 */
export function maskDestination(channel: 'email' | 'sms', value: string): string {
  if (channel === 'email') {
    const [local = '', domain = ''] = value.split('@');
    return `${local.slice(0, 1)}***@${domain}`;
  }
  return `${value.slice(0, 4)}${'*'.repeat(Math.max(0, value.length - 7))}${value.slice(-3)}`;
}

export const channelFor = (identifier: string): 'email' | 'sms' => (identifier.includes('@') ? 'email' : 'sms');
