import { Injectable, Logger, OnApplicationBootstrap, OnApplicationShutdown } from '@nestjs/common';
import type { CatchUpItem } from '@dreamlab/contracts';
import { newId } from '@lib/common';
import { InjectDatabase } from '@lib/database';
import { InjectOutbox, OutboxWriter, requestNotification } from '@lib/messaging';
import { and, eq, gt, inArray, isNull, lt, ne, notInArray, sql } from 'drizzle-orm';
import { LearningDatabase, schema } from '../../database';
import { DEFAULT_TIME_ZONE, EngagementService } from './engagement.service';
import { dueReminder, FIRST_STEP_AFTER_MS, REMINDER_GAP_MS, type ReminderKind, withinSendingHours } from './on-track';

const { cohorts, programEnrollments, courseEnrollments, progressReminders } = schema;
const EVERY_MS = 30 * 60_000;
/** Enrolments looked at per run, of each kind; the rest wait for the next run. */
const BATCH = 500;
const AUTOMATIC: ReminderKind[] = ['first_step', 'quiet_5', 'quiet_12', 'quiet_21'];

/** One enrolment a reminder could be about: a cohort programme, or a course taken on its own. */
interface Candidate {
  scope: 'program' | 'course';
  enrollmentId: string;
  userId: string;
  orgId: string | null;
  title: string;
  timeZone: string;
  started: boolean;
  enrolledAt: Date;
  lastActivity: Date | null;
  next: CatchUpItem | null;
  link: string;
}

/**
 * Email reminders that help people finish (LRN-9). A day after enrolling with nothing started, one
 * nudge; once started, one after 5, 12 and 21 quiet days, then nothing until they are active again.
 * Never more than one every 3 days per person across their enrolments, only in the daytime where they
 * learn, and a cohort learner hears about their programme rather than each course. Each reminder is
 * claimed by inserting its log row (unique per enrolment, kind and lapse) under a per-person lock, so
 * instances running at once never send twice or break the 3-day limit.
 */
@Injectable()
export class ProgressRemindersService implements OnApplicationBootstrap, OnApplicationShutdown {
  private readonly logger = new Logger(ProgressRemindersService.name);
  private timer: NodeJS.Timeout | null = null;

  constructor(
    @InjectDatabase() private readonly db: LearningDatabase,
    @InjectOutbox() private readonly outbox: OutboxWriter,
    private readonly engagement: EngagementService,
  ) {}

  onApplicationBootstrap(): void {
    this.timer = setInterval(() => void this.run().catch((e: unknown) => this.logger.error(e instanceof Error ? e.message : String(e))), EVERY_MS);
    this.timer.unref();
  }

  onApplicationShutdown(): void {
    if (this.timer) clearInterval(this.timer);
  }

  /** Sends the reminders now due; returns how many went. */
  async run(now = new Date()): Promise<number> {
    const recent = new Set(
      (
        await this.db.sys
          .selectDistinct({ userId: progressReminders.userId })
          .from(progressReminders)
          .where(and(ne(progressReminders.kind, 'check_in'), gt(progressReminders.sentAt, new Date(now.getTime() - REMINDER_GAP_MS))))
      ).map((r) => r.userId),
    );
    let sent = 0;
    for await (const c of this.candidates(now, recent)) {
      if (recent.has(c.userId)) continue;
      if (await this.send(c, now)) {
        recent.add(c.userId);
        sent++;
      }
    }
    return sent;
  }

  private async *candidates(now: Date, skip: ReadonlySet<string>): AsyncGenerator<Candidate> {
    // Programmes: active learners in running cohorts.
    const learners = await this.db.sys
      .select({ pe: programEnrollments, cohort: cohorts })
      .from(programEnrollments)
      .innerJoin(cohorts, eq(cohorts.id, programEnrollments.cohortId))
      .where(
        and(
          eq(programEnrollments.status, 'active'),
          eq(cohorts.status, 'running'),
          lt(programEnrollments.enrolledAt, new Date(now.getTime() - FIRST_STEP_AFTER_MS)),
          skip.size ? notInArray(programEnrollments.userId, [...skip]) : undefined,
        ),
      )
      // In no particular order, so a batch full of people with nothing due can't hold the rest back.
      .orderBy(sql`random()`)
      .limit(BATCH);
    for (const { pe, cohort } of learners) {
      if (skip.has(pe.userId) || !withinSendingHours(now, cohort.timeZone)) continue;
      const { state, next } = await this.engagement.programmeSnapshot(pe, cohort, now);
      if (state.completed) continue;
      yield {
        scope: 'program',
        enrollmentId: pe.id,
        userId: pe.userId,
        orgId: cohort.hostOrgId,
        title: cohort.programTitle,
        timeZone: cohort.timeZone,
        started: state.started,
        enrolledAt: pe.enrolledAt,
        lastActivity: state.lastActivity,
        next: next[0] ?? null,
        link: '/app/programme',
      };
    }

    // Courses taken on their own: quiet for a day at least (activity always comes after enrolling).
    if (!withinSendingHours(now, DEFAULT_TIME_ZONE)) return;
    const courses = await this.db.sys
      .select()
      .from(courseEnrollments)
      .where(
        and(
          eq(courseEnrollments.status, 'active'),
          isNull(courseEnrollments.programEnrollmentId),
          lt(courseEnrollments.lastActiveAt, new Date(now.getTime() - FIRST_STEP_AFTER_MS)),
          skip.size ? notInArray(courseEnrollments.userId, [...skip]) : undefined,
        ),
      )
      .orderBy(sql`random()`)
      .limit(BATCH);
    for (const e of courses) {
      if (skip.has(e.userId)) continue;
      const { line, next, content } = await this.engagement.courseSnapshot(e, now);
      if (!content) continue;
      const item = next[0] ?? null;
      yield {
        scope: 'course',
        enrollmentId: e.id,
        userId: e.userId,
        orgId: e.contextOrgId,
        title: content.course.title,
        timeZone: DEFAULT_TIME_ZONE,
        started: line.started,
        enrolledAt: e.enrolledAt,
        lastActivity: line.lastActivity,
        next: item,
        link: item ? `/learn/${e.id}/${item.itemId}` : `/learn/${e.id}`,
      };
    }
  }

  private async send(c: Candidate, now: Date): Promise<boolean> {
    const sentKinds = await this.db.sys
      .select({ kind: progressReminders.kind, lapseFrom: progressReminders.lapseFrom })
      .from(progressReminders)
      .where(and(eq(progressReminders.enrollmentId, c.enrollmentId), inArray(progressReminders.kind, AUTOMATIC)));
    const lapse = c.started && c.lastActivity ? c.lastActivity : c.enrolledAt;
    const due = dueReminder({ ...c, sent: new Set(sentKinds.filter((s) => s.lapseFrom.getTime() === lapse.getTime()).map((s) => s.kind)) }, now);
    if (!due) return false;
    const goal = await this.engagement.goalFor(c.userId, c.scope, c.enrollmentId);

    return this.db.system(async (tx) => {
      // One person at a time, so two instances can't each send them a reminder for different enrolments.
      await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${`progress-reminder:${c.userId}`}))`);
      const [recent] = await tx
        .select({ id: progressReminders.id })
        .from(progressReminders)
        .where(and(eq(progressReminders.userId, c.userId), ne(progressReminders.kind, 'check_in'), gt(progressReminders.sentAt, new Date(now.getTime() - REMINDER_GAP_MS))))
        .limit(1);
      if (recent) return false;
      const [claimed] = await tx
        .insert(progressReminders)
        .values({ id: newId(), userId: c.userId, scope: c.scope, enrollmentId: c.enrollmentId, kind: due.kind, lapseFrom: due.lapseFrom, sentAt: now })
        .onConflictDoNothing()
        .returning({ id: progressReminders.id });
      if (!claimed) return false;
      await requestNotification(this.outbox, tx, {
        to: { userIds: [c.userId] },
        category: 'progress',
        ...reminderMessage(due.kind, c.title, goal?.why ?? null, c.next),
        link: c.link,
        orgId: c.orgId,
        key: `progress-reminder:${c.scope}:${c.enrollmentId}:${due.kind}:${due.lapseFrom.getTime()}`,
      });
      return true;
    });
  }
}

/** Warm and short, in plain text: their own words when they gave them, the next step and its length, and that nothing is lost. */
export function reminderMessage(kind: ReminderKind, title: string, why: string | null, next: CatchUpItem | null): { title: string; body: string } {
  const lines: string[] = [];
  if (why) lines.push(`You said: “${why}”`);
  if (next) lines.push(`${kind === 'first_step' ? 'Your first step' : 'Next up'}: ${next.title}${next.minutes ? `, about ${next.minutes} minutes` : ''}.`);
  lines.push(
    kind === 'quiet_21'
      ? 'We have kept your place, and everything you have done so far is saved, whenever you are ready.'
      : kind === 'first_step'
        ? 'It is all ready for you, and your progress is saved as you go.'
        : 'Everything you have done so far is saved, so you can carry on from where you stopped.',
  );
  return { title: kind === 'first_step' ? `Ready when you are: ${title}` : `Pick up where you left off: ${title}`, body: lines.join('\n\n') };
}
