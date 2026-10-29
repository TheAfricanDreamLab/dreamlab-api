import { Inject, Injectable, Optional } from '@nestjs/common';
import {
  type AuthoringOverview,
  type CourseAuthoring,
  CourseAuthoringSchema,
  type Draft,
  draftIssues,
  type DraftSummary,
  type CourseMediaUpload,
  type Permission,
} from '@dreamlab/contracts';
import { AUTHZ_CHECKER, AuthzChecker, hasOrgPermission, type Principal } from '@lib/auth';
import { badRequest, conflict, forbidden, newId, notFound } from '@lib/common';
import { InjectConfig } from '@lib/config';
import { InjectDatabase } from '@lib/database';
import { InjectOutbox, type NotificationRequest, OutboxWriter, requestNotification, userActor } from '@lib/messaging';
import { IamRpc, RpcClient, UserName } from '@lib/rpc';
import { BlobStorage, safeFileName } from '@lib/storage';
import { and, asc, desc, eq, inArray, ne } from 'drizzle-orm';
import type { CatalogConfig } from '../../config';
import { CatalogDatabase, schema } from '../../database';
import { CatalogReadService } from '../courses/catalog-read.service';
import { CatalogSeedService, IAM_RPC } from '../seed/catalog-seed.service';

export const STORAGE = Symbol('STORAGE');

const { courseDrafts, courses, courseVersions, catalogListings } = schema;
type DraftRow = typeof courseDrafts.$inferSelect;
type CourseRow = typeof courses.$inferSelect;

/** A save larger than this is refused (the whole course is one JSON document). */
const MAX_DOC_BYTES = 1_000_000;
const OPEN = ['draft', 'in_review', 'changes_requested'] as const;
const VISIBILITIES = ['public', 'org_private', 'unlisted'] as const;

/**
 * Course authoring in the browser (CAT-3). Authors (course.content.edit in the owning organisation)
 * write drafts and send them for review; reviewers (course.publish there) publish them as the course's
 * next version through the same importer course files use, or ask for changes. Public courses join the
 * platform catalogue, so platform admins review those. Drafts belong to their organisation (RLS); the
 * platform's reviewers read other organisations' drafts as the system role after these checks.
 */
@Injectable()
export class AuthoringService {
  constructor(
    @InjectDatabase() private readonly db: CatalogDatabase,
    @InjectConfig() private readonly config: CatalogConfig,
    private readonly catalog: CatalogReadService,
    private readonly importer: CatalogSeedService,
    @Inject(IAM_RPC) private readonly iam: RpcClient,
    @InjectOutbox() private readonly outbox: OutboxWriter,
    @Inject(STORAGE) private readonly storage: BlobStorage,
    @Optional() @Inject(AUTHZ_CHECKER) private readonly authz?: AuthzChecker,
  ) {}

  async overview(p: Principal): Promise<AuthoringOverview> {
    const orgId = await this.homeOrg(p);
    const [author, review] = await Promise.all([this.may(p, orgId, 'course.content.edit'), this.may(p, orgId, 'course.publish')]);
    const [allCourses, open, publicQueue] = await Promise.all([
      this.db.sys.select().from(courses).where(eq(courses.ownerOrgId, orgId)).orderBy(asc(courses.title)),
      this.db.sys
        .select()
        .from(courseDrafts)
        .where(and(eq(courseDrafts.ownerOrgId, orgId), inArray(courseDrafts.status, [...OPEN])))
        .orderBy(desc(courseDrafts.updatedAt)),
      p.platformAdmin && !p.stale
        ? this.db.sys
            .select()
            .from(courseDrafts)
            .where(and(eq(courseDrafts.status, 'in_review'), eq(courseDrafts.visibility, 'public'), ne(courseDrafts.ownerOrgId, orgId)))
            .orderBy(asc(courseDrafts.submittedAt))
        : Promise.resolve([] as DraftRow[]),
    ]);
    // Authors of particular courses (the author role scoped to a course) see those courses only.
    let owned = allCourses;
    if (!author && !review) {
      owned = [];
      for (const c of allCourses.slice(0, 200)) if (await this.mayCourse(p, orgId, c.id)) owned.push(c);
      if (owned.length === 0) throw forbidden('permission_denied', 'You don’t author or review courses in this organisation.');
    }
    const versions = await this.versionNos(owned);
    const openByCourse = new Map(open.filter((d) => d.courseId).map((d) => [d.courseId!, d]));
    const reviewable = (d: DraftRow) => d.status === 'in_review' && (d.visibility === 'public' ? p.platformAdmin && !p.stale : review);
    const summaries = await this.summaries([...open, ...publicQueue]);
    return {
      courses: owned.map((c) => ({
        courseId: c.id,
        slug: c.slug,
        title: c.title,
        visibility: c.visibility,
        versionNo: versions.get(c.id) ?? null,
        openDraft: openByCourse.has(c.id) ? { id: openByCourse.get(c.id)!.id, status: openByCourse.get(c.id)!.status } : null,
        canEdit: author || owned !== allCourses,
      })),
      newDrafts: author || review ? open.filter((d) => !d.courseId).map((d) => summaries.get(d.id)!) : [],
      toReview: [...open.filter(reviewable), ...publicQueue].map((d) => summaries.get(d.id)!),
      can: { author, review },
    };
  }

  async create(p: Principal, input: { courseSlug?: string; slug?: string; title?: string }): Promise<Draft> {
    const orgId = await this.homeOrg(p);
    const orgAuthor = await this.may(p, orgId, 'course.content.edit');
    let values: Pick<DraftRow, 'courseId' | 'slug' | 'title' | 'visibility' | 'doc' | 'baseVersionNo' | 'ownerOrgId'>;
    if (input.courseSlug) {
      const [course] = await this.db.sys.select().from(courses).where(eq(courses.slug, input.courseSlug));
      if (!course || course.ownerOrgId !== orgId) throw notFound('course_not_found', 'Course not found');
      if (!orgAuthor && !(await this.mayCourse(p, orgId, course.id))) throw forbidden('permission_denied', 'Editing this course needs the course author role for it.');
      const { doc, versionNo } = await this.export(course);
      values = { courseId: course.id, slug: course.slug, title: course.title, visibility: course.visibility, doc, baseVersionNo: versionNo, ownerOrgId: course.ownerOrgId };
    } else {
      if (!orgAuthor) throw forbidden('permission_denied', 'Starting a new course needs the course author role for the organisation.');
      const slug = input.slug!;
      const title = input.title!;
      const [taken] = await this.db.sys.select({ id: courses.id }).from(courses).where(eq(courses.slug, slug));
      if (taken) throw conflict('course_slug_taken', 'A course already uses that web address. Choose another.');
      const [ownerName] = (await this.orgNames([orgId])).values();
      const visibility = p.platformAdmin ? ('public' as const) : ('org_private' as const);
      values = { courseId: null, slug, title, visibility, doc: this.blank(slug, title, ownerName ?? '', visibility), baseVersionNo: null, ownerOrgId: orgId };
    }
    const id = newId();
    const inserted = await this.db.system((tx) =>
      tx
        .insert(courseDrafts)
        .values({ id, ...values, status: 'draft', createdByUserId: p.userId, updatedByUserId: p.userId })
        .onConflictDoNothing()
        .returning(),
    );
    if (inserted.length === 0) {
      const [existing] = await this.db.sys
        .select({ id: courseDrafts.id })
        .from(courseDrafts)
        .where(and(values.courseId ? eq(courseDrafts.courseId, values.courseId) : eq(courseDrafts.slug, values.slug), inArray(courseDrafts.status, [...OPEN])));
      throw conflict('draft_exists', 'This course already has a draft. Open that one.', existing ? { draftId: existing.id } : undefined);
    }
    return this.view(p, inserted[0]!);
  }

  async get(p: Principal, draftId: string): Promise<Draft> {
    return this.view(p, await this.visible(p, draftId));
  }

  /** Whole-document save; incomplete is fine. The slug never changes. */
  async save(p: Principal, draftId: string, input: { revision: number; doc: Record<string, unknown> }): Promise<Draft> {
    const draft = await this.visible(p, draftId);
    if (!(await this.canEdit(p, draft))) throw forbidden('permission_denied', 'Only the course’s authors can change it.');
    if (draft.status === 'in_review') throw conflict('draft_in_review', 'This draft is waiting for review. Take it back from review to keep editing.');
    if (draft.status === 'published') throw conflict('draft_published', 'This draft has been published. Start a new draft to make more changes.');
    if (Buffer.byteLength(JSON.stringify(input.doc)) > MAX_DOC_BYTES) throw badRequest('draft_too_large', 'This course is too large to save in one piece (1 MB).');
    const doc: Record<string, unknown> = { ...input.doc, slug: draft.slug };
    const title = typeof doc.title === 'string' && doc.title.trim() ? doc.title.trim().slice(0, 160) : draft.title;
    const visibility = (VISIBILITIES as readonly unknown[]).includes(doc.visibility) ? (doc.visibility as DraftRow['visibility']) : draft.visibility;
    const [row] = await this.db.system((tx) =>
      tx
        .update(courseDrafts)
        .set({ doc, title, visibility, revision: draft.revision + 1, updatedByUserId: p.userId, updatedAt: new Date() })
        // Revision and status in one statement: a save can't land after the draft went for review.
        .where(and(eq(courseDrafts.id, draft.id), eq(courseDrafts.revision, input.revision), inArray(courseDrafts.status, ['draft', 'changes_requested'])))
        .returning(),
    );
    if (!row) throw conflict('draft_changed', 'Someone saved this draft after you opened it. Reload to see their changes, then make yours again.');
    return this.view(p, row);
  }

  async submit(p: Principal, draftId: string): Promise<Draft> {
    const draft = await this.visible(p, draftId);
    if (!(await this.canEdit(p, draft))) throw forbidden('permission_denied', 'Only the course’s authors can send it for review.');
    if (draft.status !== 'draft' && draft.status !== 'changes_requested') throw conflict('draft_not_editable', 'This draft is not open for editing.');
    if (draftIssues(draft.doc).length > 0) throw conflict('draft_has_issues', 'Fix the issues listed before sending it for review.');
    // The revision that was checked is the one that goes for review.
    const reviewers = draft.visibility === 'public' ? await this.platformOrg() : draft.ownerOrgId;
    return this.transition(p, draft, { status: 'in_review', submittedByUserId: p.userId, submittedAt: new Date() }, ['draft', 'changes_requested'], draft.revision, (row) => ({
      to: { permission: { orgId: reviewers, permission: 'course.publish' } },
      exclude: [p.userId],
      category: 'authoring',
      title: `“${row.title}” is ready for review`,
      body: `A new version of “${row.title}” was sent for review. Read it through, then publish it or ask for changes.`,
      link: `/app/authoring/${row.id}`,
      orgId: row.ownerOrgId,
      key: `draft-review:${row.id}:${row.submittedAt?.toISOString() ?? row.revision}`,
    }));
  }

  async withdraw(p: Principal, draftId: string): Promise<Draft> {
    const draft = await this.visible(p, draftId);
    if (!(await this.canEdit(p, draft))) throw forbidden('permission_denied', 'Only the course’s authors can take it back.');
    if (draft.status !== 'in_review') throw conflict('draft_not_in_review', 'This draft is not waiting for review.');
    return this.transition(p, draft, { status: 'draft' }, ['in_review']);
  }

  async requestChanges(p: Principal, draftId: string, note: string | null): Promise<Draft> {
    const draft = await this.visible(p, draftId);
    if (!(await this.canReview(p, draft))) throw forbidden('permission_denied', this.reviewerMessage(draft));
    if (draft.status !== 'in_review') throw conflict('draft_not_in_review', 'This draft is not waiting for review.');
    return this.transition(p, draft, { status: 'changes_requested', reviewNote: note, reviewedByUserId: p.userId, reviewedAt: new Date() }, ['in_review'], undefined, (row) => ({
      to: { userIds: authorsOf(row) },
      exclude: [p.userId],
      category: 'authoring',
      title: `Changes requested on “${row.title}”`,
      body: note ? `The reviewer wrote: ${note}` : 'The reviewer asked for changes before it can be published.',
      link: `/app/authoring/${row.id}`,
      orgId: row.ownerOrgId,
      key: `draft-changes:${row.id}:${row.reviewedAt?.toISOString() ?? row.revision}`,
    }));
  }

  /** Publish through the course importer; learners already enrolled stay on their version. */
  async publish(p: Principal, draftId: string, note: string | null): Promise<Draft> {
    const draft = await this.visible(p, draftId);
    if (!(await this.canReview(p, draft))) throw forbidden('permission_denied', this.reviewerMessage(draft));
    const row = await this.db.system(async (tx) => {
      // Locked for the whole publish, so the same draft can't be published twice at once.
      const [locked] = await tx.select().from(courseDrafts).where(eq(courseDrafts.id, draft.id)).for('update');
      if (!locked || locked.status !== 'in_review') throw conflict('draft_not_in_review', 'This draft is not waiting for review.');
      const parsed = CourseAuthoringSchema.safeParse(locked.doc);
      if (!parsed.success || draftIssues(locked.doc).length > 0) throw conflict('draft_has_issues', 'This draft has issues to fix before it can be published.');
      const [before] = await tx.select({ visibility: courses.visibility, currentVersionId: courses.currentVersionId }).from(courses).where(eq(courses.slug, locked.slug));
      // A draft started from an older version would undo what was published since: refuse it.
      const [current] = before?.currentVersionId
        ? await tx.select({ versionNo: courseVersions.versionNo }).from(courseVersions).where(eq(courseVersions.id, before.currentVersionId))
        : [];
      if ((current?.versionNo ?? null) !== locked.baseVersionNo) {
        throw conflict('draft_stale', `Version ${current?.versionNo ?? 'new'} was published after this draft started. Start a new draft from it and make your changes there.`);
      }
      // In this transaction, so the new version and the draft's publication commit together.
      const result = await this.importer.importCourse(parsed.data, locked.ownerOrgId, false, tx);
      const [course] = await tx.select({ id: courses.id }).from(courses).where(eq(courses.slug, locked.slug));
      // A course that becomes public through review joins the public catalogue (new courses are listed by the importer).
      if (course && before && before.visibility !== 'public' && parsed.data.visibility === 'public') {
        await tx
          .insert(catalogListings)
          .values({ id: newId(), ownerOrgId: locked.ownerOrgId, itemType: 'course', itemId: course.id, channel: 'public', featured: false })
          .onConflictDoNothing();
      }
      const [updated] = await tx
        .update(courseDrafts)
        .set({
          status: 'published',
          courseId: course?.id ?? locked.courseId,
          publishedVersionNo: result.versionNo,
          reviewNote: note,
          reviewedByUserId: p.userId,
          reviewedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(courseDrafts.id, locked.id))
        .returning();
      await requestNotification(
        this.outbox,
        tx,
        {
          to: { userIds: authorsOf(updated!) },
          exclude: [p.userId],
          category: 'authoring',
          title: `“${updated!.title}” is published`,
          body: `Version ${result.versionNo} of “${updated!.title}” is live. New learners get it; anyone already enrolled stays on the version they started.`,
          link: `/courses/${updated!.slug}`,
          orgId: updated!.ownerOrgId,
          key: `draft-published:${updated!.id}`,
        },
        userActor(p.userId),
      );
      return updated!;
    });
    return this.view(p, row);
  }

  /** An upload link for a cover image or video in the course's public media (MEDIA-1). */
  async uploadMedia(p: Principal, draftId: string, req: { kind: 'image' | 'video'; fileName: string; contentType: string; size: number }): Promise<CourseMediaUpload> {
    const draft = await this.visible(p, draftId);
    if (!(await this.canEdit(p, draft))) throw forbidden('permission_denied', 'Only the course’s authors can add media to it.');
    const path = `courses/${draft.ownerOrgId}/${newId()}/${safeFileName(req.fileName)}`;
    return { ...this.storage.uploadTicket('public', path, req.contentType), path, url: `/media/${path}` };
  }

  async remove(p: Principal, draftId: string): Promise<void> {
    const draft = await this.visible(p, draftId);
    if (!(await this.canEdit(p, draft))) throw forbidden('permission_denied', 'Only the course’s authors can discard it.');
    if (draft.status === 'in_review' || draft.status === 'published') throw conflict('draft_not_editable', 'Only drafts that are not in review or published can be discarded.');
    await this.db.system((tx) => tx.delete(courseDrafts).where(and(eq(courseDrafts.id, draft.id), inArray(courseDrafts.status, ['draft', 'changes_requested']))));
  }

  // ---------- access ----------

  /** The organisation the caller authors for: the active one, or the platform's for platform admins with none. */
  async homeOrg(p: Principal): Promise<string> {
    if (p.orgId) return p.orgId;
    if (p.platformAdmin) return this.platformOrg();
    throw forbidden('org_context_required', 'Switch to the organisation whose courses you write.');
  }

  private platformOrgId: string | null = null;
  private async platformOrg(): Promise<string> {
    this.platformOrgId ??= await this.importer.resolveOwner(this.config.CATALOG_SEED_OWNER_SLUG);
    return this.platformOrgId;
  }

  /** The platform team reviews public courses from every organisation; nothing else of theirs. */
  private platformReviewer(p: Principal, draft: DraftRow): boolean {
    return p.platformAdmin && !p.stale && draft.visibility === 'public';
  }

  /** A draft the caller may see: their organisation's (as author or reviewer), or a public one for the platform team. Others: not found. */
  private async visible(p: Principal, draftId: string): Promise<DraftRow> {
    const [draft] = await this.db.sys.select().from(courseDrafts).where(eq(courseDrafts.id, draftId));
    if (!draft) throw notFound('draft_not_found', 'Draft not found');
    const allowed = this.platformReviewer(p, draft) || (await this.canEdit(p, draft)) || (await this.may(p, draft.ownerOrgId, 'course.publish'));
    if (!allowed) throw notFound('draft_not_found', 'Draft not found');
    return draft;
  }

  /** May the caller author content for the organisation as a whole (course.content.edit org-wide)? */
  async isOrgAuthor(p: Principal, orgId: string): Promise<boolean> {
    return this.may(p, orgId, 'course.content.edit');
  }

  /** May the caller change this course: an organisation author, or an author of this course. */
  async canEditCourse(p: Principal, ownerOrgId: string, courseId: string): Promise<boolean> {
    return (await this.may(p, ownerOrgId, 'course.content.edit')) || (await this.mayCourse(p, ownerOrgId, courseId));
  }

  /** Authors of the whole organisation, or of this course (the author role scoped to it). */
  private async canEdit(p: Principal, draft: DraftRow): Promise<boolean> {
    if (await this.may(p, draft.ownerOrgId, 'course.content.edit')) return true;
    return draft.courseId !== null && this.mayCourse(p, draft.ownerOrgId, draft.courseId);
  }

  /** course.content.edit granted for one course, in the organisation the caller is working in. */
  private async mayCourse(p: Principal, orgId: string, courseId: string): Promise<boolean> {
    if (!this.authz || orgId !== (await this.homeOrg(p).catch(() => null))) return false;
    return this.authz.check({ userId: p.userId, orgId, permission: 'course.content.edit', authzVersion: p.authzVersion, fresh: p.stale, scopeType: 'course', scopeId: courseId });
  }

  /** Public courses join the platform catalogue, so platform admins review them; others, the owner's reviewers. */
  private async canReview(p: Principal, draft: DraftRow): Promise<boolean> {
    if (draft.visibility === 'public') return this.platformReviewer(p, draft);
    return this.may(p, draft.ownerOrgId, 'course.publish');
  }

  private reviewerMessage(draft: DraftRow): string {
    return draft.visibility === 'public' ? 'Courses for the public catalogue are reviewed by the platform team.' : 'Publishing needs the right to publish courses.';
  }

  /**
   * Org-wide in the organisation the caller is working in (their active one; for platform admins with
   * none, the platform's): from the token's roles when they can be trusted, otherwise IAM decides.
   */
  private async may(p: Principal, orgId: string, permission: Permission): Promise<boolean> {
    if (orgId !== (await this.homeOrg(p).catch(() => null))) return false;
    if (p.platformAdmin && !p.stale) return true;
    if (hasOrgPermission(p, permission)) return true;
    if (!this.authz) return false;
    return this.authz.check({ userId: p.userId, orgId, permission, authzVersion: p.authzVersion, fresh: p.stale });
  }

  // ---------- documents ----------

  /** Status changes are conditional on the status (and, when given, the revision) the caller acted on. */
  private async transition(
    p: Principal,
    draft: DraftRow,
    set: Partial<DraftRow>,
    from: DraftRow['status'][],
    revision?: number,
    notify?: (row: DraftRow) => NotificationRequest,
  ): Promise<Draft> {
    const row = await this.db.system(async (tx) => {
      const [updated] = await tx
        .update(courseDrafts)
        .set({ ...set, updatedAt: new Date() })
        .where(and(eq(courseDrafts.id, draft.id), inArray(courseDrafts.status, from), revision === undefined ? undefined : eq(courseDrafts.revision, revision)))
        .returning();
      if (updated && notify) await requestNotification(this.outbox, tx, notify(updated), userActor(p.userId));
      return updated;
    });
    if (!row) throw conflict('draft_changed', 'This draft changed in the meantime. Reload it.');
    return this.view(p, row);
  }

  /** The course as an authored document: its details and the modules and items of its current version. */
  private async export(course: CourseRow): Promise<{ doc: Record<string, unknown>; versionNo: number | null }> {
    const content = course.currentVersionId ? await this.catalog.content({ versionId: course.currentVersionId }) : null;
    const doc: CourseAuthoring = {
      slug: course.slug,
      title: course.title,
      subtitle: course.subtitle,
      description: course.description,
      provider: course.provider,
      level: course.level,
      language: course.language,
      visibility: course.visibility,
      creditHours: content?.version.creditHours ?? course.creditHours,
      outcomes: course.outcomes,
      skills: course.skills,
      audience: course.audience,
      prerequisites: course.prerequisites,
      practicalOutput: course.practicalOutput,
      cover: course.cover,
      ...(course.trailer ? { trailer: course.trailer } : {}),
      instructors: course.instructors,
      modules:
        content?.modules.map((m) => ({
          key: m.key,
          title: m.title,
          summary: m.summary,
          weekNo: m.weekNo,
          items: m.items.map((i) => i.authoring),
        })) ?? [],
    };
    return { doc: JSON.parse(JSON.stringify(doc)) as Record<string, unknown>, versionNo: content?.version.versionNo ?? null };
  }

  private blank(slug: string, title: string, provider: string, visibility: DraftRow['visibility']): Record<string, unknown> {
    return {
      slug,
      title,
      subtitle: '',
      description: '',
      provider,
      level: 'beginner',
      language: 'en',
      visibility,
      creditHours: 1,
      outcomes: [],
      skills: [],
      audience: '',
      prerequisites: '',
      practicalOutput: null,
      cover: { from: '#0A3D29', to: '#12805C', symbol: title.trim().charAt(0).toUpperCase() || 'C' },
      instructors: [],
      modules: [],
    };
  }

  private async view(p: Principal, d: DraftRow): Promise<Draft> {
    const [summary] = (await this.summaries([d])).values();
    const [edit, review] = await Promise.all([this.canEdit(p, d), this.canReview(p, d)]);
    const open = d.status === 'draft' || d.status === 'changes_requested';
    const names = await this.userNames([d.reviewedByUserId]);
    return {
      ...summary!,
      revision: d.revision,
      doc: d.doc,
      issues: draftIssues(d.doc),
      reviewNote: d.reviewNote,
      reviewedBy: d.reviewedByUserId ? { userId: d.reviewedByUserId, name: names.get(d.reviewedByUserId) ?? 'Reviewer' } : null,
      reviewedAt: d.reviewedAt?.toISOString() ?? null,
      can: {
        edit: edit && open,
        submit: edit && open,
        withdraw: edit && d.status === 'in_review',
        review: review && d.status === 'in_review',
        delete: edit && open,
      },
    };
  }

  private async summaries(rows: DraftRow[]): Promise<Map<string, DraftSummary>> {
    if (rows.length === 0) return new Map();
    const [orgs, users] = await Promise.all([this.orgNames([...new Set(rows.map((r) => r.ownerOrgId))]), this.userNames(rows.map((r) => r.updatedByUserId))]);
    return new Map(
      rows.map((d) => [
        d.id,
        {
          id: d.id,
          courseId: d.courseId,
          slug: d.slug,
          title: d.title,
          ownerOrgId: d.ownerOrgId,
          ownerName: orgs.get(d.ownerOrgId) ?? 'Organisation',
          visibility: d.visibility,
          status: d.status,
          baseVersionNo: d.baseVersionNo,
          publishedVersionNo: d.publishedVersionNo,
          updatedAt: d.updatedAt.toISOString(),
          updatedBy: { userId: d.updatedByUserId, name: users.get(d.updatedByUserId) ?? 'Author' },
          submittedAt: d.submittedAt?.toISOString() ?? null,
        },
      ]),
    );
  }

  private async versionNos(rows: CourseRow[]): Promise<Map<string, number>> {
    const ids = rows.flatMap((r) => (r.currentVersionId ? [r.currentVersionId] : []));
    if (ids.length === 0) return new Map();
    const versions = await this.db.sys.select({ courseId: courseVersions.courseId, versionNo: courseVersions.versionNo }).from(courseVersions).where(inArray(courseVersions.id, ids));
    return new Map(versions.map((v) => [v.courseId, v.versionNo]));
  }

  private async userNames(ids: (string | null)[]): Promise<Map<string, string>> {
    const userIds = [...new Set(ids.filter((i): i is string => !!i))];
    if (userIds.length === 0) return new Map();
    const rows = await this.iam.send<UserName[]>(IamRpc.UserNames, { userIds }).catch(() => [] as UserName[]);
    return new Map(rows.map((u) => [u.id, u.name]));
  }

  private async orgNames(ids: string[]): Promise<Map<string, string>> {
    if (ids.length === 0) return new Map();
    const rows = await this.iam.send<{ id: string; name: string }[]>(IamRpc.OrgNames, { ids }).catch(() => []);
    return new Map(rows.map((o) => [o.id, o.name]));
  }
}

/** Everyone who wrote or sent the draft. */
function authorsOf(d: DraftRow): string[] {
  return [...new Set([d.createdByUserId, d.updatedByUserId, ...(d.submittedByUserId ? [d.submittedByUserId] : [])])];
}
