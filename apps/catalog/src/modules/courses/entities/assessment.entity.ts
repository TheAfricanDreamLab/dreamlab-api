import { timestamps } from '@lib/database';
import { boolean, integer, numeric, pgTable, uuid } from 'drizzle-orm/pg-core';
import { contentItems } from './content-item.entity';

/** Quiz settings for a content item. */
export const assessments = pgTable('assessments', {
  contentItemId: uuid('content_item_id').primaryKey().references(() => contentItems.id),
  ownerOrgId: uuid('owner_org_id').notNull(),
  /** Percentage needed to pass. */
  passMark: numeric('pass_mark', { mode: 'number' }).notNull(),
  /** null = unlimited. */
  maxAttempts: integer('max_attempts'),
  timeLimitS: integer('time_limit_s'),
  shuffle: boolean('shuffle').notNull().default(false),
  ...timestamps,
});
