import type { CourseAuthoring } from '@dreamlab/contracts';
import { timestamps } from '@lib/database';
import { jsonb, numeric, pgTable, text, uniqueIndex, uuid } from 'drizzle-orm/pg-core';

/** A course belongs to the organisation that wrote it (ERD §5). Its content lives in versions. */
export const courses = pgTable(
  'courses',
  {
    id: uuid('id').primaryKey(),
    ownerOrgId: uuid('owner_org_id').notNull(),
    slug: text('slug').notNull(),
    title: text('title').notNull(),
    subtitle: text('subtitle').notNull(),
    description: text('description').notNull(),
    provider: text('provider').notNull(),
    visibility: text('visibility', { enum: ['public', 'org_private', 'unlisted'] }).notNull().default('public'),
    level: text('level', { enum: ['beginner', 'intermediate', 'advanced'] }).notNull(),
    language: text('language').notNull().default('en'),
    /** Planned credit hours; the published version carries the credit actually awarded. */
    creditHours: numeric('credit_hours', { mode: 'number' }).notNull(),
    outcomes: jsonb('outcomes').$type<string[]>().notNull(),
    skills: text('skills').array().notNull().default([]),
    audience: text('audience').notNull(),
    prerequisites: text('prerequisites').notNull(),
    practicalOutput: text('practical_output'),
    cover: jsonb('cover').$type<CourseAuthoring['cover']>().notNull(),
    /** Display details of the teaching team (course_staff will link user accounts). */
    instructors: jsonb('instructors').$type<CourseAuthoring['instructors']>().notNull().default([]),
    /** The published version learners enrol in; null while the course is coming soon. */
    currentVersionId: uuid('current_version_id'),
    ...timestamps,
  },
  (t) => [uniqueIndex('courses_slug_key').on(t.slug)],
);
