import type { RhythmSlot } from '@dreamlab/contracts';
import { timestamps } from '@lib/database';
import { date, integer, jsonb, pgTable, text, uuid } from 'drizzle-orm/pg-core';

/** One scheduled intake of a programme (ERD §6), hosted by an organisation. */
export const cohorts = pgTable('cohorts', {
  id: uuid('id').primaryKey(),
  programId: uuid('program_id').notNull(),
  programSlug: text('program_slug').notNull(),
  programTitle: text('program_title').notNull(),
  hostOrgId: uuid('host_org_id').notNull(),
  hostOrgName: text('host_org_name').notNull(),
  name: text('name').notNull(),
  startsOn: date('starts_on').notNull(),
  endsOn: date('ends_on').notNull(),
  weeks: integer('weeks').notNull(),
  timeZone: text('time_zone').notNull(),
  capacity: integer('capacity'),
  enrollmentPolicy: text('enrollment_policy', { enum: ['open', 'invite'] }).notNull().default('invite'),
  status: text('status', { enum: ['draft', 'open', 'running', 'closed'] }).notNull().default('draft'),
  rhythm: jsonb('rhythm').$type<RhythmSlot[]>().notNull(),
  createdByUserId: uuid('created_by_user_id').notNull(),
  ...timestamps,
});
