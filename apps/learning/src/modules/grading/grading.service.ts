import { Inject, Injectable, Optional } from '@nestjs/common';
import { type Grade, type GradingQueueItem, type GradingStatus, rubricScorePct, type SubmissionForGrading } from '@dreamlab/contracts';
import { AUTHZ_CHECKER, AuthzChecker, hasOrgPermission, type Principal } from '@lib/auth';
import { badRequest, conflict, forbidden, newId, notFound } from '@lib/common';
import { InjectDatabase } from '@lib/database';
import { InjectOutbox, OutboxWriter, userActor } from '@lib/messaging';
import { CatalogClient, CourseContent, IamRpc, RpcClient, UserName } from '@lib/rpc';
import { and, desc, eq, inArray, isNull, type SQL } from 'drizzle-orm';
import { LearningDatabase, schema } from '../../database';
import { LearningEvents } from '../../events';
import { CATALOG, flatItems } from '../enrollments/enrollments.service';
import { IAM_NAMES } from '../player/player.service';
import { courseFinalScore, itemScores } from './course-score';

const { submissions, grades, courseEnrollments, courseRuns, cohorts } = schema;
type SubmissionRow = typeof submissions.$inferSelect;
type EnrollmentRow = typeof courseEnrollments.$inferSelect;
type GradeRow = typeof grades.$inferSelect;

/** The most assignments (newest version each) the queue looks through. */
const QUEUE_SCAN = 5000;

export interface GradeInput {
  rubricScores: Record<string, number>;
  feedback: string | null;
  release: boolean;
}

const statusOf = (latest: GradeRow | undefined): GradingStatus => (!latest ? 'awaiting' : latest.releasedAt ? 'released' : 'draft');

/**
 * Faculty grading (LRN-3). Assignment submissions are graded by people with submission.grade where
 * the learner studies: org-wide (instructors), or for the learner's course run or cohort (graders).
 * Work done in the personal context is graded by platform admins. Submissions and grades belong to
 * learners (RLS), so graders read and write them as the system role after these checks. Grades are
 * append-only: a regrade adds a row that supersedes the last.
 */
@Injectable()
export class GradingService {
  constructor(
    @InjectDatabase() private readonly db: LearningDatabase,
    @InjectOutbox() private readonly outbox: OutboxWriter,
    @Inject(CATALOG) private readonly catalog: CatalogClient,
    @Inject(IAM_NAMES) private readonly iam: RpcClient,
    @Optional() @Inject(AUTHZ_CHECKER) private readonly authz?: AuthzChecker,
  ) {}

  /** The newest version of each learner's assignment, in the active organisation (platform admins: personal work too). */
  async queue(p: Principal, status: GradingStatus | 'all'): Promise<{ items: GradingQueueItem[] }> {
    const scope: SQL | undefined = p.orgId ? eq(submissions.contextOrgId, p.orgId) : p.platformAdmin ? isNull(submissions.contextOrgId) : undefined;
    if (!scope) throw forbidden('org_context_required', 'Switch to the organisation whose work you grade.');
    // The newest version of each learner's assignment first, then the limit, so graded work can't
    // crowd waiting work out of the scan.
    const rows = await this.db.sys
      .selectDistinctOn([submissions.courseEnrollmentId, submissions.contentItemId])
      .from(submissions)
      .where(and(eq(submissions.kind, 'assignment'), scope))
      .orderBy(submissions.courseEnrollmentId, submissions.contentItemId, desc(submissions.attemptNo))
      .limit(QUEUE_SCAN);
    const candidates = rows.filter((s) => s.userId !== p.userId);
    if (candidates.length === 0) return { items: [] };

    const enrollments = await this.enrollments(candidates.map((s) => s.courseEnrollmentId));
    const runs = await this.runs([...enrollments.values()].flatMap((e) => (e.courseRunId ? [e.courseRunId] : [])));
    const allowed = await this.gradableFilter(p, [...enrollments.values()], runs);
    const visible = candidates.filter((s) => allowed(enrollments.get(s.courseEnrollmentId)));
    const gradesBy = await this.latestGrades(visible.map((s) => s.id));
    const chosen = visible.filter((s) => status === 'all' || statusOf(gradesBy.get(s.id)) === status);
    if (chosen.length === 0) return { items: [] };

    const [names, summaries, contents] = await Promise.all([
      this.userNames(chosen.map((s) => s.userId)),
      this.catalog.courseSummaries([...new Set(chosen.map((s) => s.courseId))]),
      this.contents([...new Set(chosen.map((s) => enrollments.get(s.courseEnrollmentId)!.courseVersionId))]),
    ]);
    const items = chosen.map((s): GradingQueueItem => {
      const e = enrollments.get(s.courseEnrollmentId)!;
      const g = gradesBy.get(s.id);
      const item = contents.get(e.courseVersionId) && flatItems(contents.get(e.courseVersionId)!).find((i) => i.id === s.contentItemId);
      return {
        submissionId: s.id,
        version: s.attemptNo,
        submittedAt: s.submittedAt.toISOString(),
        status: statusOf(g),
        scorePct: g ? Math.round(g.score) : null,
        learner: { userId: s.userId, name: names.get(s.userId) ?? 'Learner' },
        course: { slug: summaries.get(s.courseId)?.slug ?? e.courseSlug, title: summaries.get(s.courseId)?.title ?? e.courseSlug },
        item: { id: s.contentItemId, title: item ? item.title : 'Assignment' },
        cohortName: e.courseRunId ? (runs.get(e.courseRunId)?.cohortName ?? null) : null,
      };
    });
    // Waiting work oldest first, so nobody waits longest; graded work newest first.
    items.sort((a, b) => (status === 'awaiting' ? a.submittedAt.localeCompare(b.submittedAt) : b.submittedAt.localeCompare(a.submittedAt)));
    return { items };
  }

  async submission(p: Principal, submissionId: string): Promise<SubmissionForGrading> {
    const { submission, enrollment } = await this.gradable(p, submissionId);
    return this.view(submission, enrollment);
  }

  /** Every criterion scored; a release counts at once towards the course's final score. */
  async grade(p: Principal, submissionId: string, input: GradeInput, requestId?: string): Promise<SubmissionForGrading> {
    const { submission, enrollment } = await this.gradable(p, submissionId);
    const content = await this.catalog.version(enrollment.courseVersionId);
    const item = content && flatItems(content).find((i) => i.id === submission.contentItemId);
    if (!content || !item || item.authoring.type !== 'assignment') throw notFound('submission_not_found', 'Submission not found');
    const criteria = item.authoring.payload.rubric.map((r) => r.id);
    const given = Object.keys(input.rubricScores);
    if (given.length !== criteria.length || criteria.some((c) => !(c in input.rubricScores))) {
      throw badRequest('rubric_incomplete', 'Score every rubric criterion, and only those.');
    }
    const rubricScores = Object.fromEntries(criteria.map((c) => [c, input.rubricScores[c]!]));
    const scorePct = rubricScorePct(criteria.map((c) => rubricScores[c]!));
    await this.db.system(async (tx) => {
      // One grader at a time per submission, so each regrade supersedes the one before it.
      await tx.select({ id: courseEnrollments.id }).from(courseEnrollments).where(eq(courseEnrollments.id, enrollment.id)).for('update');
      // Checked under the lock submitAssignment also takes, so a newer version can't land in between.
      const [newer] = await tx
        .select({ id: submissions.id })
        .from(submissions)
        .where(and(eq(submissions.courseEnrollmentId, enrollment.id), eq(submissions.contentItemId, submission.contentItemId), eq(submissions.kind, 'assignment')))
        .orderBy(desc(submissions.attemptNo))
        .limit(1);
      if (newer && newer.id !== submission.id) throw conflict('not_latest_version', 'The learner has submitted a newer version. Grade that one.');
      const [previous] = await tx.select().from(grades).where(eq(grades.submissionId, submission.id)).orderBy(desc(grades.createdAt)).limit(1);
      const gradeId = newId();
      await tx.insert(grades).values({
        id: gradeId,
        submissionId: submission.id,
        userId: submission.userId,
        graderUserId: p.userId,
        score: scorePct,
        rubricScores,
        feedback: input.feedback || null,
        supersedesGradeId: previous?.id ?? null,
        releasedAt: input.release ? new Date() : null,
      });
      if (!input.release) return;
      const finalScore = courseFinalScore(content, await itemScores(tx, enrollment.id));
      await tx.update(courseEnrollments).set({ finalScore, updatedAt: new Date() }).where(eq(courseEnrollments.id, enrollment.id));
      await this.outbox.add(tx, {
        type: LearningEvents.GradeReleased,
        orgId: enrollment.contextOrgId,
        actor: userActor(p.userId),
        requestId,
        payload: { gradeId, submissionId: submission.id, enrollmentId: enrollment.id, userId: submission.userId, itemId: submission.contentItemId, scorePct, finalScore },
      });
    });
    return this.view(submission, enrollment, content);
  }

  // ---------- access ----------

  /** A submission the caller may grade; anything else is not found. Nobody grades their own work. */
  private async gradable(p: Principal, submissionId: string): Promise<{ submission: SubmissionRow; enrollment: EnrollmentRow }> {
    const [submission] = await this.db.sys
      .select()
      .from(submissions)
      .where(and(eq(submissions.id, submissionId), eq(submissions.kind, 'assignment')));
    const enrollment = submission && (await this.enrollments([submission.courseEnrollmentId])).get(submission.courseEnrollmentId);
    if (!submission || !enrollment) throw notFound('submission_not_found', 'Submission not found');
    if (submission.userId === p.userId) throw forbidden('own_submission', 'You can’t grade your own work.');
    const runs = await this.runs(enrollment.courseRunId ? [enrollment.courseRunId] : []);
    const allowed = await this.gradableFilter(p, [enrollment], runs);
    if (!allowed(enrollment)) throw notFound('submission_not_found', 'Submission not found');
    return { submission, enrollment };
  }

  /**
   * Which enrolments the caller may grade. Platform admins: their active organisation's, or personal
   * work when they have none. Others: their active organisation's, org-wide or for the learner's
   * course run or cohort (asked of IAM once per run).
   */
  private async gradableFilter(p: Principal, enrollments: EnrollmentRow[], runs: Map<string, { cohortId: string; cohortName: string }>) {
    const inContext = (e: EnrollmentRow | undefined): e is EnrollmentRow => !!e && (p.orgId ? e.contextOrgId === p.orgId : p.platformAdmin && e.contextOrgId === null);
    if ((p.platformAdmin && !p.stale) || (p.orgId && (await this.may(p, p.orgId, 'org')))) return inContext;
    if (!p.orgId) return () => false;
    const orgId = p.orgId;
    const runIds = [...new Set(enrollments.filter(inContext).flatMap((e) => (e.courseRunId ? [e.courseRunId] : [])))];
    const granted = new Set<string>();
    for (const runId of runIds) {
      const run = runs.get(runId);
      if ((await this.may(p, orgId, 'course_run', runId)) || (run && (await this.may(p, orgId, 'cohort', run.cohortId)))) granted.add(runId);
    }
    return (e: EnrollmentRow | undefined) => inContext(e) && !!e.courseRunId && granted.has(e.courseRunId);
  }

  private async may(p: Principal, orgId: string, scopeType: 'org' | 'course_run' | 'cohort', scopeId?: string): Promise<boolean> {
    if (scopeType === 'org' && hasOrgPermission(p, 'submission.grade')) return true;
    if (!this.authz) return false;
    return this.authz.check({
      userId: p.userId,
      orgId,
      permission: 'submission.grade',
      authzVersion: p.authzVersion,
      fresh: p.stale,
      ...(scopeType !== 'org' && { scopeType, scopeId }),
    });
  }

  // ---------- reads ----------

  private async view(submission: SubmissionRow, enrollment: EnrollmentRow, content?: CourseContent | null): Promise<SubmissionForGrading> {
    const course = content ?? (await this.catalog.version(enrollment.courseVersionId));
    const item = course && flatItems(course).find((i) => i.id === submission.contentItemId);
    if (!course || !item || item.authoring.type !== 'assignment') throw notFound('submission_not_found', 'Submission not found');
    const payload = item.authoring.payload;
    const [versions, history, runs] = await Promise.all([
      this.db.sys
        .select()
        .from(submissions)
        .where(and(eq(submissions.courseEnrollmentId, enrollment.id), eq(submissions.contentItemId, submission.contentItemId), eq(submissions.kind, 'assignment')))
        .orderBy(desc(submissions.attemptNo)),
      this.db.sys.select().from(grades).where(eq(grades.submissionId, submission.id)).orderBy(desc(grades.createdAt)),
      this.runs(enrollment.courseRunId ? [enrollment.courseRunId] : []),
    ]);
    const versionGrades = await this.latestGrades(versions.map((v) => v.id));
    const names = await this.userNames([submission.userId, ...history.flatMap((g) => (g.graderUserId ? [g.graderUserId] : []))]);
    const r = submission.responses as { link?: string | null; selfAssessment?: Record<string, boolean> };
    const toGrade = (g: GradeRow): Grade => ({
      id: g.id,
      scorePct: Math.round(g.score),
      rubricScores: g.rubricScores,
      feedback: g.feedback,
      graderName: g.graderUserId ? (names.get(g.graderUserId) ?? null) : null,
      releasedAt: g.releasedAt?.toISOString() ?? null,
      createdAt: g.createdAt.toISOString(),
    });
    return {
      submissionId: submission.id,
      version: submission.attemptNo,
      submittedAt: submission.submittedAt.toISOString(),
      status: statusOf(history[0]),
      text: submission.body ?? '',
      link: r.link ?? null,
      selfAssessment: r.selfAssessment ?? {},
      learner: { userId: submission.userId, name: names.get(submission.userId) ?? 'Learner' },
      course: { slug: course.course.slug, title: course.course.title },
      cohortName: enrollment.courseRunId ? (runs.get(enrollment.courseRunId)?.cohortName ?? null) : null,
      item: {
        id: item.id,
        title: item.title,
        practicalOutput: payload.practicalOutput,
        brief: payload.brief,
        steps: payload.steps,
        rubric: payload.rubric,
        gradeWeight: item.gradeWeight,
      },
      versions: versions.map((v) => {
        const g = versionGrades.get(v.id);
        return { submissionId: v.id, version: v.attemptNo, submittedAt: v.submittedAt.toISOString(), status: statusOf(g), scorePct: g ? Math.round(g.score) : null };
      }),
      grade: history[0] ? toGrade(history[0]) : null,
      history: history.slice(1).map(toGrade),
    };
  }

  private async enrollments(ids: string[]): Promise<Map<string, EnrollmentRow>> {
    if (ids.length === 0) return new Map();
    const rows = await this.db.sys.select().from(courseEnrollments).where(inArray(courseEnrollments.id, [...new Set(ids)]));
    return new Map(rows.map((r) => [r.id, r]));
  }

  private async runs(ids: string[]): Promise<Map<string, { cohortId: string; cohortName: string }>> {
    if (ids.length === 0) return new Map();
    const rows = await this.db.sys
      .select({ id: courseRuns.id, cohortId: courseRuns.cohortId, cohortName: cohorts.name })
      .from(courseRuns)
      .innerJoin(cohorts, eq(cohorts.id, courseRuns.cohortId))
      .where(inArray(courseRuns.id, [...new Set(ids)]));
    return new Map(rows.map((r) => [r.id, { cohortId: r.cohortId, cohortName: r.cohortName }]));
  }

  /** The newest grade (draft or released) on each submission. */
  private async latestGrades(submissionIds: string[]): Promise<Map<string, GradeRow>> {
    if (submissionIds.length === 0) return new Map();
    const rows = await this.db.sys.select().from(grades).where(inArray(grades.submissionId, submissionIds)).orderBy(desc(grades.createdAt));
    const out = new Map<string, GradeRow>();
    for (const g of rows) if (!out.has(g.submissionId)) out.set(g.submissionId, g);
    return out;
  }

  private async contents(versionIds: string[]): Promise<Map<string, CourseContent>> {
    const loaded = await Promise.all(versionIds.map(async (v) => [v, await this.catalog.version(v)] as const));
    return new Map(loaded.flatMap(([v, c]) => (c ? [[v, c] as const] : [])));
  }

  private async userNames(userIds: string[]): Promise<Map<string, string>> {
    if (userIds.length === 0) return new Map();
    const rows = await this.iam.send<UserName[]>(IamRpc.UserNames, { userIds: [...new Set(userIds)] }).catch(() => [] as UserName[]);
    return new Map(rows.map((u) => [u.id, u.name]));
  }
}
