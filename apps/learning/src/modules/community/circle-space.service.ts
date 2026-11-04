import { Inject, Injectable } from '@nestjs/common';
import {
  CIRCLE_UPLOAD_LIMITS,
  CIRCLE_VOICE_MAX_SECONDS,
  type CircleAttachment,
  type CircleAttachmentKind,
  type CirclePost,
  type CirclePostPage,
  type CircleRole,
  type CircleSpace,
  type CircleUploadTicket,
  type CreateCirclePost,
  type JoinTicket,
} from '@dreamlab/contracts';
import type { Principal } from '@lib/auth';
import { badRequest, forbidden, newId, notFound, tooManyRequests } from '@lib/common';
import { InjectDatabase } from '@lib/database';
import type { MeetKit } from '@lib/meet-kit';
import { IamRpc, RpcClient, UserName } from '@lib/rpc';
import { type BlobStorage, safeFileName } from '@lib/storage';
import { and, asc, desc, eq, gt, gte, inArray, isNotNull, isNull, lt, or, sql } from 'drizzle-orm';
import { LearningDatabase, schema } from '../../database';
import { CohortsService } from '../cohorts/cohorts.service';
import { STORAGE } from '../files/files.service';
import { IAM_NAMES } from '../player/player.service';
import { previewLinks } from './link-preview';
import { MEET_KIT } from './live.service';

const { cohorts, dreamCircles, circleMembers, circlePosts, circleAttachments, mentorAssignments } = schema;
type CircleRow = typeof dreamCircles.$inferSelect;
type PostRow = typeof circlePosts.$inferSelect;
type AttachmentRow = typeof circleAttachments.$inferSelect;

/** Media links last two hours, so a page left open keeps playing. */
const MEDIA_LINK_MINUTES = 120;
/** Uploads one person may start per hour, across circles. */
const UPLOADS_PER_HOUR = 60;

/** What may be uploaded, by content type; anything a browser could run (HTML, SVG, scripts) is refused. */
const KINDS: [RegExp, CircleAttachmentKind][] = [
  [/^image\/(jpeg|png|webp|gif|heic|heif)$/, 'image'],
  [/^audio\/(webm|ogg|mpeg|mp4|aac|wav|x-m4a)$/, 'audio'],
  [/^video\/(mp4|webm|quicktime)$/, 'video'],
  [
    /^(application\/(pdf|msword|vnd\.openxmlformats-officedocument\.[\w.]+|vnd\.ms-(excel|powerpoint)|zip|x-zip-compressed)|text\/(plain|csv))$/,
    'file',
  ],
];

interface Access {
  circle: CircleRow;
  cohortName: string;
  role: CircleRole;
  moderate: boolean;
}

/**
 * A Dream Circle's own space (COMM-2): a board of posts and replies with voice messages, pictures,
 * videos, files and link previews, and a call any member can start. Members read and post; the
 * members' mentors and the cohort's staff (managers, teachers, graders) read, post and moderate.
 * Files go straight from the browser to storage; posts carry signed links, so a page of posts needs
 * no further requests to show its media.
 */
@Injectable()
export class CircleSpaceService {
  constructor(
    @InjectDatabase() private readonly db: LearningDatabase,
    @Inject(MEET_KIT) private readonly meet: MeetKit,
    @Inject(STORAGE) private readonly storage: BlobStorage,
    @Inject(IAM_NAMES) private readonly iam: RpcClient,
    private readonly cohortsService: CohortsService,
  ) {}

  // ---------- access ----------

  private async access(p: Principal, circleId: string): Promise<Access> {
    const [circle] = await this.db.sys.select().from(dreamCircles).where(eq(dreamCircles.id, circleId));
    if (!circle) throw notFound('circle_not_found', 'Circle not found');
    const [cohort] = await this.db.sys.select().from(cohorts).where(eq(cohorts.id, circle.cohortId));
    if (!cohort) throw notFound('circle_not_found', 'Circle not found');
    const base = { circle, cohortName: cohort.name };
    const [member] = await this.db.sys
      .select({ userId: circleMembers.userId })
      .from(circleMembers)
      .where(and(eq(circleMembers.circleId, circle.id), eq(circleMembers.userId, p.userId)));
    if (member) return { ...base, role: 'member', moderate: false };
    const memberIds = this.db.sys.select({ id: circleMembers.userId }).from(circleMembers).where(eq(circleMembers.circleId, circle.id));
    const [mentoring] = await this.db.sys
      .select({ id: mentorAssignments.id })
      .from(mentorAssignments)
      .where(and(eq(mentorAssignments.mentorUserId, p.userId), eq(mentorAssignments.cohortId, circle.cohortId), isNull(mentorAssignments.endedAt), inArray(mentorAssignments.learnerUserId, memberIds)))
      .limit(1);
    if (mentoring) return { ...base, role: 'mentor', moderate: true };
    if (await this.cohortsService.isCohortFaculty(p, cohort)) return { ...base, role: 'staff', moderate: true };
    throw notFound('circle_not_found', 'Circle not found');
  }

  private async names(ids: string[]): Promise<Map<string, string>> {
    const unique = [...new Set(ids)];
    if (unique.length === 0) return new Map();
    const rows = await this.iam.send<UserName[]>(IamRpc.UserNames, { userIds: unique }).catch(() => [] as UserName[]);
    return new Map(rows.map((r) => [r.id, r.name]));
  }

  /** Each person's part in the circle, for authors' badges: members, then their mentors; anyone else is staff. */
  private async roles(circle: CircleRow): Promise<Map<string, CircleRole>> {
    const members = await this.db.sys.select({ userId: circleMembers.userId }).from(circleMembers).where(eq(circleMembers.circleId, circle.id));
    const ids = members.map((m) => m.userId);
    const mentors = ids.length
      ? await this.db.sys
          .selectDistinct({ userId: mentorAssignments.mentorUserId })
          .from(mentorAssignments)
          .where(and(eq(mentorAssignments.cohortId, circle.cohortId), isNull(mentorAssignments.endedAt), inArray(mentorAssignments.learnerUserId, ids)))
      : [];
    const roles = new Map<string, CircleRole>(mentors.map((m) => [m.userId, 'mentor']));
    for (const id of ids) roles.set(id, 'member');
    return roles;
  }

  // ---------- the space ----------

  async space(p: Principal, circleId: string): Promise<CircleSpace> {
    const a = await this.access(p, circleId);
    const roles = await this.roles(a.circle);
    const [names, participants] = await Promise.all([this.names([...roles.keys()]), this.meet.participantCount(this.meet.roomName('circle', a.circle.id))]);
    const members = [...roles.entries()]
      .map(([userId, role]) => ({ userId, name: names.get(userId) ?? 'Member', role }))
      .sort((x, y) => (x.role === y.role ? x.name.localeCompare(y.name) : x.role === 'member' ? -1 : 1));
    return {
      id: a.circle.id,
      name: a.circle.name,
      cohortId: a.circle.cohortId,
      cohortName: a.cohortName,
      members,
      you: { role: a.role },
      call: { active: participants > 0, participants },
      can: { post: true, moderate: a.moderate },
    };
  }

  // ---------- posts ----------

  /**
   * Keyset pages: the board newest first (pinned posts on top of the first page), a post's replies
   * oldest first. The cursor is the last row's time and id.
   */
  async posts(p: Principal, circleId: string, q: { parentId?: string; before?: string; limit: number }): Promise<CirclePostPage> {
    const a = await this.access(p, circleId);
    const cursor = q.before ? decodeCursor(q.before) : null;
    const replies = Boolean(q.parentId);
    const pinned =
      !replies && !cursor
        ? await this.db.sys
            .select()
            .from(circlePosts)
            .where(and(eq(circlePosts.circleId, a.circle.id), isNull(circlePosts.parentId), isNull(circlePosts.deletedAt), isNotNull(circlePosts.pinnedAt)))
            .orderBy(desc(circlePosts.pinnedAt))
        : [];
    const after = cursor
      ? replies
        ? or(gt(circlePosts.createdAt, cursor.at), and(eq(circlePosts.createdAt, cursor.at), gt(circlePosts.id, cursor.id)))
        : or(lt(circlePosts.createdAt, cursor.at), and(eq(circlePosts.createdAt, cursor.at), lt(circlePosts.id, cursor.id)))
      : undefined;
    const rows = await this.db.sys
      .select()
      .from(circlePosts)
      .where(
        and(
          eq(circlePosts.circleId, a.circle.id),
          replies ? eq(circlePosts.parentId, q.parentId!) : isNull(circlePosts.parentId),
          isNull(circlePosts.deletedAt),
          replies ? undefined : isNull(circlePosts.pinnedAt),
          after,
        ),
      )
      .orderBy(...(replies ? [asc(circlePosts.createdAt), asc(circlePosts.id)] : [desc(circlePosts.createdAt), desc(circlePosts.id)]))
      .limit(q.limit + 1);
    const page = rows.slice(0, q.limit);
    const last = page[page.length - 1];
    return {
      items: await this.views(p, a, [...pinned, ...page]),
      nextCursor: rows.length > q.limit && last ? encodeCursor(last) : null,
    };
  }

  private async views(p: Principal, a: Access, rows: PostRow[]): Promise<CirclePost[]> {
    if (rows.length === 0) return [];
    const [attachments, names, roles] = await Promise.all([
      this.db.sys
        .select()
        .from(circleAttachments)
        .where(
          inArray(
            circleAttachments.postId,
            rows.map((r) => r.id),
          ),
        )
        .orderBy(asc(circleAttachments.position)),
      this.names(rows.map((r) => r.authorUserId)),
      this.roles(a.circle),
    ]);
    const byPost = new Map<string, CircleAttachment[]>();
    for (const f of attachments) byPost.set(f.postId!, [...(byPost.get(f.postId!) ?? []), this.attachmentView(f)]);
    return rows.map((r) => ({
      id: r.id,
      circleId: r.circleId,
      parentId: r.parentId,
      author: { userId: r.authorUserId, name: names.get(r.authorUserId) ?? 'Member', role: roles.get(r.authorUserId) ?? 'staff' },
      body: r.body,
      attachments: byPost.get(r.id) ?? [],
      links: r.links,
      pinned: r.pinnedAt !== null,
      replyCount: r.replyCount,
      createdAt: r.createdAt.toISOString(),
      can: { delete: a.moderate || r.authorUserId === p.userId, pin: a.moderate && r.parentId === null },
    }));
  }

  private attachmentView(f: AttachmentRow): CircleAttachment {
    const link = this.storage.readLink(f.path, f.fileName, { inline: f.kind !== 'file', minutes: MEDIA_LINK_MINUTES, contentType: f.contentType });
    return {
      id: f.id,
      kind: f.kind,
      fileName: f.fileName,
      contentType: f.contentType,
      size: f.size,
      url: link.url,
      durationSec: f.durationSec,
      width: f.width,
      height: f.height,
    };
  }

  /** A link to upload one file straight to storage; it joins a post when the post is made. */
  async upload(
    p: Principal,
    circleId: string,
    req: { fileName: string; contentType: string; size: number; durationSec?: number; width?: number; height?: number },
  ): Promise<CircleUploadTicket> {
    const a = await this.access(p, circleId);
    const contentType = req.contentType.toLowerCase().split(';')[0]!.trim();
    const kind = KINDS.find(([re]) => re.test(contentType))?.[1];
    if (!kind) throw badRequest('file_type_not_allowed', 'Send pictures, voice messages, videos, PDFs, documents, spreadsheets or slides.');
    if (req.size > CIRCLE_UPLOAD_LIMITS[kind]) {
      throw badRequest('file_too_large', `That ${kind === 'file' ? 'file' : kind} is too large (at most ${CIRCLE_UPLOAD_LIMITS[kind] / (1024 * 1024)} MB).`);
    }
    if (kind === 'audio' && (req.durationSec ?? 0) > CIRCLE_VOICE_MAX_SECONDS) throw badRequest('voice_too_long', 'Voice messages can be up to five minutes.');
    const [recent] = await this.db.sys
      .select({ n: sql<number>`count(*)::int` })
      .from(circleAttachments)
      .where(and(eq(circleAttachments.uploaderUserId, p.userId), gte(circleAttachments.createdAt, new Date(Date.now() - 3600_000))));
    if ((recent?.n ?? 0) >= UPLOADS_PER_HOUR) throw tooManyRequests('too_many_uploads', 'That is a lot of files at once. Try again in a little while.');
    const id = newId();
    const path = `circles/${a.circle.id}/${id}/${safeFileName(req.fileName)}`;
    const ticket = this.storage.uploadTicket('private', path, contentType);
    await this.db.system((tx) =>
      tx.insert(circleAttachments).values({
        id,
        circleId: a.circle.id,
        hostOrgId: a.circle.hostOrgId,
        uploaderUserId: p.userId,
        kind,
        path,
        fileName: req.fileName,
        contentType,
        size: req.size,
        durationSec: req.durationSec ? Math.round(req.durationSec) : null,
        width: req.width ?? null,
        height: req.height ?? null,
      }),
    );
    return { ...ticket, attachmentId: id, kind };
  }

  async createPost(p: Principal, circleId: string, input: CreateCirclePost): Promise<CirclePost> {
    const a = await this.access(p, circleId);
    if (input.parentId) {
      const [parent] = await this.db.sys.select().from(circlePosts).where(and(eq(circlePosts.id, input.parentId), eq(circlePosts.circleId, a.circle.id)));
      if (!parent || parent.deletedAt) throw notFound('post_not_found', 'That post was removed.');
      if (parent.parentId) throw badRequest('reply_to_reply', 'Reply to the post itself.');
    }
    const files = input.attachmentIds.length
      ? await this.db.sys
          .select()
          .from(circleAttachments)
          .where(and(inArray(circleAttachments.id, input.attachmentIds), eq(circleAttachments.circleId, a.circle.id), eq(circleAttachments.uploaderUserId, p.userId), isNull(circleAttachments.postId)))
      : [];
    if (files.length !== input.attachmentIds.length) throw badRequest('attachment_not_found', 'One of the files is missing. Add it again.');
    // The upload link lets the browser write the file; what arrived is checked here.
    const stored = await Promise.all(files.map((f) => this.storage.stat('private', f.path)));
    for (const [i, f] of files.entries()) {
      const blob = stored[i];
      if (!blob) throw badRequest('attachment_not_uploaded', `${f.fileName} has not finished uploading.`);
      // The upload link does not bind the type the browser sends; a file stored as anything other than
      // the type it was approved as (say HTML sent as a picture) is refused and removed.
      if ((blob.contentType ?? '').toLowerCase().split(';')[0]!.trim() !== f.contentType) {
        await this.storage.remove('private', f.path).catch(() => undefined);
        throw badRequest('file_type_mismatch', `${f.fileName} is not the kind of file it said it was. Add it again.`);
      }
      if (blob.size > CIRCLE_UPLOAD_LIMITS[f.kind]) {
        await this.storage.remove('private', f.path).catch(() => undefined);
        throw badRequest('file_too_large', `${f.fileName} is too large.`);
      }
    }
    const links = await previewLinks(input.body);
    const id = newId();
    const row = await this.db.system(async (tx) => {
      const [post] = await tx
        .insert(circlePosts)
        .values({ id, circleId: a.circle.id, hostOrgId: a.circle.hostOrgId, authorUserId: p.userId, parentId: input.parentId ?? null, body: input.body, links })
        .returning();
      for (const [i, f] of files.entries()) {
        await tx
          .update(circleAttachments)
          .set({ postId: id, position: input.attachmentIds.indexOf(f.id), size: stored[i]!.size })
          .where(eq(circleAttachments.id, f.id));
      }
      if (input.parentId) await tx.update(circlePosts).set({ replyCount: sql`${circlePosts.replyCount} + 1` }).where(eq(circlePosts.id, input.parentId));
      return post!;
    });
    return (await this.views(p, a, [row]))[0]!;
  }

  private async ownPost(p: Principal, postId: string): Promise<{ a: Access; post: PostRow }> {
    const [post] = await this.db.sys.select().from(circlePosts).where(eq(circlePosts.id, postId));
    if (!post || post.deletedAt) throw notFound('post_not_found', 'Post not found');
    return { a: await this.access(p, post.circleId), post };
  }

  /** Its author or a moderator removes a post: its text and files go; the row stays so counts hold. */
  async deletePost(p: Principal, postId: string): Promise<void> {
    const { a, post } = await this.ownPost(p, postId);
    if (!a.moderate && post.authorUserId !== p.userId) throw forbidden('permission_denied', 'Only its author or the circle’s mentors and staff can remove a post.');
    const files = await this.db.sys.select().from(circleAttachments).where(eq(circleAttachments.postId, post.id));
    await this.db.system(async (tx) => {
      await tx.update(circlePosts).set({ deletedAt: new Date(), body: '', links: [], pinnedAt: null }).where(eq(circlePosts.id, post.id));
      await tx.delete(circleAttachments).where(eq(circleAttachments.postId, post.id));
      if (post.parentId) await tx.update(circlePosts).set({ replyCount: sql`greatest(${circlePosts.replyCount} - 1, 0)` }).where(eq(circlePosts.id, post.parentId));
    });
    await Promise.all(files.map((f) => this.storage.remove('private', f.path).catch(() => undefined)));
  }

  async pinPost(p: Principal, postId: string, pinned: boolean): Promise<CirclePost> {
    const { a, post } = await this.ownPost(p, postId);
    if (!a.moderate) throw forbidden('permission_denied', 'Only the circle’s mentors and staff can pin posts.');
    if (post.parentId) throw badRequest('cannot_pin_reply', 'Pin the post itself, not a reply.');
    const [row] = await this.db.system((tx) =>
      tx
        .update(circlePosts)
        .set({ pinnedAt: pinned ? new Date() : null })
        .where(eq(circlePosts.id, post.id))
        .returning(),
    );
    return (await this.views(p, a, [row!]))[0]!;
  }

  // ---------- the call ----------

  /** Anyone in the circle starts or joins its call, with camera and microphone. Never recorded. */
  async joinCall(p: Principal, circleId: string): Promise<JoinTicket> {
    const a = await this.access(p, circleId);
    const role = a.moderate ? 'host' : 'participant';
    const [names] = await Promise.all([this.names([p.userId])]);
    const grant = await this.meet.join(this.meet.roomName('circle', a.circle.id), p.userId, names.get(p.userId) ?? 'Member', role, 15, { participantVideo: true });
    return { url: grant.url, token: grant.token, roomName: grant.roomName, role, title: `${a.circle.name} · Dream Circle call`, expiresAt: grant.expiresAt.toISOString() };
  }
}

function encodeCursor(r: PostRow): string {
  return `${r.createdAt.toISOString()}_${r.id}`;
}

function decodeCursor(raw: string): { at: Date; id: string } {
  const [at, id] = raw.split('_');
  const date = new Date(at ?? '');
  if (!id || Number.isNaN(date.getTime()) || !/^[0-9a-f-]{36}$/i.test(id)) throw badRequest('bad_cursor', 'That page link is not valid.');
  return { at: date, id };
}
