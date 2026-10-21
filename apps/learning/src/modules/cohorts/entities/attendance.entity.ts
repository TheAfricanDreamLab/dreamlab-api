import { timestamps } from '@lib/database';
import { integer, pgTable, text, unique, uuid } from 'drizzle-orm/pg-core';
import { classSessions } from './class-session.entity';
import { programEnrollments } from './program-enrollment.entity';

/** Attendance at one class (ERD §7). A correction updates the row and records who made it. */
export const attendance = pgTable(
  'attendance',
  {
    id: uuid('id').primaryKey(),
    classSessionId: uuid('class_session_id').notNull().references(() => classSessions.id),
    programEnrollmentId: uuid('program_enrollment_id').notNull().references(() => programEnrollments.id),
    userId: uuid('user_id').notNull(),
    hostOrgId: uuid('host_org_id').notNull(),
    status: text('status', { enum: ['present', 'late', 'absent', 'excused'] }).notNull(),
    minutes: integer('minutes'),
    source: text('source', { enum: ['webhook', 'recording', 'override'] }).notNull().default('override'),
    markedByUserId: uuid('marked_by_user_id').notNull(),
    ...timestamps,
  },
  (t) => [unique('attendance_session_user').on(t.classSessionId, t.userId)],
);
