import type { LinkPreview } from '@dreamlab/contracts';
import { index, integer, jsonb, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { dreamCircles } from './dream-circle.entity';

/**
 * A post on a Dream Circle's board, or a reply to one (COMM-2). Removed posts keep their row with
 * `deletedAt` set, so replies and counts stay consistent; their text and files are cleared.
 */
export const circlePosts = pgTable(
  'circle_posts',
  {
    id: uuid('id').primaryKey(),
    circleId: uuid('circle_id')
      .notNull()
      .references(() => dreamCircles.id, { onDelete: 'cascade' }),
    hostOrgId: uuid('host_org_id').notNull(),
    authorUserId: uuid('author_user_id').notNull(),
    parentId: uuid('parent_id'),
    body: text('body').notNull().default(''),
    /** Link previews read once when the post was made (title, description, site). */
    links: jsonb('links').$type<LinkPreview[]>().notNull().default([]),
    replyCount: integer('reply_count').notNull().default(0),
    pinnedAt: timestamp('pinned_at', { withTimezone: true }),
    deletedAt: timestamp('deleted_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    // The board: a circle's top-level posts, newest first (keyset pages on created_at, id).
    index('circle_posts_board').on(t.circleId, t.createdAt, t.id),
    index('circle_posts_replies').on(t.parentId, t.createdAt),
  ],
);

/**
 * A file uploaded for a post: a voice message, picture, video or other file. Created when the upload
 * link is issued; `postId` is set when the post that carries it is made. Files never attached to a
 * post are tidied away later.
 */
export const circleAttachments = pgTable(
  'circle_attachments',
  {
    id: uuid('id').primaryKey(),
    circleId: uuid('circle_id')
      .notNull()
      .references(() => dreamCircles.id, { onDelete: 'cascade' }),
    hostOrgId: uuid('host_org_id').notNull(),
    uploaderUserId: uuid('uploader_user_id').notNull(),
    postId: uuid('post_id').references(() => circlePosts.id, { onDelete: 'cascade' }),
    kind: text('kind', { enum: ['image', 'audio', 'video', 'file'] }).notNull(),
    path: text('path').notNull(),
    fileName: text('file_name').notNull(),
    contentType: text('content_type').notNull(),
    size: integer('size').notNull(),
    durationSec: integer('duration_sec'),
    width: integer('width'),
    height: integer('height'),
    position: integer('position').notNull().default(0),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('circle_attachments_post').on(t.postId), index('circle_attachments_uploader').on(t.uploaderUserId, t.createdAt)],
);
