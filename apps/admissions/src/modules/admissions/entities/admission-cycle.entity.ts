import { index, pgEnum, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { timestamps } from '@lib/database';

export const cycleStatus = pgEnum('cycle_status', ['draft', 'open', 'closed']);

/** An intake an organisation admits applicants through, for one programme (ADM-1). */
export const admissionCycles = pgTable(
  'admission_cycles',
  {
    id: uuid('id').primaryKey(),
    orgId: uuid('org_id').notNull(),
    name: text('name').notNull(),
    programSlug: text('program_slug').notNull(),
    /** Copied from the catalogue when the cycle is created. */
    programTitle: text('program_title').notNull(),
    /** The cohort admitted applicants join; learning checks it belongs to this organisation when they do. */
    cohortId: uuid('cohort_id'),
    opensAt: timestamp('opens_at', { withTimezone: true }).notNull(),
    closesAt: timestamp('closes_at', { withTimezone: true }).notNull(),
    status: cycleStatus('status').notNull().default('draft'),
    createdByUserId: uuid('created_by_user_id').notNull(),
    ...timestamps,
  },
  (t) => [index('admission_cycles_org_idx').on(t.orgId), index('admission_cycles_program_idx').on(t.programSlug)],
);
