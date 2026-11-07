import type { CaptionCue } from '@dreamlab/contracts';
import { bigint, index, integer, jsonb, pgTable, primaryKey, text, timestamp, uuid } from 'drizzle-orm/pg-core';

/**
 * An organisation's video library (CAT-6). The original upload stays private
 * (`videos/<id>/source` in the private container); what learners stream is public, under
 * `videos/<id>/v<version>/` beside `videos/<id>/manifest.json`. Processing again writes a new
 * version folder, so cached streams never mix old and new files.
 */
export const videos = pgTable(
  'videos',
  {
    id: uuid('id').primaryKey(),
    ownerOrgId: uuid('owner_org_id').notNull(),
    title: text('title').notNull(),
    fileName: text('file_name').notNull(),
    size: bigint('size', { mode: 'number' }).notNull(),
    contentType: text('content_type').notNull(),
    status: text('status', { enum: ['uploading', 'queued', 'processing', 'ready', 'failed'] }).notNull().default('uploading'),
    progress: integer('progress'),
    error: text('error'),
    durationS: integer('duration_s'),
    width: integer('width'),
    height: integer('height'),
    renditions: integer('renditions').array().notNull().default([]),
    /** The public output folder in use (v1, v2…); 0 until first processed. */
    version: integer('version').notNull().default(0),
    createdByUserId: uuid('created_by_user_id').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('videos_library').on(t.ownerOrgId, t.createdAt)],
);

/** Caption tracks: the cues are kept here (the editor's source) and published as WebVTT. */
export const videoCaptions = pgTable(
  'video_captions',
  {
    videoId: uuid('video_id')
      .notNull()
      .references(() => videos.id, { onDelete: 'cascade' }),
    lang: text('lang').notNull(),
    ownerOrgId: uuid('owner_org_id').notNull(),
    label: text('label').notNull(),
    source: text('source', { enum: ['upload', 'auto', 'edited'] }).notNull(),
    cues: jsonb('cues').$type<CaptionCue[]>().notNull(),
    updatedByUserId: uuid('updated_by_user_id'),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.videoId, t.lang] })],
);

/**
 * Work for the video worker: process a video, or make its captions. The worker claims the oldest
 * queued job (or one whose lease ran out: its worker stopped) and renews the lease while it works.
 */
export const videoJobs = pgTable(
  'video_jobs',
  {
    id: uuid('id').primaryKey(),
    videoId: uuid('video_id')
      .notNull()
      .references(() => videos.id, { onDelete: 'cascade' }),
    ownerOrgId: uuid('owner_org_id').notNull(),
    kind: text('kind', { enum: ['process', 'captions'] }).notNull(),
    /** Captions: the language spoken, or "auto". */
    lang: text('lang'),
    status: text('status', { enum: ['queued', 'running', 'done', 'failed'] }).notNull().default('queued'),
    attempts: integer('attempts').notNull().default(0),
    leaseUntil: timestamp('lease_until', { withTimezone: true }),
    error: text('error'),
    requestedByUserId: uuid('requested_by_user_id'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('video_jobs_pending').on(t.status, t.createdAt), index('video_jobs_video').on(t.videoId)],
);
