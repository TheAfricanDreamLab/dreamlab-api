import { boolean, index, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { users } from '../../users/entities/user.entity';

/** NDPA consent trail: append-only, one row per decision. */
export const consentRecords = pgTable(
  'consent_records',
  {
    id: uuid('id').primaryKey(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    purpose: text('purpose', { enum: ['terms', 'privacy', 'ai_processing', 'marketing', 'guardian'] }).notNull(),
    policyVersion: text('policy_version').notNull(),
    granted: boolean('granted').notNull(),
    ip: text('ip'),
    userAgent: text('user_agent'),
    recordedAt: timestamp('recorded_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('consent_records_user_idx').on(t.userId)],
);
