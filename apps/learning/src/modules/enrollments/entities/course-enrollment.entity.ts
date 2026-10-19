import { timestamps } from '@lib/database';
import { boolean, integer, numeric, pgTable, text, timestamp, unique, uuid } from 'drizzle-orm/pg-core';

/**
 * A learner in a course (ERD §7), pinned to the course version they enrolled in. The context
 * organisation is the one the learner was in when they enrolled (null for personal learning);
 * only its admins may report on this record.
 */
export const courseEnrollments = pgTable(
  'course_enrollments',
  {
    id: uuid('id').primaryKey(),
    userId: uuid('user_id').notNull(),
    courseId: uuid('course_id').notNull(),
    courseSlug: text('course_slug').notNull(),
    courseVersionId: uuid('course_version_id').notNull(),
    courseRunId: uuid('course_run_id'),
    programEnrollmentId: uuid('program_enrollment_id'),
    contextOrgId: uuid('context_org_id'),
    /** commerce issues access grants later; until then free and open courses record their source here. */
    accessGrantId: uuid('access_grant_id'),
    accessSource: text('access_source', { enum: ['free', 'org_private', 'grant'] }).notNull(),
    mode: text('mode', { enum: ['audit', 'full'] }).notNull().default('full'),
    status: text('status', { enum: ['active', 'completed'] }).notNull().default('active'),
    progressPct: integer('progress_pct').notNull().default(0),
    completedItems: integer('completed_items').notNull().default(0),
    totalItems: integer('total_items').notNull(),
    finalScore: numeric('final_score', { mode: 'number' }),
    passed: boolean('passed'),
    enrolledAt: timestamp('enrolled_at', { withTimezone: true }).notNull().defaultNow(),
    lastActiveAt: timestamp('last_active_at', { withTimezone: true }).notNull().defaultNow(),
    completedAt: timestamp('completed_at', { withTimezone: true }),
    ...timestamps,
  },
  (t) => [unique('course_enrollments_user_course_context').on(t.userId, t.courseId, t.contextOrgId).nullsNotDistinct()],
);
