import { HttpStatus, Inject, Injectable, Logger } from '@nestjs/common';
import type { OtpPurpose } from '@dreamlab/contracts';
import { AppException } from '@lib/common';
import { CONFIG } from '@lib/config';
import { type EmailSender, renderEmail } from '@lib/email';
import type { IamConfig } from '../../config';
import type { AccountNotice, InvitationMessage, Notifier, OtpMessage } from './interfaces/notifier.interface';
import type { SmsSender } from './providers/sms-sender.interface';

export const NOTIFIER = Symbol('NOTIFIER');
export const EMAIL_SENDER = Symbol('EMAIL_SENDER');
export const SMS_SENDER = Symbol('SMS_SENDER');

/** Email copy for each kind of one-time code; `line` is also the SMS wording. */
const PURPOSE_TEXT: Record<OtpPurpose, { subject: string; heading: string; intro: string; ignore: string; reason: string; line: string }> = {
  verify: {
    subject: 'Confirm your email for The African Dream Lab',
    heading: 'Confirm it’s you',
    intro: 'Welcome to The African Dream Lab. Enter this code to finish creating your account.',
    ignore: 'If you didn’t sign up, ignore this email: no account is created without the code.',
    reason: 'You’re getting this because this address was used to sign up.',
    line: 'Use this code to verify your account',
  },
  login: {
    subject: 'Your sign-in code for The African Dream Lab',
    heading: 'Your sign-in code',
    intro: 'Enter this code to sign in to The African Dream Lab.',
    ignore: 'If you didn’t try to sign in, ignore this email and nobody gets in. You may want to change your password.',
    reason: 'You’re getting this because someone asked to sign in with this address.',
    line: 'Use this code to sign in',
  },
  reset: {
    subject: 'Reset your password for The African Dream Lab',
    heading: 'Reset your password',
    intro: 'Enter this code to choose a new password for your account.',
    ignore: 'If you didn’t ask to reset it, ignore this email: your password stays the same.',
    reason: 'You’re getting this because someone asked to reset the password for this address.',
    line: 'Use this code to reset your password',
  },
};

/** "8 November 2026", in UTC like the rest of the server. */
const longDate = (d: Date) => new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }).format(d);

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
    const body = renderEmail({
      appUrl: this.config.PUBLIC_APP_URL,
      preview: `Your code is ${m.code}. It expires in ${minutes} minutes.`,
      heading: t.heading,
      paragraphs: [t.intro],
      code: m.code,
      note: `It expires in ${minutes} minutes. Never share it: nobody from The African Dream Lab will ask you for it. ${t.ignore}`,
      reason: t.reason,
    });
    await this.deliver({ to: m.destination, subject: t.subject, ...body });
  }

  async sendInvitation(m: InvitationMessage): Promise<void> {
    const who = m.inviterName ? `${m.inviterName} invited you` : 'You have been invited';
    const line = `${who} to join ${m.orgName} on The African Dream Lab.`;
    if (m.channel === 'sms') return this.sms(m.destination, `${line} Accept: ${m.acceptUrl}`, 'sms');
    const body = renderEmail({
      appUrl: this.config.PUBLIC_APP_URL,
      preview: `${who} to join ${m.orgName}. Accept by ${longDate(m.expiresAt)}.`,
      eyebrow: 'Invitation',
      heading: `Join ${m.orgName}`,
      paragraphs: [
        `${who} to join ${m.orgName} on The African Dream Lab, where you’ll learn, build and work together.`,
        'Accepting takes a minute: sign in, or create a free account with this email address.',
      ],
      button: { label: 'Accept the invitation', url: m.acceptUrl },
      note: `This invitation expires on ${longDate(m.expiresAt)}. If you weren’t expecting it, you can ignore this email.`,
      reason: `You’re getting this because someone at ${m.orgName} invited this address.`,
    });
    const subject = m.inviterName ? `${m.inviterName} invited you to join ${m.orgName}` : `You’re invited to join ${m.orgName}`;
    await this.deliver({ to: m.destination, subject, ...body });
  }

  /** Suspended, banned or reinstated (PLT-2): what happened, until when, and the platform's message. */
  async sendAccountNotice(m: AccountNotice): Promise<void> {
    const said = m.message ? [`The platform team says: “${m.message}”`] : [];
    const copy =
      m.status === 'active'
        ? {
            subject: 'Your Dream Lab account is active again',
            heading: 'Welcome back',
            paragraphs: ['Your account on The African Dream Lab is active again. You can sign in and carry on where you left off.', ...said],
            button: { label: 'Sign in', url: `${this.config.PUBLIC_APP_URL}/login` },
            note: undefined,
          }
        : m.status === 'suspended'
          ? {
              subject: 'Your Dream Lab account is suspended',
              heading: 'Your account is suspended',
              paragraphs: [
                m.until
                  ? `A platform administrator has suspended your account on The African Dream Lab until ${longDate(m.until)}. You can sign in again after that.`
                  : 'A platform administrator has suspended your account on The African Dream Lab. You can sign in again once they lift the suspension.',
                ...said,
              ],
              button: undefined,
              note: 'You’ve been signed out everywhere. Your work and progress are kept. If you think this is a mistake, reply to this email.',
            }
          : {
              subject: 'Your Dream Lab account has been closed',
              heading: 'Your account has been closed',
              paragraphs: ['A platform administrator has closed your account on The African Dream Lab for breaking the platform’s rules. You can no longer sign in.', ...said],
              button: undefined,
              note: 'If you think this is a mistake, reply to this email.',
            };
    const body = renderEmail({
      appUrl: this.config.PUBLIC_APP_URL,
      preview: copy.heading,
      heading: copy.heading,
      paragraphs: [`Hello ${m.name},`, ...copy.paragraphs],
      ...(copy.button ? { button: copy.button } : {}),
      ...(copy.note ? { note: copy.note } : {}),
      reason: 'You’re getting this because of a change to your account.',
    });
    await this.deliver({ to: m.destination, subject: copy.subject, ...body });
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
