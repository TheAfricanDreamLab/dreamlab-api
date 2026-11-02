import { Injectable, Logger, OnApplicationBootstrap, OnApplicationShutdown } from '@nestjs/common';
import { InjectDatabase } from '@lib/database';
import { InjectOutbox, OutboxWriter, requestNotification } from '@lib/messaging';
import { and, eq, gt, isNull, lte } from 'drizzle-orm';
import { LearningDatabase, schema } from '../../database';

const { classSessions, cohorts, programEnrollments } = schema;
const EVERY_MS = 10 * 60_000;
/** Learners hear about a class this long before it starts. */
const AHEAD_MS = 24 * 3_600_000;

/** Reminds a cohort's learners of each class session a day ahead (NOTIFY-1). */
@Injectable()
export class SessionRemindersService implements OnApplicationBootstrap, OnApplicationShutdown {
  private readonly logger = new Logger(SessionRemindersService.name);
  private timer: NodeJS.Timeout | null = null;

  constructor(
    @InjectDatabase() private readonly db: LearningDatabase,
    @InjectOutbox() private readonly outbox: OutboxWriter,
  ) {}

  onApplicationBootstrap(): void {
    this.timer = setInterval(() => void this.run().catch((e: unknown) => this.logger.error(e instanceof Error ? e.message : String(e))), EVERY_MS);
    this.timer.unref();
  }

  onApplicationShutdown(): void {
    if (this.timer) clearInterval(this.timer);
  }

  /** Sends the reminders now due; returns how many sessions were reminded. */
  async run(now = new Date()): Promise<number> {
    const due = await this.db.sys
      .select({ id: classSessions.id })
      .from(classSessions)
      .where(and(eq(classSessions.cancelled, false), isNull(classSessions.reminderSentAt), gt(classSessions.startsAt, now), lte(classSessions.startsAt, new Date(now.getTime() + AHEAD_MS))))
      .limit(100);
    let sent = 0;
    for (const { id } of due) {
      await this.db.system(async (tx) => {
        // Claimed by the update, so two instances never remind the same session twice.
        // The same conditions as the select: a session cancelled or moved since then is skipped.
        const [session] = await tx
          .update(classSessions)
          .set({ reminderSentAt: now })
          .where(
            and(
              eq(classSessions.id, id),
              isNull(classSessions.reminderSentAt),
              eq(classSessions.cancelled, false),
              gt(classSessions.startsAt, now),
              lte(classSessions.startsAt, new Date(now.getTime() + AHEAD_MS)),
            ),
          )
          .returning();
        if (!session) return;
        const [cohort] = await tx.select({ name: cohorts.name, timeZone: cohorts.timeZone }).from(cohorts).where(eq(cohorts.id, session.cohortId));
        const learners = await tx
          .select({ userId: programEnrollments.userId })
          .from(programEnrollments)
          .where(and(eq(programEnrollments.cohortId, session.cohortId), eq(programEnrollments.status, 'active')));
        if (learners.length === 0) return;
        const where = session.mode === 'virtual' ? 'online' : (session.location ?? 'in person');
        // The class's own time zone, the way its learners read the calendar, with the offset so a time
        // repeated when clocks change is still clear: "Tuesday 3 November at 21:00 GMT+1 (Africa/Lagos)".
        const timeZone = cohort?.timeZone ?? 'UTC';
        const when = new Intl.DateTimeFormat('en-GB', { weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit', hourCycle: 'h23', timeZoneName: 'shortOffset', timeZone })
          .format(session.startsAt)
          .replace(/ at |, (?=\d{2}:)/, ' at ');
        await requestNotification(this.outbox, tx, {
          to: { userIds: learners.map((l) => l.userId) },
          category: 'sessions',
          title: `Tomorrow: ${session.title}`,
          body: `${cohort?.name ?? 'Your cohort'} meets ${where} on ${when} (${timeZone}) for ${session.durationMin} minutes.${session.mode === 'virtual' ? ' The room opens 15 minutes before the class starts.' : ''}`,
          link: '/app/programme',
          orgId: session.hostOrgId,
          key: `session-reminder:${session.id}:${session.startsAt.toISOString()}`,
        });
        sent++;
      });
    }
    return sent;
  }
}
