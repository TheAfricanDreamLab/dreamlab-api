import type { DreamScoreWeights } from '@dreamlab/contracts';
import { index, integer, jsonb, numeric, pgTable, primaryKey, text, timestamp, uniqueIndex, uuid } from 'drizzle-orm/pg-core';
import { programEnrollments } from '../../cohorts/entities/program-enrollment.entity';

/**
 * Append-only evidence for the Dream Score™ (SCORE-1): one row per (source record, dimension,
 * revision). Reading an unchanged source adds nothing; a changed one (a regrade, a corrected mark)
 * adds its next revision, and scores use each source's latest. Updates and deletes are revoked.
 */
export const competencyEvents = pgTable(
  'competency_events',
  {
    id: uuid('id').primaryKey(),
    programEnrollmentId: uuid('program_enrollment_id').notNull().references(() => programEnrollments.id),
    hostOrgId: uuid('host_org_id').notNull(),
    userId: uuid('user_id').notNull(),
    dimension: text('dimension').notNull(),
    /** 0–10. */
    value: numeric('value', { precision: 4, scale: 2, mode: 'number' }).notNull(),
    source: text('source', { enum: ['course_grade', 'residency_stage', 'mentor_meeting', 'attendance'] }).notNull(),
    /** The record the evidence came from (a grade, a residency review, a meeting, an attendance mark). */
    sourceId: uuid('source_id').notNull(),
    /** 1 for the first value seen; each changed value appends the next. */
    revision: integer('revision').notNull().default(1),
    label: text('label').notNull(),
    occurredAt: timestamp('occurred_at', { withTimezone: true }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex('competency_events_revision').on(t.source, t.sourceId, t.dimension, t.revision), index('competency_events_enrollment_idx').on(t.programEnrollmentId, t.occurredAt)],
);

/** The score each cohort week (recomputed while the week is current): Learning, Building, Dream. */
export const dreamScoreSnapshots = pgTable(
  'dream_score_snapshots',
  {
    programEnrollmentId: uuid('program_enrollment_id')
      .notNull()
      .references(() => programEnrollments.id),
    hostOrgId: uuid('host_org_id').notNull(),
    weekNo: integer('week_no').notNull(),
    learning: numeric('learning', { precision: 4, scale: 2, mode: 'number' }),
    building: numeric('building', { precision: 4, scale: 2, mode: 'number' }),
    dream: numeric('dream', { precision: 4, scale: 2, mode: 'number' }),
    dimensions: jsonb('dimensions').$type<Record<string, number | null>>().notNull(),
    computedAt: timestamp('computed_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.programEnrollmentId, t.weekNo] })],
);

/** An organisation's dimension weights (percent, totalling 100); the defaults apply without a row. */
export const dreamScoreWeights = pgTable('dream_score_weights', {
  orgId: uuid('org_id').primaryKey(),
  weights: jsonb('weights').$type<DreamScoreWeights>().notNull(),
  updatedByUserId: uuid('updated_by_user_id').notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});
