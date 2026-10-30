import { Injectable } from '@nestjs/common';
import type { Residency, ResidencyStage, ResidencyStatus } from '@dreamlab/contracts';
import type { Principal } from '@lib/auth';
import { badRequest, conflict, forbidden, newId, notFound } from '@lib/common';
import { InjectDatabase } from '@lib/database';
import { InjectOutbox, OutboxWriter, requestNotification, userActor } from '@lib/messaging';
import { and, asc, eq, inArray } from 'drizzle-orm';
import { LearningDatabase, schema } from '../../database';
import { type OutcomesContext, ProgressService, type StageRow } from './progress.service';

const { residencyStages, residencyStageReviews, programEnrollments } = schema;

/** An output document needs this much before faculty review it. */
export const MIN_STAGE_TEXT = 200;

/**
 * The Dream Residency workspace (CAP-1): the learner writes each stage's output document and submits
 * it; the cohort's faculty approve it with a score (it then counts in the Programme Score with its
 * credit hours) or ask for changes. Every review is kept.
 */
@Injectable()
export class ResidencyService {
  constructor(
    @InjectDatabase() private readonly db: LearningDatabase,
    @InjectOutbox() private readonly outbox: OutboxWriter,
    private readonly progress: ProgressService,
  ) {}

  async get(p: Principal, enrollmentId: string): Promise<Residency> {
    return this.view(await this.progress.access(p, enrollmentId));
  }

  async save(p: Principal, enrollmentId: string, position: number, input: { text: string; links: { label: string; url: string }[] }): Promise<Residency> {
    const ctx = await this.progress.access(p, enrollmentId);
    this.assertLearnerCanEdit(ctx);
    this.stageOf(ctx, position);
    await this.db.system(async (tx) => {
      const [row] = await tx
        .select()
        .from(residencyStages)
        .where(and(eq(residencyStages.programEnrollmentId, ctx.pe.id), eq(residencyStages.position, position)))
        .for('update');
      if (row && !editable(row.status)) throw conflict('stage_locked', row.status === 'approved' ? 'This stage is approved.' : 'This stage is with faculty for review.');
      if (row) {
        await tx.update(residencyStages).set({ text: input.text, links: input.links, updatedAt: new Date() }).where(eq(residencyStages.id, row.id));
      } else {
        await tx
          .insert(residencyStages)
          .values({ id: newId(), programEnrollmentId: ctx.pe.id, hostOrgId: ctx.cohort.hostOrgId, userId: ctx.pe.userId, position, text: input.text, links: input.links })
          .onConflictDoNothing();
      }
    });
    return this.view(ctx);
  }

  async submit(p: Principal, enrollmentId: string, position: number): Promise<Residency> {
    const ctx = await this.progress.access(p, enrollmentId);
    this.assertLearnerCanEdit(ctx);
    const stage = this.stageOf(ctx, position);
    await this.db.system(async (tx) => {
      const [row] = await tx
        .select()
        .from(residencyStages)
        .where(and(eq(residencyStages.programEnrollmentId, ctx.pe.id), eq(residencyStages.position, position)))
        .for('update');
      if (!row || row.text.trim().length < MIN_STAGE_TEXT) throw badRequest('stage_incomplete', `Write at least ${MIN_STAGE_TEXT} characters of your ${stage.outputDocument} before submitting.`);
      if (!editable(row.status)) throw conflict('stage_locked', row.status === 'approved' ? 'This stage is approved.' : 'This stage is already with faculty.');
      await tx.update(residencyStages).set({ status: 'submitted', submittedAt: new Date(), updatedAt: new Date() }).where(eq(residencyStages.id, row.id));
      await requestNotification(
        this.outbox,
        tx,
        {
          to: { permission: { orgId: ctx.cohort.hostOrgId, permission: 'submission.grade' } },
          exclude: [ctx.pe.userId],
          category: 'submissions',
          title: `Residency work to review: ${stage.name}`,
          body: `A learner in ${ctx.cohort.name} submitted their ${stage.outputDocument}.`,
          link: `/app/programme/${ctx.pe.id}/residency?cohort=${ctx.cohort.id}`,
          orgId: ctx.cohort.hostOrgId,
          key: `residency-submitted:${row.id}:${Date.now()}`,
        },
        userActor(p.userId),
      );
    });
    return this.view(ctx);
  }

  async review(p: Principal, enrollmentId: string, position: number, input: { decision: 'approved' | 'changes_requested'; scorePct: number | null; feedback: string }): Promise<Residency> {
    const ctx = await this.progress.access(p, enrollmentId);
    if (!ctx.isFaculty) throw forbidden('permission_denied', 'Only the cohort’s faculty review residency work.');
    const stage = this.stageOf(ctx, position);
    await this.db.system(async (tx) => {
      const [row] = await tx
        .select()
        .from(residencyStages)
        .where(and(eq(residencyStages.programEnrollmentId, ctx.pe.id), eq(residencyStages.position, position)))
        .for('update');
      if (!row || row.status !== 'submitted') throw conflict('stage_not_submitted', 'Only a submitted stage can be reviewed.');
      const scorePct = input.decision === 'approved' ? input.scorePct : null;
      const now = new Date();
      await tx
        .update(residencyStages)
        .set({ status: input.decision, decision: input.decision, scorePct, feedback: input.feedback, reviewerUserId: p.userId, reviewedAt: now, updatedAt: now })
        .where(eq(residencyStages.id, row.id));
      await tx.insert(residencyStageReviews).values({ id: newId(), residencyStageId: row.id, hostOrgId: row.hostOrgId, decision: input.decision, scorePct, feedback: input.feedback, reviewerUserId: p.userId });
      await requestNotification(
        this.outbox,
        tx,
        {
          to: { userIds: [ctx.pe.userId] },
          category: 'grades',
          title: input.decision === 'approved' ? `${stage.name} approved` : `Changes asked on ${stage.name}`,
          body: input.decision === 'approved' ? `Your ${stage.outputDocument} was approved at ${Math.round(scorePct!)}%.` : `Faculty asked for changes to your ${stage.outputDocument}. Their feedback is on the stage.`,
          link: `/app/programme/${ctx.pe.id}/residency`,
          orgId: ctx.cohort.hostOrgId,
          key: `residency-review:${row.id}:${now.getTime()}`,
        },
        userActor(p.userId),
      );
    });
    return this.view(ctx);
  }

  /** Every learner's stage statuses in a cohort. */
  async board(p: Principal, cohortId: string) {
    const { cohort, program } = await this.progress.cohortForFaculty(p, cohortId);
    const learners = await this.db.sys
      .select()
      .from(programEnrollments)
      .where(and(eq(programEnrollments.cohortId, cohort.id), inArray(programEnrollments.status, ['active', 'completed', 'graduated'])))
      .orderBy(asc(programEnrollments.enrolledAt));
    const rows = learners.length ? await this.db.sys.select().from(residencyStages).where(inArray(residencyStages.programEnrollmentId, learners.map((l) => l.id))) : [];
    const names = await this.progress.names(learners.map((l) => l.userId));
    const stages = program.capstoneStages.map((s) => ({ position: s.position, name: s.name, creditHours: s.creditHours }));
    return {
      stages,
      learners: learners.map((l) => {
        const mine = new Map(rows.filter((r) => r.programEnrollmentId === l.id).map((r) => [r.position, r]));
        return {
          programEnrollmentId: l.id,
          userId: l.userId,
          name: names.get(l.userId) ?? 'Learner',
          statuses: stages.map((s) => statusOf(mine.get(s.position))),
          creditsEarned: stages.filter((s) => mine.get(s.position)?.status === 'approved').reduce((n, s) => n + s.creditHours, 0),
        };
      }),
    };
  }

  // ---------- internals ----------

  private assertLearnerCanEdit(ctx: OutcomesContext): void {
    if (!ctx.isLearner) throw forbidden('permission_denied', 'Only the learner writes their residency work.');
    if (ctx.pe.status !== 'active') throw conflict('enrollment_not_active', 'This programme enrolment is no longer active.');
  }

  private stageOf(ctx: OutcomesContext, position: number) {
    const stage = ctx.program.capstoneStages.find((s) => s.position === position);
    if (!stage) throw notFound('stage_not_found', 'Residency stage not found');
    return stage;
  }

  private async view(ctx: OutcomesContext): Promise<Residency> {
    const rows = await this.db.sys.select().from(residencyStages).where(eq(residencyStages.programEnrollmentId, ctx.pe.id));
    const byPosition = new Map(rows.map((r) => [r.position, r]));
    const names = await this.progress.names([ctx.pe.userId, ...rows.map((r) => r.reviewerUserId)]);
    const stages: ResidencyStage[] = ctx.program.capstoneStages.map((s) => {
      const r = byPosition.get(s.position);
      return {
        position: s.position,
        name: s.name,
        outputDocument: s.outputDocument,
        creditHours: s.creditHours,
        summary: s.summary,
        status: statusOf(r),
        document: { text: r?.text ?? '', links: r?.links ?? [] },
        submittedAt: r?.submittedAt?.toISOString() ?? null,
        review:
          r?.decision && r.reviewedAt
            ? { decision: r.decision, scorePct: r.scorePct, feedback: r.feedback ?? '', reviewer: names.get(r.reviewerUserId ?? '') ?? 'Faculty', reviewedAt: r.reviewedAt.toISOString() }
            : null,
      };
    });
    const creditsTotal = ctx.program.capstoneStages.reduce((n, s) => n + s.creditHours, 0);
    return {
      programEnrollmentId: ctx.pe.id,
      learner: { userId: ctx.pe.userId, name: names.get(ctx.pe.userId) ?? 'Learner' },
      cohortName: ctx.cohort.name,
      stages,
      creditsEarned: stages.filter((s) => s.status === 'approved').reduce((n, s) => n + s.creditHours, 0),
      creditsTotal,
      can: { edit: ctx.isLearner && ctx.pe.status === 'active', review: ctx.isFaculty },
    };
  }
}

const editable = (status: StageRow['status']) => status === 'draft' || status === 'changes_requested';
const statusOf = (row: StageRow | undefined): ResidencyStatus => row?.status ?? 'not_started';
