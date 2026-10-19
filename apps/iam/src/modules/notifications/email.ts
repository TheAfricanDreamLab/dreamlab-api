import { Logger } from '@nestjs/common';

export interface EmailMessage {
  to: string;
  subject: string;
  text: string;
  html: string;
}

export interface EmailSender {
  readonly name: string;
  send(message: EmailMessage): Promise<void>;
}

const TIMEOUT_MS = 10_000;

/** "Dream Lab <no-reply@x.com>" → { name, address } */
export function parseFrom(from: string): { name: string | null; address: string } {
  const match = /^\s*(.*?)\s*<([^>]+)>\s*$/.exec(from);
  return match ? { name: match[1] || null, address: match[2]! } : { name: null, address: from.trim() };
}

export class DeliveryError extends Error {}

async function postJson(url: string, headers: Record<string, string>, body: unknown, provider: string): Promise<void> {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json', accept: 'application/json', ...headers },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (!res.ok) {
    // The response body can echo request data; log the status only.
    throw new DeliveryError(`${provider} rejected the email (HTTP ${res.status})`);
  }
}

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

/** Development only: prints the message instead of sending it. */
export class ConsoleEmailSender implements EmailSender {
  readonly name = 'console';
  private readonly logger = new Logger('Email');

  async send(m: EmailMessage): Promise<void> {
    this.logger.warn(`[dev only, not sent] to=${m.to} subject="${m.subject}"\n${m.text}`);
  }
}

export const escapeHtml = (s: string): string =>
  s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);
