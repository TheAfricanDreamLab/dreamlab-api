import { Inject, Injectable } from '@nestjs/common';
import {
  CAPTION_LANGUAGES,
  type CaptionCue,
  type LibraryVideo,
  MAX_LIBRARY_VIDEO_BYTES,
  VIDEO_UPLOAD_BLOCK_BYTES,
  videoBlockCount,
  videoBlockId,
  type VideoStatus,
  type VideoUploadLink,
} from '@dreamlab/contracts';
import type { Principal } from '@lib/auth';
import { badRequest, conflict, forbidden, newId, notFound } from '@lib/common';
import { InjectDatabase } from '@lib/database';
import { IamRpc, RpcClient, UserName } from '@lib/rpc';
import { BlobStorage } from '@lib/storage';
import { and, desc, eq, ilike, inArray, isNotNull, ne, or, sql } from 'drizzle-orm';
import { CatalogDatabase, schema } from '../../database';
import { AuthoringService, STORAGE } from '../authoring/authoring.service';
import { IAM_RPC } from '../seed/catalog-seed.service';
import { blockIndex, captionPath, folderOf, manifestPath, mediaUrl, sourcePath, versionFolder, writeCaptions, writeManifest } from './video-files';

const { videos, videoCaptions, videoJobs, courseDrafts, contentItems, courseVersions, courses } = schema;
type VideoRow = typeof videos.$inferSelect;

/** Upload links last long enough for a large file on a slow connection; a fresh one can be asked for. */
const UPLOAD_LINK_HOURS = 6;
const OPEN_DRAFTS = ['draft', 'in_review', 'changes_requested'] as const;

/**
 * The video library (CAT-6): an organisation's videos, used in any of its courses. Authors of the
 * organisation (or of any of its courses) add and change videos; its reviewers may look. Processing
 * happens in the video worker; this service queues the work and reports its progress.
 */
@Injectable()
export class VideosService {
  constructor(
    @InjectDatabase() private readonly db: CatalogDatabase,
    private readonly authoring: AuthoringService,
    @Inject(STORAGE) private readonly storage: BlobStorage,
    @Inject(IAM_RPC) private readonly iam: RpcClient,
  ) {
    // A course can't be sent for review or published while its library videos aren't ready.
    authoring.addDocumentCheck((doc, ownerOrgId) => this.documentIssues(doc, ownerOrgId));
  }

  async list(p: Principal, query: { q?: string; status?: VideoStatus }): Promise<{ items: LibraryVideo[] }> {
    const orgId = await this.access(p, 'read');
    const rows = await this.db.sys
      .select()
      .from(videos)
      .where(and(eq(videos.ownerOrgId, orgId), query.status ? eq(videos.status, query.status) : undefined, query.q ? ilike(videos.title, `%${query.q.replace(/[%_\\]/g, '\\$&')}%`) : undefined))
      .orderBy(desc(videos.createdAt))
      .limit(500);
    return { items: await this.views(rows, orgId, true) };
  }

  async create(p: Principal, input: { title: string; fileName: string; contentType: string; size: number }): Promise<{ video: LibraryVideo; upload: VideoUploadLink }> {
    const orgId = await this.access(p, 'write');
    if (input.size > MAX_LIBRARY_VIDEO_BYTES) throw badRequest('video_too_large', 'Videos can be up to 2 GB.');
    const [row] = await this.db.sys
      .insert(videos)
      .values({ id: newId(), ownerOrgId: orgId, title: input.title, fileName: input.fileName, size: input.size, contentType: input.contentType, status: 'uploading', createdByUserId: p.userId })
      .returning();
    const [video] = await this.views([row!], orgId);
    return { video: video!, upload: this.link(row!) };
  }

  async get(p: Principal, id: string): Promise<LibraryVideo> {
    const { row, orgId } = await this.find(p, id, 'read');
    const [video] = await this.views([row], orgId, true);
    return video!;
  }

  async rename(p: Principal, id: string, title: string): Promise<LibraryVideo> {
    await this.find(p, id, 'write');
    await this.db.sys.update(videos).set({ title, updatedAt: new Date() }).where(eq(videos.id, id));
    return this.get(p, id);
  }

  async remove(p: Principal, id: string): Promise<void> {
    const { row, orgId } = await this.find(p, id, 'write');
    const used = await this.usage([row.id], orgId, true);
    const courses = used.get(row.id) ?? [];
    if (courses.length) throw conflict('video_in_use', `This video is used in ${courses.map((c) => `“${c.title}”`).join(', ')}. Take it out of those courses first.`);
    await this.db.sys.delete(videos).where(eq(videos.id, row.id));
    await Promise.all([this.storage.removeAll('public', folderOf(row.id)), this.storage.removeAll('private', folderOf(row.id))]);
  }

  uploadLinkFor = async (p: Principal, id: string): Promise<VideoUploadLink> => {
    const { row } = await this.find(p, id, 'write');
    if (row.status !== 'uploading') throw conflict('video_uploaded', 'This video has already been uploaded.');
    return this.link(row);
  };

  /** Blocks storage already has, of the right size, so an interrupted upload carries on from there. */
  async uploadStatus(p: Principal, id: string): Promise<{ received: number[]; blocks: number }> {
    const { row } = await this.find(p, id, 'write');
    const blocks = videoBlockCount(row.size);
    if (row.status !== 'uploading') return { received: [...Array(blocks).keys()], blocks };
    return { received: await this.receivedBlocks(row), blocks };
  }

  /** Every block is there: join them in order, check the size, and queue the video for processing. */
  async uploaded(p: Principal, id: string): Promise<LibraryVideo> {
    const { row } = await this.find(p, id, 'write');
    if (row.status !== 'uploading') return this.get(p, id);
    const blocks = videoBlockCount(row.size);
    const received = new Set(await this.receivedBlocks(row));
    const existing = await this.storage.stat('private', sourcePath(row.id));
    if (!(existing && existing.size === row.size)) {
      const missing = [...Array(blocks).keys()].filter((n) => !received.has(n));
      if (missing.length) throw conflict('upload_incomplete', `${missing.length} of ${blocks} parts of the file haven’t arrived yet. Carry on uploading.`, { missing: missing.slice(0, 50) });
      await this.storage.commitBlocks('private', sourcePath(row.id), [...Array(blocks).keys()].map(videoBlockId), row.contentType);
      const stored = await this.storage.stat('private', sourcePath(row.id));
      if (stored?.size !== row.size) throw conflict('upload_size_mismatch', 'The uploaded file is not the size expected. Upload it again.');
    }
    await this.db.system(async (tx) => {
      const [moved] = await tx
        .update(videos)
        .set({ status: 'queued', progress: 0, error: null, updatedAt: new Date() })
        .where(and(eq(videos.id, row.id), eq(videos.status, 'uploading')))
        .returning({ id: videos.id });
      if (moved) await tx.insert(videoJobs).values({ id: newId(), videoId: row.id, ownerOrgId: row.ownerOrgId, kind: 'process', requestedByUserId: p.userId });
    });
    return this.get(p, id);
  }

  async retry(p: Principal, id: string): Promise<LibraryVideo> {
    const { row } = await this.find(p, id, 'write');
    if (row.status !== 'failed') throw conflict('video_not_failed', 'Only a video whose processing failed can be processed again.');
    await this.db.system(async (tx) => {
      await tx.update(videos).set({ status: 'queued', progress: 0, error: null, updatedAt: new Date() }).where(eq(videos.id, row.id));
      await tx.insert(videoJobs).values({ id: newId(), videoId: row.id, ownerOrgId: row.ownerOrgId, kind: 'process', requestedByUserId: p.userId });
    });
    return this.get(p, id);
  }

  // ---------- captions ----------

  async captions(p: Principal, id: string, lang: string): Promise<{ lang: string; label: string; cues: CaptionCue[] }> {
    await this.find(p, id, 'read');
    const [track] = await this.db.sys.select().from(videoCaptions).where(and(eq(videoCaptions.videoId, id), eq(videoCaptions.lang, lang)));
    if (!track) throw notFound('captions_not_found', 'This video has no captions in that language.');
    return { lang: track.lang, label: track.label, cues: track.cues };
  }

  async saveCaptions(p: Principal, id: string, lang: string, input: { label: string; cues: CaptionCue[]; fromFile: boolean }): Promise<LibraryVideo> {
    const { row } = await this.find(p, id, 'write');
    const cues = [...input.cues].sort((a, b) => a.startS - b.startS);
    if (row.durationS !== null && cues.some((c) => c.startS > row.durationS! + 1)) throw badRequest('captions_too_long', 'Some captions start after the end of the video.');
    const values = { label: input.label, source: input.fromFile ? ('upload' as const) : ('edited' as const), cues, updatedByUserId: p.userId, updatedAt: new Date() };
    await this.db.sys
      .insert(videoCaptions)
      .values({ videoId: id, lang, ownerOrgId: row.ownerOrgId, ...values })
      .onConflictDoUpdate({ target: [videoCaptions.videoId, videoCaptions.lang], set: values });
    await writeCaptions(this.storage, id, lang, cues);
    await this.publishManifest(id);
    return this.get(p, id);
  }

  async removeCaptions(p: Principal, id: string, lang: string): Promise<LibraryVideo> {
    await this.find(p, id, 'write');
    const removed = await this.db.sys.delete(videoCaptions).where(and(eq(videoCaptions.videoId, id), eq(videoCaptions.lang, lang))).returning({ lang: videoCaptions.lang });
    if (!removed.length) throw notFound('captions_not_found', 'This video has no captions in that language.');
    await this.publishManifest(id);
    await this.storage.remove('public', captionPath(id, lang));
    return this.get(p, id);
  }

  /** Queue speech recognition; the worker adds the track when it is done. */
  async autoCaptions(p: Principal, id: string, lang: string): Promise<LibraryVideo> {
    const { row } = await this.find(p, id, 'write');
    if (row.status !== 'ready') throw conflict('video_not_ready', 'Captions can be made once the video has finished processing.');
    if (lang !== 'auto') {
      const [own] = await this.db.sys
        .select({ source: videoCaptions.source })
        .from(videoCaptions)
        .where(and(eq(videoCaptions.videoId, id), eq(videoCaptions.lang, lang), ne(videoCaptions.source, 'auto')));
      if (own) throw conflict('captions_exist', `This video already has ${CAPTION_LANGUAGES[lang] ?? lang} captions that were uploaded or edited. Remove them first to make new ones automatically.`);
    }
    await this.db.system(async (tx) => {
      const [busy] = await tx
        .select({ id: videoJobs.id })
        .from(videoJobs)
        .where(and(eq(videoJobs.videoId, id), eq(videoJobs.kind, 'captions'), inArray(videoJobs.status, ['queued', 'running'])));
      if (busy) throw conflict('captions_in_progress', 'Captions are already being made for this video.');
      await tx.insert(videoJobs).values({ id: newId(), videoId: id, ownerOrgId: row.ownerOrgId, kind: 'captions', lang, requestedByUserId: p.userId });
    });
    return this.get(p, id);
  }

  /** Rewrites the public manifest from the database (once the video is ready). */
  async publishManifest(id: string): Promise<void> {
    const [row] = await this.db.sys.select().from(videos).where(eq(videos.id, id));
    if (!row || row.status !== 'ready' || !row.durationS || !row.width || !row.height) return;
    const tracks = await this.db.sys.select().from(videoCaptions).where(eq(videoCaptions.videoId, id)).orderBy(videoCaptions.lang);
    await writeManifest(this.storage, { id, version: row.version, durationS: row.durationS, width: row.width, height: row.height, captions: tracks });
  }

  // ---------- publishing checks ----------

  /**
   * Library videos a course document uses that can't be published yet: not in this organisation's
   * library, still processing, or failed. Paths as in draftIssues.
   */
  async documentIssues(doc: unknown, ownerOrgId: string): Promise<{ path: string; message: string }[]> {
    const found: { path: string; id: string; block: Record<string, unknown>; at: (string | number)[] }[] = [];
    const visit = (value: unknown, path: (string | number)[]): void => {
      if (!value || typeof value !== 'object') return;
      const v = value as Record<string, unknown>;
      if (v.provider === 'library' && typeof v.videoId === 'string' && /^[0-9a-f-]{36}$/i.test(v.videoId)) found.push({ path: [...path, 'videoId'].join('.'), id: v.videoId, block: v, at: path });
      for (const [k, child] of Object.entries(v)) visit(child, [...path, k]);
    };
    visit(doc, []);
    if (!found.length) return [];
    const rows = await this.db.sys
      .select({ id: videos.id, status: videos.status, ownerOrgId: videos.ownerOrgId, durationS: videos.durationS })
      .from(videos)
      .where(inArray(videos.id, [...new Set(found.map((f) => f.id))]));
    const byId = new Map(rows.map((r) => [r.id, r]));
    return found.flatMap(({ path, id, block, at }) => {
      const v = byId.get(id);
      if (!v || v.ownerOrgId !== ownerOrgId) return [{ path, message: 'This video is not in the library any more: choose another' }];
      if (v.status === 'failed') return [{ path, message: 'This video could not be processed: open the library to try again or replace it' }];
      if (v.status !== 'ready') return [{ path, message: 'This video is still being processed: it can be published once it is ready' }];
      // Questions and chapters must fall inside the video, whatever length the block says it is.
      if (typeof block.durationS === 'number' || !v.durationS) return [];
      const late = (list: unknown, field: string) =>
        (Array.isArray(list) ? list : []).flatMap((x: { atS?: unknown }, k) =>
          typeof x?.atS === 'number' && x.atS >= v.durationS! ? [{ path: [...at, field, k, 'atS'].join('.'), message: 'After the end of the video' }] : [],
        );
      return [...late(block.pauses, 'pauses'), ...late(block.chapters, 'chapters')];
    });
  }

  // ---------- helpers ----------

  private link(row: VideoRow): VideoUploadLink {
    const { url, expiresAt } = this.storage.blockUploadLink('private', sourcePath(row.id), UPLOAD_LINK_HOURS);
    return { url, blockBytes: VIDEO_UPLOAD_BLOCK_BYTES, blocks: videoBlockCount(row.size), expiresAt };
  }

  private async receivedBlocks(row: VideoRow): Promise<number[]> {
    const blocks = videoBlockCount(row.size);
    const lastSize = row.size - (blocks - 1) * VIDEO_UPLOAD_BLOCK_BYTES;
    const out: number[] = [];
    for (const b of await this.storage.uncommittedBlocks('private', sourcePath(row.id))) {
      const n = blockIndex(b.name);
      if (n === null || n >= blocks) continue;
      if (b.size === (n === blocks - 1 ? lastSize : VIDEO_UPLOAD_BLOCK_BYTES)) out.push(n);
    }
    return [...new Set(out)].sort((a, b) => a - b);
  }

  /**
   * The organisation's library: its authors (of the whole organisation or of any of its courses) may
   * change it; its reviewers may read it too.
   */
  private async access(p: Principal, mode: 'read' | 'write'): Promise<string> {
    const orgId = await this.authoring.homeOrg(p);
    if (await this.authoring.isOrgAuthor(p, orgId)) return orgId;
    if (mode === 'read' && (await this.authoring.isOrgReviewer(p, orgId))) return orgId;
    if (await this.authoring.authorsSomeCourse(p, orgId)) return orgId;
    throw forbidden('permission_denied', 'The video library is for the organisation’s course authors.');
  }

  private async find(p: Principal, id: string, mode: 'read' | 'write'): Promise<{ row: VideoRow; orgId: string }> {
    const orgId = await this.access(p, mode);
    const [row] = await this.db.sys.select().from(videos).where(and(eq(videos.id, id), eq(videos.ownerOrgId, orgId)));
    if (!row) throw notFound('video_not_found', 'Video not found');
    return { row, orgId };
  }

  /**
   * Courses that use each video: open drafts and published versions (`everyVersion`: also older
   * versions learners may still be on, and course trailers).
   */
  private async usage(ids: string[], orgId: string, everyVersion = false): Promise<Map<string, { title: string; slug: string }[]>> {
    const out = new Map<string, { title: string; slug: string }[]>();
    if (!ids.length) return out;
    const mentions = (text: string) => ids.filter((id) => text.includes(id));
    const add = (id: string, c: { title: string; slug: string }) => {
      const list = out.get(id) ?? [];
      if (!list.some((x) => x.slug === c.slug)) list.push(c);
      out.set(id, list);
    };
    const anyId = (column: Parameters<typeof sql>[1]) => or(...ids.map((id) => sql`${column}::text like ${`%${id}%`}`));
    const [drafts, items, trailers] = await Promise.all([
      this.db.sys
        .select({ title: courseDrafts.title, slug: courseDrafts.slug, doc: sql<string>`${courseDrafts.doc}::text` })
        .from(courseDrafts)
        .where(and(eq(courseDrafts.ownerOrgId, orgId), inArray(courseDrafts.status, [...OPEN_DRAFTS]), anyId(courseDrafts.doc))),
      this.db.sys
        .select({ title: courses.title, slug: courses.slug, payload: sql<string>`${contentItems.payload}::text` })
        .from(contentItems)
        .innerJoin(courseVersions, eq(courseVersions.id, contentItems.courseVersionId))
        .innerJoin(courses, eq(courses.id, courseVersions.courseId))
        .where(and(eq(contentItems.ownerOrgId, orgId), everyVersion ? undefined : eq(courses.currentVersionId, courseVersions.id), anyId(contentItems.payload))),
      everyVersion
        ? this.db.sys
            .select({ title: courses.title, slug: courses.slug, trailer: sql<string>`${courses.trailer}::text` })
            .from(courses)
            .where(and(eq(courses.ownerOrgId, orgId), isNotNull(courses.trailer), anyId(courses.trailer)))
        : Promise.resolve([] as { title: string; slug: string; trailer: string }[]),
    ]);
    for (const d of drafts) for (const id of mentions(d.doc)) add(id, { title: d.title, slug: d.slug });
    for (const i of items) for (const id of mentions(i.payload)) add(id, { title: i.title, slug: i.slug });
    for (const t of trailers) for (const id of mentions(t.trailer)) add(id, { title: t.title, slug: t.slug });
    return out;
  }

  private async views(rows: VideoRow[], orgId: string, withUsage = false): Promise<LibraryVideo[]> {
    if (!rows.length) return [];
    const ids = rows.map((r) => r.id);
    const [tracks, jobs, usage, names] = await Promise.all([
      this.db.sys
        .select({ videoId: videoCaptions.videoId, lang: videoCaptions.lang, label: videoCaptions.label, source: videoCaptions.source, cues: sql<number>`jsonb_array_length(${videoCaptions.cues})::int`, updatedAt: videoCaptions.updatedAt })
        .from(videoCaptions)
        .where(inArray(videoCaptions.videoId, ids))
        .orderBy(videoCaptions.lang),
      this.db.sys
        .select()
        .from(videoJobs)
        .where(and(inArray(videoJobs.videoId, ids), eq(videoJobs.kind, 'captions'), ne(videoJobs.status, 'done')))
        .orderBy(desc(videoJobs.createdAt)),
      withUsage ? this.usage(ids, orgId) : Promise.resolve(new Map<string, { title: string; slug: string }[]>()),
      this.userNames(rows.map((r) => r.createdByUserId)),
    ]);
    return rows.map((r) => {
      const job = jobs.find((j) => j.videoId === r.id);
      const ready = r.status === 'ready' && r.version > 0;
      return {
        id: r.id,
        title: r.title,
        fileName: r.fileName,
        size: r.size,
        contentType: r.contentType,
        status: r.status,
        progress: r.status === 'processing' || r.status === 'queued' ? (r.progress ?? 0) : null,
        error: r.error,
        durationS: r.durationS,
        width: r.width,
        height: r.height,
        renditions: r.renditions,
        manifestUrl: ready ? mediaUrl(manifestPath(r.id)) : null,
        posterUrl: ready ? mediaUrl(`${versionFolder(r.id, r.version)}poster.jpg`) : null,
        thumbnailUrl: ready ? mediaUrl(`${versionFolder(r.id, r.version)}thumb.jpg`) : null,
        captions: tracks.filter((t) => t.videoId === r.id).map((t) => ({ lang: t.lang, label: t.label, source: t.source, cues: t.cues, updatedAt: t.updatedAt.toISOString() })),
        // A failed job shows until the next one is asked for (then the newest wins).
        captionJob: job ? { status: job.status as 'queued' | 'running' | 'failed', lang: job.lang ?? 'auto', error: job.error } : null,
        usedIn: usage.get(r.id) ?? [],
        createdBy: { userId: r.createdByUserId, name: names.get(r.createdByUserId) ?? 'An author' },
        createdAt: r.createdAt.toISOString(),
        updatedAt: r.updatedAt.toISOString(),
      };
    });
  }

  private async userNames(ids: string[]): Promise<Map<string, string>> {
    const userIds = [...new Set(ids)];
    if (!userIds.length) return new Map();
    const rows = await this.iam.send<UserName[]>(IamRpc.UserNames, { userIds }).catch(() => [] as UserName[]);
    return new Map(rows.map((u) => [u.id, u.name]));
  }
}
