import type { BlockAuthoring } from '@dreamlab/contracts';
import { timestamps } from '@lib/database';
import { integer, jsonb, pgTable, text, uniqueIndex, uuid } from 'drizzle-orm/pg-core';
import { assessments } from './assessment.entity';

/** One quiz question in its authoring form (answers included; never sent to learners). */
export const questions = pgTable(
  'questions',
  {
    id: uuid('id').primaryKey(),
    assessmentId: uuid('assessment_id').notNull().references(() => assessments.contentItemId),
    ownerOrgId: uuid('owner_org_id').notNull(),
    key: text('key').notNull(),
    position: integer('position').notNull(),
    questionType: text('question_type', { enum: ['choice', 'order', 'match'] }).notNull(),
    body: jsonb('body').$type<BlockAuthoring>().notNull(),
    ...timestamps,
  },
  (t) => [uniqueIndex('questions_assessment_key').on(t.assessmentId, t.key)],
);
