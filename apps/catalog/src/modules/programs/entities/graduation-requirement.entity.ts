import { timestamps } from '@lib/database';
import { integer, jsonb, pgTable, text, uuid } from 'drizzle-orm/pg-core';
import { programs } from './program.entity';

export const graduationRequirements = pgTable('graduation_requirements', {
  id: uuid('id').primaryKey(),
  programId: uuid('program_id').notNull().references(() => programs.id),
  ownerOrgId: uuid('owner_org_id').notNull(),
  position: integer('position').notNull(),
  key: text('key').notNull(),
  label: text('label').notNull(),
  /** Machine-checkable rule, filled in by the graduation engine slice. */
  rule: jsonb('rule').$type<Record<string, unknown>>().notNull().default({}),
  ...timestamps,
});
