import { timestamps } from '@lib/database';
import { boolean, date, numeric, pgTable, text, uuid } from 'drizzle-orm/pg-core';
import { cohorts } from './cohort.entity';

/** A course as delivered in a cohort (ERD §6 course_runs), pinned to the version current at scheduling. */
export const courseRuns = pgTable('course_runs', {
  id: uuid('id').primaryKey(),
  cohortId: uuid('cohort_id').notNull().references(() => cohorts.id),
  hostOrgId: uuid('host_org_id').notNull(),
  courseId: uuid('course_id').notNull(),
  courseSlug: text('course_slug').notNull(),
  courseVersionId: uuid('course_version_id'),
  phaseName: text('phase_name').notNull(),
  required: boolean('required').notNull(),
  /** The phase's elective group (catalog), when learners choose among these courses. */
  electiveGroupKey: text('elective_group_key'),
  creditHours: numeric('credit_hours', { mode: 'number' }).notNull(),
  startsOn: date('starts_on').notNull(),
  endsOn: date('ends_on').notNull(),
  ...timestamps,
});
