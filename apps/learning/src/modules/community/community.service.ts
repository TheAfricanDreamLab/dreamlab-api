import { Inject, Injectable } from '@nestjs/common';
import type { DreamCircle, JoinTicket, MentorAssignment, MentorMeeting, MyCommunity } from '@dreamlab/contracts';
import type { Principal } from '@lib/auth';
import { badRequest, forbidden, newId, notFound } from '@lib/common';
import { InjectDatabase } from '@lib/database';
import type { MeetKit } from '@lib/meet-kit';
import { InjectOutbox, OutboxWriter, requestNotification, userActor } from '@lib/messaging';
import { IamRpc, RpcClient, UserName } from '@lib/rpc';
import { and, asc, desc, eq, gt, inArray, isNull } from 'drizzle-orm';
import { LearningDatabase, LearningTx, schema } from '../../database';
import { IAM_NAMES } from '../player/player.service';
import { MEET_KIT } from './live.service';

const { cohorts, classSessions, programEnrollments, recordings, mentorAssignments, mentorMeetings, dreamCircles, circleMembers } = schema;
type CohortRow = typeof cohorts.$inferSelect;
type AssignmentRow = typeof mentorAssignments.$inferSelect;
type MeetingRow = typeof mentorMeetings.$inferSelect;

/** Recordings listed on a learner's My programme. */
const MY_RECORDINGS = 30;
const OPENS_BEFORE_MS = 15 * 60_000;
const CLOSES_AFTER_MS = 60 * 60_000;

/**
 * Mentorship and Dream Circles (COMM-1). Cohort managers assign mentors (people holding
 * mentorship.conduct in the host organisation) and form circles of the cohort's learners; mentors
 * schedule and log meetings with their mentees, joining virtual ones live.
 */
@Injectable()
export class CommunityService {
  constructor(
    @InjectDatabase() private readonly db: LearningDatabase,
    @InjectOutbox() private readonly outbox: OutboxWriter,
    @Inject(MEET_KIT) private readonly meet: MeetKit,
    @Inject(IAM_NAMES) private readonly iam: RpcClient,
  ) {}

  // ---------- helpers ----------

  /** The route required cohort.manage in the active organisation; the cohort must be that organisation's. */
  private async managedCohort(p: Principal, cohortId: string): Promise<CohortRow> {
    const [row] = await this.db.sys.select().from(cohorts).where(eq(cohorts.id, cohortId));
    if (!row || (!p.platformAdmin && row.hostOrgId !== p.orgId)) throw notFound('cohort_not_found', 'Cohort not found');
    return row;
  }

  private async activeLearners(cohortId: string, userIds: string[]): Promise<Set<string>> {
    if (userIds.length === 0) return new Set();
    const rows = await this.db.sys
      .select({ userId: programEnrollments.userId })
      .from(programEnrollments)
      .where(and(eq(programEnrollments.cohortId, cohortId), eq(programEnrollments.status, 'active'), inArray(programEnrollments.userId, userIds)));
    return new Set(rows.map((r) => r.userId));
  }

  private async names(ids: string[]): Promise<Map<string, string>> {
    const unique = [...new Set(ids)];
    if (unique.length === 0) return new Map();
    const rows = await this.iam.send<UserName[]>(IamRpc.UserNames, { userIds: unique }).catch(() => [] as UserName[]);
    return new Map(rows.map((r) => [r.id, r.name]));
  }

  private async mentorCandidates(orgId: string): Promise<string[]> {
    return this.iam.send<string[]>(IamRpc.PermissionHolders, { orgId, permission: 'mentorship.conduct' }).catch(() => [] as string[]);
  }

  private toAssignment(a: AssignmentRow, names: Map<string, string>): MentorAssignment {
    return {
      id: a.id,
      cohortId: a.cohortId,
      mentor: { userId: a.mentorUserId, name: names.get(a.mentorUserId) ?? 'Mentor' },
      learner: { userId: a.learnerUserId, name: names.get(a.learnerUserId) ?? 'Learner' },
      since: a.createdAt.toISOString(),
    };
  }

  private toMeeting(m: MeetingRow, a: AssignmentRow, names: Map<string, string>, viewerIsLearner: boolean, now = new Date()): MentorMeeting {
    const start = m.scheduledAt.getTime();
    return {
      id: m.id,
      assignmentId: a.id,
      mentor: { userId: a.mentorUserId, name: names.get(a.mentorUserId) ?? 'Mentor' },
      learner: { userId: a.learnerUserId, name: names.get(a.learnerUserId) ?? 'Learner' },
      scheduledAt: m.scheduledAt.toISOString(),
      durationMin: m.durationMin,
      mode: m.mode,
      location: m.location,
      status: m.status,
      // A learner reads the log once the meeting is held; the mentor always.
      notes: viewerIsLearner && m.status !== 'held' ? '' : m.notes,
      joinable:
        m.mode === 'virtual' &&
        m.status === 'scheduled' &&
        now.getTime() >= start - OPENS_BEFORE_MS &&
        now.getTime() <= start + m.durationMin * 60_000 + CLOSES_AFTER_MS,
    };
  }

  // ---------- assignments (cohort managers) ----------

  async mentors(p: Principal, cohortId: string) {
    const cohort = await this.managedCohort(p, cohortId);
    const [rows, candidates] = await Promise.all([
      this.db.sys
        .select()
        .from(mentorAssignments)
        .where(and(eq(mentorAssignments.cohortId, cohort.id), isNull(mentorAssignments.endedAt)))
        .orderBy(asc(mentorAssignments.createdAt)),
      this.mentorCandidates(cohort.hostOrgId),
    ]);
    const names = await this.names([...rows.flatMap((r) => [r.mentorUserId, r.learnerUserId]), ...candidates]);
    return {
      items: rows.map((r) => this.toAssignment(r, names)),
      candidates: candidates.map((id) => ({ userId: id, name: names.get(id) ?? 'Mentor' })).sort((a, b) => a.name.localeCompare(b.name)),
    };
  }

  async assignMentors(p: Principal, cohortId: string, input: { mentorUserId: string; learnerUserIds: string[] }) {
    const cohort = await this.managedCohort(p, cohortId);
    if (!(await this.mentorCandidates(cohort.hostOrgId)).includes(input.mentorUserId)) {
      throw badRequest('not_a_mentor', 'That person cannot mentor in this organisation. Give them the Mentor role first.');
    }
    const learners = [...new Set(input.learnerUserIds)];
    const enrolled = await this.activeLearners(cohort.id, learners);
    const missing = learners.filter((id) => !enrolled.has(id));
    if (missing.length > 0) throw badRequest('not_in_cohort', 'Some of those people are not learners in this cohort.');
    if (learners.includes(input.mentorUserId)) throw badRequest('self_mentor', 'Nobody mentors themselves.');
    const created = await this.db.system(async (tx) => {
      const existing = await tx
        .select({ learnerUserId: mentorAssignments.learnerUserId })
        .from(mentorAssignments)
        .where(and(eq(mentorAssignments.cohortId, cohort.id), eq(mentorAssignments.mentorUserId, input.mentorUserId), isNull(mentorAssignments.endedAt), inArray(mentorAssignments.learnerUserId, learners)));
      const already = new Set(existing.map((e) => e.learnerUserId));
      const fresh = learners.filter((id) => !already.has(id));
      if (fresh.length === 0) return [];
      const rows = await tx
        .insert(mentorAssignments)
        .values(fresh.map((learnerUserId) => ({ id: newId(), cohortId: cohort.id, hostOrgId: cohort.hostOrgId, mentorUserId: input.mentorUserId, learnerUserId, assignedByUserId: p.userId })))
        .returning();
      const names = await this.names([input.mentorUserId]);
      await requestNotification(
        this.outbox,
        tx,
        {
          to: { userIds: fresh },
          category: 'community',
          title: `${names.get(input.mentorUserId) ?? 'A mentor'} is now your mentor`,
          body: `In ${cohort.name}. Your mentor will schedule your first meeting.`,
          link: '/app/programme',
          orgId: cohort.hostOrgId,
          key: `mentor-assigned:${rows.map((r) => r.id).join(',').slice(0, 150)}`,
        },
        userActor(p.userId),
      );
      await requestNotification(
        this.outbox,
        tx,
        {
          to: { userIds: [input.mentorUserId] },
          category: 'community',
          title: `${fresh.length} new mentee${fresh.length === 1 ? '' : 's'} in ${cohort.name}`,
          body: 'Open Mentoring to see them and schedule a first meeting.',
          link: '/app/mentoring',
          orgId: cohort.hostOrgId,
          key: `mentees-assigned:${rows[0]!.id}`,
        },
        userActor(p.userId),
      );
      return rows;
    });
    const names = await this.names(created.flatMap((r) => [r.mentorUserId, r.learnerUserId]));
    return { items: created.map((r) => this.toAssignment(r, names)) };
  }

  async endAssignment(p: Principal, assignmentId: string): Promise<void> {
    const [a] = await this.db.sys.select().from(mentorAssignments).where(eq(mentorAssignments.id, assignmentId));
    if (!a || a.endedAt) throw notFound('assignment_not_found', 'Mentor assignment not found');
    await this.managedCohort(p, a.cohortId);
    await this.db.system((tx) => tx.update(mentorAssignments).set({ endedAt: new Date() }).where(eq(mentorAssignments.id, a.id)));
  }

  // ---------- mentors ----------

  async mentoring(p: Principal, now = new Date()) {
    const assignments = await this.db.sys
      .select({ a: mentorAssignments, cohortName: cohorts.name })
      .from(mentorAssignments)
      .innerJoin(cohorts, eq(cohorts.id, mentorAssignments.cohortId))
      .where(and(eq(mentorAssignments.mentorUserId, p.userId), isNull(mentorAssignments.endedAt)))
      .orderBy(asc(cohorts.name));
    const ids = assignments.map((r) => r.a.id);
    const meetings = ids.length
      ? await this.db.sys.select().from(mentorMeetings).where(inArray(mentorMeetings.assignmentId, ids)).orderBy(desc(mentorMeetings.scheduledAt))
      : [];
    const names = await this.names(assignments.flatMap((r) => [r.a.mentorUserId, r.a.learnerUserId]));
    const byAssignment = new Map(assignments.map((r) => [r.a.id, r.a]));
    return {
      learners: assignments.map(({ a, cohortName }) => {
        const mine = meetings.filter((m) => m.assignmentId === a.id && m.status !== 'cancelled');
        const last = mine.filter((m) => m.status === 'held').map((m) => m.scheduledAt).sort((x, y) => y.getTime() - x.getTime())[0];
        const next = mine.filter((m) => m.status === 'scheduled' && m.scheduledAt > now).map((m) => m.scheduledAt).sort((x, y) => x.getTime() - y.getTime())[0];
        return { ...this.toAssignment(a, names), cohortName, lastMeetingAt: last?.toISOString() ?? null, nextMeetingAt: next?.toISOString() ?? null };
      }),
      meetings: meetings.slice(0, 100).map((m) => this.toMeeting(m, byAssignment.get(m.assignmentId)!, names, false, now)),
    };
  }

  private async ownAssignment(p: Principal, assignmentId: string): Promise<AssignmentRow> {
    const [a] = await this.db.sys.select().from(mentorAssignments).where(eq(mentorAssignments.id, assignmentId));
    if (!a || a.endedAt || a.mentorUserId !== p.userId) throw notFound('assignment_not_found', 'Mentee not found');
    return a;
  }

  async scheduleMeeting(p: Principal, input: { assignmentId: string; scheduledAt: string; durationMin: number; mode: 'virtual' | 'physical'; location: string | null }): Promise<MentorMeeting> {
    const a = await this.ownAssignment(p, input.assignmentId);
    const at = new Date(input.scheduledAt);
    if (at.getTime() < Date.now() - 60_000) throw badRequest('in_the_past', 'Choose a time in the future.');
    const row = await this.db.system(async (tx) => {
      const [m] = await tx
        .insert(mentorMeetings)
        .values({ id: newId(), assignmentId: a.id, hostOrgId: a.hostOrgId, scheduledAt: at, durationMin: input.durationMin, mode: input.mode, location: input.location })
        .returning();
      await this.notifyLearner(tx, p, a, m!, 'scheduled');
      return m!;
    });
    return this.toMeeting(row, a, await this.names([a.mentorUserId, a.learnerUserId]), false);
  }

  async updateMeeting(p: Principal, meetingId: string, input: { scheduledAt?: string; status?: 'scheduled' | 'held' | 'cancelled'; notes?: string }): Promise<MentorMeeting> {
    const [m] = await this.db.sys.select().from(mentorMeetings).where(eq(mentorMeetings.id, meetingId));
    if (!m) throw notFound('meeting_not_found', 'Meeting not found');
    const a = await this.ownAssignment(p, m.assignmentId);
    const row = await this.db.system(async (tx) => {
      const [u] = await tx
        .update(mentorMeetings)
        .set({
          ...(input.scheduledAt !== undefined && { scheduledAt: new Date(input.scheduledAt) }),
          ...(input.status !== undefined && { status: input.status }),
          ...(input.notes !== undefined && { notes: input.notes }),
          updatedAt: new Date(),
        })
        .where(eq(mentorMeetings.id, m.id))
        .returning();
      if (input.status === 'cancelled' && m.status !== 'cancelled') await this.notifyLearner(tx, p, a, u!, 'cancelled');
      else if (input.scheduledAt !== undefined && input.scheduledAt !== m.scheduledAt.toISOString()) await this.notifyLearner(tx, p, a, u!, 'moved');
      return u!;
    });
    return this.toMeeting(row, a, await this.names([a.mentorUserId, a.learnerUserId]), false);
  }

  private async notifyLearner(tx: LearningTx, p: Principal, a: AssignmentRow, m: MeetingRow, what: 'scheduled' | 'moved' | 'cancelled') {
    const mentor = (await this.names([a.mentorUserId])).get(a.mentorUserId) ?? 'Your mentor';
    const when = `${m.scheduledAt.toISOString().slice(0, 10)} at ${m.scheduledAt.toISOString().slice(11, 16)} UTC`;
    const title = what === 'cancelled' ? `${mentor} cancelled your meeting` : what === 'moved' ? `${mentor} moved your meeting` : `Meeting with ${mentor}`;
    await requestNotification(
      this.outbox,
      tx,
      {
        to: { userIds: [a.learnerUserId] },
        category: 'community',
        title,
        body: what === 'cancelled' ? `The meeting on ${when} will not take place.` : `${when}, ${m.durationMin} minutes, ${m.mode === 'virtual' ? 'online' : (m.location ?? 'in person')}.`,
        link: '/app/programme',
        orgId: a.hostOrgId,
        key: `mentor-meeting:${m.id}:${what}:${m.scheduledAt.toISOString()}`,
      },
      userActor(p.userId),
    );
  }

  async joinMeeting(p: Principal, meetingId: string, now = new Date()): Promise<JoinTicket> {
    const [m] = await this.db.sys.select().from(mentorMeetings).where(eq(mentorMeetings.id, meetingId));
    const [a] = m ? await this.db.sys.select().from(mentorAssignments).where(eq(mentorAssignments.id, m.assignmentId)) : [];
    // An ended mentorship's meetings stay in the record but cannot be joined.
    if (!m || !a || a.endedAt || (a.mentorUserId !== p.userId && a.learnerUserId !== p.userId)) throw notFound('meeting_not_found', 'Meeting not found');
    const names = await this.names([a.mentorUserId, a.learnerUserId]);
    const view = this.toMeeting(m, a, names, a.learnerUserId === p.userId, now);
    if (m.mode !== 'virtual') throw forbidden('not_virtual', 'This meeting is in person.');
    if (!view.joinable) throw forbidden('not_joinable', m.status === 'scheduled' ? 'The room opens 15 minutes before the meeting.' : 'This meeting is not open.');
    const role = a.mentorUserId === p.userId ? 'host' : 'participant';
    // One to one: the mentee may share camera and screen too, unlike learners in a class.
    const grant = await this.meet.join(this.meet.roomName('mentor', m.id), p.userId, names.get(p.userId) ?? 'Participant', role, m.durationMin + 60, { participantVideo: true });
    return { url: grant.url, token: grant.token, roomName: grant.roomName, role, title: `Mentor meeting: ${names.get(a.mentorUserId)} and ${names.get(a.learnerUserId)}`, expiresAt: grant.expiresAt.toISOString() };
  }

  // ---------- circles ----------

  async circles(p: Principal, cohortId: string): Promise<{ items: DreamCircle[] }> {
    const cohort = await this.managedCohort(p, cohortId);
    return { items: await this.circleViews(await this.db.sys.select().from(dreamCircles).where(eq(dreamCircles.cohortId, cohort.id)).orderBy(asc(dreamCircles.name))) };
  }

  private async circleViews(rows: (typeof dreamCircles.$inferSelect)[]): Promise<DreamCircle[]> {
    if (rows.length === 0) return [];
    const members = await this.db.sys.select().from(circleMembers).where(inArray(circleMembers.circleId, rows.map((r) => r.id)));
    const names = await this.names(members.map((m) => m.userId));
    return rows.map((c) => ({
      id: c.id,
      cohortId: c.cohortId,
      name: c.name,
      members: members
        .filter((m) => m.circleId === c.id)
        .map((m) => ({ userId: m.userId, name: names.get(m.userId) ?? 'Learner' }))
        .sort((a, b) => a.name.localeCompare(b.name)),
    }));
  }

  async createCircle(p: Principal, cohortId: string, input: { name: string; memberUserIds: string[] }): Promise<DreamCircle> {
    const cohort = await this.managedCohort(p, cohortId);
    const members = await this.checkMembers(cohort.id, input.memberUserIds);
    const row = await this.db.system(async (tx) => {
      const [c] = await tx.insert(dreamCircles).values({ id: newId(), cohortId: cohort.id, hostOrgId: cohort.hostOrgId, name: input.name }).returning();
      await this.setMembers(tx, p, c!, members, []);
      return c!;
    });
    return (await this.circleViews([row]))[0]!;
  }

  async updateCircle(p: Principal, circleId: string, input: { name: string; memberUserIds: string[] }): Promise<DreamCircle> {
    const [c] = await this.db.sys.select().from(dreamCircles).where(eq(dreamCircles.id, circleId));
    if (!c) throw notFound('circle_not_found', 'Circle not found');
    await this.managedCohort(p, c.cohortId);
    const members = await this.checkMembers(c.cohortId, input.memberUserIds);
    const row = await this.db.system(async (tx) => {
      const before = (await tx.select({ userId: circleMembers.userId }).from(circleMembers).where(eq(circleMembers.circleId, c.id))).map((m) => m.userId);
      const [u] = await tx.update(dreamCircles).set({ name: input.name, updatedAt: new Date() }).where(eq(dreamCircles.id, c.id)).returning();
      await tx.delete(circleMembers).where(eq(circleMembers.circleId, c.id));
      await this.setMembers(tx, p, u!, members, before);
      return u!;
    });
    return (await this.circleViews([row]))[0]!;
  }

  async deleteCircle(p: Principal, circleId: string): Promise<void> {
    const [c] = await this.db.sys.select().from(dreamCircles).where(eq(dreamCircles.id, circleId));
    if (!c) throw notFound('circle_not_found', 'Circle not found');
    await this.managedCohort(p, c.cohortId);
    await this.db.system(async (tx) => {
      await tx.delete(circleMembers).where(eq(circleMembers.circleId, c.id));
      await tx.delete(dreamCircles).where(eq(dreamCircles.id, c.id));
    });
  }

  private async checkMembers(cohortId: string, userIds: string[]): Promise<string[]> {
    const ids = [...new Set(userIds)];
    const enrolled = await this.activeLearners(cohortId, ids);
    if (ids.some((id) => !enrolled.has(id))) throw badRequest('not_in_cohort', 'Circle members must be learners in this cohort.');
    return ids;
  }

  private async setMembers(tx: LearningTx, p: Principal, circle: typeof dreamCircles.$inferSelect, members: string[], before: string[]) {
    await tx.insert(circleMembers).values(members.map((userId) => ({ circleId: circle.id, userId, hostOrgId: circle.hostOrgId })));
    const added = members.filter((m) => !before.includes(m));
    if (added.length === 0) return;
    await requestNotification(
      this.outbox,
      tx,
      {
        to: { userIds: added },
        category: 'community',
        title: `You are in the Dream Circle “${circle.name}”`,
        body: `${members.length} learners who will support each other through the programme. See them under My programme.`,
        link: '/app/programme',
        orgId: circle.hostOrgId,
        key: `circle:${circle.id}:${added.join(',').slice(0, 150)}`,
      },
      userActor(p.userId),
    );
  }

  // ---------- learners ----------

  async myCommunity(p: Principal, now = new Date()): Promise<MyCommunity> {
    const assignments = await this.db.sys
      .select({ a: mentorAssignments, cohortName: cohorts.name })
      .from(mentorAssignments)
      .innerJoin(cohorts, eq(cohorts.id, mentorAssignments.cohortId))
      .where(and(eq(mentorAssignments.learnerUserId, p.userId), isNull(mentorAssignments.endedAt)));
    const ids = assignments.map((r) => r.a.id);
    const meetings = ids.length
      ? await this.db.sys
          .select()
          .from(mentorMeetings)
          .where(and(inArray(mentorMeetings.assignmentId, ids), gt(mentorMeetings.scheduledAt, new Date(now.getTime() - 30 * 86_400_000))))
          .orderBy(asc(mentorMeetings.scheduledAt))
      : [];
    const myCircles = await this.db.sys
      .select({ c: dreamCircles, cohortName: cohorts.name })
      .from(circleMembers)
      .innerJoin(dreamCircles, eq(dreamCircles.id, circleMembers.circleId))
      .innerJoin(cohorts, eq(cohorts.id, dreamCircles.cohortId))
      .where(eq(circleMembers.userId, p.userId));
    const names = await this.names(assignments.flatMap((r) => [r.a.mentorUserId, r.a.learnerUserId]));
    const byAssignment = new Map(assignments.map((r) => [r.a.id, r.a]));
    const recorded = await this.db.sys
      .select({ r: recordings, sessionTitle: classSessions.title, weekNo: classSessions.weekNo, cohortName: cohorts.name })
      .from(recordings)
      .innerJoin(classSessions, eq(classSessions.id, recordings.classSessionId))
      .innerJoin(cohorts, eq(cohorts.id, classSessions.cohortId))
      .innerJoin(programEnrollments, and(eq(programEnrollments.cohortId, cohorts.id), eq(programEnrollments.userId, p.userId), eq(programEnrollments.status, 'active')))
      .orderBy(desc(recordings.createdAt))
      .limit(MY_RECORDINGS);
    const circleViews = await this.circleViews(myCircles.map((r) => r.c));
    return {
      mentors: assignments.map(({ a, cohortName }) => ({ userId: a.mentorUserId, name: names.get(a.mentorUserId) ?? 'Mentor', cohortName })),
      meetings: meetings.filter((m) => m.status !== 'cancelled' || m.scheduledAt > now).map((m) => this.toMeeting(m, byAssignment.get(m.assignmentId)!, names, true, now)),
      circles: circleViews.map((c) => ({ ...c, cohortName: myCircles.find((r) => r.c.id === c.id)!.cohortName })),
      recordings: recorded.map(({ r, sessionTitle, weekNo, cohortName }) => ({
        id: r.id,
        title: r.title,
        contentType: r.contentType,
        size: r.size,
        createdAt: r.createdAt.toISOString(),
        sessionTitle,
        weekNo,
        cohortName,
      })),
    };
  }
}

