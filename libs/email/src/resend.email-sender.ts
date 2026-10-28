import type { EmailMessage, EmailSender } from './email-sender.interface';
import { postJson } from './post-json';

/** https://resend.com/docs/api-reference/emails/send-email */
export class ResendEmailSender implements EmailSender {
  readonly name = 'resend';

  constructor(
    private readonly apiKey: string,
    private readonly from: string,
  ) {}

  send(m: EmailMessage): Promise<void> {
    return postJson(
      'https://api.resend.com/emails',
      { authorization: `Bearer ${this.apiKey}` },
      { from: this.from, to: [m.to], subject: m.subject, text: m.text, html: m.html },
      'Resend',
    );
  }
}
