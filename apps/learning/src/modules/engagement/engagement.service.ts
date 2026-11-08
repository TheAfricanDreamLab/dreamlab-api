import { Inject, Injectable } from '@nestjs/common';
import {
  type CatchUpItem,
  type CertificateStep,
  type CircleProgress,
  type CohortEngagement,
  type CompletionFunnel,
  FUNNEL_STAGE_LABELS,
  FUNNEL_STAGES,
  type GoalScope,
  type LearningGoal,
  type Onboarding,
  type OnTrack,
  type ProgramOnTrack,
  type RiskLevel,
  type SaveLearningGoal,
} from '@dreamlab/contracts';
import type { Principal } from '@lib/auth';
import { forbidden, newId, notFound } from '@lib/common';
import { InjectDatabase } from '@lib/database';
import { InjectOutbox, OutboxWriter, requestNotification, userActor } from '@lib/messaging';
import { CatalogClient, type CourseContent, IamRpc, RpcClient, UserName } from '@lib/rpc';
import { and, asc, eq, gte, inArray, isNull, ne, sql } from 'drizzle-orm';
import { LearningDatabase, schema } from '../../database';
import { todayIn, zonedTime } from '../cohorts/calendar-time';
import { CohortRow, CohortsService, learnerCounts, toCohort } from '../cohorts/cohorts.service';
import { CircleSpaceService } from '../community/circle-space.service';
import { CATALOG, EnrollmentRow, flatItems } from '../enrollments/enrollments.service';
import { GraduationService } from '../outcomes/graduation.service';
import { requirementEvidence } from '../outcomes/evidence';
import { ProgressService } from '../outcomes/progress.service';
import { IAM_NAMES } from '../player/player.service';
import {
  catchUpList,
  type CourseItems,
  DAY_MS,
  dropOff,
  expectedPct,
  funnelCounts,
  type FunnelUnit,
  lastMondays,
  paceOf,
  RISK_ORDER,
  riskOf,
  thisMonday,
  weeksOfRun,
  weighted,
  wholeDays,
} from './on-track';

const {
  cohorts,
  calendarWeeks,
  courseRuns,
  courseEnrollments,
  itemProgress,
  submissions,
  programEnrollments,
  attendance,
  classSessions,
  dreamCircles,
  circleMembers,
  circlePosts,
  graduationConfirmations,
  learningGoals,
  progressReminders,
  circleProgressSharing,
} = schema;
type ProgramEnrollmentRow = typeof programEnrollments.$inferSelect;
type RunRow = typeof courseRuns.$inferSelect;
type WeekRow = typeof calendarWeeks.$inferSelect;
type GoalRow = typeof learningGoals.$inferSelect;

/** Standalone learners are reminded in the daytime of the platform's home time zone. */
export const DEFAULT_TIME_ZONE = 'Africa/Lagos';
/** Weeks the funnel's weekly activity goes back. */
const FUNNEL_WEEKS = 26;
/** Graduation requirements already shown as course and residency steps on the way to the certificate. */
const COVERED_REQUIREMENTS = new Set(['credits_earned', 'life_architecture_blueprint', 'builders_outputs', 'residency_completion', 'final_demonstration']);

export function toGoal(r: GoalRow): LearningGoal {
  return {
    id: r.id,
    scope: r.scope,
    enrollmentId: r.enrollmentId,
    why: r.why,
    success: r.success,
    studyDays: r.studyDays,
    studyTime: r.studyTime,
    minutesPerWeek: r.minutesPerWeek,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
  };
}

/** A cohort's courses and dated calendar: what expected progress is measured against. */
export interface CohortFrame {
  cohort: CohortRow;
  runs: RunRow[];
  weeks: WeekRow[];
  today: string;
}

/** What item progress says about one course enrolment. */
export interface Activity {
  items: number;
  first: Date | null;
}

/** One course of a learner's programme, or their standalone course. */
export interface CourseLine {
  run: RunRow | null;
  e: EnrollmentRow | null;
  progressPct: number;
  expectedPct: number | null;
  started: boolean;
  completed: boolean;
  lastActivity: Date | null;
  firstActivity: Date | null;
}

export interface ProgrammeState {
  lines: CourseLine[];
  progressPct: number;
  expectedPct: number | null;
  started: boolean;
  completed: boolean;
  lastActivity: Date | null;
  firstActivity: Date | null;
}

const latest = (dates: (Date | null)[]) => dates.reduce<Date | null>((a, d) => (d && (!a || d > a) ? d : a), null);
const earliest = (dates: (Date | null)[]) => dates.reduce<Date | null>((a, d) => (d && (!a || d < a) ? d : a), null);

/**
 * Staying on track (LRN-9): goals and study plans, pace and the catch-up list, the way to the
 * certificate, and for cohort staff who is at risk, check-ins, the completion funnel and opt-in circle
 * progress. Learners' own records are read as them; staff views span learners, so they are read as the
 * system role once the caller has been checked against the cohort.
 */
@Injectable()
export class EngagementService {
  constructor(
    @InjectDatabase() private readonly db: LearningDatabase,
    @InjectOutbox() private readonly outbox: OutboxWriter,
    @Inject(CATALOG) private readonly catalog: CatalogClient,
    @Inject(IAM_NAMES) private readonly iam: RpcClient,
    private readonly cohortsService: CohortsService,
    private readonly circles: CircleSpaceService,
    private readonly progress: ProgressService,
    private readonly graduation: GraduationService,
  ) {}

  // ---------- goals ----------

  async getGoal(p: Principal, scope: GoalScope, enrollmentId: string): Promise<{ goal: LearningGoal | null }> {
    await this.ownEnrollment(p, scope, enrollmentId);
    const goal = await this.goalFor(p.userId, scope, enrollmentId);
    return { goal: goal ? toGoal(goal) : null };
  }

  async saveGoal(p: Principal, scope: GoalScope, enrollmentId: string, input: SaveLearningGoal): Promise<LearningGoal> {
    await this.ownEnrollment(p, scope, enrollmentId);
    const values = {
      why: input.why,
      success: input.success?.trim() || null,
      studyDays: input.studyDays,
      studyTime: input.studyTime ?? null,
      minutesPerWeek: input.minutesPerWeek,
    };
    const [row] = await this.db.tenant({ orgId: '', userId: p.userId }, (tx) =>
      tx
        .insert(learningGoals)
        .values({ id: newId(), userId: p.userId, scope, enrollmentId, ...values })
        .onConflictDoUpdate({ target: [learningGoals.userId, learningGoals.scope, learningGoals.enrollmentId], set: { ...values, updatedAt: new Date() } })
        .returning(),
    );
    return toGoal(row!);
  }

  private async ownEnrollment(p: Principal, scope: GoalScope, enrollmentId: string): Promise<void> {
    const table = scope === 'program' ? programEnrollments : courseEnrollments;
    const [row] = await this.db.tenant({ orgId: '', userId: p.userId }, (tx) =>
      tx.select({ id: table.id }).from(table).where(and(eq(table.id, enrollmentId), eq(table.userId, p.userId))),
    );
    if (!row) throw notFound('enrollment_not_found', 'Enrolment not found');
  }

  async goalFor(userId: string, scope: GoalScope, enrollmentId: string): Promise<GoalRow | null> {
    const [row] = await this.db.sys
      .select()
      .from(learningGoals)
      .where(and(eq(learningGoals.userId, userId), eq(learningGoals.scope, scope), eq(learningGoals.enrollmentId, enrollmentId)));
    return row ?? null;
  }

  // ---------- pace and catch-up ----------

  async courseOnTrack(p: Principal, enrollmentId: string, now = new Date()): Promise<OnTrack> {
    const [e] = await this.db.tenant({ orgId: '', userId: p.userId }, (tx) =>
      tx.select().from(courseEnrollments).where(and(eq(courseEnrollments.id, enrollmentId), eq(courseEnrollments.userId, p.userId))),
    );
    if (!e) throw notFound('enrollment_not_found', 'Enrolment not found');
    const snapshot = await this.courseSnapshot(e, now);
    const pe = e.programEnrollmentId ? (await this.db.sys.select().from(programEnrollments).where(eq(programEnrollments.id, e.programEnrollmentId)))[0] : undefined;
    // In a programme the goal is the programme's; a goal set on the course itself comes first.
    const goal = (await this.goalFor(p.userId, 'course', e.id)) ?? (pe ? await this.goalFor(p.userId, 'program', pe.id) : null);
    const line = snapshot.line;
    const daysQuiet = wholeDays(line.lastActivity ?? e.enrolledAt, now);
    const pace = paceOf({ ...line, daysQuiet });
    const done = await this.completedItems([e.id]);
    return {
      pace,
      progressPct: line.progressPct,
      expectedPct: line.expectedPct,
      daysQuiet,
      catchUp: pace === 'on_track' || pace === 'completed' ? [] : snapshot.next,
      onboarding: this.onboarding(goal, (done.get(e.id)?.size ?? 0) > 0, pe ? await this.introducedInCircle(pe.userId, pe.cohortId) : null),
      goal: goal ? toGoal(goal) : null,
    };
  }

  async programOnTrack(p: Principal, enrollmentId: string, now = new Date()): Promise<ProgramOnTrack> {
    const [pe] = await this.db.tenant({ orgId: '', userId: p.userId }, (tx) =>
      tx.select().from(programEnrollments).where(and(eq(programEnrollments.id, enrollmentId), eq(programEnrollments.userId, p.userId))),
    );
    if (!pe) throw notFound('program_enrollment_not_found', 'Programme enrolment not found');
    const [cohort] = await this.db.sys.select().from(cohorts).where(eq(cohorts.id, pe.cohortId));
    if (!cohort) throw notFound('cohort_not_found', 'Cohort not found');
    const { state, next, frame } = await this.programmeSnapshot(pe, cohort, now);
    const goal = await this.goalFor(p.userId, 'program', pe.id);
    const daysQuiet = wholeDays(state.lastActivity ?? pe.enrolledAt, now);
    const pace = paceOf({ ...state, daysQuiet });
    const thisWeek = frame.weeks.find((w) => w.startsOn <= frame.today && w.endsOn >= frame.today);
    const steps = await this.certificateSteps(pe, cohort, state);
    return {
      pace,
      progressPct: state.progressPct,
      expectedPct: state.expectedPct,
      daysQuiet,
      catchUp: pace === 'on_track' || pace === 'completed' ? [] : next,
      onboarding: this.onboarding(goal, state.lines.some((l) => l.e && l.e.completedItems > 0), await this.introducedInCircle(pe.userId, pe.cohortId)),
      goal: goal ? toGoal(goal) : null,
      catchUpWeek: thisWeek?.kind === 'catch_up',
      certificate: { steps, done: steps.filter((s) => s.done).length, total: steps.length },
    };
  }

  private onboarding(goal: GoalRow | null, firstItemDone: boolean, introducedInCircle: boolean | null): Onboarding {
    return { goalSet: !!goal, firstItemDone, introducedInCircle, done: !!goal && firstItemDone && introducedInCircle !== false };
  }

  /** Whether they have posted in their Dream Circle in the cohort; null when they have none. */
  private async introducedInCircle(userId: string, cohortId: string): Promise<boolean | null> {
    const mine = await this.db.sys
      .select({ id: dreamCircles.id })
      .from(circleMembers)
      .innerJoin(dreamCircles, eq(dreamCircles.id, circleMembers.circleId))
      .where(and(eq(circleMembers.userId, userId), eq(dreamCircles.cohortId, cohortId)));
    if (mine.length === 0) return null;
    const [post] = await this.db.sys
      .select({ id: circlePosts.id })
      .from(circlePosts)
      .where(and(inArray(circlePosts.circleId, mine.map((c) => c.id)), eq(circlePosts.authorUserId, userId), isNull(circlePosts.deletedAt)))
      .limit(1);
    return !!post;
  }

  /** A course enrolment's pace inputs and next items (within its programme's calendar when it has one). */
  async courseSnapshot(e: EnrollmentRow, now: Date): Promise<{ line: CourseLine; next: CatchUpItem[]; content: CourseContent | null }> {
    const [activity, done, content] = await Promise.all([this.activity([e.id]), this.completedItems([e.id]), this.catalog.version(e.courseVersionId)]);
    let frame: CohortFrame | null = null;
    let run: RunRow | null = null;
    if (e.courseRunId) {
      const [r] = await this.db.sys.select().from(courseRuns).where(eq(courseRuns.id, e.courseRunId));
      const [cohort] = r ? await this.db.sys.select().from(cohorts).where(eq(cohorts.id, r.cohortId)) : [];
      if (r && cohort) {
        run = r;
        frame = await this.frame(cohort, now);
      }
    }
    const line = this.line(frame, run, e, activity);
    const next = content ? catchUpList([this.courseItems(e, content, done.get(e.id) ?? new Set())]) : [];
    return { line, next, content };
  }

  /** A programme enrolment's pace inputs (credit-weighted over its courses) and next items. */
  async programmeSnapshot(pe: ProgramEnrollmentRow, cohort: CohortRow, now: Date): Promise<{ state: ProgrammeState; next: CatchUpItem[]; frame: CohortFrame }> {
    const frame = await this.frame(cohort, now);
    const enrolments = await this.db.sys.select().from(courseEnrollments).where(eq(courseEnrollments.programEnrollmentId, pe.id));
    const ids = enrolments.map((e) => e.id);
    const [activity, done] = await Promise.all([this.activity(ids), this.completedItems(ids)]);
    const state = this.programmeState(pe, frame, enrolments, activity);
    // Courses whose phase has begun come first; before any has, the first ones.
    const open = state.lines.filter((l) => l.e && !l.completed);
    const begun = open.filter((l) => !l.run || l.run.startsOn <= frame.today);
    const courses: CourseItems[] = [];
    for (const l of begun.length > 0 ? begun : open) {
      const content = await this.catalog.version(l.e!.courseVersionId);
      if (content) courses.push(this.courseItems(l.e!, content, done.get(l.e!.id) ?? new Set()));
    }
    return { state, next: catchUpList(courses), frame };
  }

  private courseItems(e: EnrollmentRow, content: CourseContent, done: ReadonlySet<string>): CourseItems {
    return {
      enrollmentId: e.id,
      courseSlug: content.course.slug,
      courseTitle: content.course.title,
      items: flatItems(content).map((i) => ({ id: i.id, title: i.title, type: i.type, moduleTitle: i.module.title, minutes: i.minutes ?? null, required: i.required })),
      done,
    };
  }

  async frame(cohort: CohortRow, now: Date): Promise<CohortFrame> {
    const [runs, weeks] = await Promise.all([
      this.db.sys.select().from(courseRuns).where(eq(courseRuns.cohortId, cohort.id)).orderBy(asc(courseRuns.startsOn)),
      this.db.sys.select().from(calendarWeeks).where(eq(calendarWeeks.cohortId, cohort.id)).orderBy(asc(calendarWeeks.weekNo)),
    ]);
    return { cohort, runs, weeks, today: todayIn(cohort.timeZone, now) };
  }

  private line(frame: CohortFrame | null, run: RunRow | null, e: EnrollmentRow | null, activity: Map<string, Activity>): CourseLine {
    const a = e ? activity.get(e.id) : undefined;
    const started = (a?.items ?? 0) > 0;
    return {
      run,
      e,
      progressPct: e?.progressPct ?? 0,
      expectedPct: frame && run ? expectedPct(weeksOfRun(frame.weeks, run), frame.today) : null,
      started,
      completed: e?.status === 'completed',
      lastActivity: started ? e!.lastActiveAt : null,
      firstActivity: a?.first ?? null,
    };
  }

  /** The programme's required courses and the electives taken, weighted by credit hours. */
  programmeState(pe: ProgramEnrollmentRow, frame: CohortFrame, enrolments: EnrollmentRow[], activity: Map<string, Activity>): ProgrammeState {
    const byCourse = new Map(enrolments.map((e) => [e.courseId, e]));
    const lines = frame.runs.filter((r) => r.required || byCourse.has(r.courseId)).map((r) => this.line(frame, r, byCourse.get(r.courseId) ?? null, activity));
    const parts = (pick: (l: CourseLine) => number | null) => lines.map((l) => ({ value: pick(l), weight: l.run?.creditHours ?? 1 }));
    return {
      lines,
      progressPct: weighted(parts((l) => l.progressPct)) ?? 0,
      expectedPct: weighted(parts((l) => l.expectedPct)),
      started: lines.some((l) => l.started),
      completed: pe.status === 'completed' || pe.status === 'graduated' || (lines.length > 0 && lines.every((l) => l.completed)),
      lastActivity: latest(lines.map((l) => l.lastActivity)),
      firstActivity: earliest(lines.map((l) => l.firstActivity)),
    };
  }

  /** Items opened and when the first was, per course enrolment. */
  async activity(enrollmentIds: string[]): Promise<Map<string, Activity>> {
    if (enrollmentIds.length === 0) return new Map();
    const rows = await this.db.sys
      .select({ e: itemProgress.courseEnrollmentId, n: sql<number>`count(*)::int`, first: sql<string | null>`min(${itemProgress.createdAt})` })
      .from(itemProgress)
      .where(inArray(itemProgress.courseEnrollmentId, enrollmentIds))
      .groupBy(itemProgress.courseEnrollmentId);
    return new Map(rows.map((r) => [r.e, { items: r.n, first: r.first ? new Date(r.first) : null }]));
  }

  private async completedItems(enrollmentIds: string[]): Promise<Map<string, Set<string>>> {
    const out = new Map<string, Set<string>>();
    if (enrollmentIds.length === 0) return out;
    const rows = await this.db.sys
      .select({ e: itemProgress.courseEnrollmentId, item: itemProgress.contentItemId })
      .from(itemProgress)
      .where(and(inArray(itemProgress.courseEnrollmentId, enrollmentIds), eq(itemProgress.status, 'completed')));
    for (const r of rows) out.set(r.e, (out.get(r.e) ?? new Set()).add(r.item));
    return out;
  }

  // ---------- the way to the certificate ----------

  /**
   * Each course to complete with its practical output (the course's final assignment), each residency
   * stage, then the graduation requirements those don't already cover.
   */
  private async certificateSteps(pe: ProgramEnrollmentRow, cohort: CohortRow, state: ProgrammeState): Promise<CertificateStep[]> {
    const program = await this.catalog.program(cohort.programSlug).catch(() => null);
    const steps: CertificateStep[] = [];
    const outputs: Array<{ e: EnrollmentRow; itemId: string }> = [];
    const courseSteps: Array<{ course: CertificateStep; output: (CertificateStep & { itemId: string; enrollmentId: string }) | null }> = [];
    const summaries = await this.catalog.courseSummaries(state.lines.map((l) => l.run!.courseId)).catch(() => new Map<string, { title: string }>());
    for (const l of state.lines) {
      const title = summaries.get(l.run!.courseId)?.title ?? l.run!.courseSlug;
      const course: CertificateStep = { key: `course:${l.run!.courseSlug}`, label: `Complete ${title}`, done: l.completed, href: l.e ? `/learn/${l.e.id}` : null };
      let output: (typeof courseSteps)[number]['output'] = null;
      const content = l.e ? await this.catalog.version(l.e.courseVersionId) : null;
      const final = content ? flatItems(content).filter((i) => i.type === 'assignment').at(-1) : undefined;
      if (l.e && final) {
        outputs.push({ e: l.e, itemId: final.id });
        output = { key: `output:${l.run!.courseSlug}`, label: `Submit the practical output for ${title}: ${final.title}`, done: false, href: `/learn/${l.e.id}/${final.id}`, itemId: final.id, enrollmentId: l.e.id };
      }
      courseSteps.push({ course, output });
    }
    const submitted = outputs.length
      ? await this.db.sys
          .selectDistinct({ e: submissions.courseEnrollmentId, item: submissions.contentItemId })
          .from(submissions)
          .where(and(inArray(submissions.courseEnrollmentId, outputs.map((o) => o.e.id)), inArray(submissions.contentItemId, outputs.map((o) => o.itemId)), eq(submissions.kind, 'assignment')))
      : [];
    const sent = new Set(submitted.map((s) => `${s.e}:${s.item}`));
    for (const { course, output } of courseSteps) {
      steps.push(course);
      if (output) {
        const { itemId, enrollmentId, ...step } = output;
        steps.push({ ...step, done: sent.has(`${enrollmentId}:${itemId}`) });
      }
    }
    if (!program) return steps;

    const ctx = { pe, cohort, program };
    const progress = await this.progress.load(ctx);
    for (const s of [...program.capstoneStages].sort((a, b) => a.position - b.position)) {
      steps.push({
        key: `stage:${s.position}`,
        label: `Residency stage ${s.position}: ${s.name}`,
        done: progress.stages.get(s.position)?.status === 'approved',
        href: `/app/programme/${pe.id}/residency`,
      });
    }
    const facts = await this.graduation.facts(ctx, progress);
    const confirmed = new Set(
      (await this.db.sys.select({ key: graduationConfirmations.requirementKey }).from(graduationConfirmations).where(eq(graduationConfirmations.programEnrollmentId, pe.id))).map((c) => c.key),
    );
    // An elective is covered by its course steps once one is taken; until then it is a step of its own.
    const tookElective = state.lines.some((l) => l.run && !l.run.required);
    for (const r of [...program.graduationRequirements].sort((a, b) => a.position - b.position)) {
      if (COVERED_REQUIREMENTS.has(r.key) || (r.key === 'approved_elective' && tookElective)) continue;
      steps.push({ key: `requirement:${r.key}`, label: r.label, done: confirmed.has(r.key) || requirementEvidence(r.key, facts).met, href: requirementHref(pe.id, r.key) });
    }
    return steps;
  }

  // ---------- cohort staff ----------

  /** The cohort, for its managers and teachers; anyone outside its host organisation gets not found. */
  private async supportedCohort(p: Principal, cohortId: string): Promise<CohortRow> {
    const [cohort] = await this.db.sys.select().from(cohorts).where(eq(cohorts.id, cohortId));
    if (!cohort || (cohort.hostOrgId !== p.orgId && !p.platformAdmin)) throw notFound('cohort_not_found', 'Cohort not found');
    if (!(await this.cohortsService.isCohortManagerOrTeacher(p, cohort))) {
      throw forbidden('permission_denied', 'Only the cohort’s managers and teachers can see how its learners are doing.');
    }
    return cohort;
  }

  async cohortEngagement(p: Principal, cohortId: string, risk?: RiskLevel, now = new Date()): Promise<CohortEngagement> {
    const cohort = await this.supportedCohort(p, cohortId);
    const learners = await this.db.sys
      .select()
      .from(programEnrollments)
      .where(and(eq(programEnrollments.cohortId, cohort.id), ne(programEnrollments.status, 'withdrawn')))
      .orderBy(asc(programEnrollments.enrolledAt));
    const ids = learners.map((l) => l.id);
    const [frame, enrolments, held, attended, goals, reminders, names, counts] = await Promise.all([
      this.frame(cohort, now),
      ids.length ? this.db.sys.select().from(courseEnrollments).where(inArray(courseEnrollments.programEnrollmentId, ids)) : [],
      this.db.sys
        .select({ n: sql<number>`count(*)::int` })
        .from(classSessions)
        .where(and(eq(classSessions.cohortId, cohort.id), eq(classSessions.cancelled, false), sql`${classSessions.startsAt} < ${now}`)),
      ids.length
        ? this.db.sys
            .select({ e: attendance.programEnrollmentId, n: sql<number>`count(*)::int` })
            .from(attendance)
            .where(and(inArray(attendance.programEnrollmentId, ids), inArray(attendance.status, ['present', 'late'])))
            .groupBy(attendance.programEnrollmentId)
        : [],
      ids.length ? this.db.sys.select({ e: learningGoals.enrollmentId }).from(learningGoals).where(and(eq(learningGoals.scope, 'program'), inArray(learningGoals.enrollmentId, ids))) : [],
      ids.length
        ? this.db.sys
            .select({ e: progressReminders.enrollmentId, checkIn: sql<boolean>`${progressReminders.kind} = 'check_in'`, at: sql<string>`max(${progressReminders.sentAt})` })
            .from(progressReminders)
            .where(and(eq(progressReminders.scope, 'program'), inArray(progressReminders.enrollmentId, ids)))
            .groupBy(progressReminders.enrollmentId, sql`${progressReminders.kind} = 'check_in'`)
        : [],
      this.names(learners.map((l) => l.userId)),
      learnerCounts(this.db, [cohort.id]),
    ]);
    const activity = await this.activity(enrolments.map((e) => e.id));
    const heldCount = held[0]?.n ?? 0;
    const attendedBy = new Map(attended.map((a) => [a.e, a.n]));
    const withGoal = new Set(goals.map((g) => g.e));
    const lastSent = (e: string, checkIn: boolean) => reminders.find((r) => r.e === e && r.checkIn === checkIn)?.at ?? null;

    const rows = learners.map((pe) => {
      const state = this.programmeState(
        pe,
        frame,
        enrolments.filter((e) => e.programEnrollmentId === pe.id),
        activity,
      );
      const daysQuiet = wholeDays(state.lastActivity ?? pe.enrolledAt, now);
      const input = { ...state, daysQuiet };
      const reminderAt = lastSent(pe.id, false);
      const checkInAt = lastSent(pe.id, true);
      return {
        userId: pe.userId,
        name: names.get(pe.userId) ?? 'Learner',
        programEnrollmentId: pe.id,
        enrolledAt: pe.enrolledAt.toISOString(),
        progressPct: state.progressPct,
        expectedPct: state.expectedPct,
        pace: paceOf(input),
        risk: riskOf(input),
        daysQuiet,
        lastActiveAt: state.lastActivity?.toISOString() ?? null,
        attendancePct: heldCount > 0 ? Math.round(((attendedBy.get(pe.id) ?? 0) / heldCount) * 100) : null,
        goalSet: withGoal.has(pe.id),
        lastReminderAt: reminderAt ? new Date(reminderAt).toISOString() : null,
        lastCheckInAt: checkInAt ? new Date(checkInAt).toISOString() : null,
      };
    });
    rows.sort((a, b) => RISK_ORDER[a.risk] - RISK_ORDER[b.risk] || b.daysQuiet - a.daysQuiet);
    const count = (r: RiskLevel) => rows.filter((x) => x.risk === r).length;
    return {
      cohort: toCohort(cohort, counts.get(cohort.id) ?? 0, now),
      summary: { learners: rows.length, ok: count('ok'), watch: count('watch'), atRisk: count('at_risk'), inactive: count('inactive') },
      items: risk ? rows.filter((r) => r.risk === risk) : rows,
    };
  }

  /** A personal note to some of the cohort's learners, in the app and by email, as written. */
  async sendCheckIn(p: Principal, cohortId: string, input: { userIds: string[]; message: string }): Promise<{ sent: number }> {
    const cohort = await this.supportedCohort(p, cohortId);
    const learners = await this.db.sys
      .select({ id: programEnrollments.id, userId: programEnrollments.userId })
      .from(programEnrollments)
      .where(and(eq(programEnrollments.cohortId, cohort.id), ne(programEnrollments.status, 'withdrawn'), inArray(programEnrollments.userId, input.userIds)));
    if (learners.length !== input.userIds.length) {
      throw notFound('learner_not_in_cohort', `${input.userIds.length - learners.length} of these people aren’t learners in this cohort.`);
    }
    const sender = (await this.names([p.userId])).get(p.userId) ?? 'Your cohort team';
    const firstName = sender.split(/\s+/)[0] || sender;
    const now = new Date();
    const key = `check-in:${newId()}`;
    await this.db.system(async (tx) => {
      await tx.insert(progressReminders).values(
        learners.map((l) => ({ id: newId(), userId: l.userId, scope: 'program' as const, enrollmentId: l.id, kind: 'check_in' as const, lapseFrom: now, sentAt: now, sentByUserId: p.userId })),
      );
      await requestNotification(
        this.outbox,
        tx,
        { to: { userIds: learners.map((l) => l.userId) }, category: 'progress', title: `${firstName} sent you a note`, body: input.message, link: '/app/programme', orgId: cohort.hostOrgId, key },
        userActor(p.userId),
      );
    });
    return { sent: learners.length };
  }

  // ---------- funnels ----------

  async cohortFunnel(p: Principal, cohortId: string, now = new Date()): Promise<CompletionFunnel> {
    const [cohort] = await this.db.sys.select().from(cohorts).where(eq(cohorts.id, cohortId));
    if (!cohort || (!p.platformAdmin && cohort.hostOrgId !== p.orgId) || !(await this.cohortsService.isCohortManager(p, cohort))) {
      throw notFound('cohort_not_found', 'Cohort not found');
    }
    const learners = await this.db.sys.select().from(programEnrollments).where(eq(programEnrollments.cohortId, cohort.id));
    const ids = learners.map((l) => l.id);
    const [frame, enrolments] = await Promise.all([this.frame(cohort, now), ids.length ? this.db.sys.select().from(courseEnrollments).where(inArray(courseEnrollments.programEnrollmentId, ids)) : []]);
    const activity = await this.activity(enrolments.map((e) => e.id));
    const units = learners.map((pe) => {
      const s = this.programmeState(
        pe,
        frame,
        enrolments.filter((e) => e.programEnrollmentId === pe.id),
        activity,
      );
      return { enrolledAt: pe.enrolledAt, started: s.started, firstActivity: s.firstActivity, lastActivity: s.lastActivity, progressPct: s.progressPct, completed: s.completed };
    });
    const owners = new Map(enrolments.map((e) => [e.id, e.programEnrollmentId!]));
    return this.funnel({ kind: 'cohort', id: cohort.id, title: cohort.name }, units, 'program', ids, owners, cohort.timeZone, now);
  }

  async courseFunnel(slug: string, now = new Date()): Promise<CompletionFunnel> {
    const detail = await this.catalog.detail(slug, { orgId: null, platformAdmin: true });
    if (!detail) throw notFound('course_not_found', 'Course not found');
    const enrolments = await this.db.sys.select().from(courseEnrollments).where(eq(courseEnrollments.courseId, detail.id));
    const activity = await this.activity(enrolments.map((e) => e.id));
    const units = enrolments.map((e) => {
      const l = this.line(null, null, e, activity);
      return { enrolledAt: e.enrolledAt, started: l.started, firstActivity: l.firstActivity, lastActivity: l.lastActivity, progressPct: e.progressPct, completed: l.completed };
    });
    const ids = enrolments.map((e) => e.id);
    return this.funnel({ kind: 'course', id: detail.id, title: detail.title }, units, 'course', ids, new Map(ids.map((id) => [id, id])), DEFAULT_TIME_ZONE, now);
  }

  /**
   * The funnel's stages and drop-off, how reminders and check-ins worked, and weekly active learners.
   * `owners` maps each course enrolment to the unit it counts for (a programme enrolment, or itself).
   */
  private async funnel(
    scope: CompletionFunnel['scope'],
    units: FunnelUnit[],
    reminderScope: GoalScope,
    unitIds: string[],
    owners: Map<string, string>,
    timeZone: string,
    now: Date,
  ): Promise<CompletionFunnel> {
    const counts = funnelCounts(units);
    const sent = unitIds.length
      ? await this.db.sys
          .select({ userId: progressReminders.userId, kind: progressReminders.kind, sentAt: progressReminders.sentAt, returnedAt: progressReminders.returnedAt })
          .from(progressReminders)
          .where(and(eq(progressReminders.scope, reminderScope), inArray(progressReminders.enrollmentId, unitIds)))
      : [];
    const outcome = (rows: typeof sent) => ({
      sent: rows.length,
      returnedWithin7Days: new Set(rows.filter((r) => r.returnedAt && r.returnedAt.getTime() - r.sentAt.getTime() <= 7 * DAY_MS).map((r) => r.userId)).size,
    });

    const mondays = lastMondays(timeZone, FUNNEL_WEEKS, now);
    const since = zonedTime(mondays[0]!, '00:00', timeZone);
    const courseIds = [...owners.keys()];
    const times = courseIds.length
      ? await this.db.sys
          .select({ e: itemProgress.courseEnrollmentId, created: itemProgress.createdAt, updated: itemProgress.updatedAt, completed: itemProgress.completedAt })
          .from(itemProgress)
          .where(and(inArray(itemProgress.courseEnrollmentId, courseIds), gte(itemProgress.updatedAt, since)))
      : [];
    const activeIn = new Map<string, Set<string>>(mondays.map((m) => [m, new Set()]));
    for (const t of times) {
      for (const at of [t.created, t.updated, t.completed]) {
        if (!at || at < since) continue;
        const week = activeIn.get(thisMonday(timeZone, at));
        week?.add(owners.get(t.e)!);
      }
    }
    return {
      scope,
      stages: FUNNEL_STAGES.map((key) => ({ key, label: FUNNEL_STAGE_LABELS[key], count: counts[key] })),
      ...dropOff(units, now),
      reminders: outcome(sent.filter((r) => r.kind !== 'check_in')),
      checkIns: outcome(sent.filter((r) => r.kind === 'check_in')),
      weekly: mondays.map((weekStart) => ({ weekStart, active: activeIn.get(weekStart)!.size })),
    };
  }

  // ---------- circle progress ----------

  async circleProgress(p: Principal, circleId: string, now = new Date()): Promise<CircleProgress> {
    const a = await this.circles.access(p, circleId);
    const [cohort] = await this.db.sys.select().from(cohorts).where(eq(cohorts.id, a.circle.cohortId));
    if (!cohort) throw notFound('circle_not_found', 'Circle not found');
    const [members, flags] = await Promise.all([
      this.db.sys.select({ userId: circleMembers.userId }).from(circleMembers).where(eq(circleMembers.circleId, circleId)),
      this.db.sys.select().from(circleProgressSharing).where(and(eq(circleProgressSharing.circleId, circleId), eq(circleProgressSharing.share, true))),
    ]);
    const memberIds = new Set(members.map((m) => m.userId));
    const sharing = flags.map((f) => f.userId).filter((id) => memberIds.has(id));
    const weekStart = thisMonday(cohort.timeZone, now);
    const base = { weekStart, sharing: sharing.includes(p.userId), notSharing: memberIds.size - sharing.length };
    if (sharing.length === 0) return { ...base, members: [] };

    const since = zonedTime(weekStart, '00:00', cohort.timeZone);
    const pes = await this.db.sys
      .select()
      .from(programEnrollments)
      .where(and(eq(programEnrollments.cohortId, cohort.id), inArray(programEnrollments.userId, sharing)));
    const peIds = pes.map((pe) => pe.id);
    const [frame, enrolments, names] = await Promise.all([
      this.frame(cohort, now),
      peIds.length ? this.db.sys.select().from(courseEnrollments).where(inArray(courseEnrollments.programEnrollmentId, peIds)) : [],
      this.names(sharing),
    ]);
    const eIds = enrolments.map((e) => e.id);
    const [activity, week] = await Promise.all([
      this.activity(eIds),
      eIds.length
        ? this.db.sys
            .select({ userId: itemProgress.userId, created: itemProgress.createdAt, updated: itemProgress.updatedAt, completed: itemProgress.completedAt })
            .from(itemProgress)
            .where(and(inArray(itemProgress.courseEnrollmentId, eIds), gte(itemProgress.updatedAt, since)))
        : [],
    ]);
    const rows = sharing.map((userId) => {
      const pe = pes.find((x) => x.userId === userId);
      const state = pe ? this.programmeState(pe, frame, enrolments.filter((e) => e.programEnrollmentId === pe.id), activity) : null;
      const mine = week.filter((w) => w.userId === userId);
      const days = new Set(mine.flatMap((w) => [w.created, w.updated, w.completed]).filter((d): d is Date => !!d && d >= since).map((d) => todayIn(cohort.timeZone, d)));
      return {
        userId,
        name: names.get(userId) ?? 'Member',
        activeDaysThisWeek: Math.min(7, days.size),
        itemsCompletedThisWeek: mine.filter((w) => w.completed && w.completed >= since).length,
        progressPct: state?.progressPct ?? 0,
        lastActiveAt: state?.lastActivity?.toISOString() ?? null,
      };
    });
    rows.sort((x, y) => x.name.localeCompare(y.name));
    return { ...base, members: rows };
  }

  async setCircleSharing(p: Principal, circleId: string, share: boolean): Promise<CircleProgress> {
    const a = await this.circles.access(p, circleId);
    if (a.role !== 'member') throw forbidden('permission_denied', 'Only the circle’s members share their own progress.');
    await this.db.tenant({ orgId: a.circle.hostOrgId, userId: p.userId }, (tx) =>
      tx
        .insert(circleProgressSharing)
        .values({ circleId, userId: p.userId, hostOrgId: a.circle.hostOrgId, share })
        .onConflictDoUpdate({ target: [circleProgressSharing.circleId, circleProgressSharing.userId], set: { share, updatedAt: new Date() } }),
    );
    return this.circleProgress(p, circleId);
  }

  async names(userIds: string[]): Promise<Map<string, string>> {
    const unique = [...new Set(userIds)];
    if (unique.length === 0) return new Map();
    const rows = await this.iam.send<UserName[]>(IamRpc.UserNames, { userIds: unique }).catch(() => [] as UserName[]);
    return new Map(rows.map((u) => [u.id, u.name]));
  }
}

/** Where to do a graduation requirement in the app. */
function requirementHref(programEnrollmentId: string, key: string): string {
  const base = `/app/programme/${programEnrollmentId}`;
  if (key === 'complete_portfolio') return `${base}/portfolio`;
  if (key === 'post_lab_action_plan') return `${base}/action-plan`;
  return `${base}/graduation`;
}
