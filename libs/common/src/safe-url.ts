import { lookup } from 'node:dns/promises';
import { BlockList, isIP } from 'node:net';

/*
 * Addresses a server must never fetch from on someone else's say-so (SSRF): loopback, private
 * networks, link-local (cloud metadata), carrier-grade NAT, multicast and reserved ranges.
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

/** The host's addresses when every one of them is public; null when any is not, or it does not resolve. */
export async function publicAddresses(host: string): Promise<string[] | null> {
  const bare = host.replace(/^\[|\]$/g, '');
  const addresses = isIP(bare) ? [bare] : (await lookup(bare, { all: true, verbatim: true }).catch(() => [])).map((a) => a.address);
  if (addresses.length === 0 || addresses.some(isPrivateAddress)) return null;
  return addresses;
}
