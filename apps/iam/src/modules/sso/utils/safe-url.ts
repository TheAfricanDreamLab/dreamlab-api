import { lookup } from 'node:dns/promises';
import { BlockList, isIP } from 'node:net';

/**
 * Identity-provider URLs come from organisation admins, and anyone can create an organisation.
 * Before IAM fetches one, it must be https and resolve only to public addresses, so the server
 * cannot be pointed at its own network (SSRF). Development may opt out (SSO_ALLOW_PRIVATE_URLS).
 */
const PRIVATE = new BlockList();
for (const [net, prefix] of [
  ['0.0.0.0', 8], ['10.0.0.0', 8], ['100.64.0.0', 10], ['127.0.0.0', 8], ['169.254.0.0', 16], ['172.16.0.0', 12],
  ['192.0.0.0', 24], ['192.168.0.0', 16], ['198.18.0.0', 15], ['224.0.0.0', 4], ['240.0.0.0', 4],
] as const) {
  PRIVATE.addSubnet(net, prefix, 'ipv4');
}
// IPv4-mapped IPv6 (::ffff:a.b.c.d) is unwrapped and checked as IPv4 below; a ::ffff:0:0/96 rule here would match every IPv4 address.
for (const [net, prefix] of [['::', 128], ['::1', 128], ['fc00::', 7], ['fe80::', 10], ['ff00::', 8]] as const) {
  PRIVATE.addSubnet(net, prefix, 'ipv6');
}

export class UnsafeUrlError extends Error {}

/** ::ffff:127.0.0.1 and its hex spelling ::ffff:7f00:1 (what URL parsing produces) are IPv4 addresses. */
function unwrapMapped(address: string): string {
  const dotted = /^::ffff:(\d+\.\d+\.\d+\.\d+)$/i.exec(address);
  if (dotted) return dotted[1]!;
  const hex = /^::ffff:([0-9a-f]{1,4}):([0-9a-f]{1,4})$/i.exec(address);
  if (!hex) return address;
  const hi = Number.parseInt(hex[1]!, 16);
  const lo = Number.parseInt(hex[2]!, 16);
  return [hi >> 8, hi & 255, lo >> 8, lo & 255].join('.');
}

export const isPrivateAddress = (raw: string): boolean => {
  const address = unwrapMapped(raw);
  const family = isIP(address);
  if (family === 0) return true;
  return PRIVATE.check(address, family === 4 ? 'ipv4' : 'ipv6');
};

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
