import { Inject, Injectable } from '@nestjs/common';
import type { ProgramDetail } from '@dreamlab/contracts';
import type { Principal } from '@lib/auth';
import { notFound } from '@lib/common';
import { InjectDatabase } from '@lib/database';
import { CatalogClient, IamRpc, RpcClient, UserName } from '@lib/rpc';
import { and, asc, eq, inArray, lt, sql } from 'drizzle-orm';
import { LearningDatabase, schema } from '../../database';
import { CohortRow, CohortsService } from '../cohorts/cohorts.service';
import { CATALOG } from '../enrollments/enrollments.service';
import { IAM_NAMES } from '../player/player.service';
import { creditsEarned, programmeScore, residencyItems } from '../grading/course-score';

const { programEnrollments, cohorts, courseRuns, courseEnrollments, residencyStages, actionPlans, attendance, classSessions } = schema;
export type ProgramEnrollmentRow = typeof programEnrollments.$inferSelect;
export type StageRow = typeof residencyStages.$inferSelect;
export type ActionPlanRow = typeof actionPlans.$inferSelect;

/** Who is looking at a learner's outcomes. */
export interface OutcomesContext {
  pe: ProgramEnrollmentRow;
  cohort: CohortRow;
  program: ProgramDetail;
  isLearner: boolean;
  /** Reviews residency work and confirms graduation requirements. */
  isFaculty: boolean;
  /** Graduates learners and revokes credentials. */
  isManager: boolean;
}

export interface CourseResult {
  courseId: string;
  slug: string;
  phaseName: string;
  credits: number;
  score: number | null;
  completed: boolean;
  enrollmentId: string | null;
  versionId: string | null;
}

/** Everything the outcomes views are computed from, read once per request. */
export interface Progress {
  courses: CourseResult[];
  stages: Map<number, StageRow>;
  plan: ActionPlanRow | null;
  attendance: { attended: number; held: number };
  programmeScore: number | null;
  creditsEarned: number;
  creditsTotal: number;
}

/** Statuses that count as having been at a class (as on the roster). */
const ATTENDED = ['present', 'late'] as const;

/**
 * Access and the shared reads for Slice 3 outcomes. The learner sees their own; the cohort's faculty
 * (managers, teachers, the host's graders) see their learners'; anyone else: not found.
 */
@Injectable()
export class ProgressService {
  constructor(
    @InjectDatabase() private readonly db: LearningDatabase,
    @Inject(CATALOG) private readonly catalog: CatalogClient,
    @Inject(IAM_NAMES) private readonly iam: RpcClient,
    private readonly cohortsService: CohortsService,
  ) {}

  async access(p: Principal, enrollmentId: string): Promise<OutcomesContext> {
    const [pe] = await this.db.sys.select().from(programEnrollments).where(eq(programEnrollments.id, enrollmentId));
    const [cohort] = pe ? await this.db.sys.select().from(cohorts).where(eq(cohorts.id, pe.cohortId)) : [];
    if (!pe || !cohort) throw notFound('program_enrollment_not_found', 'Programme enrolment not found');
    const isLearner = pe.userId === p.userId;
    const [isFaculty, isManager] = isLearner ? [false, false] : await Promise.all([this.cohortsService.isCohortFaculty(p, cohort), this.cohortsService.isCohortManager(p, cohort)]);
    if (!isLearner && !isFaculty) throw notFound('program_enrollment_not_found', 'Programme enrolment not found');
    return { pe, cohort, program: await this.program(cohort), isLearner, isFaculty, isManager };
  }

  /** For staff boards: a cohort its faculty may see. */
  async cohortForFaculty(p: Principal, cohortId: string): Promise<{ cohort: CohortRow; program: ProgramDetail; isManager: boolean }> {
    const [cohort] = await this.db.sys.select().from(cohorts).where(eq(cohorts.id, cohortId));
    if (!cohort || !(await this.cohortsService.isCohortFaculty(p, cohort))) throw notFound('cohort_not_found', 'Cohort not found');
    return { cohort, program: await this.program(cohort), isManager: await this.cohortsService.isCohortManager(p, cohort) };
  }

  async program(cohort: CohortRow): Promise<ProgramDetail> {
    const program = await this.catalog.program(cohort.programSlug);
    if (!program) throw notFound('program_not_found', 'This cohort’s programme is no longer available');
    return program;
  }

  async load(ctx: Pick<OutcomesContext, 'pe' | 'cohort' | 'program'>, now = new Date()): Promise<Progress> {
    const [runs, enrolled, stageRows, [plan], [attended], [held]] = await Promise.all([
      this.db.sys.select().from(courseRuns).where(eq(courseRuns.cohortId, ctx.cohort.id)).orderBy(asc(courseRuns.startsOn)),
      this.db.sys.select().from(courseEnrollments).where(eq(courseEnrollments.programEnrollmentId, ctx.pe.id)),
      this.db.sys.select().from(residencyStages).where(eq(residencyStages.programEnrollmentId, ctx.pe.id)),
      this.db.sys.select().from(actionPlans).where(eq(actionPlans.programEnrollmentId, ctx.pe.id)),
      this.db.sys
        .select({ n: sql<number>`count(*)::int` })
        .from(attendance)
        .where(and(eq(attendance.programEnrollmentId, ctx.pe.id), inArray(attendance.status, [...ATTENDED]))),
      this.db.sys
        .select({ n: sql<number>`count(*)::int` })
        .from(classSessions)
        .where(and(eq(classSessions.cohortId, ctx.cohort.id), eq(classSessions.cancelled, false), lt(classSessions.startsAt, now))),
    ]);
    const byCourse = new Map(enrolled.map((e) => [e.courseId, e]));
    // Required courses, and the electives the learner took (they have an enrolment in the run).
    const courses: CourseResult[] = runs
      .filter((r) => r.required || byCourse.has(r.courseId))
      .map((r) => {
        const e = byCourse.get(r.courseId);
        return {
          courseId: r.courseId,
          slug: r.courseSlug,
          phaseName: r.phaseName,
          credits: r.creditHours,
          score: e?.finalScore ?? null,
          completed: e?.status === 'completed',
          enrollmentId: e?.id ?? null,
          versionId: e?.courseVersionId ?? null,
        };
      });
    const stages = new Map(stageRows.map((s) => [s.position, s]));
    const approved = new Map(stageRows.filter((s) => s.status === 'approved' && s.scorePct !== null).map((s) => [s.position, s.scorePct!]));
    const stageItems = residencyItems(ctx.program.capstoneStages, approved);
    const courseItems = courses.map((c) => ({ credits: c.credits, score: c.score }));
    const score = programmeScore([...courseItems, ...stageItems]);
    return {
      courses,
      stages,
      plan: plan ?? null,
      attendance: { attended: attended?.n ?? 0, held: held?.n ?? 0 },
      programmeScore: score.programmeScore,
      creditsEarned: creditsEarned(courseItems, stageItems),
      creditsTotal: score.totalCredits,
    };
  }

  async names(ids: (string | null | undefined)[]): Promise<Map<string, string>> {
    const unique = [...new Set(ids.filter((id): id is string => !!id))];
    if (unique.length === 0) return new Map();
    const rows = await this.iam.send<UserName[]>(IamRpc.UserNames, { userIds: unique }).catch(() => [] as UserName[]);
    return new Map(rows.map((r) => [r.id, r.name]));
  }

  async orgName(orgId: string | null): Promise<string> {
    if (!orgId) return PLATFORM_NAME;
    const [row] = await this.iam.send<{ id: string; name: string }[]>(IamRpc.OrgNames, { ids: [orgId] }).catch(() => []);
    return row?.name ?? PLATFORM_NAME;
  }
}

/** The issuer of self-paced platform learning. */
export const PLATFORM_NAME = 'The African Dream Lab';
