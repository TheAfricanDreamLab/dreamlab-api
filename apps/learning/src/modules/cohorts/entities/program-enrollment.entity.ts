import { timestamps } from '@lib/database';
import { pgTable, text, timestamp, unique, uuid } from 'drizzle-orm/pg-core';
import { cohorts } from './cohort.entity';

/** A learner in a programme through a cohort (ERD §7). The cohort's host is the context organisation. */
export const programEnrollments = pgTable(
  'program_enrollments',
  {
    id: uuid('id').primaryKey(),
    userId: uuid('user_id').notNull(),
    programId: uuid('program_id').notNull(),
    programSlug: text('program_slug').notNull(),
    cohortId: uuid('cohort_id').notNull().references(() => cohorts.id),
    contextOrgId: uuid('context_org_id').notNull(),
    accessGrantId: uuid('access_grant_id'),
    status: text('status', { enum: ['active', 'paused', 'completed', 'withdrawn', 'graduated'] }).notNull().default('active'),
    enrolledAt: timestamp('enrolled_at', { withTimezone: true }).notNull().defaultNow(),
    completedAt: timestamp('completed_at', { withTimezone: true }),
    /** Set when the cohort's managers graduate the learner (GRAD-1). */
    graduatedAt: timestamp('graduated_at', { withTimezone: true }),
    /** The Dream Portfolio's public link while the learner shares it (PORT-1). */
    portfolioToken: text('portfolio_token').unique(),
    ...timestamps,
  },
  (t) => [unique('program_enrollments_user_cohort').on(t.userId, t.cohortId)],
);
