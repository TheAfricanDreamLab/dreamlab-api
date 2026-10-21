import { timestamps } from '@lib/database';
import { boolean, index, integer, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { cohorts } from './cohort.entity';
import { courseRuns } from './course-run.entity';

/** A scheduled class (ERD §6 class_sessions), from the cohort's weekly rhythm. */
export const classSessions = pgTable(
  'class_sessions',
  {
    id: uuid('id').primaryKey(),
    cohortId: uuid('cohort_id').notNull().references(() => cohorts.id),
    courseRunId: uuid('course_run_id').references(() => courseRuns.id),
    hostOrgId: uuid('host_org_id').notNull(),
    weekNo: integer('week_no').notNull(),
    title: text('title').notNull(),
    startsAt: timestamp('starts_at', { withTimezone: true }).notNull(),
    durationMin: integer('duration_min').notNull(),
    mode: text('mode', { enum: ['virtual', 'physical'] }).notNull(),
    location: text('location'),
    cancelled: boolean('cancelled').notNull().default(false),
    ...timestamps,
  },
  (t) => [index('class_sessions_cohort_start').on(t.cohortId, t.startsAt)],
);
