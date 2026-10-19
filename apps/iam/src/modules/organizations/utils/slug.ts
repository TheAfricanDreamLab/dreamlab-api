import { RESERVED_SLUGS } from '@dreamlab/contracts';
import { randomBytes } from 'node:crypto';

const MAX_LENGTH = 63;
const RESERVED = new Set<string>(RESERVED_SLUGS);

/** "Lagos Business School" → "lagos-business-school"; accents dropped, at most 63 characters. */
export function slugify(name: string): string {
  const base = name
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, MAX_LENGTH - 6) // leave room for a "-xxxx" suffix
    .replace(/-+$/g, '');
  if (base.length < 3) return base ? `${base}-org` : 'org';
  return RESERVED.has(base) ? `${base}-org` : base;
}

/**
 * Candidates in the order they are tried: the name itself, then -2 … -9, then a short random
 * suffix (which is practically always free).
 */
export function slugCandidates(name: string): string[] {
  const base = slugify(name);
  return [base, ...Array.from({ length: 8 }, (_, i) => `${base}-${i + 2}`), `${base}-${randomBytes(3).toString('hex').slice(0, 4)}`];
}

/** The first candidate not already taken. */
export async function pickSlug(name: string, isTaken: (slugs: string[]) => Promise<Set<string>>): Promise<string> {
  const candidates = slugCandidates(name);
  const taken = await isTaken(candidates);
  return candidates.find((s) => !taken.has(s)) ?? `${slugify(name)}-${randomBytes(4).toString('hex')}`;
}
