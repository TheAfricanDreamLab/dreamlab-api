import { lookup } from 'node:dns/promises';
import { isIP } from 'node:net';
import { isPrivateAddress } from '@lib/common';

export { isPrivateAddress };

/**
 * Identity-provider URLs come from organisation admins, and anyone can create an organisation.
 * Before IAM fetches one, it must be https and resolve only to public addresses, so the server
 * cannot be pointed at its own network (SSRF). Development may opt out (SSO_ALLOW_PRIVATE_URLS).
 */
export class UnsafeUrlError extends Error {}

export async function assertSafeUrl(raw: string, allowPrivate: boolean): Promise<URL> {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    throw new UnsafeUrlError('Not a valid URL');
  }
  if (url.username || url.password) throw new UnsafeUrlError('URLs with credentials are not allowed');
  if (allowPrivate) {
    if (url.protocol !== 'https:' && url.protocol !== 'http:') throw new UnsafeUrlError('Only http(s) URLs are allowed');
    return url;
  }
  if (url.protocol !== 'https:') throw new UnsafeUrlError('The identity provider must use https');
  const host = url.hostname.replace(/^\[|\]$/g, '');
  const addresses = isIP(host) ? [host] : (await lookup(host, { all: true, verbatim: true }).catch(() => [])).map((a) => a.address);
  if (addresses.length === 0) throw new UnsafeUrlError(`Could not resolve ${host}`);
  if (addresses.some(isPrivateAddress)) throw new UnsafeUrlError(`${host} resolves to a private address`);
  return url;
}

const MAX_BYTES = 512 * 1024;

/** GET or POST to an identity provider: safe URL, no redirects, 8 s timeout, 512 KB cap. */
export async function safeFetch(raw: string, init: RequestInit, allowPrivate: boolean): Promise<{ status: number; text: string }> {
  const url = await assertSafeUrl(raw, allowPrivate);
  const res = await fetch(url, { ...init, redirect: 'manual', signal: AbortSignal.timeout(8000) });
  if (res.status >= 300 && res.status < 400) throw new UnsafeUrlError('The identity provider answered with a redirect');
  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.length > MAX_BYTES) throw new UnsafeUrlError('The identity provider’s answer is too large');
  return { status: res.status, text: buf.toString('utf8') };
}
