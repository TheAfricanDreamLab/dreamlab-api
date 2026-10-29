import { index, integer, jsonb, pgEnum, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import type { DimensionScores } from '@dreamlab/contracts';
import { admissionStage, applications } from './application.entity';

export const reviewRecommendation = pgEnum('review_recommendation', ['advance', 'hold', 'decline']);

/** A reviewer's scores and recommendation. Append-only: a changed mind is a new review. */
export const applicationReviews = pgTable(
  'application_reviews',
  {
    id: uuid('id').primaryKey(),
    applicationId: uuid('application_id').notNull().references(() => applications.id),
    orgId: uuid('org_id').notNull(),
    stage: admissionStage('stage').notNull(),
    reviewerUserId: uuid('reviewer_user_id').notNull(),
    scores: jsonb('scores').$type<DimensionScores>().notNull(),
    dbpi: integer('dbpi'),
    dsi: integer('dsi'),
    recommendation: reviewRecommendation('recommendation').notNull(),
    comment: text('comment').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('application_reviews_application_idx').on(t.applicationId)],
);
