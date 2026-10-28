import { index, integer, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { courseEnrollments } from '../../enrollments/entities/course-enrollment.entity';

/**
 * A file a learner uploaded for an assignment (MEDIA-1). The row is written when the upload link is
 * issued; submitting checks the file really arrived. Stored privately: only its owner, and faculty
 * who may grade a submission it is attached to, get a link to it.
 */
export const learnerFiles = pgTable(
  'learner_files',
  {
    id: uuid('id').primaryKey(),
    userId: uuid('user_id').notNull(),
    courseEnrollmentId: uuid('course_enrollment_id').notNull().references(() => courseEnrollments.id),
    contentItemId: uuid('content_item_id').notNull(),
    /** Path in the private container: submissions/<user>/<file id>/<name>. */
    path: text('path').notNull(),
    name: text('name').notNull(),
    /** What the learner declared; the stored size is checked when they submit. */
    size: integer('size').notNull(),
    contentType: text('content_type').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('learner_files_enrollment_item').on(t.courseEnrollmentId, t.contentItemId)],
);
