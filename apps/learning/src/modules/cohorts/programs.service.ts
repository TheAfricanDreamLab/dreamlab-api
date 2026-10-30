import { Inject, Injectable } from '@nestjs/common';
import type { Cohort, MyProgram, ProgramDetail } from '@dreamlab/contracts';
import { hasOrgPermission, type Principal } from '@lib/auth';
import { badRequest, conflict, forbidden, newId, notFound } from '@lib/common';
import { InjectDatabase } from '@lib/database';
import { type ApplicantAdmitted, InjectOutbox, OutboxWriter, requestNotification, userActor } from '@lib/messaging';
import { CatalogClient } from '@lib/rpc';
import { and, asc, eq, gt, inArray, ne, notInArray, sql } from 'drizzle-orm';
import { LearningDatabase, LearningTx, schema } from '../../database';
import { LearningEvents } from '../../events';
import { CATALOG, flatItems } from '../enrollments/enrollments.service';
import { programmeScore, residencyItems } from '../grading/course-score';
import { addDays, todayIn, weekOf } from './calendar-time';
import { CohortRow, learnerCounts, toCalendarWeek, toCohort, toSession } from './cohorts.service';

const { cohorts, calendarWeeks, courseRuns, classSessions, programEnrollments, electiveSelections, attendance, courseEnrollments, itemProgress, submissions, residencyStages } = schema;
type ProgramEnrollmentRow = typeof programEnrollments.$inferSelect;
type RunRow = typeof courseRuns.$inferSelect;

const JOINABLE = ['open', 'running'] as const;
const UPCOMING_SESSIONS = 6;

/** Learner records are written as the learner, in the cohort's host organisation (the enrolment's context). */
const hostCtx = (p: Principal, cohort: CohortRow) => ({ orgId: cohort.hostOrgId, userId: p.userId });

/**
 * A phase's electives: chosen by the end of the week before the phase starts (selectByWeek), so the
 * deadline is the day before that phase's first week. Phases that start in week 1 have no deadline.
 */
export function electiveDeadline(cohort: Pick<CohortRow, 'startsOn'>, weekFrom: number | null) {
  const selectByWeek = weekFrom && weekFrom > 1 ? weekFrom - 1 : null;
  return { selectByWeek, deadline: selectByWeek ? addDays(cohort.startsOn, selectByWeek * 7 - 1) : null };
}

/**
 * Programmes as learners take them through cohorts (LRN-2): finding an intake, joining it,
 * "my programme" and choosing electives.
 */
@Injectable()
export class ProgramsService {
  constructor(
    @InjectDatabase() private readonly db: LearningDatabase,
    @InjectOutbox() private readonly outbox: OutboxWriter,
    @Inject(CATALOG) private readonly catalog: CatalogClient,
  ) {}

  /** Open and running intakes; invite-only ones only to members of the host. Host staff also see their drafts and closed cohorts. */
  async listForProgram(p: Principal | null, slug: string): Promise<{ items: Cohort[] }> {
    const rows = await this.db.sys.select().from(cohorts).where(eq(cohorts.programSlug, slug)).orderBy(asc(cohorts.startsOn));
    const staffOf = (c: CohortRow) => !!p && (p.platformAdmin || (p.orgId === c.hostOrgId && hasOrgPermission(p, 'cohort.manage')));
    const visible = rows.filter(
      (c) => staffOf(c) || ((JOINABLE as readonly string[]).includes(c.status) && (c.enrollmentPolicy === 'open' || (!!p && p.orgId === c.hostOrgId))),
    );
    const counts = await learnerCounts(this.db, visible.map((c) => c.id));
    return { items: visible.map((c) => toCohort(c, counts.get(c.id) ?? 0)) };
  }

  /** Enrols in the programme and its required courses. Joining twice returns the same enrolment. */
  async join(p: Principal, cohortId: string, requestId?: string): Promise<MyProgram> {
    const [cohort] = await this.db.sys.select().from(cohorts).where(eq(cohorts.id, cohortId));
    const member = !!cohort && p.orgId === cohort.hostOrgId;
    if (!cohort || (cohort.enrollmentPolicy === 'invite' && !member && !p.platformAdmin)) throw notFound('cohort_not_found', 'Cohort not found');
    if (cohort.enrollmentPolicy === 'invite' && !member) {
      throw forbidden('org_context_required', `Switch to ${cohort.hostOrgName} to join this cohort.`);
    }

    const enrollmentId = await this.db.tenant(hostCtx(p, cohort), (tx) => this.enrol(tx, p.userId, cohort, { requestId }));
    return this.myProgram(p, enrollmentId);
  }

  /**
   * Admissions admitted this person to the cohort (ADM-1): enrol them past its enrolment policy and
   * capacity, which admission replaces. Only into a cohort the admitting organisation hosts, for the
   * programme they applied to.
   */
  async admit(tx: LearningTx, e: ApplicantAdmitted): Promise<'enrolled' | 'mismatch'> {
    const [cohort] = await tx.select().from(cohorts).where(eq(cohorts.id, e.cohortId));
    if (!cohort || cohort.hostOrgId !== e.orgId || cohort.programSlug !== e.programSlug) return 'mismatch';
    await this.enrol(tx, e.userId, cohort, { admitted: true });
    return 'enrolled';
  }

  /** Enrols in the programme and its required courses; an existing active enrolment is kept. */
  private async enrol(tx: LearningTx, userId: string, cohort: CohortRow, opts: { requestId?: string; admitted?: boolean }): Promise<string> {
    // Locks the cohort first, so concurrent joins (the same person twice, or two people for the
    // last place) run one after the other and each sees what the other committed.
    const [locked] = await tx.select().from(cohorts).where(eq(cohorts.id, cohort.id)).for('update');
    const [existing] = await tx
      .select()
      .from(programEnrollments)
      .where(and(eq(programEnrollments.cohortId, cohort.id), eq(programEnrollments.userId, userId)));
    if (existing && existing.status !== 'withdrawn') return existing.id;

    if (!opts.admitted) {
      if (!locked || !(JOINABLE as readonly string[]).includes(locked.status)) throw conflict('cohort_not_open', 'This cohort isn’t taking learners.');
      const learners = (await learnerCounts(this.db, [cohort.id])).get(cohort.id) ?? 0;
      if (locked.capacity !== null && learners >= locked.capacity) throw conflict('cohort_full', 'This cohort is full.');
    }

    const id = existing?.id ?? newId();
    if (existing) {
      await tx.update(programEnrollments).set({ status: 'active', enrolledAt: new Date(), updatedAt: new Date() }).where(eq(programEnrollments.id, id));
    } else {
      await tx.insert(programEnrollments).values({ id, userId, programId: cohort.programId, programSlug: cohort.programSlug, cohortId: cohort.id, contextOrgId: cohort.hostOrgId });
    }
    const runs = await tx.select().from(courseRuns).where(and(eq(courseRuns.cohortId, cohort.id), eq(courseRuns.required, true)));
    for (const run of runs) await this.enrolInRun(tx, userId, cohort, id, run, opts.requestId);
    await requestNotification(
      this.outbox,
      tx,
      {
        to: { userIds: [userId] },
        category: 'cohorts',
        title: `Welcome to ${cohort.name}`,
        body: `You have joined ${cohort.name}. Your programme calendar, courses and class sessions are ready.`,
        link: '/app/programme',
        orgId: cohort.hostOrgId,
        key: `cohort-joined:${id}:${Date.now()}`,
      },
      userActor(userId),
    );
    return id;
  }

  async myPrograms(p: Principal): Promise<{ items: MyProgram[] }> {
    const rows = await this.db.tenant({ orgId: '', userId: p.userId }, (tx) =>
      tx
        .select()
        .from(programEnrollments)
        .where(and(eq(programEnrollments.userId, p.userId), ne(programEnrollments.status, 'withdrawn')))
        .orderBy(asc(programEnrollments.enrolledAt)),
    );
    return { items: await Promise.all(rows.map((r) => this.build(p, r))) };
  }

  /** Exactly chooseN courses from one elective group, before its deadline; enrols in each chosen course. */
  async chooseElective(p: Principal, enrollmentId: string, courseSlugs: string[], requestId?: string): Promise<MyProgram> {
    const enrollment = await this.ownEnrollment(p, enrollmentId);
    const [cohort] = await this.db.sys.select().from(cohorts).where(eq(cohorts.id, enrollment.cohortId));
    const program = await this.catalog.program(enrollment.programSlug);
    if (!cohort || !program) throw notFound('program_not_found', 'Programme not found');
    if (enrollment.status !== 'active') throw conflict('program_enrollment_inactive', 'Your place in this programme is not active.');
    if (!(JOINABLE as readonly string[]).includes(cohort.status) && cohort.status !== 'closed') throw conflict('cohort_not_open', 'This cohort isn’t running yet.');

    const slugs = [...new Set(courseSlugs)];
    const runs = await this.db.sys
      .select()
      .from(courseRuns)
      .where(and(eq(courseRuns.cohortId, cohort.id), inArray(courseRuns.courseSlug, slugs)));
    const groups = new Set(runs.map((r) => r.electiveGroupKey));
    const group = runs[0]?.electiveGroupKey;
    if (runs.length !== slugs.length || groups.size !== 1 || !group) {
      throw badRequest('not_electives_of_one_group', 'Choose courses from one elective group of this programme.');
    }
    const phase = program.phases.find((ph) => ph.name === group);
    if (!phase?.chooseN) throw badRequest('not_electives_of_one_group', 'Choose courses from one elective group of this programme.');
    if (slugs.length !== phase.chooseN) throw badRequest('wrong_number_of_electives', `Choose exactly ${phase.chooseN} of the ${group} courses.`);
    if (this.electiveLocked(cohort, phase.weekFrom)) throw conflict('electives_locked', `The deadline to choose ${group} courses has passed.`);

    // One transaction, serialized per programme enrolment, so two choices made at once can't each
    // remove the other's new enrolment. The learner's ownership was checked above (ownEnrollment).
    await this.db.system(async (tx) => {
      await tx.select({ id: programEnrollments.id }).from(programEnrollments).where(eq(programEnrollments.id, enrollment.id)).for('update');
      // A new choice replaces the earlier one; courses already started stay enrolled, with their progress.
      await tx.delete(electiveSelections).where(and(eq(electiveSelections.programEnrollmentId, enrollment.id), eq(electiveSelections.groupKey, group)));
      await tx.insert(electiveSelections).values(
        runs.map((r) => ({ id: newId(), programEnrollmentId: enrollment.id, userId: p.userId, groupKey: group, courseId: r.courseId, courseSlug: r.courseSlug })),
      );
      for (const run of runs) await this.enrolInRun(tx, p.userId, cohort, enrollment.id, run, requestId);
      await this.dropUnopenedElectives(tx, p, enrollment.id, cohort.id, group, runs.map((r) => r.id));
    });
    return this.myProgram(p, enrollment.id);
  }

  /**
   * After a new choice, enrolments in the group's other courses go if the learner never opened them,
   * so switching back and forth can't collect every elective. Opened ones stay, with their progress.
   */
  private async dropUnopenedElectives(tx: LearningTx, p: Principal, programEnrollmentId: string, cohortId: string, group: string, keepRunIds: string[]) {
    const others = await tx
      .select({ id: courseRuns.id })
      .from(courseRuns)
      .where(and(eq(courseRuns.cohortId, cohortId), eq(courseRuns.electiveGroupKey, group), notInArray(courseRuns.id, keepRunIds)));
    if (others.length === 0) return;
    const candidates = await tx
      .select({ id: courseEnrollments.id })
      .from(courseEnrollments)
      .where(
        and(
          eq(courseEnrollments.userId, p.userId),
          eq(courseEnrollments.programEnrollmentId, programEnrollmentId),
          inArray(courseEnrollments.courseRunId, others.map((o) => o.id)),
          sql`not exists (select 1 from ${itemProgress} where ${itemProgress.courseEnrollmentId} = ${courseEnrollments.id})`,
          sql`not exists (select 1 from ${submissions} where ${submissions.courseEnrollmentId} = ${courseEnrollments.id})`,
        ),
      );
    if (candidates.length > 0) await tx.delete(courseEnrollments).where(inArray(courseEnrollments.id, candidates.map((c) => c.id)));
  }

  async myProgram(p: Principal, enrollmentId: string): Promise<MyProgram> {
    return this.build(p, await this.ownEnrollment(p, enrollmentId));
  }

  // ---------- internals ----------

  private async ownEnrollment(p: Principal, enrollmentId: string): Promise<ProgramEnrollmentRow> {
    const [row] = await this.db.tenant({ orgId: '', userId: p.userId }, (tx) => tx.select().from(programEnrollments).where(eq(programEnrollments.id, enrollmentId)));
    if (!row) throw notFound('program_enrollment_not_found', 'Programme enrolment not found');
    return row;
  }

  private electiveLocked(cohort: CohortRow, weekFrom: number | null, now = new Date()): boolean {
    const { deadline } = electiveDeadline(cohort, weekFrom);
    return cohort.status === 'closed' || (deadline !== null && todayIn(cohort.timeZone, now) > deadline);
  }

  /** A course enrolment for the run, or the learner's existing one in the same context, linked to the programme. */
  private async enrolInRun(tx: LearningTx, userId: string, cohort: CohortRow, programEnrollmentId: string, run: RunRow, requestId?: string) {
    const [existing] = await tx
      .select()
      .from(courseEnrollments)
      .where(and(eq(courseEnrollments.userId, userId), eq(courseEnrollments.courseId, run.courseId), eq(courseEnrollments.contextOrgId, cohort.hostOrgId)));
    if (existing) {
      if (!existing.programEnrollmentId) {
        await tx.update(courseEnrollments).set({ courseRunId: run.id, programEnrollmentId, updatedAt: new Date() }).where(eq(courseEnrollments.id, existing.id));
      }
      return;
    }
    const content = run.courseVersionId ? await this.catalog.version(run.courseVersionId) : await this.catalog.current(run.courseSlug);
    // Courses still coming soon have no content yet; the learner is enrolled once they are published.
    if (!content) return;
    const [row] = await tx
      .insert(courseEnrollments)
      .values({
        id: newId(),
        userId: userId,
        courseId: run.courseId,
        courseSlug: run.courseSlug,
        courseVersionId: content.version.id,
        courseRunId: run.id,
        programEnrollmentId,
        contextOrgId: cohort.hostOrgId,
        accessSource: 'grant',
        totalItems: flatItems(content).filter((i) => i.required).length,
      })
      .onConflictDoNothing()
      .returning();
    if (!row) return;
    await this.outbox.add(tx, {
      type: LearningEvents.EnrollmentCreated,
      orgId: cohort.hostOrgId,
      actor: userActor(userId),
      requestId,
      payload: { enrollmentId: row.id, userId: userId, courseId: row.courseId, versionId: row.courseVersionId, contextOrgId: cohort.hostOrgId, programEnrollmentId },
    });
  }

  private async build(p: Principal, pe: ProgramEnrollmentRow, now = new Date()): Promise<MyProgram> {
    const [cohort] = await this.db.sys.select().from(cohorts).where(eq(cohorts.id, pe.cohortId));
    if (!cohort) throw notFound('cohort_not_found', 'Cohort not found');
    const [weeks, upcoming, runs, program, counts, mine, held, attended] = await Promise.all([
      this.db.sys.select().from(calendarWeeks).where(eq(calendarWeeks.cohortId, cohort.id)).orderBy(asc(calendarWeeks.weekNo)),
      this.db.sys
        .select()
        .from(classSessions)
        .where(and(eq(classSessions.cohortId, cohort.id), eq(classSessions.cancelled, false), gt(sql`${classSessions.startsAt} + make_interval(mins => ${classSessions.durationMin})`, now)))
        .orderBy(asc(classSessions.startsAt))
        .limit(UPCOMING_SESSIONS),
      this.db.sys.select().from(courseRuns).where(eq(courseRuns.cohortId, cohort.id)).orderBy(asc(courseRuns.startsOn)),
      this.catalog.program(cohort.programSlug),
      learnerCounts(this.db, [cohort.id]),
      this.db.tenant(hostCtx(p, cohort), async (tx) => ({
        enrollments: await tx.select().from(courseEnrollments).where(and(eq(courseEnrollments.userId, p.userId), eq(courseEnrollments.contextOrgId, cohort.hostOrgId))),
        selections: await tx.select().from(electiveSelections).where(eq(electiveSelections.programEnrollmentId, pe.id)),
      })),
      this.db.sys
        .select({ n: sql<number>`count(*)::int` })
        .from(classSessions)
        .where(and(eq(classSessions.cohortId, cohort.id), eq(classSessions.cancelled, false), sql`${classSessions.startsAt} < ${now}`)),
      this.db.tenant({ orgId: '', userId: p.userId }, (tx) =>
        tx
          .select({ n: sql<number>`count(*)::int` })
          .from(attendance)
          .where(and(eq(attendance.programEnrollmentId, pe.id), inArray(attendance.status, ['present', 'late']))),
      ),
    ]);

    const summaries = await this.catalog.courseSummaries([...new Set(runs.map((r) => r.courseId))]);
    const enrolmentOf = new Map(mine.enrollments.map((e) => [e.courseId, e]));
    const chosen = new Set(mine.selections.map((s) => s.courseId));
    const currentWeek = weekOf(cohort.startsOn, cohort.weeks, todayIn(cohort.timeZone, now));
    const calendar = weeks.map(toCalendarWeek);

    const courses = runs
      .filter((r) => r.required || chosen.has(r.courseId))
      .flatMap((r) => {
        const course = summaries.get(r.courseId);
        const e = enrolmentOf.get(r.courseId);
        return course
          ? [{ course, phase: r.phaseName, required: r.required, enrollmentId: e?.id ?? null, progressPct: e?.progressPct ?? 0, creditHours: r.creditHours, score: e?.finalScore ?? null }]
          : [];
      });

    const electives = this.electives(cohort, program, runs, summaries, mine.selections.map((s) => ({ group: s.groupKey, slug: s.courseSlug })), now);
    // Approved Dream Residency stages count towards the Programme Score with their credit hours.
    const approvedStages = await this.db.sys
      .select({ position: residencyStages.position, score: residencyStages.scorePct })
      .from(residencyStages)
      .where(and(eq(residencyStages.programEnrollmentId, pe.id), eq(residencyStages.status, 'approved')));
    const stages = residencyItems(program?.capstoneStages ?? [], new Map(approvedStages.map((r) => [r.position, r.score!])));

    return {
      enrollment: { id: pe.id, status: pe.status, enrolledAt: pe.enrolledAt.toISOString() },
      cohort: toCohort(cohort, counts.get(cohort.id) ?? 0, now),
      thisWeek: calendar.find((w) => w.weekNo === currentWeek) ?? null,
      calendar,
      upcomingSessions: upcoming.map(toSession),
      courses,
      score: programmeScore([...courses.map((c) => ({ credits: c.creditHours, score: c.score })), ...stages]),
      electives,
      attendance: { attended: attended[0]?.n ?? 0, held: held[0]?.n ?? 0 },
    };
  }

  private electives(
    cohort: CohortRow,
    program: ProgramDetail | null,
    runs: RunRow[],
    summaries: Map<string, MyProgram['courses'][number]['course']>,
    selections: Array<{ group: string; slug: string }>,
    now: Date,
  ): MyProgram['electives'] {
    const groups = [...new Set(runs.flatMap((r) => (r.electiveGroupKey ? [r.electiveGroupKey] : [])))];
    return groups.map((group) => {
      const phase = program?.phases.find((ph) => ph.name === group);
      const weekFrom = phase?.weekFrom ?? null;
      return {
        phase: group,
        chooseN: phase?.chooseN ?? 1,
        ...electiveDeadline(cohort, weekFrom),
        options: runs.filter((r) => r.electiveGroupKey === group).flatMap((r) => summaries.get(r.courseId) ?? []),
        chosen: selections.filter((s) => s.group === group).map((s) => s.slug),
        locked: this.electiveLocked(cohort, weekFrom, now),
      };
    });
  }
}
