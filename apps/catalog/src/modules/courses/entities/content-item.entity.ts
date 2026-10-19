import { timestamps } from '@lib/database';
import { boolean, integer, jsonb, numeric, pgTable, text, uniqueIndex, uuid } from 'drizzle-orm/pg-core';
import { courseVersions } from './course-version.entity';
import { courseModules } from './module.entity';

/**
 * A typed item in a module. Quizzes keep their settings in `assessments` and their questions in
 * `questions`; assignments in `assignment_specs` and `rubrics`; everything else in `payload`.
 */
export const contentItems = pgTable(
  'content_items',
  {
    id: uuid('id').primaryKey(),
    moduleId: uuid('module_id').notNull().references(() => courseModules.id),
    courseVersionId: uuid('course_version_id').notNull().references(() => courseVersions.id),
    ownerOrgId: uuid('owner_org_id').notNull(),
    key: text('key').notNull(),
    position: integer('position').notNull(),
    itemType: text('item_type', { enum: ['lesson', 'quiz', 'assignment', 'discussion'] }).notNull(),
    title: text('title').notNull(),
    estimatedMinutes: integer('estimated_minutes').notNull(),
    isRequired: boolean('is_required').notNull().default(true),
    gradeWeight: numeric('grade_weight', { mode: 'number' }).notNull().default(0),
    mediaAssetId: uuid('media_asset_id'),
    payload: jsonb('payload').$type<Record<string, unknown>>().notNull().default({}),
    ...timestamps,
  },
  (t) => [uniqueIndex('content_items_version_key').on(t.courseVersionId, t.key)],
);
