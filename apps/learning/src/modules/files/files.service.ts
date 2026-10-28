import { Inject, Injectable, Logger, OnApplicationBootstrap, OnApplicationShutdown } from '@nestjs/common';
import { MAX_SUBMISSION_FILE_BYTES, SubmissionFile, SubmissionFileUpload } from '@dreamlab/contracts';
import type { Principal } from '@lib/auth';
import { badRequest, newId, notFound } from '@lib/common';
import { InjectDatabase } from '@lib/database';
import { BlobStorage, safeFileName } from '@lib/storage';
import { and, arrayContains, count, eq, gt, inArray, lt, sql } from 'drizzle-orm';
import { LearningDatabase, schema } from '../../database';

export const STORAGE = Symbol('STORAGE');

const { learnerFiles, submissions } = schema;
/** Uploads a learner may start per assignment in a day; stops a script filling storage. */
const DAILY_UPLOADS_PER_ITEM = 30;
/** Uploads never attached to a submission are removed after this long (upload links last 30 minutes). */
const ABANDONED_AFTER_MS = 2 * 3_600_000;
/**
 * An upload must be attached within this long; the sweep waits longer, so a file being submitted is
 * never swept at the same moment. Files already attached to a submission may be attached again later.
 */
const ATTACH_WITHIN_MS = 90 * 60_000;
const SWEEP_EVERY_MS = 3_600_000;

/**
 * Learners' assignment files: upload links, checks on submit, and short-lived download links. Upload
 * links cannot cap a file's size, so files never submitted (oversized or abandoned) are swept away.
 */
@Injectable()
export class FilesService implements OnApplicationBootstrap, OnApplicationShutdown {
  private readonly logger = new Logger(FilesService.name);
  private timer: NodeJS.Timeout | null = null;

  constructor(
    @InjectDatabase() private readonly db: LearningDatabase,
    @Inject(STORAGE) private readonly storage: BlobStorage,
  ) {}

  onApplicationBootstrap(): void {
    if (!this.storage.enabled) return;
    this.timer = setInterval(() => void this.sweep().catch((e: unknown) => this.logger.error(e instanceof Error ? e.message : String(e))), SWEEP_EVERY_MS);
    this.timer.unref();
  }

  onApplicationShutdown(): void {
    if (this.timer) clearInterval(this.timer);
  }

  /** Deletes files older than ABANDONED_AFTER_MS that no submission uses; returns how many. */
  async sweep(now = new Date()): Promise<number> {
    const stale = await this.db.sys
      .select({ id: learnerFiles.id, path: learnerFiles.path })
      .from(learnerFiles)
      .where(
        and(
          lt(learnerFiles.createdAt, new Date(now.getTime() - ABANDONED_AFTER_MS)),
          sql`not exists (select 1 from ${submissions} where ${learnerFiles.id} = any(${submissions.fileAssetIds}))`,
        ),
      )
      .limit(200);
    for (const f of stale) {
      await this.storage.remove('private', f.path);
      await this.db.system((tx) => tx.delete(learnerFiles).where(eq(learnerFiles.id, f.id)));
    }
    return stale.length;
  }

  async uploadTicket(p: Principal, enrollmentId: string, itemId: string, req: { fileName: string; contentType: string; size: number }): Promise<SubmissionFileUpload> {
    const [{ n } = { n: 0 }] = await this.db.sys
      .select({ n: count() })
      .from(learnerFiles)
      .where(and(eq(learnerFiles.courseEnrollmentId, enrollmentId), eq(learnerFiles.contentItemId, itemId), gt(learnerFiles.createdAt, new Date(Date.now() - 86_400_000))));
    if (n >= DAILY_UPLOADS_PER_ITEM) throw badRequest('too_many_uploads', 'You have uploaded a lot of files for this assignment today. Try again tomorrow.');
    const id = newId();
    const path = `submissions/${p.userId}/${id}/${safeFileName(req.fileName)}`;
    const ticket = this.storage.uploadTicket('private', path, req.contentType);
    await this.db.system((tx) =>
      tx.insert(learnerFiles).values({ id, userId: p.userId, courseEnrollmentId: enrollmentId, contentItemId: itemId, path, name: req.fileName, size: req.size, contentType: req.contentType }),
    );
    return { ...ticket, fileId: id };
  }

  /** The files to attach, in order, once each is confirmed uploaded, the learner's own and for this assignment. */
  async verify(p: Principal, enrollmentId: string, itemId: string, fileIds: string[]): Promise<string[]> {
    const ids = [...new Set(fileIds)];
    if (ids.length === 0) return [];
    const rows = await this.db.sys.select().from(learnerFiles).where(inArray(learnerFiles.id, ids));
    const byId = new Map(rows.map((r) => [r.id, r]));
    for (const id of ids) {
      const f = byId.get(id);
      if (!f || f.userId !== p.userId || f.courseEnrollmentId !== enrollmentId || f.contentItemId !== itemId) throw badRequest('file_not_found', 'One of the attached files was not found. Upload it again.');
      if (f.createdAt.getTime() < Date.now() - ATTACH_WITHIN_MS) {
        const [attached] = await this.db.sys.select({ id: submissions.id }).from(submissions).where(arrayContains(submissions.fileAssetIds, [f.id])).limit(1);
        if (!attached) throw badRequest('file_expired', `“${f.name}” was uploaded too long ago. Upload it again.`);
      }
      const stored = await this.storage.stat('private', f.path);
      if (!stored) throw badRequest('file_not_uploaded', `“${f.name}” has not finished uploading. Upload it again.`);
      if (stored.size > MAX_SUBMISSION_FILE_BYTES) {
        await this.storage.remove('private', f.path);
        throw badRequest('file_too_large', `“${f.name}” is larger than 50 MB.`);
      }
      if (stored.size !== f.size) await this.db.system((tx) => tx.update(learnerFiles).set({ size: stored.size }).where(eq(learnerFiles.id, id)));
    }
    return ids;
  }

  /** Names and sizes for display, keyed by file id. */
  async describe(ids: string[]): Promise<Map<string, SubmissionFile>> {
    const unique = [...new Set(ids)];
    if (unique.length === 0) return new Map();
    const rows = await this.db.sys.select().from(learnerFiles).where(inArray(learnerFiles.id, unique));
    return new Map(rows.map((r) => [r.id, { id: r.id, name: r.name, size: r.size, contentType: r.contentType }]));
  }

  /**
   * A short-lived link for the file's owner, or for someone `mayGrade` lets see a submission it is
   * attached to. Anyone else is told it does not exist.
   */
  async link(p: Principal, fileId: string, mayGrade: (submissionId: string) => Promise<boolean>) {
    const [file] = await this.db.sys.select().from(learnerFiles).where(eq(learnerFiles.id, fileId));
    if (!file) throw notFound('file_not_found', 'File not found');
    if (file.userId !== p.userId) {
      const attachedTo = await this.db.sys.select({ id: submissions.id }).from(submissions).where(arrayContains(submissions.fileAssetIds, [fileId]));
      let allowed = false;
      for (const s of attachedTo) if ((allowed = await mayGrade(s.id))) break;
      if (!allowed) throw notFound('file_not_found', 'File not found');
    }
    return this.storage.readLink(file.path, file.name);
  }
}
