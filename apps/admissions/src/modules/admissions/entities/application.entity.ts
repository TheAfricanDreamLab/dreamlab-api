import { index, jsonb, pgEnum, pgTable, uniqueIndex, uuid } from 'drizzle-orm/pg-core';
import { ADMISSION_STAGES, APPLICATION_STATUSES } from '@dreamlab/contracts';
import { timestamps } from '@lib/database';
import { admissionCycles } from './admission-cycle.entity';

export const admissionStage = pgEnum('admission_stage', ADMISSION_STAGES);
export const applicationStatus = pgEnum('application_status', APPLICATION_STATUSES);

export interface InterviewRecord {
  scheduledAt: string;
  interviewerUserId: string | null;
  notes: string;
}
export interface ScholarshipRecord {
  percent: number;
  note: string;
  decidedByUserId: string;
  decidedAt: string;
}
export interface DecisionRecord {
  outcome: 'admitted' | 'waitlisted' | 'declined';
  note: string;
  decidedByUserId: string;
  decidedAt: string;
}

/** One person's application to a cycle. Its history is in stage_transitions. */
export const applications = pgTable(
  'applications',
  {
    id: uuid('id').primaryKey(),
    cycleId: uuid('cycle_id').notNull().references(() => admissionCycles.id),
    /** The cycle's organisation, for row-level security. */
    orgId: uuid('org_id').notNull(),
    userId: uuid('user_id').notNull(),
    stage: admissionStage('stage').notNull().default('eligibility'),
    status: applicationStatus('status').notNull().default('in_progress'),
    /** Answers per applicant stage, drafts included. */
    answers: jsonb('answers').$type<Record<string, Record<string, unknown>>>().notNull().default({}),
    /** When each applicant stage was submitted. */
    submitted: jsonb('submitted').$type<Record<string, string>>().notNull().default({}),
    interview: jsonb('interview').$type<InterviewRecord>(),
    scholarship: jsonb('scholarship').$type<ScholarshipRecord>(),
    decision: jsonb('decision').$type<DecisionRecord>(),
    ...timestamps,
  },
  (t) => [uniqueIndex('applications_cycle_user_uq').on(t.cycleId, t.userId), index('applications_user_idx').on(t.userId), index('applications_org_idx').on(t.orgId)],
);
