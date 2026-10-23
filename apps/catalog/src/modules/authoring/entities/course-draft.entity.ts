import { timestamps } from '@lib/database';
import { index, integer, jsonb, pgTable, text, timestamp, uniqueIndex, uuid } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

/**
 * A course being written in the browser (CAT-3): the whole course as an authored document, saved as
 * often as the author likes. Publishing turns it into the course's next version; the row stays as
 * the record of who wrote and who approved that version.
 */
export const courseDrafts = pgTable(
  'course_drafts',
  {
    id: uuid('id').primaryKey(),
    ownerOrgId: uuid('owner_org_id').notNull(),
    /** Null for a new course until it is first published. */
    courseId: uuid('course_id'),
    slug: text('slug').notNull(),
    title: text('title').notNull(),
    visibility: text('visibility', { enum: ['public', 'org_private', 'unlisted'] }).notNull().default('public'),
    status: text('status', { enum: ['draft', 'in_review', 'changes_requested', 'published'] }).notNull().default('draft'),
    doc: jsonb('doc').$type<Record<string, unknown>>().notNull(),
    revision: integer('revision').notNull().default(1),
    baseVersionNo: integer('base_version_no'),
    publishedVersionNo: integer('published_version_no'),
    createdByUserId: uuid('created_by_user_id').notNull(),
    updatedByUserId: uuid('updated_by_user_id').notNull(),
    submittedByUserId: uuid('submitted_by_user_id'),
    submittedAt: timestamp('submitted_at', { withTimezone: true }),
    reviewedByUserId: uuid('reviewed_by_user_id'),
    reviewedAt: timestamp('reviewed_at', { withTimezone: true }),
    reviewNote: text('review_note'),
    ...timestamps,
  },
  (t) => [
    // One open draft per course, and per new slug.
    uniqueIndex('course_drafts_open_course').on(t.courseId).where(sql`status <> 'published' and course_id is not null`),
    uniqueIndex('course_drafts_open_slug').on(t.slug).where(sql`status <> 'published'`),
    index('course_drafts_owner_status').on(t.ownerOrgId, t.status),
  ],
);
