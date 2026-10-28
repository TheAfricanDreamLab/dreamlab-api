import { Logger } from '@nestjs/common';
import { z } from 'zod';
import { ConsoleEmailSender } from './console.email-sender';
import type { EmailSender } from './email-sender.interface';
import { ResendEmailSender } from './resend.email-sender';
import { ZeptoMailEmailSender } from './zeptomail.email-sender';

export * from './console.email-sender';
export * from './email-sender.interface';
export * from './escape-html';
export * from './parse-from';
export * from './post-json';
export * from './resend.email-sender';
export * from './zeptomail.email-sender';

/**
 * Email delivery settings, shared by every service that sends mail. With no override, Resend is used
 * when RESEND_API_KEY is set, otherwise ZeptoMail when ZEPTOMAIL_TOKEN is set, otherwise messages are
 * only logged (development).
 */
export const emailConfigShape = {
  EMAIL_PROVIDER: z.enum(['resend', 'zeptomail', 'console']).optional(),
  EMAIL_FROM: z.string().min(3).default('The African Dream Lab <no-reply@theafricandreamlab.com>'),
  RESEND_API_KEY: z.string().min(10).optional(),
  ZEPTOMAIL_TOKEN: z.string().min(10).optional(),
  ZEPTOMAIL_API_URL: z.string().url().default('https://api.zeptomail.com/v1.1/email'),
};

export interface EmailConfig {
  NODE_ENV: string;
  EMAIL_PROVIDER?: 'resend' | 'zeptomail' | 'console';
  EMAIL_FROM: string;
  RESEND_API_KEY?: string;
  ZEPTOMAIL_TOKEN?: string;
  ZEPTOMAIL_API_URL: string;
}

export function emailProvider(config: Pick<EmailConfig, 'EMAIL_PROVIDER' | 'RESEND_API_KEY' | 'ZEPTOMAIL_TOKEN'>): 'resend' | 'zeptomail' | 'console' {
  if (config.EMAIL_PROVIDER) return config.EMAIL_PROVIDER;
  if (config.RESEND_API_KEY) return 'resend';
  if (config.ZEPTOMAIL_TOKEN) return 'zeptomail';
  return 'console';
}

/** The configured sender. Production refuses to start without a real provider. */
export function createEmailSender(config: EmailConfig): EmailSender {
  const provider = emailProvider(config);
  new Logger('Email').log(`Email provider: ${provider}`);
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
}
