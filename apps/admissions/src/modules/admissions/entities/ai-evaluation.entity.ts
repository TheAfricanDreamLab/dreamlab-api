import { index, integer, jsonb, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import type { DimensionScores } from '@dreamlab/contracts';
import { applications } from './application.entity';

/**
 * What the model said about an application, with the model and prompt version that said it.
 * Immutable (updates and deletes are revoked); it informs reviewers and decides nothing.
 */
export const aiEvaluations = pgTable(
  'ai_evaluations',
  {
    id: uuid('id').primaryKey(),
    applicationId: uuid('application_id').notNull().references(() => applications.id),
    orgId: uuid('org_id').notNull(),
    model: text('model').notNull(),
    promptVersion: text('prompt_version').notNull(),
    scores: jsonb('scores').$type<DimensionScores>().notNull(),
    dbpi: integer('dbpi'),
    dsi: integer('dsi'),
    rationale: text('rationale').notNull(),
    /** SHA-256 of the answers evaluated, so reviewers can tell which version of them it saw. */
    inputDigest: text('input_digest').notNull(),
    requestedByUserId: uuid('requested_by_user_id').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('ai_evaluations_application_idx').on(t.applicationId)],
);
