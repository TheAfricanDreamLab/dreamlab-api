import { timestamps } from '@lib/database';
import { integer, numeric, pgTable, text, timestamp, uniqueIndex, uuid } from 'drizzle-orm/pg-core';
import { courses } from './course.entity';

/** Published versions can't be changed; learners stay pinned to the version they enrolled in. */
export const courseVersions = pgTable(
  'course_versions',
  {
    id: uuid('id').primaryKey(),
    courseId: uuid('course_id').notNull().references(() => courses.id),
    ownerOrgId: uuid('owner_org_id').notNull(),
    versionNo: integer('version_no').notNull(),
    status: text('status', { enum: ['draft', 'in_review', 'published', 'retired'] }).notNull().default('draft'),
    creditHours: numeric('credit_hours', { mode: 'number' }).notNull(),
    estimatedMinutes: integer('estimated_minutes').notNull(),
    /** SHA-256 of the authored content, so re-seeding identical content creates no new version. */
    contentHash: text('content_hash').notNull(),
    reviewedBy: uuid('reviewed_by'),
    publishedAt: timestamp('published_at', { withTimezone: true }),
    ...timestamps,
  },
  (t) => [uniqueIndex('course_versions_course_no_key').on(t.courseId, t.versionNo)],
);
