import { index, pgTable, timestamp, uuid } from 'drizzle-orm/pg-core';
import { cohorts } from '../../cohorts/entities/cohort.entity';

/** A mentor working with one learner in a cohort (COMM-1). Ending one keeps its meetings. */
export const mentorAssignments = pgTable(
  'mentor_assignments',
  {
    id: uuid('id').primaryKey(),
    cohortId: uuid('cohort_id').notNull().references(() => cohorts.id),
    hostOrgId: uuid('host_org_id').notNull(),
    mentorUserId: uuid('mentor_user_id').notNull(),
    learnerUserId: uuid('learner_user_id').notNull(),
    assignedByUserId: uuid('assigned_by_user_id').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    endedAt: timestamp('ended_at', { withTimezone: true }),
  },
  (t) => [index('mentor_assignments_mentor').on(t.mentorUserId), index('mentor_assignments_learner').on(t.learnerUserId), index('mentor_assignments_cohort').on(t.cohortId)],
);
