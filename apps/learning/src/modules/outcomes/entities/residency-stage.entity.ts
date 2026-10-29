import { timestamps } from '@lib/database';
import { index, integer, jsonb, numeric, pgTable, text, timestamp, unique, uuid } from 'drizzle-orm/pg-core';
import { programEnrollments } from '../../cohorts/entities/program-enrollment.entity';

export type StageLink = { label: string; url: string };

/**
 * One learner's work on one Dream Residency stage (CAP-1): the output document and its latest review.
 * Created on first save. The review history is in residency_stage_reviews.
 */
export const residencyStages = pgTable(
  'residency_stages',
  {
    id: uuid('id').primaryKey(),
    programEnrollmentId: uuid('program_enrollment_id').notNull().references(() => programEnrollments.id),
    hostOrgId: uuid('host_org_id').notNull(),
    userId: uuid('user_id').notNull(),
    /** The programme's capstone stage position, 1–7. */
    position: integer('position').notNull(),
    status: text('status', { enum: ['draft', 'submitted', 'changes_requested', 'approved'] }).notNull().default('draft'),
    text: text('text').notNull().default(''),
    links: jsonb('links').$type<StageLink[]>().notNull().default([]),
    submittedAt: timestamp('submitted_at', { withTimezone: true }),
    /** Latest review (also in the append-only history). */
    decision: text('decision', { enum: ['approved', 'changes_requested'] }),
    scorePct: numeric('score_pct', { precision: 5, scale: 2, mode: 'number' }),
    feedback: text('feedback'),
    reviewerUserId: uuid('reviewer_user_id'),
    reviewedAt: timestamp('reviewed_at', { withTimezone: true }),
    ...timestamps,
  },
  (t) => [unique('residency_stages_enrollment_position').on(t.programEnrollmentId, t.position), index('residency_stages_host_idx').on(t.hostOrgId)],
);

/** Append-only: every review of a residency stage. */
export const residencyStageReviews = pgTable(
  'residency_stage_reviews',
  {
    id: uuid('id').primaryKey(),
    residencyStageId: uuid('residency_stage_id').notNull().references(() => residencyStages.id),
    hostOrgId: uuid('host_org_id').notNull(),
    decision: text('decision', { enum: ['approved', 'changes_requested'] }).notNull(),
    scorePct: numeric('score_pct', { precision: 5, scale: 2, mode: 'number' }),
    feedback: text('feedback').notNull(),
    reviewerUserId: uuid('reviewer_user_id').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('residency_stage_reviews_stage_idx').on(t.residencyStageId)],
);
