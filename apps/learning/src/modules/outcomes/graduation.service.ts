import { Injectable } from '@nestjs/common';
import type { Graduation } from '@dreamlab/contracts';
import type { Principal } from '@lib/auth';
import { conflict, forbidden, notFound } from '@lib/common';
import { InjectDatabase } from '@lib/database';
import { InjectOutbox, OutboxWriter, requestNotification, userActor } from '@lib/messaging';
import { and, asc, eq, inArray } from 'drizzle-orm';
import { LearningDatabase, schema } from '../../database';
import { PASS_MARK } from '../grading/course-score';
import { CredentialsService } from './credentials.service';
import { type GraduationFacts, requirementEvidence } from './evidence';
import { isPhase, PortfolioService } from './portfolio.service';
import { type OutcomesContext, type Progress, ProgressService } from './progress.service';

const { graduationConfirmations, programEnrollments } = schema;
type ConfirmationRow = typeof graduationConfirmations.$inferSelect;

/**
 * Graduation (GRAD-1): the programme's ten requirements, each with what the platform can see and a
 * faculty confirmation. Graduating is a state change gated on every requirement being confirmed;
 * it issues the programme credential.
 */
@Injectable()
export class GraduationService {
  constructor(
    @InjectDatabase() private readonly db: LearningDatabase,
    @InjectOutbox() private readonly outbox: OutboxWriter,
    private readonly progress: ProgressService,
    private readonly portfolio: PortfolioService,
    private readonly credentials: CredentialsService,
  ) {}

  async get(p: Principal, enrollmentId: string): Promise<Graduation> {
    return this.view(await this.progress.access(p, enrollmentId));
  }

  async confirm(p: Principal, enrollmentId: string, key: string, input: { confirmed: boolean; note: string }): Promise<Graduation> {
    const ctx = await this.progress.access(p, enrollmentId);
    if (!ctx.isFaculty) throw forbidden('permission_denied', 'Only the cohort’s faculty confirm graduation requirements.');
    if (ctx.pe.graduatedAt) throw conflict('already_graduated', 'This learner has graduated.');
    if (!ctx.program.graduationRequirements.some((r) => r.key === key)) throw notFound('requirement_not_found', 'Requirement not found');
    await this.db.system(async (tx) => {
      // Graduating takes the same lock, so a confirmation cannot change once the learner has graduated.
      const [locked] = await tx.select({ graduatedAt: programEnrollments.graduatedAt }).from(programEnrollments).where(eq(programEnrollments.id, ctx.pe.id)).for('update');
      if (locked?.graduatedAt) throw conflict('already_graduated', 'This learner has graduated.');
      if (input.confirmed) {
        await tx
          .insert(graduationConfirmations)
          .values({ programEnrollmentId: ctx.pe.id, requirementKey: key, hostOrgId: ctx.cohort.hostOrgId, confirmedByUserId: p.userId, note: input.note })
          .onConflictDoUpdate({
            target: [graduationConfirmations.programEnrollmentId, graduationConfirmations.requirementKey],
            set: { confirmedByUserId: p.userId, note: input.note, confirmedAt: new Date() },
          });
      } else {
        await tx.delete(graduationConfirmations).where(and(eq(graduationConfirmations.programEnrollmentId, ctx.pe.id), eq(graduationConfirmations.requirementKey, key)));
      }
    });
    return this.view(ctx);
  }

  async graduate(p: Principal, enrollmentId: string): Promise<Graduation> {
    const ctx = await this.progress.access(p, enrollmentId);
    if (!ctx.isManager) throw forbidden('permission_denied', 'Only the cohort’s managers graduate learners.');
    const progress = await this.progress.load(ctx);
    const next = await this.db.system(async (tx) => {
      const [pe] = await tx.select().from(programEnrollments).where(eq(programEnrollments.id, ctx.pe.id)).for('update');
      if (pe!.graduatedAt) return pe!;
      if (pe!.status === 'withdrawn') throw conflict('enrollment_withdrawn', 'This learner withdrew from the programme.');
      const confirmed = new Set((await tx.select().from(graduationConfirmations).where(eq(graduationConfirmations.programEnrollmentId, ctx.pe.id))).map((c) => c.requirementKey));
      const missing = ctx.program.graduationRequirements.filter((r) => !confirmed.has(r.key));
      if (missing.length > 0) throw conflict('requirements_unconfirmed', `Confirm every requirement first (${missing.length} left).`, { missing: missing.map((r) => r.key) });
      const now = new Date();
      const [updated] = await tx.update(programEnrollments).set({ status: 'graduated', graduatedAt: now, completedAt: pe!.completedAt ?? now, updatedAt: now }).where(eq(programEnrollments.id, ctx.pe.id)).returning();
      const credential = await this.credentials.issue(tx, {
        kind: 'programme_graduation',
        userId: ctx.pe.userId,
        issuerOrgId: ctx.cohort.hostOrgId,
        programEnrollmentId: ctx.pe.id,
        title: ctx.program.title,
        scorePct: progress.programmeScore,
        creditHours: progress.creditsEarned,
      });
      await requestNotification(
        this.outbox,
        tx,
        {
          to: { userIds: [ctx.pe.userId] },
          category: 'cohorts',
          title: `You have graduated from ${ctx.program.title}`,
          body: `Congratulations. Your credential ${credential.code} is ready to share.`,
          link: '/app/credentials',
          orgId: ctx.cohort.hostOrgId,
          key: `graduated:${ctx.pe.id}`,
        },
        userActor(p.userId),
      );
      return updated!;
    });
    return this.view({ ...ctx, pe: next });
  }

  async board(p: Principal, cohortId: string) {
    const { cohort, program } = await this.progress.cohortForFaculty(p, cohortId);
    const learners = await this.db.sys
      .select()
      .from(programEnrollments)
      .where(and(eq(programEnrollments.cohortId, cohort.id), inArray(programEnrollments.status, ['active', 'completed', 'graduated'])))
      .orderBy(asc(programEnrollments.enrolledAt));
    const [confirmations, names] = await Promise.all([
      learners.length ? this.db.sys.select().from(graduationConfirmations).where(inArray(graduationConfirmations.programEnrollmentId, learners.map((l) => l.id))) : [],
      this.progress.names(learners.map((l) => l.userId)),
    ]);
    const keys = new Set(program.graduationRequirements.map((r) => r.key));
    const rows = [];
    for (const pe of learners) {
      const ctx = { pe, cohort, program };
      const progress = await this.progress.load(ctx);
      const facts = await this.facts(ctx, progress);
      rows.push({
        programEnrollmentId: pe.id,
        userId: pe.userId,
        name: names.get(pe.userId) ?? 'Learner',
        confirmed: confirmations.filter((c) => c.programEnrollmentId === pe.id && keys.has(c.requirementKey)).length,
        evidenceMet: program.graduationRequirements.filter((r) => requirementEvidence(r.key, facts).met).length,
        creditsEarned: progress.creditsEarned,
        graduatedAt: pe.graduatedAt?.toISOString() ?? null,
      });
    }
    return { requirements: [...program.graduationRequirements].sort((a, b) => a.position - b.position).map((r) => ({ key: r.key, label: r.label })), learners: rows };
  }

  // ---------- internals ----------

  async facts(ctx: Pick<OutcomesContext, 'pe' | 'cohort' | 'program'>, progress: Progress): Promise<GraduationFacts> {
    const phase = (prefix: 'life' | 'builder') => {
      const courses = progress.courses.filter((c) => isPhase(c.phaseName, prefix));
      return { done: courses.filter((c) => c.score !== null && c.score >= PASS_MARK).length, total: courses.length };
    };
    const electivePhase = ctx.program.phases.find((ph) => isPhase(ph.name, 'elective'));
    const electives = progress.courses.filter((c) => isPhase(c.phaseName, 'elective'));
    const stagePositions = ctx.program.capstoneStages.map((s) => s.position);
    const approved = (pos: number) => progress.stages.get(pos)?.status === 'approved';
    const final = Math.max(0, ...stagePositions);
    return {
      creditsEarned: progress.creditsEarned,
      creditsTotal: ctx.program.creditTotal || progress.creditsTotal,
      phases: {
        life: phase('life'),
        builders: phase('builder'),
        elective: { done: electives.filter((c) => c.score !== null && c.score >= PASS_MARK).length, total: electivePhase?.chooseN ?? (electives.length > 0 ? electives.length : 1) },
      },
      stages: { done: stagePositions.filter(approved).length, total: stagePositions.length },
      finalStageApproved: final > 0 && approved(final),
      attendance: progress.attendance,
      portfolio: await this.portfolio.completeness(ctx, progress),
      planStatus: progress.plan?.status ?? 'none',
    };
  }

  private async view(ctx: OutcomesContext): Promise<Graduation> {
    const progress = await this.progress.load(ctx);
    const [facts, rows, credential] = await Promise.all([
      this.facts(ctx, progress),
      this.db.sys.select().from(graduationConfirmations).where(eq(graduationConfirmations.programEnrollmentId, ctx.pe.id)),
      this.credentials.forProgramEnrollment(ctx.pe.id),
    ]);
    const byKey = new Map<string, ConfirmationRow>(rows.map((r) => [r.requirementKey, r]));
    const names = await this.progress.names([ctx.pe.userId, ...rows.map((r) => r.confirmedByUserId)]);
    const requirements = [...ctx.program.graduationRequirements]
      .sort((a, b) => a.position - b.position)
      .map((r) => {
        const { evidence, met } = requirementEvidence(r.key, facts);
        const c = byKey.get(r.key);
        return {
          key: r.key,
          label: r.label,
          evidence,
          evidenceMet: met,
          confirmed: c ? { by: names.get(c.confirmedByUserId) ?? 'Faculty', at: c.confirmedAt.toISOString(), note: c.note } : null,
        };
      });
    const eligible = requirements.length > 0 && requirements.every((r) => r.confirmed);
    const graduated = !!ctx.pe.graduatedAt;
    return {
      programEnrollmentId: ctx.pe.id,
      learner: { userId: ctx.pe.userId, name: names.get(ctx.pe.userId) ?? 'Learner' },
      cohortName: ctx.cohort.name,
      creditsEarned: progress.creditsEarned,
      creditsTotal: facts.creditsTotal,
      programmeScore: progress.programmeScore,
      requirements,
      eligible,
      graduatedAt: ctx.pe.graduatedAt?.toISOString() ?? null,
      credentialCode: credential && !credential.revokedAt ? credential.code : null,
      can: { confirm: ctx.isFaculty && !graduated, graduate: ctx.isManager && eligible && !graduated },
    };
  }
}
