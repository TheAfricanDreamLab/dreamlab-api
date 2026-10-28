import { Logger } from '@nestjs/common';
import type { EmailMessage, EmailSender } from './email-sender.interface';

/** Development only: prints the message instead of sending it. */
export class ConsoleEmailSender implements EmailSender {
  readonly name = 'console';
  private readonly logger = new Logger('Email');

  async send(m: EmailMessage): Promise<void> {
    this.logger.warn(`[dev only, not sent] to=${m.to} subject="${m.subject}"\n${m.text}`);
  }
}
