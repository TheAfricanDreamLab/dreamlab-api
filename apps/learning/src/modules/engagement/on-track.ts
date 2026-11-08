import type { CatchUpItem, FUNNEL_STAGES, Pace, RiskLevel } from '@dreamlab/contracts';
import { addDays, daysBetween, isoWeekday, todayIn } from '../cohorts/calendar-time';

/*
 * The rules behind staying on track (LRN-9), kept free of I/O so they can be tested on their own:
 * expected progress from a cohort calendar, pace, risk, which reminder is due, and the funnel.
 */

export const DAY_MS = 86_400_000;

export interface CalendarSpan {
  startsOn: string;
  endsOn: string;
  kind: 'learning' | 'catch_up';
}

/** Whole days between two instants (never negative). */
export const wholeDays = (from: Date, to: Date) => Math.max(0, Math.floor((to.getTime() - from.getTime()) / DAY_MS));

/**
 * Where the calendar expects a learner to be, 0–100: the share of the course's learning weeks that has
 * passed by today (part way through a week counts by its days). Catch-up weeks add no new lessons, so
 * they are left out. Null without a calendar.
 */
export function expectedPct(weeks: CalendarSpan[], today: string): number | null {
  const learning = weeks.filter((w) => w.kind !== 'catch_up');
  if (learning.length === 0) return null;
  let elapsed = 0;
  for (const w of learning) {
    const length = daysBetween(w.startsOn, w.endsOn) + 1;
    elapsed += Math.min(1, Math.max(0, (daysBetween(w.startsOn, today) + 1) / length));
  }
  return Math.round((elapsed / learning.length) * 100);
}

/** The cohort weeks inside a course run's dates (its phase); the whole calendar when none fall inside. */
export function weeksOfRun<W extends CalendarSpan>(weeks: W[], run: { startsOn: string; endsOn: string }): W[] {
  const inside = weeks.filter((w) => w.startsOn >= run.startsOn && w.endsOn <= run.endsOn);
  return inside.length > 0 ? inside : weeks;
}

/** A credit-weighted average, rounded; null when nothing carries weight. */
export function weighted(parts: Array<{ value: number | null; weight: number }>): number | null {
  const counted = parts.filter((p) => p.value !== null);
  const total = counted.reduce((s, p) => s + p.weight, 0);
  if (counted.length === 0) return null;
  if (total <= 0) return Math.round(counted.reduce((s, p) => s + p.value!, 0) / counted.length);
  return Math.round(counted.reduce((s, p) => s + p.value! * p.weight, 0) / total);
}

/** How far behind the calendar progress is: more than 15 points is behind, more than 35 far behind. */
export function gapLevel(progressPct: number, expected: number | null): 'ok' | 'behind' | 'far_behind' {
  if (expected === null) return 'ok';
  const gap = expected - progressPct;
  return gap > 35 ? 'far_behind' : gap > 15 ? 'behind' : 'ok';
}

export interface PaceInput {
  started: boolean;
  completed: boolean;
  progressPct: number;
  expectedPct: number | null;
  daysQuiet: number;
}

/** PaceSchema: behind is 15+ points behind or quiet 7–13 days; far behind 35+ points or quiet 14 days or more. */
export function paceOf(i: PaceInput): Pace {
  if (i.completed) return 'completed';
  if (!i.started) return 'not_started';
  const gap = gapLevel(i.progressPct, i.expectedPct);
  if (gap === 'far_behind' || i.daysQuiet >= 14) return 'far_behind';
  if (gap === 'behind' || i.daysQuiet >= 7) return 'behind';
  return 'on_track';
}

/** RiskLevelSchema: watch is behind or quiet 5–9 days; at risk far behind or quiet 10–20; inactive quiet 21 or more. */
export function riskOf(i: PaceInput): RiskLevel {
  if (i.completed) return 'ok';
  if (i.daysQuiet >= 21) return 'inactive';
  const gap = gapLevel(i.progressPct, i.expectedPct);
  if (gap === 'far_behind' || i.daysQuiet >= 10) return 'at_risk';
  if (gap === 'behind' || i.daysQuiet >= 5) return 'watch';
  return 'ok';
}

export const RISK_ORDER: Record<RiskLevel, number> = { inactive: 0, at_risk: 1, watch: 2, ok: 3 };

// ---------- reminders ----------

export type ReminderKind = 'first_step' | 'quiet_5' | 'quiet_12' | 'quiet_21';
/** Quiet days at which a reminder goes, then nothing more until they are active again. */
export const QUIET_THRESHOLDS: Array<[number, ReminderKind]> = [
  [21, 'quiet_21'],
  [12, 'quiet_12'],
  [5, 'quiet_5'],
];
/** No learner hears from us more often than this, across all their enrolments. */
export const REMINDER_GAP_MS = 3 * DAY_MS;
/** A first nudge once a day has passed without a start. */
export const FIRST_STEP_AFTER_MS = DAY_MS;

export interface ReminderState {
  started: boolean;
  enrolledAt: Date;
  /** The last activity; null before they start. */
  lastActivity: Date | null;
  /** Kinds already sent for this lapse (since lapseFrom). */
  sent: ReadonlySet<string>;
}

/**
 * The reminder due now, if any, and the lapse it belongs to. Before starting: one first-step reminder a
 * day after enrolling. After: one at 5, 12 and 21 quiet days, the highest reached that has not gone yet,
 * so a reminder held back by the 3-day limit is overtaken rather than sent late. Any activity starts a new lapse.
 */
export function dueReminder(s: ReminderState, now: Date): { kind: ReminderKind; lapseFrom: Date } | null {
  if (!s.started || !s.lastActivity) {
    if (now.getTime() - s.enrolledAt.getTime() < FIRST_STEP_AFTER_MS || s.sent.has('first_step')) return null;
    return { kind: 'first_step', lapseFrom: s.enrolledAt };
  }
  const quiet = wholeDays(s.lastActivity, now);
  const reached = QUIET_THRESHOLDS.find(([days]) => quiet >= days);
  if (!reached) return null;
  const [days] = reached;
  // Once a higher threshold has gone, the lower ones are past.
  if (QUIET_THRESHOLDS.some(([d, k]) => d >= days && s.sent.has(k))) return null;
  return { kind: reached[1], lapseFrom: s.lastActivity };
}

/** Reminders go out in the day, 08:00 to 20:00 where the learner's cohort is. */
export function withinSendingHours(now: Date, timeZone: string): boolean {
  const hour = Number(new Intl.DateTimeFormat('en-GB', { timeZone, hour: '2-digit', hourCycle: 'h23' }).format(now));
  return hour >= 8 && hour < 20;
}

// ---------- the funnel ----------

export interface FunnelUnit {
  enrolledAt: Date;
  started: boolean;
  /** The first activity, for "active in their first week". */
  firstActivity: Date | null;
  lastActivity: Date | null;
  progressPct: number;
  completed: boolean;
}

/** Learners at each stage (each stage includes everyone further along). */
export function funnelCounts(units: FunnelUnit[]): Record<(typeof FUNNEL_STAGES)[number], number> {
  const at = (pct: number) => units.filter((u) => u.completed || u.progressPct >= pct).length;
  return {
    enrolled: units.length,
    started: units.filter((u) => u.started || u.completed).length,
    first_week: units.filter((u) => u.firstActivity !== null && u.firstActivity.getTime() - u.enrolledAt.getTime() <= 7 * DAY_MS).length,
    quarter: at(25),
    half: at(50),
    three_quarters: at(75),
    completed: units.filter((u) => u.completed).length,
  };
}

/** Not completed and quiet 21 days or more; the median day (after enrolling) of their last activity. */
export function dropOff(units: FunnelUnit[], now: Date): { dropped: number; medianDropDay: number | null } {
  const dropped = units.filter((u) => !u.completed && wholeDays(u.lastActivity ?? u.enrolledAt, now) >= 21);
  const days = dropped.map((u) => wholeDays(u.enrolledAt, u.lastActivity ?? u.enrolledAt)).sort((a, b) => a - b);
  return { dropped: dropped.length, medianDropDay: median(days) };
}

export function median(sorted: number[]): number | null {
  if (sorted.length === 0) return null;
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid]! : (sorted[mid - 1]! + sorted[mid]!) / 2;
}

/** Monday of the week a date falls in. */
export const mondayOf = (iso: string) => addDays(iso, 1 - isoWeekday(iso));

/** This week's Monday in a time zone. */
export const thisMonday = (timeZone: string, now = new Date()) => mondayOf(todayIn(timeZone, now));

/** The last `count` Mondays, oldest first, ending with this week's. */
export function lastMondays(timeZone: string, count: number, now = new Date()): string[] {
  const latest = thisMonday(timeZone, now);
  return Array.from({ length: count }, (_, i) => addDays(latest, (i - count + 1) * 7));
}

// ---------- catch-up ----------

export interface CourseItems {
  enrollmentId: string;
  courseSlug: string;
  courseTitle: string;
  items: Array<{ id: string; title: string; type: CatchUpItem['type']; moduleTitle: string; minutes: number | null; required: boolean }>;
  done: ReadonlySet<string>;
}

/** The next items not yet done, required ones first, in course order: the shortest way back. */
export function catchUpList(courses: CourseItems[], limit = 3): CatchUpItem[] {
  const open = courses.flatMap((c) => c.items.filter((i) => !c.done.has(i.id)).map((i) => ({ c, i })));
  return [...open.filter((o) => o.i.required), ...open.filter((o) => !o.i.required)].slice(0, limit).map(({ c, i }) => ({
    enrollmentId: c.enrollmentId,
    courseSlug: c.courseSlug,
    courseTitle: c.courseTitle,
    itemId: i.id,
    title: i.title,
    type: i.type,
    moduleTitle: i.moduleTitle,
    minutes: i.minutes,
  }));
}
