import { Inject, Injectable, Optional } from '@nestjs/common';
import type { CalendarWeek, ClassSession, Cohort, CohortDetail, Permission, ProgramDetail, RhythmSlot, ScopeType } from '@dreamlab/contracts';
import { AUTHZ_CHECKER, AuthzChecker, hasOrgPermission, type Principal } from '@lib/auth';
import { conflict, forbidden, newId, notFound } from '@lib/common';
import { InjectDatabase } from '@lib/database';
import { CatalogClient, IamRpc, RpcClient, UserName } from '@lib/rpc';
import { and, asc, eq, inArray, lt, ne, sql } from 'drizzle-orm';
import { LearningDatabase, schema } from '../../database';
import { CATALOG } from '../enrollments/enrollments.service';
import { programmeScore } from '../grading/course-score';
import { IAM_NAMES } from '../player/player.service';
import { addDays, assertTimeZone, dateInWeek, todayIn, weekOf, zonedTime } from './calendar-time';

const { cohorts, calendarWeeks, courseRuns, classSessions, programEnrollments, attendance, courseEnrollments } = schema;
export type CohortRow = typeof cohorts.$inferSelect;
type WeekRow = typeof calendarWeeks.$inferSelect;
type SessionRow = typeof classSessions.$inferSelect;

/** Statuses that count as having been at a class. */
const ATTENDED = ['present', 'late'] as const;

export function toCohort(r: CohortRow, learnerCount: number, now = new Date()): Cohort {
  return {
    id: r.id,
    programSlug: r.programSlug,
    programTitle: r.programTitle,
    hostOrgId: r.hostOrgId,
    hostOrgName: r.hostOrgName,
    name: r.name,
    startsOn: r.startsOn,
    endsOn: r.endsOn,
    timeZone: r.timeZone,
    capacity: r.capacity,
    enrollmentPolicy: r.enrollmentPolicy,
    status: r.status,
    learnerCount,
    currentWeek: weekOf(r.startsOn, r.weeks, todayIn(r.timeZone, now)),
    createdAt: r.createdAt.toISOString(),
  };
}

export const toCalendarWeek = (w: WeekRow): CalendarWeek => ({
  weekNo: w.weekNo,
  startsOn: w.startsOn,
  endsOn: w.endsOn,
  phase: w.phaseName,
  focus: w.focus,
  majorOutput: w.majorOutput,
});

export const toSession = (s: SessionRow): ClassSession => ({
  id: s.id,
  weekNo: s.weekNo,
  title: s.title,
  startsAt: s.startsAt.toISOString(),
  durationMin: s.durationMin,
  mode: s.mode,
  location: s.location,
  cancelled: s.cancelled,
});

/** Learners who have not withdrawn, per cohort. */
export async function learnerCounts(db: LearningDatabase, cohortIds: string[]): Promise<Map<string, number>> {
  if (cohortIds.length === 0) return new Map();
  const rows = await db.sys
    .select({ cohortId: programEnrollments.cohortId, n: sql<number>`count(*)::int` })
    .from(programEnrollments)
    .where(and(inArray(programEnrollments.cohortId, cohortIds), ne(programEnrollments.status, 'withdrawn')))
    .groupBy(programEnrollments.cohortId);
  return new Map(rows.map((r) => [r.cohortId, r.n]));
}

/** The programme's courses as cohort runs: elective phases make their courses optional, grouped by phase. */
export function plannedRuns(program: ProgramDetail, startsOn: string, endsOn: string) {
  return program.phases.flatMap((phase) =>
    phase.courses.map((course) => ({
      course,
      phaseName: phase.name,
      required: phase.chooseN === null && course.required,
      electiveGroupKey: phase.chooseN === null ? null : phase.name,
      startsOn: phase.weekFrom ? addDays(startsOn, (phase.weekFrom - 1) * 7) : startsOn,
      endsOn: phase.weekTo ? addDays(startsOn, phase.weekTo * 7 - 1) : endsOn,
    })),
  );
}

/** Every class in every week, from the weekly rhythm, at wall-clock times in the cohort's time zone. */
export function plannedSessions(startsOn: string, weeks: number, rhythm: RhythmSlot[], timeZone: string) {
  const out: Array<{ weekNo: number; slot: RhythmSlot; startsAt: Date }> = [];
  for (let weekNo = 1; weekNo <= weeks; weekNo++) {
    const weekStart = addDays(startsOn, (weekNo - 1) * 7);
    for (const slot of rhythm) out.push({ weekNo, slot, startsAt: zonedTime(dateInWeek(weekStart, slot.weekday), slot.time, timeZone) });
  }
  return out.sort((a, b) => a.startsAt.getTime() - b.startsAt.getTime());
}

export interface CreateCohortInput {
  programSlug: string;
  name: string;
  startsOn: string;
  timeZone: string;
  capacity: number | null;
  enrollmentPolicy: 'open' | 'invite';
  rhythm: RhythmSlot[];
}

export interface UpdateCohortInput {
  name?: string;
  capacity?: number | null;
  enrollmentPolicy?: 'open' | 'invite';
  status?: CohortRow['status'];
}

export interface UpdateSessionInput {
  location?: string | null;
  cancelled?: boolean;
  startsAt?: string;
}

export interface MarkAttendanceInput {
  entries: Array<{ userId: string; status: 'present' | 'late' | 'absent' | 'excused'; minutes: number | null }>;
}

/**
 * Cohorts as their host organisation's staff run them (LRN-2). Cohort tables are read and written
 * in the host organisation's context; rosters span learners' own records, so they are read as the
 * system role after the caller has been checked against the host organisation.
 */
@Injectable()
export class CohortsService {
  constructor(
    @InjectDatabase() private readonly db: LearningDatabase,
    @Inject(CATALOG) private readonly catalog: CatalogClient,
    @Inject(IAM_NAMES) private readonly iam: RpcClient,
    @Optional() @Inject(AUTHZ_CHECKER) private readonly authz?: AuthzChecker,
  ) {}

  async create(p: Principal, input: CreateCohortInput): Promise<CohortDetail> {
    const hostOrgId = p.orgId;
    if (!hostOrgId) throw forbidden('org_context_required', 'Switch to the organisation that will host this cohort first.');
    assertTimeZone(input.timeZone);
    const program = await this.catalog.program(input.programSlug);
    if (!program) throw notFound('program_not_found', 'Programme not found');
    const weeks = Math.max(0, ...program.calendar.map((w) => w.weekNo)) || (program.weeks ?? 0);
    if (weeks < 1) throw conflict('program_has_no_calendar', 'This programme has no weekly calendar to schedule.');

    const endsOn = addDays(input.startsOn, weeks * 7 - 1);
    const [host] = await this.iam.send<{ id: string; name: string }[]>(IamRpc.OrgNames, { ids: [hostOrgId] }).catch(() => []);
    const runs = plannedRuns(program, input.startsOn, endsOn);
    const versions = new Map(await Promise.all(runs.map(async (r) => [r.course.id, (await this.catalog.current(r.course.slug))?.version.id ?? null] as const)));

    const cohortId = newId();
    await this.db.tenant({ orgId: hostOrgId, userId: p.userId }, async (tx) => {
      await tx.insert(cohorts).values({
        id: cohortId,
        programId: program.id,
        programSlug: program.slug,
        programTitle: program.title,
        hostOrgId,
        hostOrgName: host?.name ?? 'Organisation',
        name: input.name,
        startsOn: input.startsOn,
        endsOn,
        weeks,
        timeZone: input.timeZone,
        capacity: input.capacity,
        enrollmentPolicy: input.enrollmentPolicy,
        status: 'draft',
        rhythm: input.rhythm,
        createdByUserId: p.userId,
      });
      if (program.calendar.length > 0) {
        await tx.insert(calendarWeeks).values(
          program.calendar.map((w) => ({
            id: newId(),
            cohortId,
            hostOrgId,
            weekNo: w.weekNo,
            phaseName: w.phase,
            focus: w.focus,
            majorOutput: w.majorOutput,
            startsOn: addDays(input.startsOn, (w.weekNo - 1) * 7),
            endsOn: addDays(input.startsOn, w.weekNo * 7 - 1),
          })),
        );
      }
      if (runs.length > 0) {
        await tx.insert(courseRuns).values(
          runs.map((r) => ({
            id: newId(),
            cohortId,
            hostOrgId,
            courseId: r.course.id,
            courseSlug: r.course.slug,
            courseVersionId: versions.get(r.course.id) ?? null,
            phaseName: r.phaseName,
            required: r.required,
            electiveGroupKey: r.electiveGroupKey,
            creditHours: r.course.creditHours,
            startsOn: r.startsOn,
            endsOn: r.endsOn,
          })),
        );
      }
      await tx.insert(classSessions).values(
        plannedSessions(input.startsOn, weeks, input.rhythm, input.timeZone).map((s) => ({
          id: newId(),
          cohortId,
          hostOrgId,
          weekNo: s.weekNo,
          title: s.slot.title,
          startsAt: s.startsAt,
          durationMin: s.slot.durationMin,
          mode: s.slot.mode,
          location: s.slot.location,
        })),
      );
    });
    return this.get(p, cohortId);
  }

  /** The active organisation's cohorts; platform admins see every cohort. */
  async list(p: Principal): Promise<{ items: Cohort[] }> {
    const rows = p.platformAdmin
      ? await this.db.sys.select().from(cohorts).orderBy(asc(cohorts.startsOn))
      : p.orgId
        ? await this.db.tenant({ orgId: p.orgId, userId: p.userId }, (tx) => tx.select().from(cohorts).orderBy(asc(cohorts.startsOn)))
        : [];
    const counts = await learnerCounts(this.db, rows.map((r) => r.id));
    return { items: rows.map((r) => toCohort(r, counts.get(r.id) ?? 0)) };
  }

  async get(p: Principal, cohortId: string): Promise<CohortDetail> {
    const cohort = await this.staffCohort(p, cohortId);
    return this.detail(cohort);
  }

  async update(p: Principal, cohortId: string, input: UpdateCohortInput): Promise<CohortDetail> {
    const cohort = await this.staffCohort(p, cohortId);
    if (cohort.status === 'closed' && input.status && input.status !== 'closed') {
      throw conflict('cohort_closed', 'A closed cohort can’t be reopened. Schedule a new cohort instead.');
    }
    const learners = (await learnerCounts(this.db, [cohort.id])).get(cohort.id) ?? 0;
    if (input.status === 'draft' && cohort.status !== 'draft' && learners > 0) {
      throw conflict('cohort_has_learners', 'Learners have joined this cohort, so it can’t go back to draft.');
    }
    if (input.capacity != null && input.capacity < learners) {
      throw conflict('capacity_below_learners', `${learners} learners have already joined; set the capacity to at least that.`);
    }
    const [row] = await this.db.tenant({ orgId: cohort.hostOrgId, userId: p.userId }, (tx) =>
      tx
        .update(cohorts)
        .set({ ...input, updatedAt: new Date() })
        .where(eq(cohorts.id, cohort.id))
        .returning(),
    );
    return this.detail(row!);
  }

  /** Learners with their attendance (of classes held so far) and average progress across their programme courses. */
  async roster(p: Principal, cohortId: string) {
    const cohort = await this.staffCohort(p, cohortId);
    const learners = await this.db.sys.select().from(programEnrollments).where(eq(programEnrollments.cohortId, cohort.id)).orderBy(asc(programEnrollments.enrolledAt));
    if (learners.length === 0) return { items: [] };
    const ids = learners.map((l) => l.id);
    const [held, attended, progress, scores, names] = await Promise.all([
      this.heldCount(cohort.id),
      this.db.sys
        .select({ e: attendance.programEnrollmentId, n: sql<number>`count(*)::int` })
        .from(attendance)
        .where(and(inArray(attendance.programEnrollmentId, ids), inArray(attendance.status, [...ATTENDED])))
        .groupBy(attendance.programEnrollmentId),
      this.db.sys
        .select({ e: courseEnrollments.programEnrollmentId, pct: sql<number>`round(avg(${courseEnrollments.progressPct}))::int` })
        .from(courseEnrollments)
        .where(inArray(courseEnrollments.programEnrollmentId, ids))
        .groupBy(courseEnrollments.programEnrollmentId),
      this.db.sys
        .select({ e: courseEnrollments.programEnrollmentId, score: courseEnrollments.finalScore, credits: courseRuns.creditHours })
        .from(courseEnrollments)
        .innerJoin(courseRuns, eq(courseRuns.id, courseEnrollments.courseRunId))
        .where(inArray(courseEnrollments.programEnrollmentId, ids)),
      this.userNames(learners.map((l) => l.userId)),
    ]);
    const attendedBy = new Map(attended.map((r) => [r.e, r.n]));
    const progressBy = new Map(progress.map((r) => [r.e, r.pct]));
    return {
      items: learners.map((l) => ({
        userId: l.userId,
        name: names.get(l.userId) ?? 'Learner',
        status: l.status,
        enrolledAt: l.enrolledAt.toISOString(),
        attendancePct: held > 0 ? Math.round(((attendedBy.get(l.id) ?? 0) / held) * 100) : null,
        progressPct: progressBy.get(l.id) ?? 0,
        programmeScore: programmeScore(scores.filter((s) => s.e === l.id).map((s) => ({ credits: s.credits, score: s.score }))).programmeScore,
      })),
    };
  }

  async updateSession(p: Principal, cohortId: string, sessionId: string, input: UpdateSessionInput): Promise<ClassSession> {
    const cohort = await this.staffCohort(p, cohortId);
    const [row] = await this.db.tenant({ orgId: cohort.hostOrgId, userId: p.userId }, (tx) =>
      tx
        .update(classSessions)
        .set({
          ...(input.location !== undefined && { location: input.location }),
          ...(input.cancelled !== undefined && { cancelled: input.cancelled }),
          ...(input.startsAt !== undefined && { startsAt: new Date(input.startsAt) }),
          updatedAt: new Date(),
        })
        .where(and(eq(classSessions.id, sessionId), eq(classSessions.cohortId, cohort.id)))
        .returning(),
    );
    if (!row) throw notFound('session_not_found', 'Class session not found');
    return toSession(row);
  }

  async attendance(p: Principal, cohortId: string, sessionId: string) {
    const { cohort, session } = await this.teachingSession(p, cohortId, sessionId);
    return this.attendanceSheet(cohort, session);
  }

  /** Upserts one mark per learner; a correction replaces the earlier mark and records who made it. */
  async markAttendance(p: Principal, cohortId: string, sessionId: string, input: MarkAttendanceInput) {
    const { cohort, session } = await this.teachingSession(p, cohortId, sessionId);
    const learners = await this.db.sys
      .select({ id: programEnrollments.id, userId: programEnrollments.userId })
      .from(programEnrollments)
      .where(and(eq(programEnrollments.cohortId, cohort.id), inArray(programEnrollments.userId, input.entries.map((e) => e.userId))));
    const enrollmentOf = new Map(learners.map((l) => [l.userId, l.id]));
    const strangers = input.entries.filter((e) => !enrollmentOf.has(e.userId));
    if (strangers.length > 0) throw notFound('learner_not_in_cohort', `${strangers.length} of these people aren’t learners in this cohort.`);

    await this.db.tenant({ orgId: cohort.hostOrgId, userId: p.userId }, async (tx) => {
      for (const e of input.entries) {
        const values = { status: e.status, minutes: e.minutes, source: 'override' as const, markedByUserId: p.userId };
        await tx
          .insert(attendance)
          .values({ id: newId(), classSessionId: session.id, programEnrollmentId: enrollmentOf.get(e.userId)!, userId: e.userId, hostOrgId: cohort.hostOrgId, ...values })
          .onConflictDoUpdate({ target: [attendance.classSessionId, attendance.userId], set: { ...values, updatedAt: new Date() } });
      }
    });
    return this.attendanceSheet(cohort, session);
  }

  // ---------- access ----------

  /**
   * A cohort the caller runs as staff of its host organisation (the route already required
   * cohort.manage in the active organisation). Anyone else gets not found, not forbidden.
   */
  private async staffCohort(p: Principal, cohortId: string): Promise<CohortRow> {
    const [row] = await this.db.sys.select().from(cohorts).where(eq(cohorts.id, cohortId));
    if (!row || (!p.platformAdmin && row.hostOrgId !== p.orgId)) throw notFound('cohort_not_found', 'Cohort not found');
    return row;
  }

  /** Attendance is taken by cohort managers and by anyone who teaches in the cohort or the session's course run. */
  private async teachingSession(p: Principal, cohortId: string, sessionId: string): Promise<{ cohort: CohortRow; session: SessionRow }> {
    const [cohort] = await this.db.sys.select().from(cohorts).where(eq(cohorts.id, cohortId));
    if (!cohort) throw notFound('cohort_not_found', 'Cohort not found');
    const [session] = await this.db.sys
      .select()
      .from(classSessions)
      .where(and(eq(classSessions.id, sessionId), eq(classSessions.cohortId, cohort.id)));
    if (!session) throw notFound('session_not_found', 'Class session not found');

    const allowed =
      (p.platformAdmin && !p.stale) ||
      (cohort.hostOrgId === p.orgId &&
        ((await this.may(p, cohort.hostOrgId, 'cohort.manage')) ||
          (await this.may(p, cohort.hostOrgId, 'course_run.teach', 'cohort', cohort.id)) ||
          (session.courseRunId !== null && (await this.may(p, cohort.hostOrgId, 'course_run.teach', 'course_run', session.courseRunId)))));
    if (!allowed) {
      if (cohort.hostOrgId !== p.orgId && !p.platformAdmin) throw notFound('cohort_not_found', 'Cohort not found');
      throw forbidden('permission_denied', 'Only the cohort’s managers and teachers can take attendance.');
    }
    return { cohort, session };
  }

  /** Org-wide from the token's roles when they can be trusted; otherwise (or at a narrower scope) IAM decides. */
  private async may(p: Principal, orgId: string, permission: Permission, scopeType?: ScopeType, scopeId?: string): Promise<boolean> {
    if (!scopeType && hasOrgPermission(p, permission)) return true;
    if (!this.authz) return false;
    return this.authz.check({ userId: p.userId, orgId, permission, authzVersion: p.authzVersion, ...(scopeType && { scopeType, scopeId }) });
  }

  // ---------- reads ----------

  private async detail(cohort: CohortRow): Promise<CohortDetail> {
    const [weeks, sessions, counts] = await Promise.all([
      this.db.sys.select().from(calendarWeeks).where(eq(calendarWeeks.cohortId, cohort.id)).orderBy(asc(calendarWeeks.weekNo)),
      this.db.sys.select().from(classSessions).where(eq(classSessions.cohortId, cohort.id)).orderBy(asc(classSessions.startsAt)),
      learnerCounts(this.db, [cohort.id]),
    ]);
    return {
      ...toCohort(cohort, counts.get(cohort.id) ?? 0),
      calendar: weeks.map(toCalendarWeek),
      sessions: sessions.map(toSession),
      rhythm: cohort.rhythm,
    };
  }

  /** Classes that have started and were not cancelled. */
  private async heldCount(cohortId: string, now = new Date()): Promise<number> {
    const [row] = await this.db.sys
      .select({ n: sql<number>`count(*)::int` })
      .from(classSessions)
      .where(and(eq(classSessions.cohortId, cohortId), eq(classSessions.cancelled, false), lt(classSessions.startsAt, now)));
    return row?.n ?? 0;
  }

  private async attendanceSheet(cohort: CohortRow, session: SessionRow) {
    const [learners, marks] = await Promise.all([
      this.db.sys
        .select({ userId: programEnrollments.userId })
        .from(programEnrollments)
        .where(and(eq(programEnrollments.cohortId, cohort.id), ne(programEnrollments.status, 'withdrawn')))
        .orderBy(asc(programEnrollments.enrolledAt)),
      this.db.sys.select().from(attendance).where(eq(attendance.classSessionId, session.id)),
    ]);
    const markOf = new Map(marks.map((m) => [m.userId, m]));
    const names = await this.userNames(learners.map((l) => l.userId));
    return {
      session: toSession(session),
      items: learners.map((l) => ({
        userId: l.userId,
        name: names.get(l.userId) ?? 'Learner',
        status: markOf.get(l.userId)?.status ?? null,
        minutes: markOf.get(l.userId)?.minutes ?? null,
      })),
    };
  }

  private async userNames(userIds: string[]): Promise<Map<string, string>> {
    if (userIds.length === 0) return new Map();
    const rows = await this.iam.send<UserName[]>(IamRpc.UserNames, { userIds: [...new Set(userIds)] }).catch(() => [] as UserName[]);
    return new Map(rows.map((u) => [u.id, u.name]));
  }
}
