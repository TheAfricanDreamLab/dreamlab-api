import { pgTable, text, timestamp, unique, uuid } from 'drizzle-orm/pg-core';
import { programEnrollments } from './program-enrollment.entity';

/** A learner's chosen elective (ERD §6 elective_selections). One row per chosen course. */
export const electiveSelections = pgTable(
  'elective_selections',
  {
    id: uuid('id').primaryKey(),
    programEnrollmentId: uuid('program_enrollment_id').notNull().references(() => programEnrollments.id),
    userId: uuid('user_id').notNull(),
    groupKey: text('group_key').notNull(),
    courseId: uuid('course_id').notNull(),
    courseSlug: text('course_slug').notNull(),
    selectedAt: timestamp('selected_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [unique('elective_selections_enrollment_course').on(t.programEnrollmentId, t.courseId)],
);
