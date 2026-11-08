import type { StudyDay } from '@dreamlab/contracts';
import { timestamps } from '@lib/database';
import { boolean, index, integer, pgTable, primaryKey, text, timestamp, uniqueIndex, uuid } from 'drizzle-orm/pg-core';
import { dreamCircles } from '../../community/entities/dream-circle.entity';

/**
 * A learner's goal and study plan (LRN-9), in their own words: one per programme enrolment (cohort
 * learners) or course enrolment (learning on their own). Only its owner reads or writes it.
 */
export const learningGoals = pgTable(
  'learning_goals',
  {
    id: uuid('id').primaryKey(),
    userId: uuid('user_id').notNull(),
    scope: text('scope', { enum: ['program', 'course'] }).notNull(),
    /** A programme enrolment or a course enrolment, by scope. */
    enrollmentId: uuid('enrollment_id').notNull(),
    why: text('why').notNull(),
    success: text('success'),
    studyDays: text('study_days').array().$type<StudyDay[]>().notNull(),
    studyTime: text('study_time'),
    minutesPerWeek: integer('minutes_per_week').notNull(),
    ...timestamps,
  },
  (t) => [uniqueIndex('learning_goals_owner_enrollment').on(t.userId, t.scope, t.enrollmentId)],
);

/**
 * Every reminder and check-in sent to a learner (LRN-9). Reminders are claimed by inserting their row:
 * one per enrolment, kind and lapse (the activity the quiet days count from), so two scheduler
 * instances never send the same one. returned_at is set when the learner is next active.
 */
export const progressReminders = pgTable(
  'progress_reminders',
  {
    id: uuid('id').primaryKey(),
    userId: uuid('user_id').notNull(),
    scope: text('scope', { enum: ['program', 'course'] }).notNull(),
    enrollmentId: uuid('enrollment_id').notNull(),
    kind: text('kind', { enum: ['first_step', 'quiet_5', 'quiet_12', 'quiet_21', 'check_in'] }).notNull(),
    /** Automatic reminders: when the quiet spell began (enrolment or last activity). Check-ins: when sent. */
    lapseFrom: timestamp('lapse_from', { withTimezone: true }).notNull(),
    sentAt: timestamp('sent_at', { withTimezone: true }).notNull().defaultNow(),
    /** Null for automatic reminders; the sender of a check-in. */
    sentByUserId: uuid('sent_by_user_id'),
    returnedAt: timestamp('returned_at', { withTimezone: true }),
  },
  (t) => [
    uniqueIndex('progress_reminders_once').on(t.enrollmentId, t.kind, t.lapseFrom),
    index('progress_reminders_user_sent').on(t.userId, t.sentAt),
  ],
);

/** Whether a member shares their week's progress with their Dream Circle (off until they turn it on). */
export const circleProgressSharing = pgTable(
  'circle_progress_sharing',
  {
    circleId: uuid('circle_id')
      .notNull()
      .references(() => dreamCircles.id, { onDelete: 'cascade' }),
    userId: uuid('user_id').notNull(),
    hostOrgId: uuid('host_org_id').notNull(),
    share: boolean('share').notNull().default(false),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.circleId, t.userId] })],
);
