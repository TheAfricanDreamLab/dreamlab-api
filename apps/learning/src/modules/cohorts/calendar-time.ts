import { badRequest } from '@lib/common';

/*
 * Calendar arithmetic for cohorts. Dates are ISO calendar dates (YYYY-MM-DD) with no time zone;
 * class times are wall-clock times in the cohort's IANA time zone, stored as UTC instants.
 */

const DAY_MS = 86_400_000;
const toUtcMidnight = (iso: string): number => Date.parse(`${iso}T00:00:00Z`);

export function addDays(iso: string, days: number): string {
  return new Date(toUtcMidnight(iso) + days * DAY_MS).toISOString().slice(0, 10);
}

export function daysBetween(fromIso: string, toIso: string): number {
  return Math.round((toUtcMidnight(toIso) - toUtcMidnight(fromIso)) / DAY_MS);
}

/** 1 = Monday … 7 = Sunday. */
export function isoWeekday(iso: string): number {
  return ((new Date(toUtcMidnight(iso)).getUTCDay() + 6) % 7) + 1;
}

export function assertTimeZone(timeZone: string): void {
  try {
    new Intl.DateTimeFormat('en-GB', { timeZone }).format(0);
  } catch {
    throw badRequest('invalid_time_zone', `Unknown time zone "${timeZone}". Use one like Africa/Lagos or Africa/Nairobi.`);
  }
}

/** Milliseconds the zone is ahead of UTC at that instant. */
function zoneOffsetMs(timeZone: string, instant: number): number {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hourCycle: 'h23',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).formatToParts(new Date(instant));
  const get = (type: string) => Number(parts.find((p) => p.type === type)!.value);
  return Date.UTC(get('year'), get('month') - 1, get('day'), get('hour'), get('minute'), get('second')) - instant;
}

/** The UTC instant of a wall-clock time on a date in a time zone (handles daylight-saving changes). */
export function zonedTime(dateIso: string, time: string, timeZone: string): Date {
  const [y, m, d] = dateIso.split('-').map(Number) as [number, number, number];
  const [hh, mm] = time.split(':').map(Number) as [number, number];
  const wall = Date.UTC(y, m - 1, d, hh, mm);
  let utc = wall - zoneOffsetMs(timeZone, wall);
  const corrected = wall - zoneOffsetMs(timeZone, utc);
  if (corrected !== utc) utc = corrected;
  return new Date(utc);
}

/** Today's date in a time zone. */
export function todayIn(timeZone: string, now = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit' }).format(now);
}

/** The cohort week a date falls in (1-based), or null outside the cohort. */
export function weekOf(startsOn: string, weeks: number, dateIso: string): number | null {
  const d = daysBetween(startsOn, dateIso);
  if (d < 0) return null;
  const week = Math.floor(d / 7) + 1;
  return week <= weeks ? week : null;
}

/** The date in the week starting on weekStart that falls on an ISO weekday. */
export function dateInWeek(weekStart: string, weekday: number): string {
  return addDays(weekStart, (weekday - isoWeekday(weekStart) + 7) % 7);
}
