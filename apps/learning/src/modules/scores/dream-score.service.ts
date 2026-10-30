import { Inject, Injectable, Logger, OnApplicationBootstrap, OnApplicationShutdown, Optional } from '@nestjs/common';
import { DEFAULT_DREAM_SCORE_WEIGHTS, type DreamScore, type DreamScoreWeights } from '@dreamlab/contracts';
import { AUTHZ_CHECKER, type AuthzChecker, hasOrgPermission, type Principal } from '@lib/auth';
import { forbidden, newId, notFound } from '@lib/common';
import { InjectDatabase } from '@lib/database';
import { CatalogClient } from '@lib/rpc';
import { and, asc, desc, eq, gt, isNull, lt, sql } from 'drizzle-orm';
import { LearningDatabase, schema } from '../../database';
import { todayIn, weekOf } from '../cohorts/calendar-time';
import { CATALOG } from '../enrollments/enrollments.service';
import { courseFinalScore, itemScores } from '../grading/course-score';
import {
  ATTENDANCE_VALUES,
  changedEvidence,
  computeDreamScore,
  COURSE_DIMENSIONS,
  latestRevisions,
  MENTOR_MEETING_EVIDENCE,
  pct,
  RESIDENCY_DIMENSIONS,
  type RevisedEvidence,
} from './dream-score';

const {
  cohorts,
  programEnrollments,
  courseEnrollments,
  residencyStages,
  mentorAssignments,
  mentorMeetings,
  attendance,
  classSessions,
  competencyEvents,
  dreamScoreSnapshots,
  dreamScoreWeights,
} = schema;
type EnrollmentRow = typeof programEnrollments.$inferSelect;
type CohortRow = typeof cohorts.$inferSelect;
type NewEvent = typeof competencyEvents.$inferInsert;

/** Attendance becomes evidence once corrections have had time to land (the evidence is append-only). */
const ATTENDANCE_SETTLES_MS = 48 * 3_600_000;
const SYNC_EVERY_MS = 60 * 60_000;
/** The hourly sync walks active enrolments in pages of this size. */
const SYNC_PAGE = 500;
const RECENT = 15;

/**
 * The Dream Score™ (SCORE-1): a competency radar that informs and gates nothing. Evidence is pulled
 * from grades, residency reviews, mentor meetings and attendance into the append-only
 * competency_events (once per source record and dimension); the score recomputes from that evidence,
 * and a snapshot per cohort week records its growth.
 */
@Injectable()
export class DreamScoreService implements OnApplicationBootstrap, OnApplicationShutdown {
  private readonly logger = new Logger(DreamScoreService.name);
  private timer: NodeJS.Timeout | null = null;

  constructor(
    @InjectDatabase() private readonly db: LearningDatabase,
    @Inject(CATALOG) private readonly catalog: CatalogClient,
    @Optional() @Inject(AUTHZ_CHECKER) private readonly authz?: AuthzChecker,
  ) {}

  onApplicationBootstrap(): void {
    this.timer = setInterval(() => void this.syncAll().catch((e: unknown) => this.logger.error(e instanceof Error ? e.message : String(e))), SYNC_EVERY_MS);
    this.timer.unref();
  }

  onApplicationShutdown(): void {
    if (this.timer) clearInterval(this.timer);
  }

  // ---------- reads ----------

  /** A learner's Dream Score, for the learner or the cohort's staff; anyone else: not found. */
  async get(p: Principal, programEnrollmentId: string): Promise<DreamScore> {
    const { pe, cohort } = await this.load(programEnrollmentId);
    if (pe.userId !== p.userId && !(await this.isStaff(p, cohort, pe))) throw notFound('program_enrollment_not_found', 'Programme enrolment not found');
    return this.forEnrollment(programEnrollmentId);
  }

  /** A programme enrolment's Dream Score as of now. Callers have already checked access. */
  async forEnrollment(programEnrollmentId: string, now = new Date()): Promise<DreamScore> {
    const { pe, cohort } = await this.load(programEnrollmentId);
    await this.sync(pe, cohort, now);
    const [events, snapshots, weights] = await Promise.all([
      this.db.sys.select().from(competencyEvents).where(eq(competencyEvents.programEnrollmentId, pe.id)).orderBy(desc(competencyEvents.occurredAt)),
      this.db.sys.select().from(dreamScoreSnapshots).where(eq(dreamScoreSnapshots.programEnrollmentId, pe.id)).orderBy(asc(dreamScoreSnapshots.weekNo)),
      this.weightsOf(cohort.hostOrgId),
    ]);
    const computed = computeDreamScore(latestRevisions(events as RevisedEvidence[]), weights);
    return {
      programEnrollmentId: pe.id,
      overall: computed.overall,
      dimensions: computed.dimensions,
      growth: snapshots.map((s) => ({ weekNo: s.weekNo, learning: s.learning, building: s.building, dream: s.dream })),
      recent: events.slice(0, RECENT).map((e) => ({
        dimension: e.dimension as DreamScore['recent'][number]['dimension'],
        value: e.value,
        source: e.source,
        label: e.label,
        at: e.occurredAt.toISOString(),
      })),
    };
  }

  // ---------- weights ----------

  async weights(p: Principal): Promise<{ weights: DreamScoreWeights }> {
    return { weights: await this.weightsOf(this.orgOf(p)) };
  }

  async setWeights(p: Principal, weights: DreamScoreWeights): Promise<{ weights: DreamScoreWeights }> {
    const orgId = this.orgOf(p);
    await this.db.system((tx) =>
      tx
        .insert(dreamScoreWeights)
        .values({ orgId, weights, updatedByUserId: p.userId })
        .onConflictDoUpdate({ target: dreamScoreWeights.orgId, set: { weights, updatedByUserId: p.userId, updatedAt: new Date() } }),
    );
    return { weights };
  }

  private orgOf(p: Principal): string {
    if (!p.orgId) throw forbidden('org_context_required', 'Switch to the organisation whose Dream Score weights you set.');
    return p.orgId;
  }

  private async weightsOf(orgId: string): Promise<DreamScoreWeights> {
    const [row] = await this.db.sys.select().from(dreamScoreWeights).where(eq(dreamScoreWeights.orgId, orgId));
    return row?.weights ?? DEFAULT_DREAM_SCORE_WEIGHTS;
  }

  // ---------- evidence ----------

  /** Every active learner of running cohorts, a page at a time: keeps snapshots weekly without anyone opening the page. */
  async syncAll(now = new Date()): Promise<number> {
    let after: string | null = null;
    let done = 0;
    for (;;) {
      const rows = await this.db.sys
        .select({ pe: programEnrollments, cohort: cohorts })
        .from(programEnrollments)
        .innerJoin(cohorts, eq(cohorts.id, programEnrollments.cohortId))
        .where(and(eq(cohorts.status, 'running'), eq(programEnrollments.status, 'active'), after ? gt(programEnrollments.id, after) : undefined))
        .orderBy(asc(programEnrollments.id))
        .limit(SYNC_PAGE);
      for (const { pe, cohort } of rows) await this.sync(pe, cohort, now);
      done += rows.length;
      if (rows.length < SYNC_PAGE) return done;
      after = rows[rows.length - 1]!.pe.id;
    }
  }

  /**
   * Appends the evidence not yet recorded and the next revision of any that changed (a regrade, a
   * corrected attendance mark), then refreshes this week's snapshot. Concurrent syncs append at most
   * one row per revision (the unique index).
   */
  async sync(pe: EnrollmentRow, cohort: CohortRow, now = new Date()): Promise<void> {
    const candidates = [...(await this.courseEvidence(pe, cohort)), ...(await this.residencyEvidence(pe, cohort)), ...(await this.mentorEvidence(pe, cohort)), ...(await this.attendanceEvidence(pe, cohort, now))];
    const stored = (await this.db.sys.select().from(competencyEvents).where(eq(competencyEvents.programEnrollmentId, pe.id))) as RevisedEvidence[];
    const events = changedEvidence(candidates, stored);
    if (events.length > 0) await this.db.system((tx) => tx.insert(competencyEvents).values(events).onConflictDoNothing());
    await this.snapshot(pe, cohort, now);
  }

  private base(pe: EnrollmentRow, cohort: CohortRow) {
    return { programEnrollmentId: pe.id, hostOrgId: cohort.hostOrgId, userId: pe.userId };
  }

  /** A course's final score, once it has one, for the dimensions the course shows. */
  private async courseEvidence(pe: EnrollmentRow, cohort: CohortRow): Promise<NewEvent[]> {
    const rows = await this.db.sys.select().from(courseEnrollments).where(eq(courseEnrollments.programEnrollmentId, pe.id));
    const out: NewEvent[] = [];
    for (const ce of rows) {
      const dims = COURSE_DIMENSIONS[ce.courseSlug];
      if (!dims) continue;
      const content = await this.catalog.version(ce.courseVersionId);
      if (!content) continue;
      const score = courseFinalScore(content, await this.db.system((tx) => itemScores(tx, ce.id)));
      if (score === null) continue;
      for (const dimension of dims) {
        out.push({ id: newId(), ...this.base(pe, cohort), dimension, value: score / 10, source: 'course_grade', sourceId: ce.id, label: `${content.course.title} final score ${pct(score)}`, occurredAt: ce.updatedAt });
      }
    }
    return out;
  }

  private async residencyEvidence(pe: EnrollmentRow, cohort: CohortRow): Promise<NewEvent[]> {
    const rows = await this.db.sys
      .select()
      .from(residencyStages)
      .where(and(eq(residencyStages.programEnrollmentId, pe.id), eq(residencyStages.status, 'approved')));
    if (rows.length === 0) return [];
    const program = await this.catalog.program(cohort.programSlug).catch(() => null);
    const out: NewEvent[] = [];
    for (const r of rows) {
      if (r.scorePct === null) continue;
      const name = program?.capstoneStages.find((s) => s.position === r.position)?.name ?? `Stage ${r.position}`;
      for (const dimension of RESIDENCY_DIMENSIONS[r.position] ?? []) {
        out.push({
          id: newId(),
          ...this.base(pe, cohort),
          dimension,
          value: r.scorePct / 10,
          source: 'residency_stage',
          sourceId: r.id,
          label: `${name} approved at ${pct(r.scorePct)}`,
          occurredAt: r.reviewedAt ?? r.updatedAt,
        });
      }
    }
    return out;
  }

  private async mentorEvidence(pe: EnrollmentRow, cohort: CohortRow): Promise<NewEvent[]> {
    const rows = await this.db.sys
      .select({ m: mentorMeetings })
      .from(mentorMeetings)
      .innerJoin(mentorAssignments, eq(mentorAssignments.id, mentorMeetings.assignmentId))
      .where(and(eq(mentorAssignments.cohortId, cohort.id), eq(mentorAssignments.learnerUserId, pe.userId), eq(mentorMeetings.status, 'held')));
    return rows.map(({ m }) => ({
      id: newId(),
      ...this.base(pe, cohort),
      dimension: MENTOR_MEETING_EVIDENCE.dimension,
      value: MENTOR_MEETING_EVIDENCE.value,
      source: 'mentor_meeting' as const,
      sourceId: m.id,
      label: 'Mentor meeting held',
      occurredAt: m.scheduledAt,
    }));
  }

  /** Attendance at classes that ended long enough ago for corrections to have landed. */
  private async attendanceEvidence(pe: EnrollmentRow, cohort: CohortRow, now: Date): Promise<NewEvent[]> {
    const settled = new Date(now.getTime() - ATTENDANCE_SETTLES_MS);
    const rows = await this.db.sys
      .select({ a: attendance, s: classSessions })
      .from(attendance)
      .innerJoin(classSessions, eq(classSessions.id, attendance.classSessionId))
      .where(and(eq(attendance.programEnrollmentId, pe.id), lt(sql`${classSessions.startsAt} + make_interval(mins => ${classSessions.durationMin})`, settled)));
    return rows.map(({ a, s }) => ({
      id: newId(),
      ...this.base(pe, cohort),
      dimension: 'execution',
      value: ATTENDANCE_VALUES[a.status],
      source: 'attendance' as const,
      sourceId: a.id,
      label: `${s.title}, week ${s.weekNo}: ${a.status}`,
      occurredAt: s.startsAt,
    }));
  }

  /** This cohort week's snapshot (after the cohort ends, its last week keeps updating). */
  private async snapshot(pe: EnrollmentRow, cohort: CohortRow, now: Date): Promise<void> {
    const today = todayIn(cohort.timeZone, now);
    if (today < cohort.startsOn) return;
    const weekNo = weekOf(cohort.startsOn, cohort.weeks, today) ?? cohort.weeks;
    const [events, weights] = await Promise.all([
      this.db.sys.select().from(competencyEvents).where(eq(competencyEvents.programEnrollmentId, pe.id)),
      this.weightsOf(cohort.hostOrgId),
    ]);
    const c = computeDreamScore(latestRevisions(events as RevisedEvidence[]), weights);
    const values = {
      hostOrgId: cohort.hostOrgId,
      learning: c.learning,
      building: c.building,
      dream: c.overall,
      dimensions: Object.fromEntries(c.dimensions.map((d) => [d.key, d.score])),
      computedAt: now,
    };
    await this.db.system((tx) =>
      tx
        .insert(dreamScoreSnapshots)
        .values({ programEnrollmentId: pe.id, weekNo, ...values })
        .onConflictDoUpdate({ target: [dreamScoreSnapshots.programEnrollmentId, dreamScoreSnapshots.weekNo], set: values }),
    );
  }

  // ---------- access ----------

  private async load(programEnrollmentId: string): Promise<{ pe: EnrollmentRow; cohort: CohortRow }> {
    const [row] = await this.db.sys
      .select({ pe: programEnrollments, cohort: cohorts })
      .from(programEnrollments)
      .innerJoin(cohorts, eq(cohorts.id, programEnrollments.cohortId))
      .where(eq(programEnrollments.id, programEnrollmentId));
    if (!row) throw notFound('program_enrollment_not_found', 'Programme enrolment not found');
    return row;
  }

  /** The cohort's managers and teachers in the host organisation, and the learner's own mentor. */
  private async isStaff(p: Principal, cohort: CohortRow, pe: EnrollmentRow): Promise<boolean> {
    if (p.platformAdmin && !p.stale) return true;
    if (p.orgId !== cohort.hostOrgId) return false;
    if (hasOrgPermission(p, 'cohort.manage') || hasOrgPermission(p, 'course_run.teach')) return true;
    const [mentoring] = await this.db.sys
      .select({ id: mentorAssignments.id })
      .from(mentorAssignments)
      .where(and(eq(mentorAssignments.cohortId, cohort.id), eq(mentorAssignments.mentorUserId, p.userId), eq(mentorAssignments.learnerUserId, pe.userId), isNull(mentorAssignments.endedAt)));
    if (mentoring) return true;
    if (!this.authz) return false;
    return this.authz.check({ userId: p.userId, orgId: cohort.hostOrgId, permission: 'course_run.teach', authzVersion: p.authzVersion, fresh: p.stale, scopeType: 'cohort', scopeId: cohort.id });
  }
}
