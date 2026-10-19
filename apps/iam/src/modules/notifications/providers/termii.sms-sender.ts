import { postJson } from './post-json';
import type { SmsMessage, SmsSender } from './sms-sender.interface';

/**
 * Termii (Nigeria): SMS on the generic or DND route, and WhatsApp. The API key travels in the
 * body, as Termii's Messaging API expects. Numbers are sent without the leading +.
 */
export class TermiiSmsSender implements SmsSender {
  readonly name = 'termii';

  constructor(
    private readonly apiKey: string,
    private readonly senderId: string,
    private readonly apiUrl: string,
    private readonly smsChannel: 'generic' | 'dnd',
  ) {}

  async send(message: SmsMessage): Promise<void> {
    await postJson(this.apiUrl, {}, {
      api_key: this.apiKey,
      to: message.to.replace(/^\+/, ''),
      from: this.senderId,
      sms: message.text,
      type: 'plain',
      channel: message.channel === 'whatsapp' ? 'whatsapp' : this.smsChannel,
    }, 'Termii');
  }
}
