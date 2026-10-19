import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';
import { v7 as uuidv7 } from 'uuid';

/** Time-ordered UUIDv7: sortable, index-friendly primary keys. */
export const newId = (): string => uuidv7();

/** URL-safe random token with the given number of bytes of entropy. */
export const randomToken = (bytes = 32): string => randomBytes(bytes).toString('base64url');

export const sha256 = (value: string): string => createHash('sha256').update(value).digest('hex');

export function safeEqual(a: string, b: string): boolean {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
}

/** `%term%` for ILIKE with the user's own % and _ treated literally. */
export const likeContains = (term: string): string => `%${term.replace(/[\\%_]/g, (c) => `\\${c}`)}%`;
