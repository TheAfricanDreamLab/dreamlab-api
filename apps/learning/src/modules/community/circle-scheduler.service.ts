import { Inject, Injectable, Logger, OnApplicationBootstrap, OnApplicationShutdown } from '@nestjs/common';
import { CIRCLE_MEETUP_REMINDER_MINUTES } from '@dreamlab/contracts';
import { InjectDatabase } from '@lib/database';
import { InjectOutbox, OutboxWriter, requestNotification } from '@lib/messaging';
import type { BlobStorage } from '@lib/storage';
import { and, asc, eq, gt, inArray, isNull, lt, lte } from 'drizzle-orm';
import { LearningDatabase, schema } from '../../database';
import { STORAGE } from '../files/files.service';
import { meetupWhen } from './circle-time';

const { circleAttachments, circleMembers, circleMeetups, cohorts, dreamCircles, mentorAssignments } = schema;
const EVERY_MS = 5 * 60_000;
const AHEAD_MS = CIRCLE_MEETUP_REMINDER_MINUTES * 60_000;
/** Files uploaded for a post that was never made are removed after this long. */
const ORPHAN_AFTER_MS = 24 * 3_600_000;

/**
 * Dream Circle housekeeping (COMM-3): reminds everyone in a circle an hour before each meetup, and
 * removes files that were uploaded but never posted.
 */
@Injectable()
export class CircleSchedulerService implements OnApplicationBootstrap, OnApplicationShutdown {
  private readonly logger = new Logger(CircleSchedulerService.name);
  private timer: NodeJS.Timeout | null = null;

  constructor(
    @InjectDatabase() private readonly db: LearningDatabase,
    @InjectOutbox() private readonly outbox: OutboxWriter,
    @Inject(STORAGE) private readonly storage: BlobStorage,
  ) {}

  onApplicationBootstrap(): void {
    this.timer = setInterval(() => void this.tick(), EVERY_MS);
    this.timer.unref();
  }

  onApplicationShutdown(): void {
    if (this.timer) clearInterval(this.timer);
  }

  private async tick(): Promise<void> {
    for (const job of [() => this.remind(), () => this.tidy()]) {
      await job().catch((e: unknown) => this.logger.error(e instanceof Error ? e.message : String(e)));
    }
  }

  /** Sends the meetup reminders now due; returns how many meetups were reminded. */
  async remind(now = new Date()): Promise<number> {
    const window = and(isNull(circleMeetups.cancelledAt), isNull(circleMeetups.reminderSentAt), gt(circleMeetups.startsAt, now), lte(circleMeetups.startsAt, new Date(now.getTime() + AHEAD_MS)));
    const due = await this.db.sys.select({ id: circleMeetups.id }).from(circleMeetups).where(window).orderBy(asc(circleMeetups.startsAt), asc(circleMeetups.id)).limit(100);
    let sent = 0;
    for (const { id } of due) {
      // One meetup that fails (say a bad time zone) is logged and retried next time; the rest still go out.
      await this.remindOne(id, now, window).then(
        (ok) => (sent += ok ? 1 : 0),
        (e: unknown) => this.logger.error(`Could not remind meetup ${id}: ${e instanceof Error ? e.message : String(e)}`),
      );
    }
    return sent;
  }

  private remindOne(id: string, now: Date, window: ReturnType<typeof and>): Promise<boolean> {
    return this.db.system(async (tx) => {
      // Claimed by the update, so two instances never send the same reminder.
      const [m] = await tx
        .update(circleMeetups)
        .set({ reminderSentAt: now })
        .where(and(eq(circleMeetups.id, id), window))
        .returning();
      if (!m) return false;
      const [circle] = await tx
        .select({ name: dreamCircles.name, cohortId: dreamCircles.cohortId, timeZone: cohorts.timeZone })
        .from(dreamCircles)
        .innerJoin(cohorts, eq(cohorts.id, dreamCircles.cohortId))
        .where(eq(dreamCircles.id, m.circleId));
      if (!circle) return false;
      const members = (await tx.select({ userId: circleMembers.userId }).from(circleMembers).where(eq(circleMembers.circleId, m.circleId))).map((r) => r.userId);
      if (members.length === 0) return false;
      const mentors = await tx
        .selectDistinct({ userId: mentorAssignments.mentorUserId })
        .from(mentorAssignments)
        .where(and(eq(mentorAssignments.cohortId, circle.cohortId), isNull(mentorAssignments.endedAt), inArray(mentorAssignments.learnerUserId, members)));
      await requestNotification(this.outbox, tx, {
        to: { userIds: [...new Set([...members, ...mentors.map((r) => r.userId)])] },
        category: 'circles',
        title: `Soon: ${m.title}`,
        body: `${circle.name} meets ${m.location ? `at ${m.location}` : 'online in the circle call'} on ${meetupWhen(m.startsAt, circle.timeZone)}.`,
        link: m.mode === 'virtual' ? `/app/circles/${m.circleId}/call` : `/app/circles/${m.circleId}`,
        orgId: m.hostOrgId,
        key: `circle-meetup-reminder:${m.id}:${m.startsAt.toISOString()}`,
      });
      return true;
    });
  }

  /** Removes files uploaded for posts that were never made; returns how many went. */
  async tidy(now = new Date()): Promise<number> {
    const stale = await this.db.sys
      .select({ id: circleAttachments.id, path: circleAttachments.path })
      .from(circleAttachments)
      .where(and(isNull(circleAttachments.postId), lt(circleAttachments.createdAt, new Date(now.getTime() - ORPHAN_AFTER_MS))))
      .limit(200);
    let removed = 0;
    for (const f of stale) {
      // Only while still unattached: a post made in the meantime keeps its file.
      const gone = await this.db.system((tx) => tx.delete(circleAttachments).where(and(eq(circleAttachments.id, f.id), isNull(circleAttachments.postId))).returning({ id: circleAttachments.id }));
      if (gone.length === 0) continue;
      try {
        await this.storage.remove('private', f.path);
        removed++;
      } catch (e) {
        // The row is gone, so nothing retries this: leave a trace to clean up by hand.
        this.logger.error(`Could not remove unposted circle file ${f.path}: ${e instanceof Error ? e.message : String(e)}`);
      }
    }
    return removed;
  }
}
