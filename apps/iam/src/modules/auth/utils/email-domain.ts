/** The domain of an email address, lower-cased, or null. */
export function emailDomain(email: string): string | null {
  const at = email.lastIndexOf('@');
  if (at < 1 || at === email.length - 1) return null;
  return email.slice(at + 1).trim().toLowerCase();
}

/**
 * Mailbox providers anyone can sign up to. Owning one of these addresses says nothing about an
 * organisation, so they can never be claimed as an organisation's domain.
 */
export const PUBLIC_EMAIL_DOMAINS = new Set([
  'gmail.com', 'googlemail.com', 'yahoo.com', 'yahoo.co.uk', 'ymail.com', 'rocketmail.com', 'outlook.com', 'hotmail.com', 'hotmail.co.uk',
  'live.com', 'msn.com', 'icloud.com', 'me.com', 'mac.com', 'aol.com', 'proton.me', 'protonmail.com', 'zoho.com', 'zohomail.com',
  'gmx.com', 'gmx.net', 'mail.com', 'yandex.com', 'yandex.ru', 'qq.com', '163.com', 'tutanota.com', 'fastmail.com', 'hey.com',
  'example.com', 'example.org', 'example.net',
]);
