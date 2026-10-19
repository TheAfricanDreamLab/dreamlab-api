import { parseFrom } from '../utils/parse-from';
import type { EmailMessage, EmailSender } from './email-sender.interface';
import { postJson } from './post-json';

/** https://www.zoho.com/zeptomail/help/api/email-sending.html */
export class ZeptoMailEmailSender implements EmailSender {
  readonly name = 'zeptomail';
  private readonly authorization: string;

  constructor(
    token: string,
    private readonly from: string,
    private readonly apiUrl: string,
  ) {
    // Accept the token with or without the "Zoho-enczapikey" prefix the console shows.
    this.authorization = token.startsWith('Zoho-enczapikey') ? token : `Zoho-enczapikey ${token}`;
  }

  send(m: EmailMessage): Promise<void> {
    const from = parseFrom(this.from);
    return postJson(
      this.apiUrl,
      { authorization: this.authorization },
      {
        from: { address: from.address, ...(from.name ? { name: from.name } : {}) },
        to: [{ email_address: { address: m.to } }],
        subject: m.subject,
        textbody: m.text,
        htmlbody: m.html,
      },
      'ZeptoMail',
    );
  }
}
