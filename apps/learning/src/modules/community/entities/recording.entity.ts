import { pgTable, bigint, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { classSessions } from '../../cohorts/entities/class-session.entity';

/** A class recording, uploaded by faculty (Plan §10.2; provider recording is a later option). */
export const recordings = pgTable('recordings', {
  id: uuid('id').primaryKey(),
  classSessionId: uuid('class_session_id').notNull().references(() => classSessions.id),
  hostOrgId: uuid('host_org_id').notNull(),
  title: text('title').notNull(),
  /** Path in the private container: recordings/<cohort>/<id>/<name>. */
  path: text('path').notNull(),
  contentType: text('content_type').notNull(),
  size: bigint('size', { mode: 'number' }).notNull(),
  uploadedByUserId: uuid('uploaded_by_user_id').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});
