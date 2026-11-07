import type { AccountBlocked } from '@dreamlab/contracts';
import { forbidden } from '@lib/common';
import type { UserRow } from './users.repository';

type Standing = Pick<UserRow, 'status' | 'suspendedUntil' | 'statusMessage'>;

/** A suspension whose end has passed: sign-in lifts it (PLT-2). */
export const suspensionEnded = (u: Standing, now = new Date()): boolean => u.status === 'suspended' && !!u.suspendedUntil && u.suspendedUntil <= now;

/**
 * Stops sign-in for someone kept out (PLT-2), saying why: `account_suspended` (with its end) or
 * `account_banned`, each with the platform's message. An ended suspension passes.
 */
export function assertCanSignIn(u: Standing): void {
  if (u.status === 'active' || suspensionEnded(u)) return;
  if (u.status === 'suspended' || u.status === 'banned') {
    const details: AccountBlocked = { status: u.status, until: u.suspendedUntil?.toISOString() ?? null, message: u.statusMessage ?? null };
    if (u.status === 'banned') throw forbidden('account_banned', 'This account has been closed.', details);
    throw forbidden('account_suspended', u.suspendedUntil ? `This account is suspended until ${details.until}.` : 'This account is suspended.', details);
  }
  throw forbidden('account_disabled', 'This account is disabled');
}
