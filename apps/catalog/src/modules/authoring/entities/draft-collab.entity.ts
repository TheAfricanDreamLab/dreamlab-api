import type { CommentAnchor } from '@dreamlab/contracts';
import { index, jsonb, pgTable, primaryKey, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { courseDrafts } from './course-draft.entity';

/** Review comments on a draft (CAT-6), on the course, a module, an item or one block. */
export const draftComments = pgTable(
  'draft_comments',
  {
    id: uuid('id').primaryKey(),
    draftId: uuid('draft_id')
      .notNull()
      .references(() => courseDrafts.id, { onDelete: 'cascade' }),
    ownerOrgId: uuid('owner_org_id').notNull(),
    /** The thread's first comment; null for that first comment. */
    parentId: uuid('parent_id'),
    anchor: jsonb('anchor').$type<CommentAnchor>().notNull(),
    body: text('body').notNull(),
    authorUserId: uuid('author_user_id').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    editedAt: timestamp('edited_at', { withTimezone: true }),
    resolvedAt: timestamp('resolved_at', { withTimezone: true }),
    resolvedByUserId: uuid('resolved_by_user_id'),
  },
  (t) => [index('draft_comments_draft').on(t.draftId, t.createdAt)],
);

/** Who has a draft open, from their heartbeats; rows older than a few minutes are cleared. */
export const draftPresence = pgTable(
  'draft_presence',
  {
    draftId: uuid('draft_id')
      .notNull()
      .references(() => courseDrafts.id, { onDelete: 'cascade' }),
    userId: uuid('user_id').notNull(),
    ownerOrgId: uuid('owner_org_id').notNull(),
    where: jsonb('where').$type<{ moduleKey: string | null; itemKey: string | null; label: string } | null>(),
    editingAt: timestamp('editing_at', { withTimezone: true }),
    seenAt: timestamp('seen_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.draftId, t.userId] })],
);
