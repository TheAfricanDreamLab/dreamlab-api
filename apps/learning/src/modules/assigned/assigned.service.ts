import { Inject, Injectable } from '@nestjs/common';
import type { CourseSummary, LearningAssignment, MyAssignment } from '@dreamlab/contracts';
import type { Principal } from '@lib/auth';
import { badRequest, conflict, forbidden, newId, notFound } from '@lib/common';
import { InjectDatabase } from '@lib/database';
import { InjectOutbox, OutboxWriter, requestNotification, userActor } from '@lib/messaging';
import { CatalogClient, IamRpc, RpcClient, UserName } from '@lib/rpc';
import { and, desc, eq, inArray, isNull } from 'drizzle-orm';
import { LearningDatabase, schema } from '../../database';
import { CATALOG, EnrollmentsService } from '../enrollments/enrollments.service';
import { IAM_NAMES } from '../player/player.service';
import { assigneeStatus, emptyCounts } from './assignee-status';

const { learningAssignments, learningAssignees, courseEnrollments } = schema;
type AssignmentRow = typeof learningAssignments.$inferSelect;

type Detail = LearningAssignment & { assignees: { userId: string; name: string; status: MyAssignment['status']; progressPct: number; completedAt: string | null }[] };

/**
 * Assigned learning (ASSIGN-1): an organisation assigns a course to its people and groups. Groups are
 * expanded to people when the assignment is made; everyone is enrolled in the organisation's context
 * and told. Withdrawing an assignment keeps the enrolments and their progress.
 */
@Injectable()
export class AssignedService {
  constructor(
    @InjectDatabase() private readonly db: LearningDatabase,
    @InjectOutbox() private readonly outbox: OutboxWriter,
    @Inject(CATALOG) private readonly catalog: CatalogClient,
    @Inject(IAM_NAMES) private readonly iam: RpcClient,
    private readonly enrollments: EnrollmentsService,
  ) {}

  private orgOf(p: Principal): string {
    if (!p.orgId) throw forbidden('org_context_required', 'Switch to the organisation that assigns the learning.');
    return p.orgId;
  }

  async list(p: Principal): Promise<{ items: LearningAssignment[] }> {
    const orgId = this.orgOf(p);
    const rows = await this.db.sys
      .select()
      .from(learningAssignments)
      .where(and(eq(learningAssignments.orgId, orgId), isNull(learningAssignments.withdrawnAt)))
      .orderBy(desc(learningAssignments.createdAt));
    const details = await this.details(rows);
    return { items: details.map(({ assignees: _assignees, ...a }) => a) };
  }

  async get(p: Principal, assignmentId: string): Promise<Detail> {
    return (await this.details([await this.own(p, assignmentId)]))[0]!;
  }

  async create(p: Principal, input: { courseSlug: string; userIds: string[]; groupIds: string[]; dueOn: string | null; note: string }, requestId?: string): Promise<Detail> {
    const orgId = this.orgOf(p);
    // The course must be one the organisation's people can see.
    const detail = await this.catalog.detail(input.courseSlug, { orgId, platformAdmin: false });
    if (!detail) throw notFound('course_not_found', 'Course not found');
    const content = await this.catalog.current(input.courseSlug);
    if (!content) throw conflict('course_not_open', 'This course isn’t open for enrolment yet.');
    if (content.course.visibility === 'org_private' && content.course.ownerOrgId !== orgId) throw notFound('course_not_found', 'Course not found');

    const [fromGroups, direct] = await Promise.all([
      input.groupIds.length ? this.iam.send<string[]>(IamRpc.GroupMembers, { orgId, groupIds: input.groupIds }) : Promise.resolve([] as string[]),
      input.userIds.length ? this.iam.send<string[]>(IamRpc.ActiveMembers, { orgId, userIds: input.userIds }) : Promise.resolve([] as string[]),
    ]);
    const people = [...new Set([...direct, ...fromGroups])];
    if (people.length === 0) throw badRequest('no_assignees', 'None of those people are active members of the organisation.');

    const id = newId();
    await this.db.system(async (tx) => {
      await tx.insert(learningAssignments).values({ id, orgId, courseId: content.course.id, courseSlug: content.course.slug, dueOn: input.dueOn, note: input.note, assignedByUserId: p.userId });
      for (const userId of people) {
        const { row } = await this.enrollments.enrolInContext(tx, userId, orgId, content, p.userId, requestId);
        await tx.insert(learningAssignees).values({ assignmentId: id, userId, orgId, courseEnrollmentId: row.id }).onConflictDoNothing();
      }
      const due = input.dueOn ? ` by ${input.dueOn}` : '';
      await requestNotification(
        this.outbox,
        tx,
        {
          to: { userIds: people },
          exclude: [p.userId],
          category: 'cohorts',
          title: `New course to take: ${content.course.title}`,
          body: `You have been asked to complete ${content.course.title}${due}. You are already enrolled.${input.note ? ` ${input.note}` : ''}`,
          link: '/app/learning',
          orgId,
          key: `assigned:${id}`,
        },
        userActor(p.userId),
      );
    });
    return this.get(p, id);
  }

  async update(p: Principal, assignmentId: string, input: { dueOn?: string | null; note?: string }): Promise<Detail> {
    const row = await this.own(p, assignmentId);
    await this.db.system((tx) =>
      tx
        .update(learningAssignments)
        .set({ dueOn: input.dueOn === undefined ? row.dueOn : input.dueOn, note: input.note ?? row.note, updatedAt: new Date() })
        .where(eq(learningAssignments.id, row.id)),
    );
    return this.get(p, assignmentId);
  }

  async remove(p: Principal, assignmentId: string): Promise<void> {
    const row = await this.own(p, assignmentId);
    await this.db.system((tx) => tx.update(learningAssignments).set({ withdrawnAt: new Date(), updatedAt: new Date() }).where(eq(learningAssignments.id, row.id)));
  }

  /** What I was assigned, in every organisation. */
  async mine(p: Principal): Promise<{ items: MyAssignment[] }> {
    const rows = await this.db.sys
      .select({ a: learningAssignments, e: courseEnrollments })
      .from(learningAssignees)
      .innerJoin(learningAssignments, eq(learningAssignments.id, learningAssignees.assignmentId))
      .leftJoin(courseEnrollments, eq(courseEnrollments.id, learningAssignees.courseEnrollmentId))
      .where(and(eq(learningAssignees.userId, p.userId), isNull(learningAssignments.withdrawnAt)))
      .orderBy(desc(learningAssignments.createdAt));
    if (rows.length === 0) return { items: [] };
    const [courses, orgs] = await Promise.all([
      this.catalog.courseSummaries([...new Set(rows.map((r) => r.a.courseId))]),
      this.iam.send<{ id: string; name: string }[]>(IamRpc.OrgNames, { ids: [...new Set(rows.map((r) => r.a.orgId))] }).catch(() => []),
    ]);
    const orgName = new Map(orgs.map((o) => [o.id, o.name]));
    const items: MyAssignment[] = [];
    for (const { a, e } of rows) {
      const course = courses.get(a.courseId);
      if (!course) continue;
      items.push({
        id: a.id,
        course,
        orgName: orgName.get(a.orgId) ?? 'Your organisation',
        dueOn: a.dueOn,
        note: a.note,
        status: assigneeStatus(e, a.dueOn),
        progressPct: e?.progressPct ?? 0,
        enrollmentId: e?.id ?? null,
      });
    }
    return { items };
  }

  // ---------- internals ----------

  private async own(p: Principal, assignmentId: string): Promise<AssignmentRow> {
    const orgId = this.orgOf(p);
    const [row] = await this.db.sys
      .select()
      .from(learningAssignments)
      .where(and(eq(learningAssignments.id, assignmentId), eq(learningAssignments.orgId, orgId), isNull(learningAssignments.withdrawnAt)));
    if (!row) throw notFound('assignment_not_found', 'Assignment not found');
    return row;
  }

  private async details(rows: AssignmentRow[]): Promise<Detail[]> {
    if (rows.length === 0) return [];
    const ids = rows.map((r) => r.id);
    const assignees = await this.db.sys
      .select({ x: learningAssignees, e: courseEnrollments })
      .from(learningAssignees)
      .leftJoin(courseEnrollments, eq(courseEnrollments.id, learningAssignees.courseEnrollmentId))
      .where(inArray(learningAssignees.assignmentId, ids));
    const [courses, names] = await Promise.all([
      this.catalog.courseSummaries([...new Set(rows.map((r) => r.courseId))]),
      this.names([...new Set([...assignees.map((a) => a.x.userId), ...rows.map((r) => r.assignedByUserId)])]),
    ]);
    const out: Detail[] = [];
    for (const r of rows) {
      const course = courses.get(r.courseId);
      if (!course) continue;
      const people = assignees
        .filter((a) => a.x.assignmentId === r.id)
        .map(({ x, e }) => ({
          userId: x.userId,
          name: names.get(x.userId) ?? 'Member',
          status: assigneeStatus(e, r.dueOn),
          progressPct: e?.progressPct ?? 0,
          completedAt: e?.completedAt?.toISOString() ?? null,
        }))
        .sort((a, b) => a.name.localeCompare(b.name));
      const counts = emptyCounts();
      for (const person of people) counts[person.status] += 1;
      out.push({
        id: r.id,
        course: course as CourseSummary,
        dueOn: r.dueOn,
        note: r.note,
        assignedBy: names.get(r.assignedByUserId) ?? 'An admin',
        createdAt: r.createdAt.toISOString(),
        counts,
        assignees: people,
      });
    }
    return out;
  }

  /** Display names, asked for in batches of 500 (the most the IAM RPC takes at once). */
  private async names(ids: string[]): Promise<Map<string, string>> {
    const batches: string[][] = [];
    for (let i = 0; i < ids.length; i += 500) batches.push(ids.slice(i, i + 500));
    const rows = (await Promise.all(batches.map((userIds) => this.iam.send<UserName[]>(IamRpc.UserNames, { userIds }).catch(() => [] as UserName[])))).flat();
    return new Map(rows.map((r) => [r.id, r.name]));
  }
}
