import { Inject, Injectable } from '@nestjs/common';
import {
  AssignmentSubmission,
  BlockResponse,
  BlockResult,
  Discussion,
  ItemState,
  ItemView,
  QuizAttempt,
  toDeliveryContent,
} from '@dreamlab/contracts';
import type { Principal } from '@lib/auth';
import { badRequest, conflict, newId, notFound } from '@lib/common';
import { InjectDatabase } from '@lib/database';
import { InjectOutbox, OutboxWriter, userActor } from '@lib/messaging';
import { CatalogClient, ContentItemRef, CourseContent, IamRpc, RpcClient, UserName } from '@lib/rpc';
import { and, asc, eq, inArray, isNull, sql } from 'drizzle-orm';
import { LearningDatabase, LearningTx, schema } from '../../database';
import { LearningEvents } from '../../events';
import { CATALOG, EnrollmentRow, flatItems, learnerCtx, toEnrollment } from '../enrollments/enrollments.service';
import { checkBlock, findBlock, gradeQuiz, interactiveBlocks, isSettled, wordCount } from './grading';

export const IAM_NAMES = Symbol('IAM_NAMES');

const { courseEnrollments, itemProgress, submissions, grades } = schema;
type ProgressRow = typeof itemProgress.$inferSelect;
type Located = { enrollment: EnrollmentRow; content: CourseContent; item: ContentItemRef & { module: CourseContent['modules'][number] } };

const EMPTY_STATE: ItemState = { stepIndex: 0, results: {}, responses: {} };
const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join('') || '?';

@Injectable()
export class PlayerService {
  constructor(
    @InjectDatabase() private readonly db: LearningDatabase,
    @InjectOutbox() private readonly outbox: OutboxWriter,
    @Inject(CATALOG) private readonly catalog: CatalogClient,
    @Inject(IAM_NAMES) private readonly iam: RpcClient,
  ) {}

  async getItem(p: Principal, enrollmentId: string, itemId: string): Promise<ItemView> {
    const { enrollment, content, item } = await this.locate(p, enrollmentId, itemId);
    const progress = await this.db.tenant(learnerCtx(p), async (tx) => {
      await tx.update(courseEnrollments).set({ lastActiveAt: new Date() }).where(eq(courseEnrollments.id, enrollment.id));
      return this.ensureProgress(tx, p, enrollment, item);
    });
    const mine = await this.db.tenant(learnerCtx(p), (tx) =>
      tx
        .select()
        .from(submissions)
        .where(and(eq(submissions.courseEnrollmentId, enrollment.id), eq(submissions.contentItemId, item.id), inArray(submissions.kind, ['quiz', 'assignment'])))
        .orderBy(asc(submissions.submittedAt)),
    );
    const all = flatItems(content);
    const at = all.findIndex((i) => i.id === item.id);
    const nav = (i: (typeof all)[number] | undefined) => (i ? { id: i.id, title: i.title, type: i.type } : null);
    return {
      enrollment: toEnrollment(enrollment),
      course: { slug: content.course.slug, title: content.course.title, cover: content.course.cover },
      module: { id: item.module.id, title: item.module.title, position: item.module.position, itemCount: item.module.items.length },
      item: { id: item.id, key: item.key, type: item.type, title: item.title, minutes: item.minutes, required: item.required, position: item.module.items.findIndex((i) => i.id === item.id) + 1 },
      content: toDeliveryContent(item.authoring, enrollment.id),
      status: progress.status,
      state: progress.state,
      quizAttempts: mine.filter((s) => s.kind === 'quiz').map((s) => this.toAttempt(s)),
      submissions: mine.filter((s) => s.kind === 'assignment').map((s) => this.toSubmission(s)),
      discussion: item.type === 'discussion' ? await this.discussion(p, enrollment, item) : null,
      previous: nav(all[at - 1]),
      next: nav(all[at + 1]),
    };
  }

  async saveProgress(p: Principal, enrollmentId: string, itemId: string, body: { stepIndex: number; complete: boolean }) {
    const { enrollment, content, item } = await this.locate(p, enrollmentId, itemId);
    return this.db.tenant(learnerCtx(p), async (tx) => {
      const progress = await this.ensureProgress(tx, p, enrollment, item);
      const steps = item.authoring.type === 'lesson' ? item.authoring.payload.steps.length : 1;
      const stepIndex = Math.min(Math.max(progress.stepIndex, body.stepIndex), steps - 1);
      await tx
        .update(itemProgress)
        .set({
          stepIndex,
          state: { ...progress.state, stepIndex },
          progressPct: progress.status === 'completed' ? 100 : Math.round(((stepIndex + 1) / steps) * 100),
          rowVersion: sql`${itemProgress.rowVersion} + 1`,
        })
        .where(eq(itemProgress.id, progress.id));
      if (body.complete && progress.status !== 'completed') {
        if (item.type !== 'lesson') throw conflict('complete_by_submitting', 'This item completes when you submit it.');
        const open = interactiveBlocks(item.authoring).filter((b) => !isSettled(progress.state.results[b.id]));
        if (open.length > 0) throw conflict('lesson_incomplete', `Answer every question in this lesson first (${open.length} left).`);
        return this.complete(tx, p, enrollment, content, item);
      }
      const [fresh] = await tx.select().from(courseEnrollments).where(eq(courseEnrollments.id, enrollment.id));
      return { status: progress.status, enrollment: toEnrollment(fresh!), courseCompleted: false };
    });
  }

  async check(p: Principal, enrollmentId: string, itemId: string, blockId: string, response: BlockResponse): Promise<BlockResult> {
    const { enrollment, content, item } = await this.locate(p, enrollmentId, itemId);
    if (item.authoring.type !== 'lesson') throw badRequest('not_a_lesson', 'Only lesson questions are checked one by one.');
    const block = findBlock(item.authoring, blockId);
    return this.db.tenant(learnerCtx(p), async (tx) => {
      const progress = await this.ensureProgress(tx, p, enrollment, item);
      const prior = progress.state.results[blockId];
      let result = checkBlock(block, response, prior?.attempts ?? 0);
      // Once the solution is out, a learner can keep practising without losing it.
      if (prior?.solution && !result.solution) result = { ...result, explanation: prior.explanation, solution: prior.solution, canRetry: false };

      const isReflection = response.type === 'reflection';
      await tx.insert(submissions).values({
        id: newId(),
        courseEnrollmentId: enrollment.id,
        userId: p.userId,
        courseId: enrollment.courseId,
        contentItemId: item.id,
        itemKey: item.key,
        contextOrgId: enrollment.contextOrgId,
        kind: isReflection ? 'reflection' : 'check',
        blockId,
        attemptNo: result.attempts,
        responses: isReflection
          ? { prompt: block.prompt, itemTitle: item.title, courseSlug: content.course.slug, courseTitle: content.course.title }
          : { response, correct: result.correct },
        body: isReflection ? response.text : null,
      });
      if (response.type === 'poll' || response.type === 'scale') {
        result = { ...result, distribution: await this.distribution(p.userId, enrollment.courseId, item.key, blockId, response) };
      }

      const state: ItemState = { ...progress.state, results: { ...progress.state.results, [blockId]: result }, responses: { ...progress.state.responses, [blockId]: response } };
      await tx.update(itemProgress).set({ state, rowVersion: sql`${itemProgress.rowVersion} + 1` }).where(eq(itemProgress.id, progress.id));
      await tx.update(courseEnrollments).set({ lastActiveAt: new Date() }).where(eq(courseEnrollments.id, enrollment.id));
      return result;
    });
  }

  async submitQuiz(p: Principal, enrollmentId: string, itemId: string, answers: Record<string, BlockResponse>): Promise<QuizAttempt> {
    const { enrollment, content, item } = await this.locate(p, enrollmentId, itemId);
    if (item.authoring.type !== 'quiz') throw badRequest('not_a_quiz', 'This item is not a quiz.');
    const quiz = item.authoring;
    return this.db.tenant(learnerCtx(p), async (tx) => {
      await this.ensureProgress(tx, p, enrollment, item);
      const [{ n } = { n: 0 }] = await tx
        .select({ n: sql<number>`count(*)::int` })
        .from(submissions)
        .where(and(eq(submissions.courseEnrollmentId, enrollment.id), eq(submissions.contentItemId, item.id), eq(submissions.kind, 'quiz')));
      const max = quiz.payload.maxAttempts;
      if (max !== null && n >= max) throw conflict('no_attempts_left', 'You have used every attempt for this quiz.');
      const graded = gradeQuiz(quiz, answers, max === null ? null : max - (n + 1));
      const submissionId = newId();
      const [row] = await tx
        .insert(submissions)
        .values({
          id: submissionId,
          courseEnrollmentId: enrollment.id,
          userId: p.userId,
          courseId: enrollment.courseId,
          contentItemId: item.id,
          itemKey: item.key,
          contextOrgId: enrollment.contextOrgId,
          kind: 'quiz',
          attemptNo: n + 1,
          responses: { answers, result: graded },
        })
        .returning();
      // Graded automatically, so released at once. Assignments wait for a human.
      await tx.insert(grades).values({ id: newId(), submissionId, userId: p.userId, score: graded.scorePct, releasedAt: new Date() });
      if (graded.passed) await this.complete(tx, p, enrollment, content, item);
      return this.toAttempt(row!);
    });
  }

  async submitAssignment(p: Principal, enrollmentId: string, itemId: string, body: { text: string; link: string | null; selfAssessment: Record<string, boolean> }): Promise<AssignmentSubmission> {
    const { enrollment, content, item } = await this.locate(p, enrollmentId, itemId);
    if (item.authoring.type !== 'assignment') throw badRequest('not_an_assignment', 'This item is not an assignment.');
    const minWords = item.authoring.payload.minWords;
    if (wordCount(body.text) < minWords) throw badRequest('submission_too_short', `Write at least ${minWords} words.`);
    const criteria = new Set(item.authoring.payload.rubric.map((r) => r.id));
    const selfAssessment = Object.fromEntries(Object.entries(body.selfAssessment).filter(([k]) => criteria.has(k)));
    return this.db.tenant(learnerCtx(p), async (tx) => {
      await this.ensureProgress(tx, p, enrollment, item);
      const [{ n } = { n: 0 }] = await tx
        .select({ n: sql<number>`count(*)::int` })
        .from(submissions)
        .where(and(eq(submissions.courseEnrollmentId, enrollment.id), eq(submissions.contentItemId, item.id), eq(submissions.kind, 'assignment')));
      const [row] = await tx
        .insert(submissions)
        .values({
          id: newId(),
          courseEnrollmentId: enrollment.id,
          userId: p.userId,
          courseId: enrollment.courseId,
          contentItemId: item.id,
          itemKey: item.key,
          contextOrgId: enrollment.contextOrgId,
          kind: 'assignment',
          attemptNo: n + 1,
          responses: { link: body.link, selfAssessment },
          body: body.text,
        })
        .returning();
      await this.outbox.add(tx, {
        type: LearningEvents.SubmissionCreated,
        orgId: enrollment.contextOrgId,
        actor: userActor(p.userId),
        payload: { submissionId: row!.id, enrollmentId: enrollment.id, courseId: enrollment.courseId, itemId: item.id, version: n + 1 },
      });
      await this.complete(tx, p, enrollment, content, item);
      return this.toSubmission(row!);
    });
  }

  async postDiscussion(p: Principal, enrollmentId: string, itemId: string, body: { body: string; parentId: string | null }): Promise<Discussion> {
    const { enrollment, content, item } = await this.locate(p, enrollmentId, itemId);
    if (item.authoring.type !== 'discussion') throw badRequest('not_a_discussion', 'This item is not a discussion.');
    const minWords = item.authoring.payload.minWords;
    await this.db.tenant(learnerCtx(p), async (tx) => {
      await this.ensureProgress(tx, p, enrollment, item);
      if (body.parentId) {
        const [parent] = await this.db.sys
          .select({ id: submissions.id })
          .from(submissions)
          .where(and(eq(submissions.id, body.parentId), eq(submissions.courseId, enrollment.courseId), eq(submissions.itemKey, item.key), eq(submissions.kind, 'discussion'), isNull(submissions.parentId)));
        if (!parent) throw notFound('post_not_found', 'That post no longer exists.');
      } else if (wordCount(body.body) < minWords) {
        throw badRequest('post_too_short', `Write at least ${minWords} words so others have something to respond to.`);
      }
      await tx.insert(submissions).values({
        id: newId(),
        courseEnrollmentId: enrollment.id,
        userId: p.userId,
        courseId: enrollment.courseId,
        contentItemId: item.id,
        itemKey: item.key,
        contextOrgId: enrollment.contextOrgId,
        kind: 'discussion',
        body: body.body,
        parentId: body.parentId,
      });
      if (!body.parentId) await this.complete(tx, p, enrollment, content, item);
    });
    return this.discussion(p, enrollment, item);
  }

  /**
   * Posts from learners on the same course item in the same context (an organisation's learners
   * see each other; personal learners see other personal learners). Visible after posting.
   */
  private async discussion(p: Principal, enrollment: EnrollmentRow, item: ContentItemRef): Promise<Discussion> {
    const rows = await this.db.sys
      .select()
      .from(submissions)
      .where(
        and(
          eq(submissions.courseId, enrollment.courseId),
          eq(submissions.itemKey, item.key),
          eq(submissions.kind, 'discussion'),
          enrollment.contextOrgId ? eq(submissions.contextOrgId, enrollment.contextOrgId) : isNull(submissions.contextOrgId),
        ),
      )
      .orderBy(asc(submissions.submittedAt))
      .limit(500);
    const posts = rows.filter((r) => !r.parentId);
    const hasPosted = posts.some((r) => r.userId === p.userId);
    if (!hasPosted) return { hasPosted, postCount: posts.length, posts: [] };
    const names = new Map(
      (await this.iam.send<UserName[]>(IamRpc.UserNames, { userIds: [...new Set(rows.map((r) => r.userId))] }).catch(() => [] as UserName[])).map((u) => [u.id, u.name]),
    );
    const author = (userId: string) => {
      const name = userId === p.userId ? 'You' : (names.get(userId) ?? 'A learner');
      return { name, initials: initials(userId === p.userId ? (names.get(userId) ?? name) : name), isMe: userId === p.userId };
    };
    return {
      hasPosted,
      postCount: posts.length,
      posts: posts
        .reverse()
        .map((r) => ({
          id: r.id,
          author: author(r.userId),
          body: r.body ?? '',
          createdAt: r.submittedAt.toISOString(),
          replies: rows
            .filter((x) => x.parentId === r.id)
            .map((x) => ({ id: x.id, author: author(x.userId), body: x.body ?? '', createdAt: x.submittedAt.toISOString() })),
        })),
    };
  }

  /**
   * How every learner answered a poll or scale: each learner's latest answer counts once. Read on
   * the system pool, which cannot see this learner's uncommitted answer, so theirs is added here.
   */
  private async distribution(
    userId: string,
    courseId: string,
    itemKey: string,
    blockId: string,
    response: Extract<BlockResponse, { type: 'poll' | 'scale' }>,
  ): Promise<Record<string, number>> {
    const field = response.type === 'poll' ? sql`responses->'response'->>'optionId'` : sql`responses->'response'->>'value'`;
    const result = await this.db.sys.execute<{ answer: string; n: number }>(sql`
      select answer, count(*)::int as n from (
        select distinct on (user_id) ${field} as answer
        from ${submissions}
        where course_id = ${courseId} and item_key = ${itemKey} and block_id = ${blockId} and kind = 'check' and user_id <> ${userId}
        order by user_id, submitted_at desc
      ) latest where answer is not null group by answer`);
    const counts: Record<string, number> = Object.fromEntries(result.rows.map((r) => [r.answer, Number(r.n)]));
    const mine = response.type === 'poll' ? response.optionId : String(response.value);
    counts[mine] = (counts[mine] ?? 0) + 1;
    return counts;
  }

  /** Mark an item done and roll the enrolment forward; finishing every required item completes the course. */
  private async complete(tx: LearningTx, p: Principal, enrollment: EnrollmentRow, content: CourseContent, item: ContentItemRef) {
    const updated = await tx
      .update(itemProgress)
      .set({ status: 'completed', progressPct: 100, completedAt: new Date(), rowVersion: sql`${itemProgress.rowVersion} + 1` })
      .where(and(eq(itemProgress.courseEnrollmentId, enrollment.id), eq(itemProgress.contentItemId, item.id), sql`${itemProgress.status} <> 'completed'`))
      .returning({ id: itemProgress.id });
    const required = flatItems(content).filter((i) => i.required);
    const done = await tx
      .select({ item: itemProgress.contentItemId })
      .from(itemProgress)
      .where(and(eq(itemProgress.courseEnrollmentId, enrollment.id), eq(itemProgress.status, 'completed')));
    const doneIds = new Set(done.map((d) => d.item));
    const completedItems = required.filter((i) => doneIds.has(i.id)).length;
    const finished = completedItems === required.length && enrollment.status !== 'completed';
    const patch: Partial<typeof courseEnrollments.$inferInsert> = {
      completedItems,
      progressPct: required.length ? Math.round((completedItems / required.length) * 100) : 100,
      lastActiveAt: new Date(),
    };
    if (finished) {
      patch.status = 'completed';
      patch.completedAt = new Date();
      patch.finalScore = await this.finalScore(tx, enrollment, content);
      patch.passed = true;
    }
    const [fresh] = await tx.update(courseEnrollments).set(patch).where(eq(courseEnrollments.id, enrollment.id)).returning();
    if (updated.length > 0) {
      await this.outbox.add(tx, {
        type: LearningEvents.ItemCompleted,
        orgId: enrollment.contextOrgId,
        actor: userActor(p.userId),
        payload: { enrollmentId: enrollment.id, courseId: enrollment.courseId, itemId: item.id, itemKey: item.key },
      });
    }
    if (finished) {
      await this.outbox.add(tx, {
        type: LearningEvents.CourseCompleted,
        orgId: enrollment.contextOrgId,
        actor: userActor(p.userId),
        payload: { enrollmentId: enrollment.id, userId: p.userId, courseId: enrollment.courseId, versionId: enrollment.courseVersionId, finalScore: patch.finalScore },
      });
    }
    return { status: 'completed' as const, enrollment: toEnrollment(fresh!), courseCompleted: finished };
  }

  /** Weighted best quiz scores (assignments count once a human releases their grade). */
  private async finalScore(tx: LearningTx, enrollment: EnrollmentRow, content: CourseContent): Promise<number | null> {
    const weighted = flatItems(content).filter((i) => i.type === 'quiz' && i.gradeWeight > 0);
    if (weighted.length === 0) return null;
    const best = await tx
      .select({ item: submissions.contentItemId, score: sql<number>`max(${grades.score})::float` })
      .from(grades)
      .innerJoin(submissions, eq(submissions.id, grades.submissionId))
      .where(and(eq(submissions.courseEnrollmentId, enrollment.id), eq(submissions.kind, 'quiz')))
      .groupBy(submissions.contentItemId);
    const total = weighted.reduce((n, i) => n + i.gradeWeight, 0);
    const score = weighted.reduce((n, i) => n + (best.find((b) => b.item === i.id)?.score ?? 0) * i.gradeWeight, 0) / total;
    return Math.round(score * 10) / 10;
  }

  private async locate(p: Principal, enrollmentId: string, itemId: string): Promise<Located> {
    const [enrollment] = await this.db.tenant(learnerCtx(p), (tx) => tx.select().from(courseEnrollments).where(eq(courseEnrollments.id, enrollmentId)));
    if (!enrollment) throw notFound('enrollment_not_found', 'Enrolment not found');
    const content = await this.catalog.version(enrollment.courseVersionId);
    if (!content) throw notFound('course_not_found', 'This course is no longer available');
    const item = flatItems(content).find((i) => i.id === itemId);
    if (!item) throw notFound('item_not_found', 'Item not found in this course');
    return { enrollment, content, item };
  }

  private async ensureProgress(tx: LearningTx, p: Principal, enrollment: EnrollmentRow, item: ContentItemRef): Promise<ProgressRow> {
    await tx
      .insert(itemProgress)
      .values({ id: newId(), courseEnrollmentId: enrollment.id, userId: p.userId, contentItemId: item.id, itemKey: item.key, status: 'in_progress', state: EMPTY_STATE })
      .onConflictDoNothing();
    const [row] = await tx
      .select()
      .from(itemProgress)
      .where(and(eq(itemProgress.courseEnrollmentId, enrollment.id), eq(itemProgress.contentItemId, item.id)));
    return { ...row!, state: { ...EMPTY_STATE, ...row!.state } };
  }

  private toAttempt(s: typeof submissions.$inferSelect): QuizAttempt {
    const r = (s.responses as { result: { scorePct: number; passed: boolean; results: BlockResult[] } }).result;
    return { attemptNo: s.attemptNo, scorePct: r.scorePct, passed: r.passed, results: r.results, submittedAt: s.submittedAt.toISOString() };
  }

  private toSubmission(s: typeof submissions.$inferSelect): AssignmentSubmission {
    const r = s.responses as { link?: string | null; selfAssessment?: Record<string, boolean> };
    return { id: s.id, version: s.attemptNo, text: s.body ?? '', link: r.link ?? null, selfAssessment: r.selfAssessment ?? {}, submittedAt: s.submittedAt.toISOString() };
  }
}
