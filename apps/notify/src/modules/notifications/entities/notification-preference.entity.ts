import { timestamps } from '@lib/database';
import { jsonb, pgTable, uuid } from 'drizzle-orm/pg-core';

/** A person's email choices per category. A category not listed is emailed. */
export const notificationPreferences = pgTable('notification_preferences', {
  userId: uuid('user_id').primaryKey(),
  email: jsonb('email').$type<Record<string, boolean>>().notNull().default({}),
  ...timestamps,
});
