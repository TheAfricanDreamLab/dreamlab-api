import { index, integer, jsonb, pgTable, primaryKey, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { courseDrafts } from './course-draft.entity';

/**
 * A draft's save history (CAT-5): the document as it was at each save, so an author can look back
 * and restore an earlier version. The newest DRAFT_HISTORY_KEPT saves are kept per draft.
 */
export const courseDraftSaves = pgTable(
  'course_draft_saves',
  {
    draftId: uuid('draft_id')
      .notNull()
      .references(() => courseDrafts.id, { onDelete: 'cascade' }),
    revision: integer('revision').notNull(),
    ownerOrgId: uuid('owner_org_id').notNull(),
    doc: jsonb('doc').$type<Record<string, unknown>>().notNull(),
    title: text('title').notNull(),
    savedByUserId: uuid('saved_by_user_id').notNull(),
    savedAt: timestamp('saved_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.draftId, t.revision] }), index('course_draft_saves_recent').on(t.draftId, t.savedAt)],
);
