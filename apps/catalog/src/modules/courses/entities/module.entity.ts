import { timestamps } from '@lib/database';
import { integer, pgTable, text, uniqueIndex, uuid } from 'drizzle-orm/pg-core';
import { courseVersions } from './course-version.entity';

export const courseModules = pgTable(
  'modules',
  {
    id: uuid('id').primaryKey(),
    courseVersionId: uuid('course_version_id').notNull().references(() => courseVersions.id),
    ownerOrgId: uuid('owner_org_id').notNull(),
    /** Stable across versions (the authoring key). */
    key: text('key').notNull(),
    position: integer('position').notNull(),
    title: text('title').notNull(),
    summary: text('summary').notNull(),
    weekNo: integer('week_no'),
    ...timestamps,
  },
  (t) => [uniqueIndex('modules_version_key').on(t.courseVersionId, t.key)],
);
