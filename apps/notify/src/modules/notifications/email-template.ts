import { escapeHtml, type EmailMessage } from '@lib/email';

/** A plain, accessible email for one notification, linking back to the app. */
export function notificationEmail(to: string, name: string, n: { title: string; body: string; link: string | null }, appUrl: string): EmailMessage {
  const url = n.link ? new URL(n.link, appUrl).href : null;
  const settings = new URL('/app/account#notifications', appUrl).href;
  const first = name.split(' ')[0] || name;
  return {
    to,
    subject: n.title,
    text: [`Hi ${first},`, '', n.body, ...(url ? ['', `Open it: ${url}`] : []), '', `Choose which emails you get: ${settings}`].join('\n'),
    html: [
      `<p>Hi ${escapeHtml(first)},</p>`,
      `<p>${escapeHtml(n.body).replace(/\n/g, '<br>')}</p>`,
      url ? `<p><a href="${escapeHtml(url)}" style="display:inline-block;padding:10px 16px;background:#7a2e0e;color:#fff;border-radius:6px;text-decoration:none">Open in Dream Lab</a></p>` : '',
      `<p style="color:#666;font-size:12px">The African Dream Lab · <a href="${escapeHtml(settings)}">Choose which emails you get</a></p>`,
    ].join(''),
  };
}
