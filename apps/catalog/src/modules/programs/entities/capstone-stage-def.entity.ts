import { timestamps } from '@lib/database';
import { integer, numeric, pgTable, text, uuid } from 'drizzle-orm/pg-core';
import { programs } from './program.entity';

/** A graded capstone stage, e.g. one of the seven Dream Residency stages. */
export const capstoneStageDefs = pgTable('capstone_stage_defs', {
  id: uuid('id').primaryKey(),
  programId: uuid('program_id').notNull().references(() => programs.id),
  ownerOrgId: uuid('owner_org_id').notNull(),
  position: integer('position').notNull(),
  name: text('name').notNull(),
  outputDocument: text('output_document').notNull(),
  creditHours: numeric('credit_hours', { mode: 'number' }).notNull(),
  summary: text('summary').notNull(),
  ...timestamps,
});
