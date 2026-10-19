import { timestamps } from '@lib/database';
import { integer, jsonb, pgTable, uuid } from 'drizzle-orm/pg-core';
import { programPhases } from './program-phase.entity';
import { programs } from './program.entity';

/** Learners choose `choose_n` of the group's courses by `select_by_week`. */
export const electiveGroups = pgTable('elective_groups', {
  id: uuid('id').primaryKey(),
  programId: uuid('program_id').notNull().references(() => programs.id),
  phaseId: uuid('phase_id').references(() => programPhases.id),
  ownerOrgId: uuid('owner_org_id').notNull(),
  chooseN: integer('choose_n').notNull(),
  selectByWeek: integer('select_by_week'),
  capacityPerOption: jsonb('capacity_per_option').$type<Record<string, number>>().notNull().default({}),
  ...timestamps,
});
