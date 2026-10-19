import { timestamps } from '@lib/database';
import { integer, jsonb, pgTable, text, uuid } from 'drizzle-orm/pg-core';
import { contentItems } from './content-item.entity';
import { rubrics } from './rubric.entity';

/** Assignment and peer-review settings. `practical_output` carries the Dream Lab named output. */
export const assignmentSpecs = pgTable('assignment_specs', {
  contentItemId: uuid('content_item_id').primaryKey().references(() => contentItems.id),
  ownerOrgId: uuid('owner_org_id').notNull(),
  rubricId: uuid('rubric_id').references(() => rubrics.id),
  practicalOutput: text('practical_output'),
  peerReviewsRequired: integer('peer_reviews_required').notNull().default(0),
  acceptedFiles: jsonb('accepted_files').$type<string[]>().notNull().default([]),
  ...timestamps,
});
