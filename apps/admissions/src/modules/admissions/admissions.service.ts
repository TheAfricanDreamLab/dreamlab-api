import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import {
  ADMISSION_STAGES,
  type AdmissionCycle,
  type AdmissionStage,
  type AiEvaluation,
  type Application,
  type ApplicationReview,
  type ApplicationStatus,
  type ApplicationSummary,
  APPLICANT_STAGES,
  type ApplicantStage,
  compositeScores,
  type DimensionScores,
  StageAnswerSchemas,
} from '@dreamlab/contracts';
import { hasOrgPermission, type Principal } from '@lib/auth';
import { AppException, badRequest, conflict, forbidden, newId, notFound } from '@lib/common';
import { InjectConfig } from '@lib/config';
import { InjectDatabase } from '@lib/database';
import { APPLICANT_ADMITTED, type ApplicantAdmitted, InjectOutbox, OutboxWriter, requestNotification, userActor } from '@lib/messaging';
import { CatalogClient, IamRpc, RpcClient, UserName } from '@lib/rpc';
import { and, asc, desc, eq, inArray, lte, gt, sql } from 'drizzle-orm';
import { createHash } from 'node:crypto';
import type { AdmissionsConfig } from '../../config';
import { AdmissionsDatabase, AdmissionsTx, schema } from '../../database';
import { AiEvaluator, evaluationInput } from './ai-evaluator';

export const IAM = Symbol('IAM');
export const CATALOG = Symbol('CATALOG');
export const AI_EVALUATOR = Symbol('AI_EVALUATOR');

const { admissionCycles, applications, stageTransitions, applicationReviews, aiEvaluations } = schema;
type CycleRow = typeof admissionCycles.$inferSelect;
type ApplicationRow = typeof applications.$inferSelect;

/** Draft answers are capped so a stage cannot be used to store arbitrary data. */
const MAX_DRAFT_CHARS = 40_000;
const STAFF_PERMISSIONS = ['admissions.review', 'admissions.manage', 'admissions.decide'] as const;
const ORG_NAME_TTL_MS = 5 * 60_000;

const nextStage = (s: AdmissionStage): AdmissionStage | null => ADMISSION_STAGES[ADMISSION_STAGES.indexOf(s) + 1] ?? null;
const isApplicantStage = (s: AdmissionStage): s is ApplicantStage => (APPLICANT_STAGES as readonly string[]).includes(s);
const cycleAccepting = (c: CycleRow, now = new Date()) => c.status === 'open' && c.opensAt <= now && c.closesAt > now;

/**
 * Admissions (ADM-1): cycles, the ten-stage pipeline and its records. Applicants complete the
 * first six stages; staff of the cycle's organisation review, interview, award scholarships and
 * decide. Transitions, reviews and AI evaluations are append-only; every decision is a person's.
 */
@Injectable()
export class AdmissionsService {
  private readonly orgNames = new Map<string, { name: string; expires: number }>();

  constructor(
    @InjectDatabase() private readonly db: AdmissionsDatabase,
    @InjectOutbox() private readonly outbox: OutboxWriter,
    @InjectConfig() private readonly config: AdmissionsConfig,
    @Inject(IAM) private readonly iam: RpcClient,
    @Inject(CATALOG) private readonly catalog: CatalogClient,
    @Inject(AI_EVALUATOR) private readonly ai: AiEvaluator,
  ) {}

  // ---------- cycles ----------

  async openCycles(programSlug?: string, now = new Date()): Promise<{ items: AdmissionCycle[] }> {
    const rows = await this.db.sys
      .select()
      .from(admissionCycles)
      .where(
        and(
          eq(admissionCycles.status, 'open'),
          lte(admissionCycles.opensAt, now),
          gt(admissionCycles.closesAt, now),
          programSlug ? eq(admissionCycles.programSlug, programSlug) : undefined,
        ),
      )
      .orderBy(asc(admissionCycles.closesAt));
    return { items: await this.cycleViews(rows) };
  }

  async cycles(p: Principal): Promise<{ items: AdmissionCycle[] }> {
    const orgId = this.staffOrg(p);
    const rows = await this.db.sys.select().from(admissionCycles).where(eq(admissionCycles.orgId, orgId)).orderBy(desc(admissionCycles.opensAt));
    return { items: await this.cycleViews(rows) };
  }

  async createCycle(p: Principal, input: { name: string; programSlug: string; cohortId: string | null; opensAt: string; closesAt: string }): Promise<AdmissionCycle> {
    const orgId = this.staffOrg(p);
    const program = await this.catalog.program(input.programSlug);
    if (!program) throw notFound('program_not_found', 'Programme not found');
    const [row] = await this.db.system((tx) =>
      tx
        .insert(admissionCycles)
        .values({
          id: newId(),
          orgId,
          name: input.name,
          programSlug: program.slug,
          programTitle: program.title,
          cohortId: input.cohortId,
          opensAt: new Date(input.opensAt),
          closesAt: new Date(input.closesAt),
          createdByUserId: p.userId,
        })
        .returning(),
    );
    return (await this.cycleViews([row!]))[0]!;
  }

  async updateCycle(
    p: Principal,
    cycleId: string,
    input: { name?: string; cohortId?: string | null; opensAt?: string; closesAt?: string; status?: 'draft' | 'open' | 'closed' },
  ): Promise<AdmissionCycle> {
    const cycle = await this.staffCycle(p, cycleId);
    const opensAt = input.opensAt ? new Date(input.opensAt) : cycle.opensAt;
    const closesAt = input.closesAt ? new Date(input.closesAt) : cycle.closesAt;
    if (closesAt <= opensAt) throw badRequest('invalid_dates', 'The cycle must close after it opens.');
    const updated = await this.db.system(async (tx) => {
      const [row] = await tx
        .update(admissionCycles)
        .set({ name: input.name ?? cycle.name, cohortId: input.cohortId === undefined ? cycle.cohortId : input.cohortId, opensAt, closesAt, status: input.status ?? cycle.status })
        .where(eq(admissionCycles.id, cycle.id))
        .returning();
      // A cohort chosen after people were admitted: they join it now.
      if (row!.cohortId && row!.cohortId !== cycle.cohortId) {
        const admitted = await tx.select().from(applications).where(and(eq(applications.cycleId, cycle.id), eq(applications.status, 'admitted')));
        for (const a of admitted) await this.emitAdmitted(tx, a, row!, p.userId);
      }
      return row!;
    });
    return (await this.cycleViews([updated]))[0]!;
  }

  async pipeline(p: Principal, cycleId: string, filter: { stage?: AdmissionStage; status?: ApplicationStatus }) {
    const cycle = await this.staffCycle(p, cycleId);
    const rows = await this.db.sys.select().from(applications).where(eq(applications.cycleId, cycle.id)).orderBy(desc(applications.updatedAt));
    const counts = Object.fromEntries(ADMISSION_STAGES.map((s) => [s, 0])) as Record<AdmissionStage, number>;
    const statusCounts: Partial<Record<ApplicationStatus, number>> = {};
    for (const r of rows) {
      counts[r.stage] += 1;
      statusCounts[r.status] = (statusCounts[r.status] ?? 0) + 1;
    }
    const shown = rows.filter((r) => (!filter.stage || r.stage === filter.stage) && (!filter.status || r.status === filter.status));
    const [view] = await this.cycleViews([cycle]);
    return { cycle: view!, counts, statusCounts, items: await this.summaries(shown, new Map([[cycle.id, view!]]), true) };
  }

  // ---------- applicant ----------

  async start(p: Principal, cycleId: string): Promise<Application> {
    const [cycle] = await this.db.sys.select().from(admissionCycles).where(eq(admissionCycles.id, cycleId));
    if (!cycle || cycle.status === 'draft') throw notFound('cycle_not_found', 'Admission cycle not found');
    const id = await this.db.system(async (tx) => {
      const [existing] = await tx.select({ id: applications.id }).from(applications).where(and(eq(applications.cycleId, cycle.id), eq(applications.userId, p.userId)));
      if (existing) return existing.id;
      if (!cycleAccepting(cycle)) throw conflict('cycle_closed', 'This admission cycle is not taking applications.');
      const [row] = await tx
        .insert(applications)
        .values({ id: newId(), cycleId: cycle.id, orgId: cycle.orgId, userId: p.userId })
        .onConflictDoNothing()
        .returning();
      if (!row) return (await tx.select({ id: applications.id }).from(applications).where(and(eq(applications.cycleId, cycle.id), eq(applications.userId, p.userId))))[0]!.id;
      await this.transition(tx, row, null, 'eligibility', 'in_progress', p.userId, true, null);
      return row.id;
    });
    return this.get(p, id);
  }

  async mine(p: Principal): Promise<{ items: ApplicationSummary[] }> {
    const rows = await this.db.sys.select().from(applications).where(eq(applications.userId, p.userId)).orderBy(desc(applications.updatedAt));
    return { items: await this.summaries(rows, await this.cyclesById(rows), false) };
  }

  async saveStage(p: Principal, applicationId: string, stage: AdmissionStage, answers: Record<string, unknown>): Promise<Application> {
    if (JSON.stringify(answers).length > MAX_DRAFT_CHARS) throw badRequest('answers_too_long', 'These answers are too long to save.');
    await this.applicantChange(p, applicationId, stage, async (tx, app) => {
      await tx.update(applications).set({ answers: { ...app.answers, [stage]: answers } }).where(eq(applications.id, app.id));
    });
    return this.get(p, applicationId);
  }

  async submitStage(p: Principal, applicationId: string, stage: AdmissionStage): Promise<Application> {
    await this.applicantChange(p, applicationId, stage, async (tx, app, cycle) => {
      const parsed = StageAnswerSchemas[stage as ApplicantStage].safeParse(app.answers[stage] ?? {});
      if (!parsed.success) {
        const issue = parsed.error.issues[0];
        throw badRequest('stage_incomplete', issue ? `${issue.path.join('.') || 'answers'}: ${issue.message}` : 'Complete this stage first.', parsed.error.issues);
      }
      const to = nextStage(stage)!;
      const status: ApplicationStatus = isApplicantStage(to) ? 'in_progress' : 'under_review';
      await tx
        .update(applications)
        .set({ answers: { ...app.answers, [stage]: parsed.data as Record<string, unknown> }, submitted: { ...app.submitted, [stage]: new Date().toISOString() }, stage: to, status })
        .where(eq(applications.id, app.id));
      await this.transition(tx, app, stage, to, status, p.userId, true, null);
      if (status === 'under_review') {
        await requestNotification(
          this.outbox,
          tx,
          {
            to: { permission: { orgId: app.orgId, permission: 'admissions.review' } },
            exclude: [app.userId],
            category: 'admissions',
            title: `New application in ${cycle.name}`,
            body: 'An applicant has completed every stage and is ready for review.',
            link: `/app/admissions/applications/${app.id}`,
            orgId: app.orgId,
            key: `application-ready:${app.id}`,
          },
          userActor(p.userId),
        );
      }
    });
    return this.get(p, applicationId);
  }

  async withdraw(p: Principal, applicationId: string): Promise<Application> {
    await this.db.system(async (tx) => {
      const app = await this.lock(tx, applicationId);
      if (!app || app.userId !== p.userId) throw notFound('application_not_found', 'Application not found');
      if (!['in_progress', 'under_review', 'waitlisted'].includes(app.status)) throw conflict('application_closed', 'This application has already been decided.');
      await tx.update(applications).set({ status: 'withdrawn' }).where(eq(applications.id, app.id));
      await this.transition(tx, app, app.stage, app.stage, 'withdrawn', p.userId, true, null);
    });
    return this.get(p, applicationId);
  }

  // ---------- staff ----------

  async review(p: Principal, applicationId: string, input: { scores: DimensionScores; recommendation: 'advance' | 'hold' | 'decline'; comment: string }): Promise<Application> {
    await this.staffChange(p, applicationId, ['under_review', 'waitlisted'], async (tx, app) => {
      const { dbpi, dsi } = compositeScores(input.scores);
      await tx.insert(applicationReviews).values({
        id: newId(),
        applicationId: app.id,
        orgId: app.orgId,
        stage: app.stage,
        reviewerUserId: p.userId,
        scores: input.scores,
        dbpi,
        dsi,
        recommendation: input.recommendation,
        comment: input.comment,
      });
      await tx.update(applications).set({ updatedAt: new Date() }).where(eq(applications.id, app.id));
    });
    return this.get(p, applicationId);
  }

  async aiEvaluate(p: Principal, applicationId: string): Promise<Application> {
    const app = await this.staffApplication(p, applicationId);
    if (!this.ai.enabled) throw new AppException(HttpStatus.SERVICE_UNAVAILABLE, 'ai_unavailable', 'AI evaluations are not set up on this platform.');
    if (app.status === 'in_progress' || app.status === 'withdrawn') throw conflict('application_not_submitted', 'Evaluate an application once the applicant has completed every stage.');
    const [{ n } = { n: 0 }] = await this.db.sys.select({ n: sql<number>`count(*)::int` }).from(aiEvaluations).where(eq(aiEvaluations.applicationId, app.id));
    if (n >= this.config.ADMISSIONS_AI_MAX_PER_APPLICATION) throw conflict('ai_limit_reached', 'This application already has the most AI evaluations allowed.');
    const result = await this.ai.evaluate(app.answers);
    const { dbpi, dsi } = compositeScores(result.scores);
    await this.db.system((tx) =>
      tx.insert(aiEvaluations).values({
        id: newId(),
        applicationId: app.id,
        orgId: app.orgId,
        model: result.model,
        promptVersion: result.promptVersion,
        scores: result.scores,
        dbpi,
        dsi,
        rationale: result.rationale,
        inputDigest: createHash('sha256').update(evaluationInput(app.answers)).digest('hex'),
        requestedByUserId: p.userId,
      }),
    );
    return this.get(p, applicationId);
  }

  async advance(p: Principal, applicationId: string, note: string | null): Promise<Application> {
    await this.staffChange(p, applicationId, ['under_review'], async (tx, app) => {
      const to = nextStage(app.stage);
      if (!to || isApplicantStage(app.stage)) throw conflict('cannot_advance', 'This application cannot move on from here.');
      if (app.stage === 'interview' && !app.interview) throw conflict('interview_missing', 'Schedule the interview and record its notes first.');
      if (app.stage === 'scholarship' && !app.scholarship) throw conflict('scholarship_missing', 'Record the scholarship award (0% if none) first.');
      if (app.stage === 'committee') {
        const [review] = await tx.select({ id: applicationReviews.id }).from(applicationReviews).where(eq(applicationReviews.applicationId, app.id)).limit(1);
        if (!review) throw conflict('review_missing', 'The committee needs at least one scored review first.');
      }
      await tx.update(applications).set({ stage: to }).where(eq(applications.id, app.id));
      await this.transition(tx, app, app.stage, to, app.status, p.userId, false, note);
    });
    return this.get(p, applicationId);
  }

  async interview(p: Principal, applicationId: string, input: { scheduledAt: string; interviewerUserId: string | null; notes: string }): Promise<Application> {
    if (input.interviewerUserId) {
      const app = await this.staffApplication(p, applicationId);
      const holders = await this.iam.send<string[]>(IamRpc.PermissionHolders, { orgId: app.orgId, permission: 'admissions.review' });
      if (!holders.includes(input.interviewerUserId)) throw badRequest('not_a_reviewer', 'The interviewer must be on the organisation’s admissions team.');
    }
    await this.staffChange(p, applicationId, ['under_review'], async (tx, app) => {
      if (app.stage !== 'interview') throw conflict('wrong_stage', 'Interviews are scheduled at the Interview stage.');
      const moved = app.interview?.scheduledAt !== new Date(input.scheduledAt).toISOString();
      const scheduledAt = new Date(input.scheduledAt).toISOString();
      await tx.update(applications).set({ interview: { scheduledAt, interviewerUserId: input.interviewerUserId, notes: input.notes } }).where(eq(applications.id, app.id));
      if (moved) {
        await requestNotification(
          this.outbox,
          tx,
          {
            to: { userIds: [app.userId] },
            category: 'admissions',
            title: 'Your admissions interview',
            body: `Your interview is scheduled for ${scheduledAt.slice(0, 16).replace('T', ' ')} UTC.`,
            link: `/app/apply/${app.id}`,
            orgId: app.orgId,
            key: `interview:${app.id}:${scheduledAt}`,
          },
          userActor(p.userId),
        );
      }
    });
    return this.get(p, applicationId);
  }

  async scholarship(p: Principal, applicationId: string, input: { percent: number; note: string }): Promise<Application> {
    await this.staffChange(p, applicationId, ['under_review', 'waitlisted'], async (tx, app) => {
      if (!['scholarship', 'committee', 'decision'].includes(app.stage)) throw conflict('wrong_stage', 'Scholarships are awarded from the Scholarship Review stage on.');
      await tx
        .update(applications)
        .set({ scholarship: { percent: input.percent, note: input.note, decidedByUserId: p.userId, decidedAt: new Date().toISOString() } })
        .where(eq(applications.id, app.id));
      await this.transition(tx, app, app.stage, app.stage, app.status, p.userId, false, `Scholarship ${input.percent}%: ${input.note}`);
    });
    return this.get(p, applicationId);
  }

  async decide(p: Principal, applicationId: string, input: { outcome: 'admitted' | 'waitlisted' | 'declined'; note: string }): Promise<Application> {
    await this.staffChange(p, applicationId, ['under_review', 'waitlisted'], async (tx, app, cycle) => {
      if (app.stage !== 'decision') throw conflict('wrong_stage', 'Move the application to the Decision stage first.');
      const decidedAt = new Date().toISOString();
      const [row] = await tx
        .update(applications)
        .set({ status: input.outcome, decision: { outcome: input.outcome, note: input.note, decidedByUserId: p.userId, decidedAt } })
        .where(eq(applications.id, app.id))
        .returning();
      await this.transition(tx, app, app.stage, app.stage, input.outcome, p.userId, false, input.note);
      const message = {
        admitted: { title: `You are admitted to ${cycle.programTitle}`, body: `Congratulations: you have a place in ${cycle.name}.` },
        waitlisted: { title: `Your application to ${cycle.name}`, body: 'You are on the waitlist. We will tell you as soon as a place opens.' },
        declined: { title: `Your application to ${cycle.name}`, body: 'We are unable to offer you a place in this cycle. Thank you for applying.' },
      }[input.outcome];
      await requestNotification(
        this.outbox,
        tx,
        { to: { userIds: [app.userId] }, category: 'admissions', ...message, link: `/app/apply/${app.id}`, orgId: app.orgId, key: `decision:${app.id}:${input.outcome}` },
        userActor(p.userId),
      );
      if (input.outcome === 'admitted') await this.emitAdmitted(tx, row!, cycle, p.userId);
    });
    return this.get(p, applicationId);
  }

  // ---------- reads ----------

  /** The applicant's own application, or any of the organisation's for its admissions staff. */
  async get(p: Principal, applicationId: string): Promise<Application> {
    const [app] = await this.db.sys.select().from(applications).where(eq(applications.id, applicationId));
    if (!app) throw notFound('application_not_found', 'Application not found');
    const staff = this.isStaff(p, app.orgId);
    if (!staff && app.userId !== p.userId) throw notFound('application_not_found', 'Application not found');
    return this.view(p, app, staff);
  }

  // ---------- internals ----------

  private isStaff(p: Principal, orgId: string): boolean {
    return p.platformAdmin || (p.orgId === orgId && STAFF_PERMISSIONS.some((perm) => hasOrgPermission(p, perm)));
  }

  /** The route already required an admissions permission in the active organisation. */
  private staffOrg(p: Principal): string {
    if (!p.orgId) throw forbidden('org_context_required', 'Switch to the organisation that runs admissions first.');
    return p.orgId;
  }

  private async staffCycle(p: Principal, cycleId: string): Promise<CycleRow> {
    const [cycle] = await this.db.sys.select().from(admissionCycles).where(eq(admissionCycles.id, cycleId));
    if (!cycle || (!p.platformAdmin && cycle.orgId !== p.orgId)) throw notFound('cycle_not_found', 'Admission cycle not found');
    return cycle;
  }

  private async staffApplication(p: Principal, applicationId: string): Promise<ApplicationRow> {
    const [app] = await this.db.sys.select().from(applications).where(eq(applications.id, applicationId));
    if (!app || (!p.platformAdmin && app.orgId !== p.orgId)) throw notFound('application_not_found', 'Application not found');
    // Nobody reviews or decides their own application.
    if (app.userId === p.userId) throw forbidden('own_application', 'You cannot act on your own application.');
    return app;
  }

  private lock(tx: AdmissionsTx, applicationId: string): Promise<ApplicationRow | undefined> {
    return tx.select().from(applications).where(eq(applications.id, applicationId)).for('update').then((r) => r[0]);
  }

  private async cycleOf(tx: AdmissionsTx, app: ApplicationRow): Promise<CycleRow> {
    return (await tx.select().from(admissionCycles).where(eq(admissionCycles.id, app.cycleId)))[0]!;
  }

  private async applicantChange(p: Principal, applicationId: string, stage: AdmissionStage, fn: (tx: AdmissionsTx, app: ApplicationRow, cycle: CycleRow) => Promise<void>) {
    await this.db.system(async (tx) => {
      const app = await this.lock(tx, applicationId);
      if (!app || app.userId !== p.userId) throw notFound('application_not_found', 'Application not found');
      if (app.status !== 'in_progress') throw conflict('application_submitted', 'This application is no longer open for changes.');
      if (!isApplicantStage(stage) || app.stage !== stage) throw conflict('wrong_stage', `Your application is at the ${app.stage.replace('_', ' ')} stage.`);
      const cycle = await this.cycleOf(tx, app);
      if (!cycleAccepting(cycle)) throw conflict('cycle_closed', 'This admission cycle has closed.');
      await fn(tx, app, cycle);
    });
  }

  private async staffChange(p: Principal, applicationId: string, statuses: ApplicationStatus[], fn: (tx: AdmissionsTx, app: ApplicationRow, cycle: CycleRow) => Promise<void>) {
    await this.staffApplication(p, applicationId);
    await this.db.system(async (tx) => {
      const app = (await this.lock(tx, applicationId))!;
      if (!statuses.includes(app.status)) throw conflict('application_not_open', `This application is ${app.status.replace('_', ' ')}.`);
      await fn(tx, app, await this.cycleOf(tx, app));
    });
  }

  private async transition(
    tx: AdmissionsTx,
    app: ApplicationRow,
    from: AdmissionStage | null,
    to: AdmissionStage,
    status: ApplicationStatus,
    actorUserId: string,
    byApplicant: boolean,
    note: string | null,
  ): Promise<void> {
    await tx.insert(stageTransitions).values({ id: newId(), applicationId: app.id, orgId: app.orgId, fromStage: from, toStage: to, status, actorUserId, byApplicant, note });
  }

  private async emitAdmitted(tx: AdmissionsTx, app: ApplicationRow, cycle: CycleRow, actorUserId: string): Promise<void> {
    if (!cycle.cohortId) return; // joins the cohort once the cycle has one (updateCycle)
    const payload: ApplicantAdmitted = {
      applicationId: app.id,
      userId: app.userId,
      orgId: cycle.orgId,
      cycleId: cycle.id,
      cohortId: cycle.cohortId,
      programSlug: cycle.programSlug,
      scholarshipPercent: app.scholarship?.percent ?? null,
    };
    await this.outbox.add(tx, { type: APPLICANT_ADMITTED, orgId: cycle.orgId, actor: userActor(actorUserId), payload });
  }

  private async names(ids: (string | null | undefined)[]): Promise<Map<string, string>> {
    const unique = [...new Set(ids.filter((id): id is string => !!id))];
    if (unique.length === 0) return new Map();
    const rows = await this.iam.send<UserName[]>(IamRpc.UserNames, { userIds: unique }).catch(() => [] as UserName[]);
    return new Map(rows.map((r) => [r.id, r.name]));
  }

  private async orgNamesFor(ids: string[]): Promise<Map<string, string>> {
    const now = Date.now();
    const missing = [...new Set(ids)].filter((id) => (this.orgNames.get(id)?.expires ?? 0) < now);
    if (missing.length > 0) {
      const rows = await this.iam.send<{ id: string; name: string }[]>(IamRpc.OrgNames, { ids: missing }).catch(() => []);
      for (const r of rows) this.orgNames.set(r.id, { name: r.name, expires: now + ORG_NAME_TTL_MS });
    }
    return new Map(ids.map((id) => [id, this.orgNames.get(id)?.name ?? 'Organisation']));
  }

  private async cycleViews(rows: CycleRow[]): Promise<AdmissionCycle[]> {
    const orgs = await this.orgNamesFor(rows.map((r) => r.orgId));
    return rows.map((c) => ({
      id: c.id,
      orgId: c.orgId,
      orgName: orgs.get(c.orgId)!,
      name: c.name,
      programSlug: c.programSlug,
      programTitle: c.programTitle,
      cohortId: c.cohortId,
      opensAt: c.opensAt.toISOString(),
      closesAt: c.closesAt.toISOString(),
      status: c.status,
    }));
  }

  private async cyclesById(apps: ApplicationRow[]): Promise<Map<string, AdmissionCycle>> {
    const ids = [...new Set(apps.map((a) => a.cycleId))];
    if (ids.length === 0) return new Map();
    const rows = await this.db.sys.select().from(admissionCycles).where(inArray(admissionCycles.id, ids));
    return new Map((await this.cycleViews(rows)).map((c) => [c.id, c]));
  }

  /** Latest human review per application, for the composites on the board (staff only). */
  private async latestReviews(appIds: string[]): Promise<Map<string, { dbpi: number | null; dsi: number | null }>> {
    if (appIds.length === 0) return new Map();
    const rows = await this.db.sys
      .select({ applicationId: applicationReviews.applicationId, dbpi: applicationReviews.dbpi, dsi: applicationReviews.dsi })
      .from(applicationReviews)
      .where(inArray(applicationReviews.applicationId, appIds))
      .orderBy(desc(applicationReviews.createdAt));
    const latest = new Map<string, { dbpi: number | null; dsi: number | null }>();
    for (const r of rows) if (!latest.has(r.applicationId)) latest.set(r.applicationId, { dbpi: r.dbpi, dsi: r.dsi });
    return latest;
  }

  private async summaries(rows: ApplicationRow[], cycles: Map<string, AdmissionCycle>, staff: boolean): Promise<ApplicationSummary[]> {
    const [names, scores] = await Promise.all([this.names(rows.map((r) => r.userId)), staff ? this.latestReviews(rows.map((r) => r.id)) : new Map()]);
    return rows
      .filter((r) => cycles.has(r.cycleId))
      .map((r) => ({
        id: r.id,
        cycle: cycles.get(r.cycleId)!,
        stage: r.stage,
        status: r.status,
        applicant: { userId: r.userId, name: names.get(r.userId) ?? 'Applicant' },
        dbpi: scores.get(r.id)?.dbpi ?? null,
        dsi: scores.get(r.id)?.dsi ?? null,
        updatedAt: r.updatedAt.toISOString(),
        createdAt: r.createdAt.toISOString(),
      }));
  }

  private async view(p: Principal, app: ApplicationRow, staff: boolean): Promise<Application> {
    const [cycles, transitions, reviews, evaluations] = await Promise.all([
      this.cyclesById([app]),
      this.db.sys.select().from(stageTransitions).where(eq(stageTransitions.applicationId, app.id)).orderBy(asc(stageTransitions.at)),
      staff ? this.db.sys.select().from(applicationReviews).where(eq(applicationReviews.applicationId, app.id)).orderBy(asc(applicationReviews.createdAt)) : [],
      staff ? this.db.sys.select().from(aiEvaluations).where(eq(aiEvaluations.applicationId, app.id)).orderBy(asc(aiEvaluations.createdAt)) : [],
    ]);
    const names = await this.names([
      app.userId,
      ...transitions.map((t) => t.actorUserId),
      ...reviews.map((r) => r.reviewerUserId),
      ...evaluations.map((e) => e.requestedByUserId),
      app.interview?.interviewerUserId,
      app.scholarship?.decidedByUserId,
      app.decision?.decidedByUserId,
    ]);
    const nameOf = (id: string | null | undefined, fallback: string) => (id && names.get(id)) || fallback;
    const [summary] = await this.summaries([app], cycles, staff);
    const cycle = cycles.get(app.cycleId)!;
    const toReview = (r: (typeof reviews)[number]): ApplicationReview => ({
      id: r.id,
      stage: r.stage,
      reviewer: nameOf(r.reviewerUserId, 'Reviewer'),
      scores: r.scores,
      dbpi: r.dbpi,
      dsi: r.dsi,
      recommendation: r.recommendation,
      comment: r.comment,
      createdAt: r.createdAt.toISOString(),
    });
    const toEvaluation = (e: (typeof evaluations)[number]): AiEvaluation => ({
      id: e.id,
      model: e.model,
      promptVersion: e.promptVersion,
      scores: e.scores,
      dbpi: e.dbpi,
      dsi: e.dsi,
      rationale: e.rationale,
      requestedBy: nameOf(e.requestedByUserId, 'Reviewer'),
      createdAt: e.createdAt.toISOString(),
    });
    const own = app.userId === p.userId;
    const canStaff = staff && !own;
    return {
      ...summary!,
      answers: app.answers as Application['answers'],
      submitted: app.submitted as Application['submitted'],
      // Applicants see their own moves and the outcome of staff ones, not staff notes or names.
      transitions: transitions.map((t) => ({
        from: t.fromStage,
        to: t.toStage,
        status: t.status,
        actor: { name: staff || t.byApplicant ? nameOf(t.actorUserId, 'Someone') : 'Admissions team', isApplicant: t.byApplicant },
        note: staff ? t.note : null,
        at: t.at.toISOString(),
      })),
      reviews: reviews.map(toReview),
      aiEvaluations: evaluations.map(toEvaluation),
      interview: app.interview
        ? { scheduledAt: app.interview.scheduledAt, interviewer: app.interview.interviewerUserId ? nameOf(app.interview.interviewerUserId, 'Interviewer') : null, notes: staff ? app.interview.notes : '' }
        : null,
      scholarship:
        app.scholarship && (staff || app.decision?.outcome === 'admitted')
          ? { percent: app.scholarship.percent, note: staff ? app.scholarship.note : '', decidedBy: staff ? nameOf(app.scholarship.decidedByUserId, 'Admissions team') : 'Admissions team', decidedAt: app.scholarship.decidedAt }
          : null,
      decision:
        app.decision
          ? { outcome: app.decision.outcome, note: staff ? app.decision.note : '', decidedBy: staff ? nameOf(app.decision.decidedByUserId, 'Admissions team') : 'Admissions team', decidedAt: app.decision.decidedAt }
          : null,
      can: {
        edit: own && app.status === 'in_progress' && isApplicantStage(app.stage) && cycle.status === 'open' && Date.parse(cycle.opensAt) <= Date.now() && Date.parse(cycle.closesAt) > Date.now(),
        review: canStaff && (p.platformAdmin || hasOrgPermission(p, 'admissions.review')) && ['under_review', 'waitlisted'].includes(app.status),
        decide: canStaff && (p.platformAdmin || hasOrgPermission(p, 'admissions.decide')) && app.stage === 'decision' && ['under_review', 'waitlisted'].includes(app.status),
      },
    };
  }
}
