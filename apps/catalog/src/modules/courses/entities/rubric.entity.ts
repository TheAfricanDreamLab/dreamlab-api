import { timestamps } from '@lib/database';
import { pgTable, text, uuid } from 'drizzle-orm/pg-core';

export const rubrics = pgTable('rubrics', {
  id: uuid('id').primaryKey(),
  ownerOrgId: uuid('owner_org_id').notNull(),
  title: text('title').notNull(),
  ...timestamps,
});
