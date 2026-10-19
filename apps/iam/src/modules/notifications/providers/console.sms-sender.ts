import { Logger } from '@nestjs/common';
import type { SmsMessage, SmsSender } from './sms-sender.interface';

/** Development only: prints the message instead of sending it. */
export class ConsoleSmsSender implements SmsSender {
  readonly name = 'console';
  private readonly logger = new Logger('Sms');

  async send(m: SmsMessage): Promise<void> {
    this.logger.warn(`[dev only, ${m.channel.toUpperCase()} not sent] to=${m.to}: ${m.text}`);
  }
}
