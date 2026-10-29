import { timestamps } from '@lib/database';
import { index, pgTable, primaryKey, text, uuid } from 'drizzle-orm/pg-core';
import { cohorts } from '../../cohorts/entities/cohort.entity';

/** A Dream Circle: a small peer group within a cohort (COMM-1). */
export const dreamCircles = pgTable(
  'dream_circles',
  {
    id: uuid('id').primaryKey(),
    cohortId: uuid('cohort_id').notNull().references(() => cohorts.id),
    hostOrgId: uuid('host_org_id').notNull(),
    name: text('name').notNull(),
    ...timestamps,
  },
  (t) => [index('dream_circles_cohort').on(t.cohortId)],
);

export const circleMembers = pgTable(
  'circle_members',
  {
    circleId: uuid('circle_id').notNull().references(() => dreamCircles.id, { onDelete: 'cascade' }),
    userId: uuid('user_id').notNull(),
    hostOrgId: uuid('host_org_id').notNull(),
  },
  (t) => [primaryKey({ columns: [t.circleId, t.userId] }), index('circle_members_user').on(t.userId)],
);
