import { timestamps } from '@lib/database';
import { integer, pgTable, text, uniqueIndex, uuid } from 'drizzle-orm/pg-core';
import { programPhases } from './program-phase.entity';
import { programs } from './program.entity';

/**
 * The programme's template calendar (an addition to ERD §6). Each cohort copies it into its own
 * `calendar_weeks` (learning service) when the cohort is scheduled.
 */
export const programCalendarWeeks = pgTable(
  'program_calendar_weeks',
  {
    id: uuid('id').primaryKey(),
    programId: uuid('program_id').notNull().references(() => programs.id),
    phaseId: uuid('phase_id').references(() => programPhases.id),
    ownerOrgId: uuid('owner_org_id').notNull(),
    weekNo: integer('week_no').notNull(),
    focus: text('focus').notNull(),
    majorOutput: text('major_output').notNull(),
    ...timestamps,
  },
  (t) => [uniqueIndex('program_calendar_weeks_program_week').on(t.programId, t.weekNo)],
);
