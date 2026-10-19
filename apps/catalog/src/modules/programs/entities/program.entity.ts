import type { ProgramAuthoring } from '@dreamlab/contracts';
import { timestamps } from '@lib/database';
import { jsonb, numeric, pgTable, text, uniqueIndex, uuid } from 'drizzle-orm/pg-core';

/** An ordered set of courses with a type and switchable features (ERD §6). */
export const programs = pgTable(
  'programs',
  {
    id: uuid('id').primaryKey(),
    ownerOrgId: uuid('owner_org_id').notNull(),
    slug: text('slug').notNull(),
    title: text('title').notNull(),
    subtitle: text('subtitle').notNull(),
    description: text('description').notNull(),
    provider: text('provider').notNull(),
    programType: text('program_type', { enum: ['specialization', 'professional_certificate', 'learning_path', 'cohort_program', 'degree'] }).notNull(),
    deliveryMode: text('delivery_mode', { enum: ['self_paced', 'cohort', 'blended'] }).notNull(),
    visibility: text('visibility', { enum: ['public', 'org_private', 'unlisted'] }).notNull().default('public'),
    creditTotal: numeric('credit_total', { mode: 'number' }).notNull(),
    features: jsonb('features').$type<ProgramAuthoring['features']>().notNull().default([]),
    cover: jsonb('cover').$type<ProgramAuthoring['cover']>().notNull(),
    ...timestamps,
  },
  (t) => [uniqueIndex('programs_slug_key').on(t.slug)],
);
