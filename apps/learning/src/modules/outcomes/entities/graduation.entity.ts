import { pgTable, primaryKey, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { programEnrollments } from '../../cohorts/entities/program-enrollment.entity';

/**
 * A faculty confirmation of one graduation requirement (GRAD-1). Withdrawing a confirmation deletes
 * the row; graduating needs every requirement of the programme confirmed.
 */
export const graduationConfirmations = pgTable(
  'graduation_confirmations',
  {
    programEnrollmentId: uuid('program_enrollment_id')
      .notNull()
      .references(() => programEnrollments.id),
    requirementKey: text('requirement_key').notNull(),
    hostOrgId: uuid('host_org_id').notNull(),
    confirmedByUserId: uuid('confirmed_by_user_id').notNull(),
    note: text('note').notNull().default(''),
    confirmedAt: timestamp('confirmed_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.programEnrollmentId, t.requirementKey] })],
);
