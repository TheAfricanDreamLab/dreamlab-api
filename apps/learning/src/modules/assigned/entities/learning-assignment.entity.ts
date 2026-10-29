import { date, index, pgTable, primaryKey, text, timestamp, uuid } from 'drizzle-orm/pg-core';

/** A course an organisation assigned to some of its people (ASSIGN-1). */
export const learningAssignments = pgTable(
  'learning_assignments',
  {
    id: uuid('id').primaryKey(),
    orgId: uuid('org_id').notNull(),
    courseId: uuid('course_id').notNull(),
    courseSlug: text('course_slug').notNull(),
    dueOn: date('due_on'),
    note: text('note').notNull().default(''),
    assignedByUserId: uuid('assigned_by_user_id').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    /** Withdrawn assignments disappear from lists; enrolments and progress stay. */
    withdrawnAt: timestamp('withdrawn_at', { withTimezone: true }),
  },
  (t) => [index('learning_assignments_org_idx').on(t.orgId)],
);

/** One person on an assignment, expanded from groups when it was made. */
export const learningAssignees = pgTable(
  'learning_assignees',
  {
    assignmentId: uuid('assignment_id')
      .notNull()
      .references(() => learningAssignments.id),
    userId: uuid('user_id').notNull(),
    orgId: uuid('org_id').notNull(),
    courseEnrollmentId: uuid('course_enrollment_id'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.assignmentId, t.userId] }), index('learning_assignees_user_idx').on(t.userId)],
);
