import type { ItemState } from '@dreamlab/contracts';
import { timestamps } from '@lib/database';
import { bigint, integer, jsonb, numeric, pgTable, text, timestamp, uniqueIndex, uuid } from 'drizzle-orm/pg-core';
import { courseEnrollments } from './course-enrollment.entity';

/** Where a learner is in one item, and their answers so far. Last write wins (offline sync, ERD §7). */
export const itemProgress = pgTable(
  'item_progress',
  {
    id: uuid('id').primaryKey(),
    courseEnrollmentId: uuid('course_enrollment_id').notNull().references(() => courseEnrollments.id),
    userId: uuid('user_id').notNull(),
    contentItemId: uuid('content_item_id').notNull(),
    itemKey: text('item_key').notNull(),
    status: text('status', { enum: ['not_started', 'in_progress', 'completed'] }).notNull().default('in_progress'),
    progressPct: numeric('progress_pct', { mode: 'number' }).notNull().default(0),
    positionS: integer('position_s'),
    stepIndex: integer('step_index').notNull().default(0),
    state: jsonb('state').$type<ItemState>().notNull().default({ stepIndex: 0, results: {}, responses: {} }),
    rowVersion: bigint('row_version', { mode: 'number' }).notNull().default(1),
    completedAt: timestamp('completed_at', { withTimezone: true }),
    ...timestamps,
  },
  (t) => [uniqueIndex('item_progress_enrollment_item').on(t.courseEnrollmentId, t.contentItemId)],
);
