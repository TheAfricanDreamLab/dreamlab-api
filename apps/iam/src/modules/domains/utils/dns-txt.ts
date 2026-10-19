import { Resolver } from 'node:dns/promises';

/** Where the organisation publishes its proof of ownership. */
export const verificationRecordName = (domain: string): string => `_dreamlab-challenge.${domain}`;
export const verificationRecordValue = (token: string): string => `dreamlab-verification=${token}`;

export type TxtLookup = (name: string) => Promise<string[][]>;

/** Development only (refused in production): every claimed domain verifies without a DNS check. */
export const TRUST_ALL_DOMAINS = 'trust' as const;

/** Public resolvers, so a stale or split-horizon local resolver cannot vouch for a domain. */
export function publicTxtLookup(): TxtLookup {
  const resolver = new Resolver({ timeout: 4000, tries: 2 });
  resolver.setServers(['1.1.1.1', '8.8.8.8']);
  return (name) => resolver.resolveTxt(name);
}

/** True when any TXT record at the challenge name carries the expected value. */
export async function hasVerificationRecord(lookup: TxtLookup, domain: string, token: string): Promise<boolean> {
  try {
    const records = await lookup(verificationRecordName(domain));
    const expected = verificationRecordValue(token);
    // Long TXT records arrive split into chunks; join them before comparing.
    return records.some((chunks) => chunks.join('').trim() === expected);
  } catch {
    return false;
  }
}
