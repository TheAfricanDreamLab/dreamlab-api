import { boolean, index, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { admissionStage, applicationStatus, applications } from './application.entity';

/** Append-only: every move of an application, with who made it. Updates and deletes are revoked. */
export const stageTransitions = pgTable(
  'stage_transitions',
  {
    id: uuid('id').primaryKey(),
    applicationId: uuid('application_id').notNull().references(() => applications.id),
    orgId: uuid('org_id').notNull(),
    fromStage: admissionStage('from_stage'),
    toStage: admissionStage('to_stage').notNull(),
    status: applicationStatus('status').notNull(),
    actorUserId: uuid('actor_user_id').notNull(),
    byApplicant: boolean('by_applicant').notNull(),
    note: text('note'),
    at: timestamp('at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('stage_transitions_application_idx').on(t.applicationId, t.at)],
);
