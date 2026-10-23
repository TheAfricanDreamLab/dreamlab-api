import { Injectable } from '@nestjs/common';
import type { ProgramDetail, ProgramSummary } from '@dreamlab/contracts';
import type { Principal } from '@lib/auth';
import { notFound } from '@lib/common';
import { InjectDatabase } from '@lib/database';
import { asc, eq, inArray, sql } from 'drizzle-orm';
import { CatalogDatabase, schema } from '../../database';
import { CatalogReadService } from '../courses/catalog-read.service';

const { programs, programPhases, programCourses, electiveGroups, graduationRequirements, capstoneStageDefs, programCalendarWeeks, courses } = schema;
type ProgramRow = typeof programs.$inferSelect;

@Injectable()
export class ProgramsService {
  constructor(
    @InjectDatabase() private readonly db: CatalogDatabase,
    private readonly catalog: CatalogReadService,
  ) {}

  async list(principal: Principal | null): Promise<ProgramSummary[]> {
    const rows = await this.db.sys.select().from(programs).orderBy(asc(programs.title));
    return this.summarize(rows.filter((r) => this.canSee(r, principal)));
  }

  /**
   * A programme as this viewer may see it: private courses linked to it are left out for people who
   * may not see them. `internal` (service RPC, e.g. scheduling a cohort) sees every linked course.
   */
  async get(slug: string, principal: Principal | null, internal = false): Promise<ProgramDetail> {
    const [row] = await this.db.sys.select().from(programs).where(eq(programs.slug, slug));
    if (!row || !this.canSee(row, principal)) throw notFound('program_not_found', 'Programme not found');
    const [summary] = await this.summarize([row]);
    const [phases, links, groups, reqs, stages, weeks] = await Promise.all([
      this.db.sys.select().from(programPhases).where(eq(programPhases.programId, row.id)).orderBy(asc(programPhases.position)),
      this.db.sys.select().from(programCourses).where(eq(programCourses.programId, row.id)).orderBy(asc(programCourses.position)),
      this.db.sys.select().from(electiveGroups).where(eq(electiveGroups.programId, row.id)),
      this.db.sys.select().from(graduationRequirements).where(eq(graduationRequirements.programId, row.id)).orderBy(asc(graduationRequirements.position)),
      this.db.sys.select().from(capstoneStageDefs).where(eq(capstoneStageDefs.programId, row.id)).orderBy(asc(capstoneStageDefs.position)),
      this.db.sys.select().from(programCalendarWeeks).where(eq(programCalendarWeeks.programId, row.id)).orderBy(asc(programCalendarWeeks.weekNo)),
    ]);
    const linked = links.length ? await this.db.sys.select().from(courses).where(inArray(courses.id, links.map((l) => l.courseId))) : [];
    const courseRows = internal ? linked : linked.filter((c) => this.catalog.canSee(c, principal));
    const summaries = new Map((await this.catalog.summarize(courseRows)).map((s) => [s.id, s]));
    const phaseName = new Map(phases.map((p) => [p.id, p.name]));

    return {
      ...summary!,
      description: row.description,
      features: row.features,
      phases: phases.map((p) => {
        const inPhase = links.filter((l) => l.phaseId === p.id);
        const group = groups.find((g) => g.phaseId === p.id);
        // A phase with no courses that holds the capstone (the Dream Residency) earns the stages' credits.
        const capstone = inPhase.length === 0 && /residency|capstone/i.test(p.name);
        const credits = capstone
          ? stages.reduce((n, s) => n + s.creditHours, 0)
          : group
            ? group.chooseN * Math.max(0, ...inPhase.map((l) => l.creditHours))
            : inPhase.reduce((n, l) => n + l.creditHours, 0);
        return {
          id: p.id,
          position: p.position,
          name: p.name,
          summary: p.summary,
          weekFrom: p.weekFrom,
          weekTo: p.weekTo,
          weightPct: p.weightPct,
          creditHours: credits,
          chooseN: group?.chooseN ?? null,
          courses: inPhase
            .map((l) => {
              const s = summaries.get(l.courseId);
              return s ? { ...s, creditHours: l.creditHours, required: l.isRequired } : null;
            })
            .filter((c): c is NonNullable<typeof c> => c !== null),
        };
      }),
      capstoneStages: stages.map((s) => ({ position: s.position, name: s.name, outputDocument: s.outputDocument, creditHours: s.creditHours, summary: s.summary })),
      graduationRequirements: reqs.map((r) => ({ position: r.position, key: r.key, label: r.label })),
      calendar: weeks.map((w) => ({ weekNo: w.weekNo, phase: (w.phaseId && phaseName.get(w.phaseId)) || '', focus: w.focus, majorOutput: w.majorOutput })),
    };
  }

  private canSee(row: ProgramRow, principal: Principal | null): boolean {
    return row.visibility !== 'org_private' || (!!principal && (principal.platformAdmin || principal.orgId === row.ownerOrgId));
  }

  private async summarize(rows: ProgramRow[]): Promise<ProgramSummary[]> {
    if (rows.length === 0) return [];
    const counts = await this.db.sys
      .select({ programId: programCourses.programId, n: sql<number>`count(*)::int` })
      .from(programCourses)
      .where(inArray(programCourses.programId, rows.map((r) => r.id)))
      .groupBy(programCourses.programId);
    const weeks = await this.db.sys
      .select({ programId: programCalendarWeeks.programId, n: sql<number>`max(${programCalendarWeeks.weekNo})::int` })
      .from(programCalendarWeeks)
      .where(inArray(programCalendarWeeks.programId, rows.map((r) => r.id)))
      .groupBy(programCalendarWeeks.programId);
    return rows.map((r) => ({
      id: r.id,
      slug: r.slug,
      title: r.title,
      subtitle: r.subtitle,
      provider: r.provider,
      programType: r.programType,
      deliveryMode: r.deliveryMode,
      creditTotal: r.creditTotal,
      weeks: weeks.find((w) => w.programId === r.id)?.n ?? null,
      courseCount: counts.find((c) => c.programId === r.id)?.n ?? 0,
      cover: r.cover,
    }));
  }
}
