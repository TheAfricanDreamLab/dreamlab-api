import type { ActionPlanBody } from '@dreamlab/contracts';
import { timestamps } from '@lib/database';
import { jsonb, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { programEnrollments } from '../../cohorts/entities/program-enrollment.entity';

/** A learner's 12-month post-Lab action plan, one per programme enrolment (a graduation requirement). */
export const actionPlans = pgTable('action_plans', {
  programEnrollmentId: uuid('program_enrollment_id')
    .primaryKey()
    .references(() => programEnrollments.id),
  hostOrgId: uuid('host_org_id').notNull(),
  userId: uuid('user_id').notNull(),
  body: jsonb('body').$type<ActionPlanBody>().notNull(),
  status: text('status', { enum: ['draft', 'submitted', 'changes_requested', 'approved'] }).notNull().default('draft'),
  submittedAt: timestamp('submitted_at', { withTimezone: true }),
  decision: text('decision', { enum: ['approved', 'changes_requested'] }),
  feedback: text('feedback'),
  reviewerUserId: uuid('reviewer_user_id'),
  reviewedAt: timestamp('reviewed_at', { withTimezone: true }),
  ...timestamps,
});
