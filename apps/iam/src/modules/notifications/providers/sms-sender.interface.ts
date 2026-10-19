export interface SmsMessage {
  /** E.164, e.g. +2348012345678. */
  to: string;
  text: string;
  channel: 'sms' | 'whatsapp';
}

/** Sends text messages to phones (IAM-20). */
export interface SmsSender {
  readonly name: string;
  send(message: SmsMessage): Promise<void>;
}
