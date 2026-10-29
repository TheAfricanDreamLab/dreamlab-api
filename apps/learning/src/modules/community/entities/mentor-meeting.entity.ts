import { timestamps } from '@lib/database';
import { index, integer, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { mentorAssignments } from './mentor-assignment.entity';

/** A meeting between a mentor and a learner; virtual ones get a live room. The mentor keeps the log. */
export const mentorMeetings = pgTable(
  'mentor_meetings',
  {
    id: uuid('id').primaryKey(),
    assignmentId: uuid('assignment_id').notNull().references(() => mentorAssignments.id),
    hostOrgId: uuid('host_org_id').notNull(),
    scheduledAt: timestamp('scheduled_at', { withTimezone: true }).notNull(),
    durationMin: integer('duration_min').notNull(),
    mode: text('mode', { enum: ['virtual', 'physical'] }).notNull(),
    location: text('location'),
    status: text('status', { enum: ['scheduled', 'held', 'cancelled'] }).notNull().default('scheduled'),
    notes: text('notes').notNull().default(''),
    ...timestamps,
  },
  (t) => [index('mentor_meetings_assignment').on(t.assignmentId, t.scheduledAt)],
);
