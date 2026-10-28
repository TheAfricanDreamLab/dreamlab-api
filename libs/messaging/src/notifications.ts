import type { NotificationCategory } from '@dreamlab/contracts';
import type { Tx } from '@lib/database';
import type { EventActor } from './envelope';
import type { OutboxWriter } from './outbox';

/** Any service asks the notifications service to tell people something (NOTIFY-1). */
export const NOTIFICATION_REQUESTED = 'notification.requested';

export interface NotificationRequest {
  /** Recipients: these people, and the organisation's members holding this permission org-wide. */
  to: { userIds?: string[]; permission?: { orgId: string; permission: string } };
  /** Never notify these people (usually whoever caused it). */
  exclude?: string[];
  category: NotificationCategory;
  title: string;
  body: string;
  /** An app path such as /app/learn/…; emails link to it on the platform's address. */
  link: string | null;
  orgId: string | null;
  /** Stops duplicates per recipient, e.g. `grade:<gradeId>`. */
  key: string;
}

/** Queue a notification in the caller's transaction, so it goes out only if the change commits. */
export function requestNotification<S extends Record<string, unknown>>(
  outbox: OutboxWriter,
  tx: Tx<S>,
  request: NotificationRequest,
  actor?: EventActor,
): Promise<unknown> {
  return outbox.add(tx, { type: NOTIFICATION_REQUESTED, orgId: request.orgId, actor, payload: request });
}
