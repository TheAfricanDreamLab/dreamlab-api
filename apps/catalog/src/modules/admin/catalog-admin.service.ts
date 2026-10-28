import { Injectable } from '@nestjs/common';
import type { ProgramAuthoring } from '@dreamlab/contracts';
import type { Principal } from '@lib/auth';
import { newId, notFound } from '@lib/common';
import { InjectDatabase } from '@lib/database';
import { InjectOutbox, OutboxWriter, userActor } from '@lib/messaging';
import { and, asc, eq, inArray } from 'drizzle-orm';
import { CatalogDatabase, schema } from '../../database';
import { CatalogEvents } from '../../events';

const { courses, courseVersions, catalogListings, programs, programPhases, programCourses, electiveGroups, capstoneStageDefs, graduationRequirements, programCalendarWeeks } = schema;

/** Platform administration of the catalog (PLT-1): what is listed and what is featured. */
@Injectable()
export class CatalogAdminService {
  constructor(
    @InjectDatabase() private readonly db: CatalogDatabase,
    @InjectOutbox() private readonly outbox: OutboxWriter,
  ) {}

  async list() {
    const rows = await this.db.sys.select().from(courses).orderBy(asc(courses.title));
    return { items: await this.toAdmin(rows.map((r) => r.id)) };
  }

  async update(principal: Principal, courseId: string, patch: { listed?: boolean; featured?: boolean }) {
    await this.db.system(async (tx) => {
      const [course] = await tx.select().from(courses).where(eq(courses.id, courseId));
      if (!course) throw notFound('course_not_found', 'Course not found');
      const where = and(eq(catalogListings.itemType, 'course'), eq(catalogListings.itemId, courseId), eq(catalogListings.channel, 'public'));
      const [listing] = await tx.select().from(catalogListings).where(where);
      const listed = patch.listed ?? !!listing;
      if (!listed) {
        if (listing) await tx.delete(catalogListings).where(where);
      } else if (listing) {
        if (patch.featured !== undefined) await tx.update(catalogListings).set({ featured: patch.featured }).where(where);
      } else {
        await tx.insert(catalogListings).values({ id: newId(), ownerOrgId: course.ownerOrgId, itemType: 'course', itemId: courseId, channel: 'public', featured: patch.featured ?? false });
      }
      await this.outbox.add(tx, {
        type: CatalogEvents.CourseListingChanged,
        orgId: course.ownerOrgId,
        actor: userActor(principal.userId),
        payload: { courseId, listed, featured: patch.featured ?? listing?.featured ?? false },
      });
    });
    const [item] = await this.toAdmin([courseId]);
    return item!;
  }

  /** The programme as its authored file: what importProgram takes, so an edit round-trips unchanged. */
  async exportProgram(slug: string): Promise<ProgramAuthoring> {
    // One snapshot: an import committing halfway through would otherwise mix old phases with new
    // course links, and importing that file again would drop the programme's courses.
    const { program, phases, links, groups, stages, requirements, weeks } = await this.db.sys.transaction(
      async (tx) => {
        const [program] = await tx.select().from(programs).where(eq(programs.slug, slug));
        if (!program) throw notFound('program_not_found', 'Programme not found');
        const phases = await tx.select().from(programPhases).where(eq(programPhases.programId, program.id)).orderBy(asc(programPhases.position));
        const links = await tx
          .select({ phaseId: programCourses.phaseId, slug: courses.slug, creditHours: programCourses.creditHours, required: programCourses.isRequired })
          .from(programCourses)
          .innerJoin(courses, eq(courses.id, programCourses.courseId))
          .where(eq(programCourses.programId, program.id))
          .orderBy(asc(programCourses.position));
        const groups = await tx.select().from(electiveGroups).where(eq(electiveGroups.programId, program.id));
        const stages = await tx.select().from(capstoneStageDefs).where(eq(capstoneStageDefs.programId, program.id)).orderBy(asc(capstoneStageDefs.position));
        const requirements = await tx.select().from(graduationRequirements).where(eq(graduationRequirements.programId, program.id)).orderBy(asc(graduationRequirements.position));
        const weeks = await tx.select().from(programCalendarWeeks).where(eq(programCalendarWeeks.programId, program.id)).orderBy(asc(programCalendarWeeks.weekNo));
        return { program, phases, links, groups, stages, requirements, weeks };
      },
      { isolationLevel: 'repeatable read', accessMode: 'read only' },
    );
    const phaseName = new Map(phases.map((ph) => [ph.id, ph.name]));
    const chooseN = new Map(groups.map((g) => [g.phaseId, g.chooseN]));
    return {
      slug: program.slug,
      title: program.title,
      subtitle: program.subtitle,
      description: program.description,
      provider: program.provider,
      programType: program.programType,
      deliveryMode: program.deliveryMode,
      features: program.features,
      cover: program.cover,
      phases: phases.map((ph) => ({
        key: ph.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || `phase-${ph.position}`,
        name: ph.name,
        summary: ph.summary,
        weekFrom: ph.weekFrom,
        weekTo: ph.weekTo,
        weightPct: ph.weightPct,
        chooseN: chooseN.get(ph.id) ?? null,
        courses: links.filter((l) => l.phaseId === ph.id).map((l) => ({ slug: l.slug, creditHours: l.creditHours, required: l.required })),
      })),
      capstoneStages: stages.map((st) => ({ name: st.name, outputDocument: st.outputDocument, creditHours: st.creditHours, summary: st.summary })),
      graduationRequirements: requirements.map((r) => ({ key: r.key, label: r.label })),
      calendar: weeks.map((w) => ({ weekNo: w.weekNo, phase: (w.phaseId && phaseName.get(w.phaseId)) || '', focus: w.focus, majorOutput: w.majorOutput })),
    };
  }

  private async toAdmin(ids: string[]) {
    if (ids.length === 0) return [];
    const rows = await this.db.sys.select().from(courses).where(inArray(courses.id, ids)).orderBy(asc(courses.title));
    const versionIds = rows.map((r) => r.currentVersionId).filter((v): v is string => !!v);
    const versions = versionIds.length ? await this.db.sys.select().from(courseVersions).where(inArray(courseVersions.id, versionIds)) : [];
    const listings = await this.db.sys
      .select()
      .from(catalogListings)
      .where(and(eq(catalogListings.itemType, 'course'), eq(catalogListings.channel, 'public'), inArray(catalogListings.itemId, ids)));
    return rows.map((r) => {
      const v = versions.find((x) => x.id === r.currentVersionId);
      const l = listings.find((x) => x.itemId === r.id);
      return {
        id: r.id,
        slug: r.slug,
        title: r.title,
        provider: r.provider,
        ownerOrgId: r.ownerOrgId,
        visibility: r.visibility,
        availability: v ? ('available' as const) : ('coming_soon' as const),
        listed: !!l,
        featured: l?.featured ?? false,
        versionNo: v?.versionNo ?? null,
        publishedAt: v?.publishedAt?.toISOString() ?? null,
        updatedAt: r.updatedAt.toISOString(),
      };
    });
  }
}
