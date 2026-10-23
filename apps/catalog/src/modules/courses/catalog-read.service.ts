import { Injectable } from '@nestjs/common';
import type { BlockAuthoring, CourseDetail, CourseSummary, ItemAuthoring } from '@dreamlab/contracts';
import type { Principal } from '@lib/auth';
import { notFound } from '@lib/common';
import { InjectDatabase } from '@lib/database';
import type { ContentItemRef, CourseContent } from '@lib/rpc';
import { and, asc, eq, ilike, inArray, isNotNull, ne, or, sql } from 'drizzle-orm';
import { CatalogDatabase, schema } from '../../database';

const { courses, courseVersions, courseModules, contentItems, assessments, questions, assignmentSpecs, rubricCriteria, catalogListings, programs, programCourses } =
  schema;
type CourseRow = typeof courses.$inferSelect;
type VersionRow = typeof courseVersions.$inferSelect;

export interface CourseFilter {
  q?: string;
  program?: string;
  level?: CourseRow['level'];
}

/**
 * Read side of the catalog. Runs on the system role: what a reader may see is decided here
 * explicitly (public or unlisted courses, plus private courses of the reader's active organisation).
 */
@Injectable()
export class CatalogReadService {
  constructor(@InjectDatabase() private readonly db: CatalogDatabase) {}

  /** Visible to this reader at all (by link). */
  canSee(course: Pick<CourseRow, 'visibility' | 'ownerOrgId'>, principal: Principal | null): boolean {
    if (course.visibility !== 'org_private') return true;
    return !!principal && (principal.platformAdmin || principal.orgId === course.ownerOrgId);
  }

  async listCourses(principal: Principal | null, filter: CourseFilter): Promise<CourseSummary[]> {
    const listed = sql`exists (select 1 from ${catalogListings} l where l.item_type = 'course' and l.item_id = ${courses.id} and l.channel = 'public')`;
    const ownPrivate = principal?.orgId ? and(eq(courses.visibility, 'org_private'), eq(courses.ownerOrgId, principal.orgId)) : undefined;
    const conditions = [ownPrivate ? or(and(eq(courses.visibility, 'public'), listed), ownPrivate) : and(eq(courses.visibility, 'public'), listed)];
    if (filter.q) {
      const like = `%${filter.q.replace(/[%_\\]/g, (c) => `\\${c}`)}%`;
      conditions.push(or(ilike(courses.title, like), ilike(courses.subtitle, like), sql`${courses.skills}::text ilike ${like}`));
    }
    if (filter.level) conditions.push(eq(courses.level, filter.level));
    if (filter.program) {
      conditions.push(
        sql`${courses.id} in (select pc.course_id from ${programCourses} pc join ${programs} p on p.id = pc.program_id where p.slug = ${filter.program})`,
      );
    }
    const rows = await this.db.sys.select().from(courses).where(and(...conditions));
    const summaries = await this.summarize(rows, principal);
    return summaries.sort((a, b) => Number(b.featured) - Number(a.featured) || Number(a.availability === 'coming_soon') - Number(b.availability === 'coming_soon') || a.title.localeCompare(b.title));
  }

  async summariesByIds(ids: string[]): Promise<CourseSummary[]> {
    if (ids.length === 0) return [];
    const rows = await this.db.sys.select().from(courses).where(inArray(courses.id, ids));
    return this.summarize(rows);
  }

  async getCourse(slug: string, principal: Principal | null): Promise<CourseDetail> {
    const [row] = await this.db.sys.select().from(courses).where(eq(courses.slug, slug));
    if (!row || !this.canSee(row, principal)) throw notFound('course_not_found', 'Course not found');
    const [summary] = await this.summarize([row], principal);
    const version = row.currentVersionId ? await this.version(row.currentVersionId) : null;
    const modules = version ? await this.outline(version.id) : [];
    return {
      ...summary!,
      description: row.description,
      outcomes: row.outcomes,
      audience: row.audience,
      prerequisites: row.prerequisites,
      instructors: row.instructors,
      trailer: row.trailer ?? null,
      versionId: version?.id ?? null,
      versionNo: version?.versionNo ?? null,
      modules,
    };
  }

  /** Course content for the learning service, answers included. */
  async content(by: { slug: string } | { versionId: string }): Promise<CourseContent | null> {
    let course: CourseRow | undefined;
    let version: VersionRow | undefined;
    if ('slug' in by) {
      [course] = await this.db.sys.select().from(courses).where(eq(courses.slug, by.slug));
      if (!course?.currentVersionId) return null;
      version = await this.version(course.currentVersionId);
    } else {
      version = await this.version(by.versionId);
      if (!version) return null;
      [course] = await this.db.sys.select().from(courses).where(eq(courses.id, version.courseId));
    }
    if (!course || !version) return null;

    const mods = await this.db.sys.select().from(courseModules).where(eq(courseModules.courseVersionId, version.id)).orderBy(asc(courseModules.position));
    const items = await this.db.sys.select().from(contentItems).where(eq(contentItems.courseVersionId, version.id)).orderBy(asc(contentItems.position));
    const itemIds = items.map((i) => i.id);
    const [quizzes, qs, specs] = itemIds.length
      ? await Promise.all([
          this.db.sys.select().from(assessments).where(inArray(assessments.contentItemId, itemIds)),
          this.db.sys.select().from(questions).where(inArray(questions.assessmentId, itemIds)).orderBy(asc(questions.position)),
          this.db.sys.select().from(assignmentSpecs).where(inArray(assignmentSpecs.contentItemId, itemIds)),
        ])
      : [[], [], []];
    const rubricIds = specs.map((s) => s.rubricId).filter((id): id is string => !!id);
    const criteria = rubricIds.length
      ? await this.db.sys.select().from(rubricCriteria).where(inArray(rubricCriteria.rubricId, rubricIds)).orderBy(asc(rubricCriteria.position))
      : [];

    const refOf = (i: (typeof items)[number]): ContentItemRef => {
      const base = { key: i.key, title: i.title, minutes: i.estimatedMinutes, required: i.isRequired };
      let authoring: ItemAuthoring;
      const p = i.payload as Record<string, unknown>;
      if (i.itemType === 'quiz') {
        const a = quizzes.find((q) => q.contentItemId === i.id)!;
        authoring = {
          ...base,
          type: 'quiz',
          gradeWeight: i.gradeWeight,
          payload: {
            intro: String(p.intro ?? ''),
            passPct: a.passMark,
            maxAttempts: a.maxAttempts,
            questions: qs.filter((q) => q.assessmentId === i.id).map((q) => q.body) as Extract<BlockAuthoring, { type: 'choice' | 'order' | 'match' }>[],
          },
        };
      } else if (i.itemType === 'assignment') {
        const spec = specs.find((s) => s.contentItemId === i.id)!;
        authoring = {
          ...base,
          type: 'assignment',
          gradeWeight: i.gradeWeight,
          payload: {
            brief: String(p.brief),
            practicalOutput: spec.practicalOutput,
            steps: p.steps as string[],
            template: p.template as string | undefined,
            minWords: Number(p.minWords ?? 0),
            rubric: criteria.filter((c) => c.rubricId === spec.rubricId).map((c) => ({ id: c.key, criterion: c.criterion, description: c.description })),
          },
        };
      } else if (i.itemType === 'lesson') {
        authoring = { ...base, type: 'lesson', payload: p as Extract<ItemAuthoring, { type: 'lesson' }>['payload'] };
      } else {
        authoring = { ...base, type: 'discussion', payload: p as Extract<ItemAuthoring, { type: 'discussion' }>['payload'] };
      }
      return { id: i.id, key: i.key, position: i.position, type: i.itemType, title: i.title, minutes: i.estimatedMinutes, required: i.isRequired, gradeWeight: i.gradeWeight, authoring };
    };

    return {
      course: { id: course.id, slug: course.slug, title: course.title, ownerOrgId: course.ownerOrgId, visibility: course.visibility, cover: course.cover },
      version: { id: version.id, versionNo: version.versionNo, creditHours: version.creditHours, estimatedMinutes: version.estimatedMinutes },
      modules: mods.map((m) => ({
        id: m.id,
        key: m.key,
        position: m.position,
        title: m.title,
        summary: m.summary,
        weekNo: m.weekNo,
        items: items.filter((i) => i.moduleId === m.id).map(refOf),
      })),
    };
  }

  private async version(id: string): Promise<VersionRow | undefined> {
    const [v] = await this.db.sys.select().from(courseVersions).where(eq(courseVersions.id, id));
    return v;
  }

  private async outline(versionId: string): Promise<CourseDetail['modules']> {
    const mods = await this.db.sys.select().from(courseModules).where(eq(courseModules.courseVersionId, versionId)).orderBy(asc(courseModules.position));
    const items = await this.db.sys
      .select({
        id: contentItems.id,
        moduleId: contentItems.moduleId,
        key: contentItems.key,
        type: contentItems.itemType,
        title: contentItems.title,
        minutes: contentItems.estimatedMinutes,
        required: contentItems.isRequired,
      })
      .from(contentItems)
      .where(eq(contentItems.courseVersionId, versionId))
      .orderBy(asc(contentItems.position));
    return mods.map((m) => ({
      id: m.id,
      key: m.key,
      position: m.position,
      title: m.title,
      summary: m.summary,
      weekNo: m.weekNo,
      items: items.filter((i) => i.moduleId === m.id).map(({ moduleId: _m, ...i }) => i),
    }));
  }

  /**
   * Course rows → summaries, with version figures, listing flags and programme membership. Private
   * programmes are named only to the viewer who may see them (their organisation, platform admins);
   * with no viewer (service calls), only public programmes are named.
   */
  async summarize(rows: CourseRow[], viewer: Principal | null = null): Promise<CourseSummary[]> {
    if (rows.length === 0) return [];
    const ids = rows.map((r) => r.id);
    const versionIds = rows.map((r) => r.currentVersionId).filter((v): v is string => !!v);
    const [versions, moduleCounts, listings, memberships] = await Promise.all([
      versionIds.length ? this.db.sys.select().from(courseVersions).where(inArray(courseVersions.id, versionIds)) : Promise.resolve([]),
      versionIds.length
        ? this.db.sys
            .select({ versionId: courseModules.courseVersionId, n: sql<number>`count(*)::int` })
            .from(courseModules)
            .where(inArray(courseModules.courseVersionId, versionIds))
            .groupBy(courseModules.courseVersionId)
        : Promise.resolve([]),
      this.db.sys
        .select()
        .from(catalogListings)
        .where(and(eq(catalogListings.itemType, 'course'), inArray(catalogListings.itemId, ids), isNotNull(catalogListings.itemId))),
      this.db.sys
        .select({ courseId: programCourses.courseId, slug: programs.slug, title: programs.title })
        .from(programCourses)
        .innerJoin(programs, eq(programs.id, programCourses.programId))
        .where(
          and(
            inArray(programCourses.courseId, ids),
            viewer?.platformAdmin
              ? undefined
              : viewer?.orgId
                ? or(ne(programs.visibility, 'org_private'), eq(programs.ownerOrgId, viewer.orgId))
                : ne(programs.visibility, 'org_private'),
          ),
        ),
    ]);
    return rows.map((r) => {
      const v = versions.find((x) => x.id === r.currentVersionId);
      return {
        id: r.id,
        slug: r.slug,
        title: r.title,
        subtitle: r.subtitle,
        provider: r.provider,
        level: r.level,
        language: r.language,
        creditHours: v?.creditHours ?? r.creditHours,
        estimatedMinutes: v?.estimatedMinutes ?? null,
        moduleCount: moduleCounts.find((m) => m.versionId === r.currentVersionId)?.n ?? 0,
        skills: r.skills,
        practicalOutput: r.practicalOutput,
        cover: r.cover,
        availability: v ? 'available' : 'coming_soon',
        featured: listings.some((l) => l.itemId === r.id && l.featured),
        programs: memberships.filter((m) => m.courseId === r.id).map(({ slug, title }) => ({ slug, title })),
      };
    });
  }
}
