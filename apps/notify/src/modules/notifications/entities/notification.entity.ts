import { index, pgTable, text, timestamp, unique, uuid } from 'drizzle-orm/pg-core';

/** One notification for one person. Shown in the app; emailed when their preference says so. */
export const notifications = pgTable(
  'notifications',
  {
    id: uuid('id').primaryKey(),
    userId: uuid('user_id').notNull(),
    orgId: uuid('org_id'),
    category: text('category').notNull(),
    title: text('title').notNull(),
    body: text('body').notNull(),
    link: text('link'),
    /** The requester's key; a redelivered request never notifies anyone twice. */
    dedupeKey: text('dedupe_key').notNull(),
    readAt: timestamp('read_at', { withTimezone: true }),
    emailedAt: timestamp('emailed_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [unique('notifications_user_key').on(t.userId, t.dedupeKey), index('notifications_user_created').on(t.userId, t.createdAt.desc())],
);
