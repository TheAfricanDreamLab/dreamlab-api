import { Inject, Injectable } from '@nestjs/common';
import type { CourseProgress, Enrollment, EnrollmentSummary } from '@dreamlab/contracts';
import type { Principal } from '@lib/auth';
import { conflict, newId, notFound } from '@lib/common';
import { InjectDatabase } from '@lib/database';
import { InjectOutbox, OutboxWriter, userActor } from '@lib/messaging';
import { CatalogClient, CourseContent } from '@lib/rpc';
import { and, desc, eq, inArray, isNull, sql } from 'drizzle-orm';
import { LearningDatabase, LearningTx, schema } from '../../database';
import { LearningEvents } from '../../events';

export const CATALOG = Symbol('CATALOG');

const { courseEnrollments, itemProgress, submissions } = schema;
export type EnrollmentRow = typeof courseEnrollments.$inferSelect;

/** Every learner record is read and written as that learner: RLS keeps everyone else's out. */
export const learnerCtx = (p: Principal) => ({ orgId: p.orgId ?? '', userId: p.userId });

export function toEnrollment(r: EnrollmentRow): Enrollment {
  return {
    id: r.id,
    courseId: r.courseId,
    courseSlug: r.courseSlug,
    versionId: r.courseVersionId,
    contextOrgId: r.contextOrgId,
    status: r.status,
    progressPct: r.progressPct,
    completedItems: r.completedItems,
    totalItems: r.totalItems,
    enrolledAt: r.enrolledAt.toISOString(),
    lastActiveAt: r.lastActiveAt.toISOString(),
    completedAt: r.completedAt?.toISOString() ?? null,
  };
}

export const flatItems = (content: CourseContent) => content.modules.flatMap((m) => m.items.map((i) => ({ ...i, module: m })));

/** First item not yet completed (required items first), for "Continue". */
export function nextItem(content: CourseContent, completed: Set<string>) {
  const items = flatItems(content);
  const next = items.find((i) => i.required && !completed.has(i.id)) ?? items.find((i) => !completed.has(i.id));
  return next ? { id: next.id, title: next.title, type: next.type, moduleTitle: next.module.title } : null;
}

@Injectable()
export class EnrollmentsService {
  constructor(
    @InjectDatabase() private readonly db: LearningDatabase,
    @InjectOutbox() private readonly outbox: OutboxWriter,
    @Inject(CATALOG) private readonly catalog: CatalogClient,
  ) {}

  /** Free and open courses: anyone signed in. Private courses: members of the owning organisation. */
  async enroll(p: Principal, slug: string, requestId?: string): Promise<Enrollment> {
    const content = await this.catalog.current(slug);
    if (!content) {
      const detail = await this.catalog.detail(slug, { orgId: p.orgId, platformAdmin: p.platformAdmin });
      if (detail) throw conflict('course_not_open', 'This course isn’t open for enrolment yet.');
      throw notFound('course_not_found', 'Course not found');
    }
    const isPrivate = content.course.visibility === 'org_private';
    if (isPrivate && p.orgId !== content.course.ownerOrgId && !p.platformAdmin) throw notFound('course_not_found', 'Course not found');

    return this.db.tenant(learnerCtx(p), async (tx) => {
      const existing = await this.findInContext(tx, p, content.course.id);
      if (existing) return toEnrollment(existing);
      const total = flatItems(content).filter((i) => i.required).length;
      const [row] = await tx
        .insert(courseEnrollments)
        .values({
          id: newId(),
          userId: p.userId,
          courseId: content.course.id,
          courseSlug: content.course.slug,
          courseVersionId: content.version.id,
          contextOrgId: p.orgId,
          accessSource: isPrivate ? 'org_private' : 'free',
          totalItems: total,
        })
        .onConflictDoNothing()
        .returning();
      if (!row) return toEnrollment((await this.findInContext(tx, p, content.course.id))!);
      await this.outbox.add(tx, {
        type: LearningEvents.EnrollmentCreated,
        orgId: p.orgId,
        actor: userActor(p.userId),
        requestId,
        payload: { enrollmentId: row.id, userId: p.userId, courseId: row.courseId, versionId: row.courseVersionId, contextOrgId: p.orgId },
      });
      return toEnrollment(row);
    });
  }

  async mine(p: Principal): Promise<{ items: EnrollmentSummary[] }> {
    const rows = await this.db.tenant(learnerCtx(p), (tx) =>
      tx.select().from(courseEnrollments).where(eq(courseEnrollments.userId, p.userId)).orderBy(desc(courseEnrollments.lastActiveAt)),
    );
    if (rows.length === 0) return { items: [] };
    const [summaries, done] = await Promise.all([this.catalog.courseSummaries(rows.map((r) => r.courseId)), this.completedByEnrollment(p, rows.map((r) => r.id))]);
    const items: EnrollmentSummary[] = [];
    for (const r of rows) {
      const course = summaries.get(r.courseId);
      const content = await this.catalog.version(r.courseVersionId);
      if (!course || !content) continue;
      items.push({ ...toEnrollment(r), course, nextItem: nextItem(content, done.get(r.id) ?? new Set()) });
    }
    return { items };
  }

  async courseProgress(p: Principal | null, slug: string): Promise<CourseProgress> {
    const detail = await this.catalog.detail(slug, { orgId: p?.orgId ?? null, platformAdmin: p?.platformAdmin ?? false });
    if (!detail) throw notFound('course_not_found', 'Course not found');
    const [learners] = await this.db.sys
      .select({ n: sql<number>`count(distinct ${courseEnrollments.userId})::int` })
      .from(courseEnrollments)
      .where(eq(courseEnrollments.courseId, detail.id));
    const base = { course: detail, enrollment: null, itemStatus: {}, nextItem: null, learnerCount: learners?.n ?? 0 };
    if (!p) return base;

    const enrollment = await this.db.tenant(learnerCtx(p), async (tx) => {
      return (await this.findInContext(tx, p, detail.id)) ?? (await tx.select().from(courseEnrollments).where(eq(courseEnrollments.courseId, detail.id)).orderBy(desc(courseEnrollments.lastActiveAt)))[0];
    });
    if (!enrollment) return base;

    // The learner works through the version they enrolled in, which may be older than the current one.
    const content = await this.catalog.version(enrollment.courseVersionId);
    if (!content) return base;
    const progress = await this.db.tenant(learnerCtx(p), (tx) =>
      tx.select({ itemId: itemProgress.contentItemId, status: itemProgress.status }).from(itemProgress).where(eq(itemProgress.courseEnrollmentId, enrollment.id)),
    );
    const completed = new Set(progress.filter((r) => r.status === 'completed').map((r) => r.itemId));
    return {
      course: {
        ...detail,
        versionId: content.version.id,
        versionNo: content.version.versionNo,
        modules: content.modules.map((m) => ({
          id: m.id,
          key: m.key,
          position: m.position,
          title: m.title,
          summary: m.summary,
          weekNo: m.weekNo,
          items: m.items.map((i) => ({ id: i.id, key: i.key, type: i.type, title: i.title, minutes: i.minutes, required: i.required })),
        })),
      },
      enrollment: toEnrollment(enrollment),
      itemStatus: Object.fromEntries(progress.map((r) => [r.itemId, r.status])),
      nextItem: nextItem(content, completed),
      learnerCount: base.learnerCount,
    };
  }

  /** Everything the learner wrote in reflections, newest first. */
  async journal(p: Principal) {
    const rows = await this.db.tenant(learnerCtx(p), (tx) =>
      tx
        .select()
        .from(submissions)
        .where(and(eq(submissions.userId, p.userId), eq(submissions.kind, 'reflection')))
        .orderBy(desc(submissions.submittedAt))
        .limit(200),
    );
    return {
      items: rows.map((r) => {
        const meta = r.responses as { prompt?: string; itemTitle?: string; courseSlug?: string; courseTitle?: string };
        return {
          id: r.id,
          course: { slug: meta.courseSlug ?? '', title: meta.courseTitle ?? '' },
          itemId: r.contentItemId,
          itemTitle: meta.itemTitle ?? '',
          prompt: meta.prompt ?? '',
          text: r.body ?? '',
          createdAt: r.submittedAt.toISOString(),
        };
      }),
    };
  }

  private async findInContext(tx: LearningTx, p: Principal, courseId: string): Promise<EnrollmentRow | undefined> {
    const [row] = await tx
      .select()
      .from(courseEnrollments)
      .where(and(eq(courseEnrollments.courseId, courseId), p.orgId ? eq(courseEnrollments.contextOrgId, p.orgId) : isNull(courseEnrollments.contextOrgId)));
    return row;
  }

  private async completedByEnrollment(p: Principal, enrollmentIds: string[]): Promise<Map<string, Set<string>>> {
    const rows = await this.db.tenant(learnerCtx(p), (tx) =>
      tx
        .select({ e: itemProgress.courseEnrollmentId, item: itemProgress.contentItemId })
        .from(itemProgress)
        .where(and(inArray(itemProgress.courseEnrollmentId, enrollmentIds), eq(itemProgress.status, 'completed'))),
    );
    const out = new Map<string, Set<string>>();
    for (const r of rows) out.set(r.e, (out.get(r.e) ?? new Set()).add(r.item));
    return out;
  }
}
