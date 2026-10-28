import { Injectable } from '@nestjs/common';
import { NOTIFICATION_CATEGORIES, Notification, NotificationCategory, NotificationPreferences } from '@dreamlab/contracts';
import type { Principal } from '@lib/auth';
import { notFound } from '@lib/common';
import { InjectDatabase } from '@lib/database';
import { and, count, desc, eq, isNull, lt, sql } from 'drizzle-orm';
import { NotifyDatabase, NotifyTx, schema } from '../../database';

const { notifications, notificationPreferences } = schema;
type Row = typeof notifications.$inferSelect;

/** A person's own notifications and email choices. Row-level security keeps each person to their own. */
@Injectable()
export class NotificationsService {
  constructor(@InjectDatabase() private readonly db: NotifyDatabase) {}

  private own<T>(p: Principal, fn: (tx: NotifyTx) => Promise<T>): Promise<T> {
    return this.db.tenant({ orgId: '', userId: p.userId }, fn);
  }

  list(p: Principal, q: { unread?: 'true' | 'false'; before?: string; limit: number }) {
    return this.own(p, async (tx) => {
      const where = and(
        eq(notifications.userId, p.userId),
        q.unread === 'true' ? isNull(notifications.readAt) : undefined,
        q.before ? lt(notifications.createdAt, new Date(q.before)) : undefined,
      );
      const rows = await tx.select().from(notifications).where(where).orderBy(desc(notifications.createdAt)).limit(q.limit + 1);
      return { items: rows.slice(0, q.limit).map(toNotification), unread: await this.countUnread(tx, p), hasMore: rows.length > q.limit };
    });
  }

  async unreadCount(p: Principal) {
    return { unread: await this.own(p, (tx) => this.countUnread(tx, p)) };
  }

  private async countUnread(tx: NotifyTx, p: Principal): Promise<number> {
    const [row] = await tx.select({ n: count() }).from(notifications).where(and(eq(notifications.userId, p.userId), isNull(notifications.readAt)));
    return row?.n ?? 0;
  }

  async markRead(p: Principal, id: string): Promise<void> {
    await this.own(p, async (tx) => {
      const [row] = await tx
        .update(notifications)
        .set({ readAt: sql`coalesce(${notifications.readAt}, now())` })
        .where(and(eq(notifications.id, id), eq(notifications.userId, p.userId)))
        .returning({ id: notifications.id });
      if (!row) throw notFound('notification_not_found', 'Notification not found');
    });
  }

  async markAllRead(p: Principal): Promise<void> {
    await this.own(p, (tx) =>
      tx.update(notifications).set({ readAt: new Date() }).where(and(eq(notifications.userId, p.userId), isNull(notifications.readAt))),
    );
  }

  preferences(p: Principal): Promise<NotificationPreferences> {
    return this.own(p, async (tx) => {
      const [row] = await tx.select().from(notificationPreferences).where(eq(notificationPreferences.userId, p.userId));
      return { email: withDefaults(row?.email ?? {}) };
    });
  }

  updatePreferences(p: Principal, prefs: NotificationPreferences): Promise<NotificationPreferences> {
    return this.own(p, async (tx) => {
      const email = withDefaults(prefs.email);
      await tx
        .insert(notificationPreferences)
        .values({ userId: p.userId, email })
        .onConflictDoUpdate({ target: notificationPreferences.userId, set: { email, updatedAt: new Date() } });
      return { email };
    });
  }
}

/** Every category, emailed unless the person turned it off. */
export function withDefaults(email: Partial<Record<string, boolean>>): Record<NotificationCategory, boolean> {
  return Object.fromEntries(NOTIFICATION_CATEGORIES.map((c) => [c, email[c] !== false])) as Record<NotificationCategory, boolean>;
}

function toNotification(r: Row): Notification {
  return {
    id: r.id,
    category: r.category as NotificationCategory,
    title: r.title,
    body: r.body,
    link: r.link,
    orgId: r.orgId,
    readAt: r.readAt?.toISOString() ?? null,
    createdAt: r.createdAt.toISOString(),
  };
}
