import { Inject, Injectable } from '@nestjs/common';
import { type DreamScore, type Portfolio, PORTFOLIO_SECTION_LABELS, PORTFOLIO_SECTIONS } from '@dreamlab/contracts';
import type { Principal } from '@lib/auth';
import { conflict, forbidden, notFound } from '@lib/common';
import { InjectDatabase } from '@lib/database';
import { CatalogClient } from '@lib/rpc';
import { and, desc, eq, inArray, isNotNull } from 'drizzle-orm';
import { randomBytes } from 'node:crypto';
import { LearningDatabase, schema } from '../../database';
import { CATALOG, flatItems } from '../enrollments/enrollments.service';
import { DreamScoreService } from '../scores';
import { CredentialsService } from './credentials.service';
import { type OutcomesContext, type Progress, ProgressService } from './progress.service';

const { programEnrollments, cohorts, submissions, grades } = schema;

type Section = Portfolio['sections'][number];
type Entry = Section['entries'][number];

/** Phases by their (programme-defined) names. */
export const isPhase = (phaseName: string, prefix: 'life' | 'builder' | 'elective') => phaseName.toLowerCase().replace(/[’']/g, '').startsWith(prefix);

/** The final residency stage is the Final Demonstration; the ones before it make up the Dream Residency section. */
const lastStage = (ctx: Pick<OutcomesContext, 'program'>) => Math.max(0, ...ctx.program.capstoneStages.map((s) => s.position));

/**
 * The Dream Portfolio (PORT-1): eight fixed sections assembled from approved work only, shared at a
 * public link while the learner chooses, printable from the web app.
 */
@Injectable()
export class PortfolioService {
  constructor(
    @InjectDatabase() private readonly db: LearningDatabase,
    @Inject(CATALOG) private readonly catalog: CatalogClient,
    private readonly progress: ProgressService,
    private readonly dreamScores: DreamScoreService,
    private readonly credentials: CredentialsService,
  ) {}

  async get(p: Principal, enrollmentId: string): Promise<Portfolio> {
    const ctx = await this.progress.access(p, enrollmentId);
    return this.build(ctx, await this.progress.load(ctx), ctx.isLearner);
  }

  async share(p: Principal, enrollmentId: string, shared: boolean): Promise<Portfolio> {
    const ctx = await this.progress.access(p, enrollmentId);
    if (!ctx.isLearner) throw forbidden('permission_denied', 'Only the learner publishes their portfolio.');
    if (shared && !['active', 'completed', 'graduated'].includes(ctx.pe.status)) throw conflict('enrollment_not_active', 'This programme enrolment has ended.');
    const token = shared ? (ctx.pe.portfolioToken ?? randomBytes(32).toString('base64url')) : null;
    const [pe] = await this.db.system((tx) => tx.update(programEnrollments).set({ portfolioToken: token, updatedAt: new Date() }).where(eq(programEnrollments.id, ctx.pe.id)).returning());
    const next = { ...ctx, pe: pe! };
    return this.build(next, await this.progress.load(next), true);
  }

  /** A published portfolio, for anyone with the link. */
  async published(token: string): Promise<Portfolio> {
    const [pe] = await this.db.sys.select().from(programEnrollments).where(eq(programEnrollments.portfolioToken, token));
    if (!pe || !['active', 'completed', 'graduated'].includes(pe.status)) throw notFound('portfolio_not_found', 'This portfolio is not published.');
    const [cohort] = await this.db.sys.select().from(cohorts).where(eq(cohorts.id, pe.cohortId));
    const ctx = { pe, cohort: cohort!, program: await this.progress.program(cohort!) };
    return this.build(ctx, await this.progress.load(ctx), false);
  }

  /** How many of the eight sections are complete (a graduation requirement). */
  async completeness(ctx: Pick<OutcomesContext, 'pe' | 'cohort' | 'program'>, progress: Progress): Promise<{ done: number; total: number }> {
    const sections = await this.sections(ctx, progress, await this.dreamScores.forEnrollment(ctx.pe.id));
    return { done: sections.filter((s) => s.complete).length, total: sections.length };
  }

  private async build(ctx: Pick<OutcomesContext, 'pe' | 'cohort' | 'program'>, progress: Progress, owner: boolean): Promise<Portfolio> {
    const score = await this.dreamScores.forEnrollment(ctx.pe.id);
    const [sections, names, hostOrgName, credential] = await Promise.all([
      this.sections(ctx, progress, score),
      this.progress.names([ctx.pe.userId]),
      this.progress.orgName(ctx.cohort.hostOrgId),
      this.credentials.forProgramEnrollment(ctx.pe.id),
    ]);
    const { recent: _recent, programEnrollmentId: _id, ...dreamScore } = score;
    return {
      learner: { name: names.get(ctx.pe.userId) ?? 'Learner' },
      programTitle: ctx.program.title,
      cohortName: ctx.cohort.name,
      hostOrgName,
      programmeScore: progress.programmeScore,
      creditsEarned: progress.creditsEarned,
      sections,
      dreamScore,
      graduatedAt: ctx.pe.graduatedAt?.toISOString() ?? null,
      credentialCode: credential && !credential.revokedAt ? credential.code : null,
      shareToken: owner ? ctx.pe.portfolioToken : null,
    };
  }

  private async sections(ctx: Pick<OutcomesContext, 'pe' | 'cohort' | 'program'>, progress: Progress, score: DreamScore): Promise<Section[]> {
    const final = lastStage(ctx);
    const approved = (position: number) => {
      const row = progress.stages.get(position);
      return row?.status === 'approved' ? row : null;
    };
    const stageEntry = (position: number): Entry[] => {
      const row = approved(position);
      const stage = ctx.program.capstoneStages.find((s) => s.position === position);
      return row && stage ? [{ title: stage.outputDocument, detail: stage.name, scorePct: row.scorePct, text: row.text, links: row.links }] : [];
    };
    const summaries = await this.catalog.courseSummaries(progress.courses.map((c) => c.courseId)).catch(() => new Map());
    const titleOf = (courseId: string, slug: string) => summaries.get(courseId)?.title ?? slug;

    const life = progress.courses.filter((c) => isPhase(c.phaseName, 'life'));
    const artifacts = await this.artifacts(progress, titleOf);
    const residencyPositions = ctx.program.capstoneStages.map((s) => s.position).filter((pos) => pos !== final && pos !== 1);
    const plan = progress.plan?.status === 'approved' ? progress.plan : null;

    const content: Record<(typeof PORTFOLIO_SECTIONS)[number], { complete: boolean; entries: Entry[] }> = {
      my_dream: { complete: !!approved(1), entries: stageEntry(1) },
      life_architecture: {
        complete: life.length > 0 && life.every((c) => c.score !== null),
        entries: life.filter((c) => c.score !== null).map((c) => ({ title: titleOf(c.courseId, c.slug), detail: `${c.credits} credits`, scorePct: c.score, text: null, links: [] })),
      },
      course_artifacts: { complete: artifacts.length > 0, entries: artifacts },
      competencies: {
        complete: score.dimensions.some((d) => d.score !== null),
        entries: score.dimensions
          .filter((d) => d.score !== null)
          .map((d) => ({ title: d.label, detail: `${d.score!.toFixed(1)} / 10 from ${d.evidence} ${d.evidence === 1 ? 'piece' : 'pieces'} of evidence`, scorePct: null, text: null, links: [] })),
      },
      // Dream Definition is My Dream and the last stage is the Final Demonstration: the stages between.
      dream_residency: { complete: residencyPositions.length > 0 && residencyPositions.every((pos) => !!approved(pos)), entries: residencyPositions.flatMap(stageEntry) },
      final_demonstration: { complete: final > 0 && !!approved(final), entries: final > 0 ? stageEntry(final) : [] },
      dream_score: {
        complete: score.overall !== null,
        entries: score.overall !== null ? [{ title: 'Dream Score', detail: `${score.overall.toFixed(1)} / 10`, scorePct: null, text: null, links: [] }] : [],
      },
      action_plan: {
        complete: !!plan,
        entries: plan
          ? [
              {
                title: '12-month action plan',
                detail: `${plan.body.milestones.length} milestones`,
                scorePct: null,
                text: [plan.body.vision, ...plan.body.milestones.map((m) => `Month ${m.month}: ${m.milestone} (${m.measure})`)].join('\n'),
                links: [],
              },
            ]
          : [],
      },
    };
    return PORTFOLIO_SECTIONS.map((key) => ({ key, label: PORTFOLIO_SECTION_LABELS[key], ...content[key] }));
  }

  /** Graded assignments of the programme's courses: the latest released grade of each. */
  private async artifacts(progress: Progress, titleOf: (courseId: string, slug: string) => string): Promise<Entry[]> {
    const enrollments = progress.courses.filter((c) => c.enrollmentId);
    if (enrollments.length === 0) return [];
    const rows = await this.db.sys
      .select({ submission: submissions, score: grades.score, releasedAt: grades.releasedAt })
      .from(grades)
      .innerJoin(submissions, eq(submissions.id, grades.submissionId))
      .where(and(inArray(submissions.courseEnrollmentId, enrollments.map((c) => c.enrollmentId!)), eq(submissions.kind, 'assignment'), isNotNull(grades.releasedAt)))
      .orderBy(desc(grades.releasedAt));
    const seen = new Set<string>();
    const latest = rows.filter((r) => {
      const key = `${r.submission.courseEnrollmentId}:${r.submission.contentItemId}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
    const entries: Entry[] = [];
    for (const r of latest) {
      const course = enrollments.find((c) => c.enrollmentId === r.submission.courseEnrollmentId)!;
      const content = course.versionId ? await this.catalog.version(course.versionId).catch(() => null) : null;
      const item = content ? flatItems(content).find((i) => i.id === r.submission.contentItemId) : undefined;
      entries.push({ title: item?.title ?? 'Assignment', detail: titleOf(course.courseId, course.slug), scorePct: Math.round(r.score), text: r.submission.body, links: [] });
    }
    return entries;
  }
}
