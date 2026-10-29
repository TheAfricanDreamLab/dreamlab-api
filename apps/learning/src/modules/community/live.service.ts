import { Inject, Injectable, Logger } from '@nestjs/common';
import type { FileLink, JoinTicket, Recording, RecordingUpload, SessionLive } from '@dreamlab/contracts';
import type { Principal } from '@lib/auth';
import { forbidden, newId, notFound } from '@lib/common';
import { InjectDatabase } from '@lib/database';
import type { LiveRole, MeetKit } from '@lib/meet-kit';
import { IamRpc, RpcClient, UserName } from '@lib/rpc';
import { BlobStorage, safeFileName } from '@lib/storage';
import { and, asc, eq } from 'drizzle-orm';
import { LearningDatabase, schema } from '../../database';
import { CohortsService } from '../cohorts/cohorts.service';
import { STORAGE } from '../files/files.service';
import { IAM_NAMES } from '../player/player.service';

export const MEET_KIT = Symbol('MEET_KIT');

const { cohorts, classSessions, programEnrollments, recordings, meetingEvents, attendance } = schema;
type CohortRow = typeof cohorts.$inferSelect;
type SessionRow = typeof classSessions.$inferSelect;

/** Rooms open this long before a class and stay open this long after it should have ended. */
const OPENS_BEFORE_MS = 15 * 60_000;
const CLOSES_AFTER_MS = 60 * 60_000;
/** Joining this long after the start counts as late. */
const LATE_AFTER_MS = 10 * 60_000;


/**
 * Live classes (LIVE-1): who may join a session's room and as what, recordings, and attendance
 * derived from the provider's join and leave events (faculty corrections always win).
 */
@Injectable()
export class LiveService {
  private readonly logger = new Logger(LiveService.name);

  constructor(
    @InjectDatabase() private readonly db: LearningDatabase,
    @Inject(MEET_KIT) private readonly meet: MeetKit,
    @Inject(STORAGE) private readonly storage: BlobStorage,
    @Inject(IAM_NAMES) private readonly iam: RpcClient,
    private readonly cohortsService: CohortsService,
  ) {}

  // ---------- access ----------

  /** Staff (managers and teachers) host; the cohort's active learners take part; anyone else: not found. */
  private async access(p: Principal, cohortId: string, sessionId: string): Promise<{ cohort: CohortRow; session: SessionRow; role: LiveRole }> {
    const [cohort] = await this.db.sys.select().from(cohorts).where(eq(cohorts.id, cohortId));
    const [session] = cohort ? await this.db.sys.select().from(classSessions).where(and(eq(classSessions.id, sessionId), eq(classSessions.cohortId, cohort.id))) : [];
    if (!cohort || !session) throw notFound('session_not_found', 'Class session not found');
    if (await this.isLearner(p.userId, cohort.id)) return { cohort, session, role: 'participant' };
    try {
      await this.cohortsService.teachingSession(p, cohortId, sessionId);
      return { cohort, session, role: 'host' };
    } catch {
      throw notFound('session_not_found', 'Class session not found');
    }
  }

  private async isLearner(userId: string, cohortId: string): Promise<boolean> {
    const [row] = await this.db.sys
      .select({ id: programEnrollments.id })
      .from(programEnrollments)
      .where(and(eq(programEnrollments.cohortId, cohortId), eq(programEnrollments.userId, userId), eq(programEnrollments.status, 'active')));
    return !!row;
  }

  private window(session: SessionRow): { opensAt: Date; closesAt: Date } {
    const start = session.startsAt.getTime();
    return { opensAt: new Date(start - OPENS_BEFORE_MS), closesAt: new Date(start + session.durationMin * 60_000 + CLOSES_AFTER_MS) };
  }

  // ---------- reads and joins ----------

  async sessionLive(p: Principal, cohortId: string, sessionId: string, now = new Date()): Promise<SessionLive> {
    const { session } = await this.access(p, cohortId, sessionId);
    const { opensAt, closesAt } = this.window(session);
    const rows = await this.db.sys.select().from(recordings).where(eq(recordings.classSessionId, session.id)).orderBy(asc(recordings.createdAt));
    return {
      sessionId: session.id,
      joinable: session.mode === 'virtual' && !session.cancelled && now >= opensAt && now <= closesAt,
      opensAt: opensAt.toISOString(),
      closesAt: closesAt.toISOString(),
      recordings: rows.map(toRecording),
    };
  }

  async joinSession(p: Principal, cohortId: string, sessionId: string, now = new Date()): Promise<JoinTicket> {
    const { session, role } = await this.access(p, cohortId, sessionId);
    if (session.mode !== 'virtual') throw forbidden('not_virtual', 'This class meets in person.');
    if (session.cancelled) throw forbidden('session_cancelled', 'This class was cancelled.');
    const { opensAt, closesAt } = this.window(session);
    if (now < opensAt) throw forbidden('not_open_yet', 'The room opens 15 minutes before the class starts.');
    if (now > closesAt) throw forbidden('session_over', 'This class has ended. Its recording appears here once faculty upload it.');
    const grant = await this.meet.join(this.meet.roomName('session', session.id), p.userId, await this.nameOf(p.userId), role, session.durationMin + 60);
    return { url: grant.url, token: grant.token, roomName: grant.roomName, role, title: session.title, expiresAt: grant.expiresAt.toISOString() };
  }

  // ---------- recordings ----------

  async uploadRecording(p: Principal, cohortId: string, sessionId: string, req: { title: string; fileName: string; contentType: string; size: number }): Promise<RecordingUpload> {
    const { cohort, session } = await this.cohortsService.teachingSession(p, cohortId, sessionId);
    const id = newId();
    const path = `recordings/${cohort.id}/${id}/${safeFileName(req.fileName)}`;
    const ticket = this.storage.uploadTicket('private', path, req.contentType);
    await this.db.system((tx) =>
      tx.insert(recordings).values({ id, classSessionId: session.id, hostOrgId: cohort.hostOrgId, title: req.title, path, contentType: req.contentType, size: req.size, uploadedByUserId: p.userId }),
    );
    return { ...ticket, recordingId: id };
  }

  async recordingLink(p: Principal, recordingId: string): Promise<FileLink> {
    const [rec] = await this.db.sys.select().from(recordings).where(eq(recordings.id, recordingId));
    if (!rec) throw notFound('recording_not_found', 'Recording not found');
    const [session] = await this.db.sys.select().from(classSessions).where(eq(classSessions.id, rec.classSessionId));
    await this.access(p, session!.cohortId, session!.id);
    // Uploads that never arrived are hidden rather than linked.
    if (!(await this.storage.stat('private', rec.path))) throw notFound('recording_not_found', 'This recording is still uploading.');
    return this.storage.readLink(rec.path, `${safeFileName(rec.title)}.${rec.path.split('.').pop()}`);
  }

  // ---------- provider events ----------

  /** A verified provider webhook: stored raw, then attendance for class sessions is derived from it. */
  async receive(body: string, authorization: string | undefined): Promise<boolean> {
    const e = await this.meet.receive(body, authorization);
    if (!e) return false;
    if (!this.meet.owns(e.roomName)) return true; // another environment's room on a shared server
    const inserted = await this.db.system((tx) =>
      tx
        .insert(meetingEvents)
        .values({ id: newId(), eventId: e.eventId, event: e.event, roomName: e.roomName, identity: e.identity, occurredAt: e.at })
        .onConflictDoNothing()
        .returning({ id: meetingEvents.id }),
    );
    if (inserted.length === 0 || !e.identity || !['participant_joined', 'participant_left'].includes(e.event)) return true;
    const sessionPrefix = this.meet.roomName('session', '');
    if (e.roomName.startsWith(sessionPrefix)) await this.deriveAttendance(e.roomName.slice(sessionPrefix.length), e.identity);
    return true;
  }

  /** Minutes in the room from join/leave pairs; late after ten minutes. Overrides by faculty are kept. */
  async deriveAttendance(sessionId: string, userId: string, now = new Date()): Promise<void> {
    const [session] = await this.db.sys.select().from(classSessions).where(eq(classSessions.id, sessionId));
    if (!session) return;
    const [enrollment] = await this.db.sys
      .select()
      .from(programEnrollments)
      .where(and(eq(programEnrollments.cohortId, session.cohortId), eq(programEnrollments.userId, userId)));
    if (!enrollment) return; // staff and guests are not on the register
    const events = await this.db.sys
      .select()
      .from(meetingEvents)
      .where(and(eq(meetingEvents.roomName, this.meet.roomName('session', sessionId)), eq(meetingEvents.identity, userId)))
      .orderBy(asc(meetingEvents.occurredAt));
    let ms = 0;
    let since: Date | null = null;
    let firstJoin: Date | null = null;
    for (const ev of events) {
      if (ev.event === 'participant_joined') {
        firstJoin ??= ev.occurredAt;
        since ??= ev.occurredAt;
      } else if (ev.event === 'participant_left' && since) {
        ms += ev.occurredAt.getTime() - since.getTime();
        since = null;
      }
    }
    if (since) ms += Math.max(0, now.getTime() - since.getTime());
    if (!firstJoin) return;
    const minutes = Math.min(600, Math.round(ms / 60_000));
    const status = firstJoin.getTime() > session.startsAt.getTime() + LATE_AFTER_MS ? 'late' : 'present';
    await this.db.system(async (tx) => {
      const [existing] = await tx.select().from(attendance).where(and(eq(attendance.classSessionId, sessionId), eq(attendance.userId, userId)));
      if (existing?.source === 'override') return;
      if (existing) {
        await tx.update(attendance).set({ status, minutes, source: 'webhook', updatedAt: new Date() }).where(eq(attendance.id, existing.id));
      } else {
        await tx.insert(attendance).values({
          id: newId(),
          classSessionId: sessionId,
          programEnrollmentId: enrollment.id,
          userId,
          hostOrgId: session.hostOrgId,
          status,
          minutes,
          source: 'webhook',
          markedByUserId: userId,
        });
      }
    });
  }

  private async nameOf(userId: string): Promise<string> {
    const rows = await this.iam.send<UserName[]>(IamRpc.UserNames, { userIds: [userId] }).catch(() => [] as UserName[]);
    return rows[0]?.name ?? 'Participant';
  }
}

function toRecording(r: typeof recordings.$inferSelect): Recording {
  return { id: r.id, title: r.title, contentType: r.contentType, size: r.size, createdAt: r.createdAt.toISOString() };
}

