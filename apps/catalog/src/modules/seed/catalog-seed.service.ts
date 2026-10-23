import { Inject, Injectable, Logger } from '@nestjs/common';
import { CourseAuthoring, CourseAuthoringSchema, ProgramAuthoring, ProgramAuthoringSchema } from '@dreamlab/contracts';
import { conflict, newId, sha256 } from '@lib/common';
import { InjectDatabase } from '@lib/database';
import { InjectOutbox, OutboxWriter, SYSTEM_ACTOR } from '@lib/messaging';
import { IamRpc, RpcClient } from '@lib/rpc';
import { and, eq, max, ne } from 'drizzle-orm';
import { CatalogDatabase, CatalogTx, schema } from '../../database';
import { CatalogEvents } from '../../events';

export const IAM_RPC = Symbol('IAM_RPC');

export interface CatalogDataset {
  name: string;
  courses: CourseAuthoring[];
  programs: ProgramAuthoring[];
  /** Courses featured when first listed. */
  featured: string[];
}

const {
  courses,
  courseVersions,
  courseModules,
  contentItems,
  assessments,
  questions,
  rubrics,
  rubricCriteria,
  assignmentSpecs,
  catalogListings,
  programs,
  programPhases,
  electiveGroups,
  programCourses,
  graduationRequirements,
  capstoneStageDefs,
  programCalendarWeeks,
} = schema;

/**
 * Loads a dataset of authored courses and programmes. Idempotent: course details are updated in
 * place, and a new version is published only when the authored content changed (learners already
 * enrolled stay on their version). Listing choices a platform admin made are never overwritten.
 */
@Injectable()
export class CatalogSeedService {
  private readonly logger = new Logger(CatalogSeedService.name);

  constructor(
    @InjectDatabase() private readonly db: CatalogDatabase,
    @InjectOutbox() private readonly outbox: OutboxWriter,
    @Inject(IAM_RPC) private readonly iam: RpcClient,
  ) {}

  /** The id of the organisation with this slug, from IAM. */
  async resolveOwner(slug: string): Promise<string> {
    const owner = await this.iam.send<{ id: string } | null>(IamRpc.ResolveOrg, { slug });
    if (!owner) throw new Error(`Owner organisation "${slug}" was not found in IAM`);
    return owner.id;
  }

  async run(dataset: CatalogDataset, ownerSlug: string): Promise<void> {
    const owner = { id: await this.resolveOwner(ownerSlug) };
    let published = 0;
    for (const raw of dataset.courses) {
      const course = CourseAuthoringSchema.parse(raw);
      if ((await this.importCourse(course, owner.id, dataset.featured.includes(course.slug))).published) published++;
    }
    for (const raw of dataset.programs) await this.importProgram(ProgramAuthoringSchema.parse(raw), owner.id);
    this.logger.log(`Seeded "${dataset.name}": ${dataset.courses.length} courses (${published} new versions), ${dataset.programs.length} programmes`);
  }

  /**
   * Create or update a course; publishes a new version when the authored content changed. Pass `outer`
   * to make it part of a larger transaction (publishing a draft).
   */
  importCourse(c: CourseAuthoring, ownerOrgId: string, featured = false, outer?: CatalogTx): Promise<{ slug: string; published: boolean; versionNo: number | null }> {
    const run = async (tx: CatalogTx) => {
      const details = {
        title: c.title,
        subtitle: c.subtitle,
        description: c.description,
        provider: c.provider,
        visibility: c.visibility,
        level: c.level,
        language: c.language,
        creditHours: c.creditHours,
        outcomes: c.outcomes,
        skills: c.skills,
        audience: c.audience,
        prerequisites: c.prerequisites,
        practicalOutput: c.practicalOutput,
        cover: c.cover,
        trailer: c.trailer ?? null,
        instructors: c.instructors,
      };
      let [row] = await tx.select().from(courses).where(eq(courses.slug, c.slug));
      if (!row) {
        [row] = await tx.insert(courses).values({ id: newId(), ownerOrgId, slug: c.slug, ...details }).returning();
        if (c.visibility === 'public') {
          await tx.insert(catalogListings).values({ id: newId(), ownerOrgId, itemType: 'course', itemId: row!.id, channel: 'public', featured }).onConflictDoNothing();
        }
      } else {
        // A slug names one organisation's course: an import never takes over another's.
        if (row.ownerOrgId !== ownerOrgId) throw conflict('slug_owned_elsewhere', `Another organisation already has a course at "${c.slug}". Choose another slug.`);
        await tx.update(courses).set(details).where(eq(courses.id, row.id));
      }
      const [current] = row!.currentVersionId ? await tx.select().from(courseVersions).where(eq(courseVersions.id, row!.currentVersionId)) : [];
      const unchanged = { slug: c.slug, published: false, versionNo: current?.versionNo ?? null };
      if (!c.modules?.length) return unchanged;

      const hash = sha256(JSON.stringify({ creditHours: c.creditHours, modules: c.modules }));
      if (current?.contentHash === hash) return unchanged;
      const { versionId, versionNo } = await this.publishVersion(tx, row!.id, ownerOrgId, c, hash);
      await tx.update(courseVersions).set({ status: 'retired' }).where(and(eq(courseVersions.courseId, row!.id), ne(courseVersions.id, versionId), eq(courseVersions.status, 'published')));
      await tx.update(courses).set({ currentVersionId: versionId }).where(eq(courses.id, row!.id));
      await this.outbox.add(tx, {
        type: CatalogEvents.CoursePublished,
        orgId: ownerOrgId,
        actor: SYSTEM_ACTOR,
        payload: { courseId: row!.id, slug: c.slug, versionId },
      });
      return { slug: c.slug, published: true, versionNo };
    };
    return outer ? run(outer) : this.db.system(run);
  }

  private async publishVersion(
    tx: CatalogTx,
    courseId: string,
    ownerOrgId: string,
    c: CourseAuthoring,
    contentHash: string,
  ): Promise<{ versionId: string; versionNo: number }> {
    const [{ last } = { last: 0 }] = await tx.select({ last: max(courseVersions.versionNo) }).from(courseVersions).where(eq(courseVersions.courseId, courseId));
    const versionId = newId();
    const versionNo = (last ?? 0) + 1;
    const modules = c.modules!;
    const minutes = modules.flatMap((m) => m.items).reduce((n, i) => n + i.minutes, 0);
    await tx.insert(courseVersions).values({
      id: versionId,
      courseId,
      ownerOrgId,
      versionNo,
      status: 'published',
      creditHours: c.creditHours,
      estimatedMinutes: minutes,
      contentHash,
      publishedAt: new Date(),
    });
    let position = 0;
    for (const [mi, m] of modules.entries()) {
      const moduleId = newId();
      await tx.insert(courseModules).values({ id: moduleId, courseVersionId: versionId, ownerOrgId, key: m.key, position: mi + 1, title: m.title, summary: m.summary, weekNo: m.weekNo });
      for (const item of m.items) {
        const itemId = newId();
        position++;
        const base = {
          id: itemId,
          moduleId,
          courseVersionId: versionId,
          ownerOrgId,
          key: item.key,
          position,
          itemType: item.type,
          title: item.title,
          estimatedMinutes: item.minutes,
          isRequired: item.required,
          gradeWeight: 'gradeWeight' in item ? item.gradeWeight : 0,
        };
        if (item.type === 'quiz') {
          await tx.insert(contentItems).values({ ...base, payload: { intro: item.payload.intro } });
          await tx.insert(assessments).values({ contentItemId: itemId, ownerOrgId, passMark: item.payload.passPct, maxAttempts: item.payload.maxAttempts });
          await tx.insert(questions).values(
            item.payload.questions.map((q, qi) => ({ id: newId(), assessmentId: itemId, ownerOrgId, key: q.id, position: qi + 1, questionType: q.type, body: q })),
          );
        } else if (item.type === 'assignment') {
          const { rubric, practicalOutput, ...rest } = item.payload;
          await tx.insert(contentItems).values({ ...base, payload: rest });
          const rubricId = newId();
          await tx.insert(rubrics).values({ id: rubricId, ownerOrgId, title: `${c.title}: ${item.title}` });
          await tx.insert(rubricCriteria).values(
            rubric.map((r, ri) => ({ id: newId(), rubricId, ownerOrgId, key: r.id, position: ri + 1, criterion: r.criterion, description: r.description })),
          );
          await tx.insert(assignmentSpecs).values({ contentItemId: itemId, ownerOrgId, rubricId, practicalOutput, acceptedFiles: ['text', 'link'] });
        } else {
          await tx.insert(contentItems).values({ ...base, payload: item.payload });
        }
      }
    }
    return { versionId, versionNo };
  }

  /** Programmes are re-written in full: nothing references their phases yet. */
  importProgram(p: ProgramAuthoring, ownerOrgId: string): Promise<void> {
    return this.db.system(async (tx) => {
      const creditTotal =
        p.phases.reduce((n, ph) => n + (ph.chooseN ? ph.chooseN * Math.max(0, ...ph.courses.map((c) => c.creditHours)) : ph.courses.reduce((m, c) => m + c.creditHours, 0)), 0) +
        p.capstoneStages.reduce((n, s) => n + s.creditHours, 0);
      const details = {
        title: p.title,
        subtitle: p.subtitle,
        description: p.description,
        provider: p.provider,
        programType: p.programType,
        deliveryMode: p.deliveryMode,
        features: p.features,
        cover: p.cover,
        creditTotal,
      };
      let [row] = await tx.select().from(programs).where(eq(programs.slug, p.slug));
      if (!row) [row] = await tx.insert(programs).values({ id: newId(), ownerOrgId, slug: p.slug, ...details }).returning();
      else if (row.ownerOrgId !== ownerOrgId) throw conflict('slug_owned_elsewhere', `Another organisation already has a programme at "${p.slug}". Choose another slug.`);
      else await tx.update(programs).set(details).where(eq(programs.id, row.id));
      const programId = row!.id;

      for (const table of [programCalendarWeeks, programCourses, electiveGroups, graduationRequirements, capstoneStageDefs, programPhases]) {
        await tx.delete(table).where(eq(table.programId, programId));
      }
      const phaseIds = new Map<string, string>();
      let coursePosition = 0;
      for (const [i, ph] of p.phases.entries()) {
        const phaseId = newId();
        phaseIds.set(ph.name, phaseId);
        await tx.insert(programPhases).values({ id: phaseId, programId, ownerOrgId, position: i + 1, name: ph.name, summary: ph.summary, weekFrom: ph.weekFrom, weekTo: ph.weekTo, weightPct: ph.weightPct });
        let groupId: string | null = null;
        if (ph.chooseN) {
          groupId = newId();
          await tx.insert(electiveGroups).values({ id: groupId, programId, phaseId, ownerOrgId, chooseN: ph.chooseN, selectByWeek: ph.weekFrom });
        }
        for (const pc of ph.courses) {
          const [course] = await tx.select({ id: courses.id }).from(courses).where(eq(courses.slug, pc.slug));
          if (!course) throw new Error(`Programme ${p.slug} references unknown course ${pc.slug}`);
          await tx.insert(programCourses).values({
            id: newId(),
            programId,
            courseId: course.id,
            phaseId,
            electiveGroupId: groupId,
            ownerOrgId,
            position: ++coursePosition,
            isRequired: groupId ? false : pc.required,
            creditHours: pc.creditHours,
          });
        }
      }
      for (const [i, s] of p.capstoneStages.entries()) {
        await tx.insert(capstoneStageDefs).values({ id: newId(), programId, ownerOrgId, position: i + 1, ...s });
      }
      for (const [i, r] of p.graduationRequirements.entries()) {
        await tx.insert(graduationRequirements).values({ id: newId(), programId, ownerOrgId, position: i + 1, key: r.key, label: r.label });
      }
      for (const w of p.calendar) {
        await tx.insert(programCalendarWeeks).values({ id: newId(), programId, ownerOrgId, phaseId: phaseIds.get(w.phase) ?? null, weekNo: w.weekNo, focus: w.focus, majorOutput: w.majorOutput });
      }
      const listed = await tx
        .select({ id: catalogListings.id })
        .from(catalogListings)
        .where(and(eq(catalogListings.itemType, 'program'), eq(catalogListings.itemId, programId)));
      if (listed.length === 0) await tx.insert(catalogListings).values({ id: newId(), ownerOrgId, itemType: 'program', itemId: programId, channel: 'public' });
    });
  }
}
