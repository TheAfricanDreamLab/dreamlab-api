import { escapeHtml } from './escape-html';

/*
 * The one look for every email the platform sends: the brand header, a white card with a headline,
 * short paragraphs, an optional code or button, and a footer that says why the email came. Tables
 * and inline styles only, so Gmail, Outlook and phone mail apps all show it the same; a plain-text
 * version goes with it. Copy passed in is plain text: it is escaped here.
 */

const C = {
  page: '#e7edf3',
  card: '#ffffff',
  ink: '#16233a',
  body: '#4c5a73',
  muted: '#5c6880',
  line: '#e4e9f2',
  primary: '#159b62',
  link: '#0f7a4d',
  forest: '#0a3d29',
  gold: '#b8963a',
  tint: '#e6f4ec',
  tintLine: '#bfe3d0',
};
const FONT = "'Outfit','Segoe UI',Helvetica,Arial,sans-serif";
const MONO = "'JetBrains Mono','SFMono-Regular',Menlo,Consolas,monospace";

export interface EmailLayout {
  /** The app's public address: the logo and the footer link come from it. */
  appUrl: string;
  /** Shown by inboxes beside the subject, never in the email itself. */
  preview: string;
  /** A small label above the headline, e.g. "Admissions". */
  eyebrow?: string;
  heading: string;
  /** Short paragraphs; blank lines inside one are kept as line breaks. */
  paragraphs: string[];
  /** A one-time code, shown large and easy to copy. */
  code?: string;
  button?: { label: string; url: string };
  /** Small print under the button or code: expiry, safety. */
  note?: string;
  /** Why this email came, at the foot. */
  reason: string;
  /** A link to choose which emails come, when the person can turn this kind off. */
  manageUrl?: string;
}

export function renderEmail(e: EmailLayout): { html: string; text: string } {
  const logo = new URL('/brand/adn-logo.png', e.appUrl).href;
  const home = new URL('/', e.appUrl).href;
  const para = (p: string) => `<p style="margin:0 0 16px;font:16px/1.6 ${FONT};color:${C.body}">${escapeHtml(p).replace(/\n/g, '<br>')}</p>`;

  const code = e.code
    ? `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:8px 0 20px"><tr><td style="background:${C.tint};border:1px solid ${C.tintLine};border-radius:14px;padding:16px 28px;font:700 32px/1 ${MONO};letter-spacing:8px;color:${C.forest}">${escapeHtml(e.code)}</td></tr></table>`
    : '';
  const button = e.button
    ? `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:8px 0 20px"><tr><td style="border-radius:999px;background:${C.primary}"><a href="${escapeHtml(e.button.url)}" style="display:inline-block;padding:14px 28px;font:600 16px/1 ${FONT};color:#ffffff;text-decoration:none;border-radius:999px">${escapeHtml(e.button.label)}</a></td></tr></table>`
    : '';
  const fallback = e.button
    ? `<p style="margin:0 0 16px;font:13px/1.6 ${FONT};color:${C.muted}">If the button doesn’t work, copy this link into your browser:<br><a href="${escapeHtml(e.button.url)}" style="color:${C.link};word-break:break-all">${escapeHtml(e.button.url)}</a></p>`
    : '';
  const note = e.note ? `<p style="margin:0 0 16px;font:14px/1.6 ${FONT};color:${C.muted}">${escapeHtml(e.note)}</p>` : '';
  const manage = e.manageUrl ? ` · <a href="${escapeHtml(e.manageUrl)}" style="color:${C.link}">Choose which emails you get</a>` : '';

  const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light"><meta name="supported-color-schemes" content="light"><title>${escapeHtml(e.heading)}</title></head>
<body style="margin:0;padding:0;background:${C.page}">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent">${escapeHtml(e.preview)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${C.page}"><tr><td align="center" style="padding:32px 16px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:560px">
<tr><td style="padding:0 4px 20px"><a href="${escapeHtml(home)}" style="text-decoration:none"><table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
<td style="padding-right:12px"><img src="${escapeHtml(logo)}" width="40" height="40" alt="" style="display:block;border:0;border-radius:10px;background:#ffffff"></td>
<td style="font:700 17px/1.2 ${FONT};color:${C.ink}">The African Dream Lab</td></tr></table></a></td></tr>
<tr><td style="background:${C.card};border-radius:20px;border-top:4px solid ${C.forest};padding:36px 32px 20px">
${e.eyebrow ? `<p style="margin:0 0 10px;font:700 12px/1 ${MONO};letter-spacing:2px;text-transform:uppercase;color:${C.gold}">${escapeHtml(e.eyebrow)}</p>` : ''}
<h1 style="margin:0 0 18px;font:800 26px/1.25 ${FONT};color:${C.ink}">${escapeHtml(e.heading)}</h1>
${e.paragraphs.map(para).join('\n')}
${code}${button}${note}${fallback}
</td></tr>
<tr><td style="padding:24px 8px 0;font:13px/1.6 ${FONT};color:${C.muted};text-align:center">
<p style="margin:0 0 6px">${escapeHtml(e.reason)}${manage}</p>
<p style="margin:0;font:12px/1.6 ${FONT};color:${C.muted}">The African Dream Lab · Born from TADIS · Learn · Build · Lead</p>
</td></tr>
</table></td></tr></table>
</body></html>`;

  const text = [
    e.heading,
    '',
    ...e.paragraphs.flatMap((p) => [p, '']),
    ...(e.code ? [`Your code: ${e.code}`, ''] : []),
    ...(e.button ? [`${e.button.label}: ${e.button.url}`, ''] : []),
    ...(e.note ? [e.note, ''] : []),
    '—',
    e.reason,
    ...(e.manageUrl ? [`Choose which emails you get: ${e.manageUrl}`] : []),
    'The African Dream Lab',
  ].join('\n');

  return { html, text };
}
