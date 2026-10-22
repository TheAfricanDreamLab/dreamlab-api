import { timestamps } from '@lib/database';
import { date, integer, pgTable, text, uniqueIndex, uuid } from 'drizzle-orm/pg-core';
import { cohorts } from './cohort.entity';

/** The cohort's dated copy of the programme calendar (ERD §6 calendar_weeks). */
export const calendarWeeks = pgTable(
  'calendar_weeks',
  {
    id: uuid('id').primaryKey(),
    cohortId: uuid('cohort_id').notNull().references(() => cohorts.id),
    hostOrgId: uuid('host_org_id').notNull(),
    weekNo: integer('week_no').notNull(),
    phaseName: text('phase_name').notNull(),
    focus: text('focus').notNull(),
    majorOutput: text('major_output').notNull(),
    startsOn: date('starts_on').notNull(),
    endsOn: date('ends_on').notNull(),
    ...timestamps,
  },
  (t) => [uniqueIndex('calendar_weeks_cohort_week').on(t.cohortId, t.weekNo)],
);
