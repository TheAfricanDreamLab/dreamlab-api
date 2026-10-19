import { timestamps } from '@lib/database';
import { integer, pgTable, text, uniqueIndex, uuid } from 'drizzle-orm/pg-core';
import { rubrics } from './rubric.entity';

export const rubricCriteria = pgTable(
  'rubric_criteria',
  {
    id: uuid('id').primaryKey(),
    rubricId: uuid('rubric_id').notNull().references(() => rubrics.id),
    ownerOrgId: uuid('owner_org_id').notNull(),
    key: text('key').notNull(),
    position: integer('position').notNull(),
    criterion: text('criterion').notNull(),
    description: text('description').notNull(),
    maxPoints: integer('max_points').notNull().default(4),
    ...timestamps,
  },
  (t) => [uniqueIndex('rubric_criteria_rubric_key').on(t.rubricId, t.key)],
);
