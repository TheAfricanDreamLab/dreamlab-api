import { Inject, Injectable } from '@nestjs/common';
import type { CourseMediaUpload, InstructorProfile } from '@dreamlab/contracts';
import type { Principal } from '@lib/auth';
import { badRequest, forbidden, newId, notFound } from '@lib/common';
import { InjectDatabase } from '@lib/database';
import { BlobStorage, safeFileName } from '@lib/storage';
import { and, asc, eq, inArray } from 'drizzle-orm';
import { CatalogDatabase, schema } from '../../database';
import { AuthoringService, STORAGE } from '../authoring/authoring.service';

const { instructorProfiles, courseStaff, courses } = schema;
type ProfileRow = typeof instructorProfiles.$inferSelect;

type SaveInput = { name: string; title: string; bio: string; photoUrl: string | null; userId: string | null };

/**
 * Instructor profiles and course staff (INSTR-1). Profiles belong to the organisation (its course
 * authors keep them); a course's own authors decide who teaches it.
 */
@Injectable()
export class InstructorsService {
  constructor(
    @InjectDatabase() private readonly db: CatalogDatabase,
    @Inject(STORAGE) private readonly storage: BlobStorage,
    private readonly authoring: AuthoringService,
  ) {}

  /** The caller's organisation, where they author org-wide. */
  private async authorOrg(p: Principal): Promise<string> {
    const orgId = await this.authoring.homeOrg(p);
    if (!(await this.authoring.isOrgAuthor(p, orgId))) throw forbidden('permission_denied', 'Managing instructors needs the course author role for the organisation.');
    return orgId;
  }

  async list(p: Principal): Promise<{ items: InstructorProfile[] }> {
    const orgId = await this.authorOrg(p);
    const rows = await this.db.sys.select().from(instructorProfiles).where(eq(instructorProfiles.ownerOrgId, orgId)).orderBy(asc(instructorProfiles.name));
    return { items: await this.views(rows) };
  }

  async create(p: Principal, input: SaveInput): Promise<InstructorProfile> {
    const orgId = await this.authorOrg(p);
    const [row] = await this.db.system((tx) => tx.insert(instructorProfiles).values({ id: newId(), ownerOrgId: orgId, ...input }).returning());
    return (await this.views([row!]))[0]!;
  }

  async update(p: Principal, profileId: string, input: SaveInput): Promise<InstructorProfile> {
    const orgId = await this.authorOrg(p);
    const [row] = await this.db.system((tx) =>
      tx
        .update(instructorProfiles)
        .set({ ...input, updatedAt: new Date() })
        .where(and(eq(instructorProfiles.id, profileId), eq(instructorProfiles.ownerOrgId, orgId)))
        .returning(),
    );
    if (!row) throw notFound('instructor_not_found', 'Instructor not found');
    return (await this.views([row]))[0]!;
  }

  async remove(p: Principal, profileId: string): Promise<void> {
    const orgId = await this.authorOrg(p);
    const removed = await this.db.system(async (tx) => {
      await tx.delete(courseStaff).where(and(eq(courseStaff.profileId, profileId), eq(courseStaff.ownerOrgId, orgId)));
      return tx.delete(instructorProfiles).where(and(eq(instructorProfiles.id, profileId), eq(instructorProfiles.ownerOrgId, orgId))).returning({ id: instructorProfiles.id });
    });
    if (removed.length === 0) throw notFound('instructor_not_found', 'Instructor not found');
  }

  async uploadPhoto(p: Principal, req: { fileName: string; contentType: string; size: number }): Promise<CourseMediaUpload> {
    const orgId = await this.authorOrg(p);
    const path = `courses/${orgId}/${newId()}/${safeFileName(req.fileName)}`;
    return { ...this.storage.uploadTicket('public', path, req.contentType), path, url: `/media/${path}` };
  }

  async setStaff(p: Principal, slug: string, staff: { profileId: string; role: 'lead' | 'instructor' | 'assistant' }[]) {
    const [course] = await this.db.sys.select().from(courses).where(eq(courses.slug, slug));
    if (!course) throw notFound('course_not_found', 'Course not found');
    if (!(await this.authoring.canEditCourse(p, course.ownerOrgId, course.id))) throw notFound('course_not_found', 'Course not found');
    const ids = staff.map((s) => s.profileId);
    const owned = ids.length
      ? await this.db.sys.select({ id: instructorProfiles.id }).from(instructorProfiles).where(and(inArray(instructorProfiles.id, ids), eq(instructorProfiles.ownerOrgId, course.ownerOrgId)))
      : [];
    if (owned.length !== ids.length) throw badRequest('instructor_not_found', 'Choose instructors from your organisation’s profiles.');
    await this.db.system(async (tx) => {
      // Locks the course, so two authors saving its staff at once replace it one after the other.
      await tx.select({ id: courses.id }).from(courses).where(eq(courses.id, course.id)).for('update');
      await tx.delete(courseStaff).where(eq(courseStaff.courseId, course.id));
      if (staff.length) await tx.insert(courseStaff).values(staff.map((s, i) => ({ courseId: course.id, profileId: s.profileId, ownerOrgId: course.ownerOrgId, role: s.role, position: i + 1 })));
    });
    return { staff };
  }

  private async views(rows: ProfileRow[]): Promise<InstructorProfile[]> {
    if (rows.length === 0) return [];
    const links = await this.db.sys
      .select({ profileId: courseStaff.profileId, role: courseStaff.role, slug: courses.slug, title: courses.title })
      .from(courseStaff)
      .innerJoin(courses, eq(courses.id, courseStaff.courseId))
      .where(inArray(courseStaff.profileId, rows.map((r) => r.id)));
    return rows.map((r) => ({
      id: r.id,
      name: r.name,
      title: r.title,
      bio: r.bio,
      photoUrl: r.photoUrl,
      userId: r.userId,
      courses: links.filter((l) => l.profileId === r.id).map((l) => ({ slug: l.slug, title: l.title, role: l.role })),
    }));
  }
}
