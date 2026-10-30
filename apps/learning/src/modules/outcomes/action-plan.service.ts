import { Injectable } from '@nestjs/common';
import { type ActionPlan, type ActionPlanBody, SubmittableActionPlanSchema } from '@dreamlab/contracts';
import type { Principal } from '@lib/auth';
import { badRequest, conflict, forbidden } from '@lib/common';
import { InjectDatabase } from '@lib/database';
import { InjectOutbox, OutboxWriter, requestNotification, userActor } from '@lib/messaging';
import { eq } from 'drizzle-orm';
import { LearningDatabase, schema } from '../../database';
import { type ActionPlanRow, type OutcomesContext, ProgressService } from './progress.service';

const { actionPlans } = schema;

const EMPTY: ActionPlanBody = { vision: '', milestones: [], resources: '', risks: '' };

/** The 12-month post-Lab action plan: the learner writes and submits it; faculty approve it (a graduation requirement). */
@Injectable()
export class ActionPlanService {
  constructor(
    @InjectDatabase() private readonly db: LearningDatabase,
    @InjectOutbox() private readonly outbox: OutboxWriter,
    private readonly progress: ProgressService,
  ) {}

  async get(p: Principal, enrollmentId: string): Promise<ActionPlan> {
    const ctx = await this.progress.access(p, enrollmentId);
    return this.view(ctx, await this.row(ctx));
  }

  async save(p: Principal, enrollmentId: string, body: ActionPlanBody): Promise<ActionPlan> {
    const ctx = await this.progress.access(p, enrollmentId);
    this.assertLearnerCanEdit(ctx);
    const row = await this.db.system(async (tx) => {
      const [current] = await tx.select().from(actionPlans).where(eq(actionPlans.programEnrollmentId, ctx.pe.id)).for('update');
      if (current && !editable(current.status)) throw conflict('plan_locked', current.status === 'approved' ? 'Your action plan is approved.' : 'Your action plan is with faculty for review.');
      const [saved] = current
        ? await tx.update(actionPlans).set({ body, updatedAt: new Date() }).where(eq(actionPlans.programEnrollmentId, ctx.pe.id)).returning()
        : await tx
            .insert(actionPlans)
            .values({ programEnrollmentId: ctx.pe.id, hostOrgId: ctx.cohort.hostOrgId, userId: ctx.pe.userId, body })
            // A concurrent first save created the draft meanwhile: this save updates it.
            .onConflictDoUpdate({ target: actionPlans.programEnrollmentId, set: { body, updatedAt: new Date() } })
            .returning();
      return saved!;
    });
    return this.view(ctx, row);
  }

  async submit(p: Principal, enrollmentId: string): Promise<ActionPlan> {
    const ctx = await this.progress.access(p, enrollmentId);
    this.assertLearnerCanEdit(ctx);
    const row = await this.db.system(async (tx) => {
      const [current] = await tx.select().from(actionPlans).where(eq(actionPlans.programEnrollmentId, ctx.pe.id)).for('update');
      const parsed = SubmittableActionPlanSchema.safeParse(current?.body ?? EMPTY);
      if (!current || !parsed.success) {
        const issue = parsed.success ? null : parsed.error.issues[0];
        throw badRequest('plan_incomplete', issue?.message ?? 'Write your plan before submitting it.', parsed.success ? undefined : parsed.error.issues);
      }
      if (!editable(current.status)) throw conflict('plan_locked', current.status === 'approved' ? 'Your action plan is approved.' : 'Your action plan is already with faculty.');
      const [saved] = await tx.update(actionPlans).set({ status: 'submitted', submittedAt: new Date(), updatedAt: new Date() }).where(eq(actionPlans.programEnrollmentId, ctx.pe.id)).returning();
      await requestNotification(
        this.outbox,
        tx,
        {
          to: { permission: { orgId: ctx.cohort.hostOrgId, permission: 'submission.grade' } },
          exclude: [ctx.pe.userId],
          category: 'submissions',
          title: 'An action plan to review',
          body: `A learner in ${ctx.cohort.name} submitted their 12-month action plan.`,
          link: `/app/programme/${ctx.pe.id}/action-plan?cohort=${ctx.cohort.id}`,
          orgId: ctx.cohort.hostOrgId,
          key: `action-plan-submitted:${ctx.pe.id}:${Date.now()}`,
        },
        userActor(p.userId),
      );
      return saved!;
    });
    return this.view(ctx, row);
  }

  async review(p: Principal, enrollmentId: string, input: { decision: 'approved' | 'changes_requested'; feedback: string }): Promise<ActionPlan> {
    const ctx = await this.progress.access(p, enrollmentId);
    if (!ctx.isFaculty) throw forbidden('permission_denied', 'Only the cohort’s faculty review action plans.');
    const row = await this.db.system(async (tx) => {
      const [current] = await tx.select().from(actionPlans).where(eq(actionPlans.programEnrollmentId, ctx.pe.id)).for('update');
      if (!current || current.status !== 'submitted') throw conflict('plan_not_submitted', 'Only a submitted action plan can be reviewed.');
      const now = new Date();
      const [saved] = await tx
        .update(actionPlans)
        .set({ status: input.decision, decision: input.decision, feedback: input.feedback, reviewerUserId: p.userId, reviewedAt: now, updatedAt: now })
        .where(eq(actionPlans.programEnrollmentId, ctx.pe.id))
        .returning();
      await requestNotification(
        this.outbox,
        tx,
        {
          to: { userIds: [ctx.pe.userId] },
          category: 'grades',
          title: input.decision === 'approved' ? 'Your action plan is approved' : 'Changes asked on your action plan',
          body: input.decision === 'approved' ? 'Faculty approved your 12-month action plan.' : 'Faculty asked for changes to your 12-month action plan. Their feedback is with the plan.',
          link: `/app/programme/${ctx.pe.id}/action-plan`,
          orgId: ctx.cohort.hostOrgId,
          key: `action-plan-review:${ctx.pe.id}:${now.getTime()}`,
        },
        userActor(p.userId),
      );
      return saved!;
    });
    return this.view(ctx, row);
  }

  private assertLearnerCanEdit(ctx: OutcomesContext): void {
    if (!ctx.isLearner) throw forbidden('permission_denied', 'Only the learner writes their action plan.');
    if (ctx.pe.status !== 'active') throw conflict('enrollment_not_active', 'This programme enrolment is no longer active.');
  }

  private async row(ctx: OutcomesContext): Promise<ActionPlanRow | null> {
    const [row] = await this.db.sys.select().from(actionPlans).where(eq(actionPlans.programEnrollmentId, ctx.pe.id));
    return row ?? null;
  }

  private async view(ctx: OutcomesContext, row: ActionPlanRow | null): Promise<ActionPlan> {
    const names = await this.progress.names([row?.reviewerUserId]);
    const status = row?.status ?? 'draft';
    return {
      ...(row?.body ?? EMPTY),
      status,
      submittedAt: row?.submittedAt?.toISOString() ?? null,
      review:
        row?.decision && row.reviewedAt
          ? { decision: row.decision, feedback: row.feedback ?? '', reviewer: names.get(row.reviewerUserId ?? '') ?? 'Faculty', reviewedAt: row.reviewedAt.toISOString() }
          : null,
      can: { edit: ctx.isLearner && ctx.pe.status === 'active' && editable(status), review: ctx.isFaculty && status === 'submitted' },
    };
  }
}

const editable = (status: ActionPlanRow['status']) => status === 'draft' || status === 'changes_requested';
