import { Inject, Injectable, Optional } from '@nestjs/common';
import {
  type AuthoringOverview,
  type CourseAuthoring,
  CourseAuthoringSchema,
  type Draft,
  draftIssues,
  type DraftSummary,
  type Permission,
} from '@dreamlab/contracts';
import { AUTHZ_CHECKER, AuthzChecker, hasOrgPermission, type Principal } from '@lib/auth';
import { badRequest, conflict, forbidden, newId, notFound } from '@lib/common';
import { InjectConfig } from '@lib/config';
import { InjectDatabase } from '@lib/database';
import { IamRpc, RpcClient, UserName } from '@lib/rpc';
import { and, asc, desc, eq, inArray, ne } from 'drizzle-orm';
import type { CatalogConfig } from '../../config';
import { CatalogDatabase, schema } from '../../database';
import { CatalogReadService } from '../courses/catalog-read.service';
import { CatalogSeedService, IAM_RPC } from '../seed/catalog-seed.service';

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
    @Optional() @Inject(AUTHZ_CHECKER) private readonly authz?: AuthzChecker,
  ) {}

  async overview(p: Principal): Promise<AuthoringOverview> {
    const orgId = await this.homeOrg(p);
    const [author, review] = await Promise.all([this.may(p, orgId, 'course.content.edit'), this.may(p, orgId, 'course.publish')]);
    if (!author && !review) throw forbidden('permission_denied', 'You don’t author or review courses in this organisation.');
    const [owned, open, publicQueue] = await Promise.all([
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
      })),
      newDrafts: open.filter((d) => !d.courseId).map((d) => summaries.get(d.id)!),
      toReview: [...open.filter(reviewable), ...publicQueue].map((d) => summaries.get(d.id)!),
      can: { author, review },
    };
  }

  async create(p: Principal, input: { courseSlug?: string; slug?: string; title?: string }): Promise<Draft> {
    const orgId = await this.homeOrg(p);
    if (!(await this.may(p, orgId, 'course.content.edit'))) throw forbidden('permission_denied', 'Writing courses needs the course author role.');
    let values: Pick<DraftRow, 'courseId' | 'slug' | 'title' | 'visibility' | 'doc' | 'baseVersionNo' | 'ownerOrgId'>;
    if (input.courseSlug) {
      const [course] = await this.db.sys.select().from(courses).where(eq(courses.slug, input.courseSlug));
      if (!course || (course.ownerOrgId !== orgId && !(p.platformAdmin && !p.stale))) throw notFound('course_not_found', 'Course not found');
      const { doc, versionNo } = await this.export(course);
      values = { courseId: course.id, slug: course.slug, title: course.title, visibility: course.visibility, doc, baseVersionNo: versionNo, ownerOrgId: course.ownerOrgId };
    } else {
      const slug = input.slug!;
      const title = input.title!;
      const [taken] = await this.db.sys.select({ id: courses.id }).from(courses).where(eq(courses.slug, slug));
      if (taken) throw conflict('slug_taken', 'A course already uses that web address. Choose another.');
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
        .where(and(eq(courseDrafts.id, draft.id), eq(courseDrafts.revision, input.revision)))
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
    return this.transition(p, draft, { status: 'in_review', submittedByUserId: p.userId, submittedAt: new Date() }, ['draft', 'changes_requested']);
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
    return this.transition(p, draft, { status: 'changes_requested', reviewNote: note, reviewedByUserId: p.userId, reviewedAt: new Date() }, ['in_review']);
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
      const [before] = await tx.select({ visibility: courses.visibility }).from(courses).where(eq(courses.slug, locked.slug));
      const result = await this.importer.importCourse(parsed.data, locked.ownerOrgId);
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
      return updated!;
    });
    return this.view(p, row);
  }

  async remove(p: Principal, draftId: string): Promise<void> {
    const draft = await this.visible(p, draftId);
    if (!(await this.canEdit(p, draft))) throw forbidden('permission_denied', 'Only the course’s authors can discard it.');
    if (draft.status === 'in_review' || draft.status === 'published') throw conflict('draft_not_editable', 'Only drafts that are not in review or published can be discarded.');
    await this.db.system((tx) => tx.delete(courseDrafts).where(and(eq(courseDrafts.id, draft.id), inArray(courseDrafts.status, ['draft', 'changes_requested']))));
  }

  // ---------- access ----------

  /** The organisation the caller authors for: the active one, or the platform's for platform admins with none. */
  private async homeOrg(p: Principal): Promise<string> {
    if (p.orgId) return p.orgId;
    if (p.platformAdmin) return this.importer.resolveOwner(this.config.CATALOG_SEED_OWNER_SLUG);
    throw forbidden('org_context_required', 'Switch to the organisation whose courses you write.');
  }

  /** A draft the caller may see: their organisation's, or (platform admins) any. Others: not found. */
  private async visible(p: Principal, draftId: string): Promise<DraftRow> {
    const [draft] = await this.db.sys.select().from(courseDrafts).where(eq(courseDrafts.id, draftId));
    if (!draft) throw notFound('draft_not_found', 'Draft not found');
    const allowed = (p.platformAdmin && !p.stale) || (await this.canEdit(p, draft)) || (await this.may(p, draft.ownerOrgId, 'course.publish'));
    if (!allowed) throw notFound('draft_not_found', 'Draft not found');
    return draft;
  }

  private canEdit(p: Principal, draft: DraftRow): Promise<boolean> {
    return this.may(p, draft.ownerOrgId, 'course.content.edit');
  }

  /** Public courses join the platform catalogue, so platform admins review them; others, the owner's reviewers. */
  private async canReview(p: Principal, draft: DraftRow): Promise<boolean> {
    if (p.platformAdmin && !p.stale) return true;
    if (draft.visibility === 'public') return false;
    return this.may(p, draft.ownerOrgId, 'course.publish');
  }

  private reviewerMessage(draft: DraftRow): string {
    return draft.visibility === 'public' ? 'Courses for the public catalogue are reviewed by the platform team.' : 'Publishing needs the right to publish courses.';
  }

  /** Org-wide in the organisation: from the token's roles when they can be trusted, otherwise IAM decides. */
  private async may(p: Principal, orgId: string, permission: Permission): Promise<boolean> {
    if (p.platformAdmin && !p.stale) return true;
    if (p.orgId !== orgId) return false;
    if (hasOrgPermission(p, permission)) return true;
    if (!this.authz) return false;
    return this.authz.check({ userId: p.userId, orgId, permission, authzVersion: p.authzVersion, fresh: p.stale });
  }

  // ---------- documents ----------

  private async transition(p: Principal, draft: DraftRow, set: Partial<DraftRow>, from: DraftRow['status'][]): Promise<Draft> {
    const [row] = await this.db.system((tx) =>
      tx
        .update(courseDrafts)
        .set({ ...set, updatedAt: new Date() })
        .where(and(eq(courseDrafts.id, draft.id), inArray(courseDrafts.status, from)))
        .returning(),
    );
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

