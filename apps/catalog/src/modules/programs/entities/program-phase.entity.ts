import { timestamps } from '@lib/database';
import { integer, numeric, pgTable, text, uuid } from 'drizzle-orm/pg-core';
import { programs } from './program.entity';

export const programPhases = pgTable('program_phases', {
  id: uuid('id').primaryKey(),
  programId: uuid('program_id').notNull().references(() => programs.id),
  ownerOrgId: uuid('owner_org_id').notNull(),
  position: integer('position').notNull(),
  name: text('name').notNull(),
  summary: text('summary').notNull(),
  weekFrom: integer('week_from'),
  weekTo: integer('week_to'),
  weightPct: numeric('weight_pct', { mode: 'number' }).notNull(),
  ...timestamps,
});
