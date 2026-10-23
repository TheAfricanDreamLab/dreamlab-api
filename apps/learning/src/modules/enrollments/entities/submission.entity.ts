import { index, integer, jsonb, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { courseEnrollments } from './course-enrollment.entity';

/**
 * Append-only (ERD §7): every answer, quiz attempt, assignment version, reflection and discussion
 * post is a new row. The app role may insert and read, never update or delete.
 */
export const submissions = pgTable(
  'submissions',
  {
    id: uuid('id').primaryKey(),
    courseEnrollmentId: uuid('course_enrollment_id').notNull().references(() => courseEnrollments.id),
    userId: uuid('user_id').notNull(),
    courseId: uuid('course_id').notNull(),
    contentItemId: uuid('content_item_id').notNull(),
    /** Stable across course versions, so peers on different versions share a discussion. */
    itemKey: text('item_key').notNull(),
    contextOrgId: uuid('context_org_id'),
    kind: text('kind', { enum: ['check', 'quiz', 'assignment', 'reflection', 'discussion'] }).notNull(),
    blockId: text('block_id'),
    attemptNo: integer('attempt_no').notNull().default(1),
    responses: jsonb('responses').$type<Record<string, unknown>>().notNull().default({}),
    body: text('body'),
    /** Discussion replies point at the post they answer. */
    parentId: uuid('parent_id'),
    fileAssetIds: uuid('file_asset_ids').array().notNull().default([]),
    clientCommandId: uuid('client_command_id'),
    submittedAt: timestamp('submitted_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index('submissions_enrollment_item').on(t.courseEnrollmentId, t.contentItemId),
    index('submissions_course_item_block').on(t.courseId, t.itemKey, t.blockId),
    /** The grading queue: an organisation's assignment submissions, newest first. */
    index('submissions_context_kind_time').on(t.contextOrgId, t.kind, t.submittedAt),
  ],
);
