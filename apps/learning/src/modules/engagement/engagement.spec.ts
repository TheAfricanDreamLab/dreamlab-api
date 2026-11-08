import { addDays } from '../cohorts/calendar-time';
import {
  catchUpList,
  dropOff,
  dueReminder,
  expectedPct,
  funnelCounts,
  type FunnelUnit,
  lastMondays,
  mondayOf,
  paceOf,
  riskOf,
  weeksOfRun,
  weighted,
  withinSendingHours,
} from './on-track';
import { reminderMessage } from './progress-reminders.service';

const DAY = 86_400_000;
const week = (startsOn: string, kind: 'learning' | 'catch_up' = 'learning') => ({ startsOn, endsOn: addDays(startsOn, 6), kind });
const weeks = (from: string, n: number) => Array.from({ length: n }, (_, i) => week(addDays(from, i * 7)));

describe('expected progress', () => {
  it('is the share of learning weeks passed, counting a week part way by its days', () => {
    const cal = weeks('2026-11-02', 4);
    expect(expectedPct(cal, '2026-11-01')).toBe(0);
    expect(expectedPct(cal, '2026-11-08')).toBe(25);
    expect(expectedPct(cal, '2026-11-12')).toBe(39); // 1 + 4/7 weeks of 4
    expect(expectedPct(cal, '2026-12-31')).toBe(100);
    expect(expectedPct([], '2026-11-08')).toBeNull();
  });

  it('leaves catch-up weeks out: they add no new lessons', () => {
    const cal = [week('2026-11-02'), week('2026-11-09', 'catch_up'), week('2026-11-16')];
    expect(expectedPct(cal, '2026-11-15')).toBe(50);
    expect(expectedPct(cal, '2026-11-22')).toBe(100);
  });

  it('measures a course against its own phase, and weights a programme by credits', () => {
    const cal = weeks('2026-11-02', 6);
    expect(weeksOfRun(cal, { startsOn: '2026-11-16', endsOn: '2026-11-29' })).toHaveLength(2);
    expect(weeksOfRun(cal, { startsOn: '2027-01-01', endsOn: '2027-02-01' })).toHaveLength(6);
    expect(weighted([{ value: 100, weight: 3 }, { value: 0, weight: 1 }])).toBe(75);
    expect(weighted([{ value: null, weight: 3 }])).toBeNull();
  });
});

describe('pace and risk', () => {
  const base = { started: true, completed: false, progressPct: 50, expectedPct: 50, daysQuiet: 0 };

  it('follows the gap to the calendar and the quiet days', () => {
    expect(paceOf({ ...base, started: false })).toBe('not_started');
    expect(paceOf({ ...base, completed: true, daysQuiet: 40 })).toBe('completed');
    expect(paceOf(base)).toBe('on_track');
    expect(paceOf({ ...base, progressPct: 35 })).toBe('on_track');
    expect(paceOf({ ...base, progressPct: 34 })).toBe('behind');
    expect(paceOf({ ...base, progressPct: 14 })).toBe('far_behind');
    expect(paceOf({ ...base, daysQuiet: 7 })).toBe('behind');
    expect(paceOf({ ...base, daysQuiet: 14 })).toBe('far_behind');
    // On their own, only quiet days count.
    expect(paceOf({ ...base, progressPct: 0, expectedPct: null, daysQuiet: 6 })).toBe('on_track');
  });

  it('turns into a risk level for cohort staff', () => {
    expect(riskOf(base)).toBe('ok');
    expect(riskOf({ ...base, daysQuiet: 5 })).toBe('watch');
    expect(riskOf({ ...base, progressPct: 30 })).toBe('watch');
    expect(riskOf({ ...base, daysQuiet: 10 })).toBe('at_risk');
    expect(riskOf({ ...base, progressPct: 10 })).toBe('at_risk');
    expect(riskOf({ ...base, daysQuiet: 21 })).toBe('inactive');
    expect(riskOf({ ...base, completed: true, daysQuiet: 30 })).toBe('ok');
  });
});

describe('reminders', () => {
  const now = new Date('2026-11-20T11:00:00Z');
  const ago = (days: number) => new Date(now.getTime() - days * DAY);

  it('nudges once a day after enrolling when nothing has started', () => {
    const s = { started: false, enrolledAt: ago(0.5), lastActivity: null, sent: new Set<string>() };
    expect(dueReminder(s, now)).toBeNull();
    expect(dueReminder({ ...s, enrolledAt: ago(2) }, now)).toEqual({ kind: 'first_step', lapseFrom: ago(2) });
    expect(dueReminder({ ...s, enrolledAt: ago(2), sent: new Set(['first_step']) }, now)).toBeNull();
  });

  it('reminds at 5, 12 and 21 quiet days, then stops until they are active again', () => {
    const s = (days: number, sent: string[] = []) => ({ started: true, enrolledAt: ago(60), lastActivity: ago(days), sent: new Set(sent) });
    expect(dueReminder(s(4), now)).toBeNull();
    expect(dueReminder(s(5), now)?.kind).toBe('quiet_5');
    expect(dueReminder(s(6, ['quiet_5']), now)).toBeNull();
    expect(dueReminder(s(12, ['quiet_5']), now)?.kind).toBe('quiet_12');
    expect(dueReminder(s(21, ['quiet_5', 'quiet_12']), now)?.kind).toBe('quiet_21');
    expect(dueReminder(s(40, ['quiet_5', 'quiet_12', 'quiet_21']), now)).toBeNull();
    // One held back by the 3-day limit is overtaken, not sent late.
    expect(dueReminder(s(13, ['quiet_12']), now)).toBeNull();
    expect(dueReminder(s(12), now)?.kind).toBe('quiet_12');
    expect(dueReminder(s(5), now)?.lapseFrom).toEqual(ago(5));
  });

  it('goes out between 08:00 and 20:00 where the learner is', () => {
    expect(withinSendingHours(new Date('2026-11-20T06:59:00Z'), 'Africa/Lagos')).toBe(false);
    expect(withinSendingHours(new Date('2026-11-20T07:00:00Z'), 'Africa/Lagos')).toBe(true);
    expect(withinSendingHours(new Date('2026-11-20T18:59:00Z'), 'Africa/Lagos')).toBe(true);
    expect(withinSendingHours(new Date('2026-11-20T19:00:00Z'), 'Africa/Lagos')).toBe(false);
    expect(withinSendingHours(new Date('2026-11-20T06:00:00Z'), 'Africa/Nairobi')).toBe(true);
  });

  it('says it warmly: their own words, the next step, and that nothing is lost', () => {
    const next = { enrollmentId: 'e', courseSlug: 'c', courseTitle: 'C', itemId: 'i', title: 'Framing the problem', type: 'lesson' as const, moduleTitle: 'M', minutes: 12 };
    const m = reminderMessage('quiet_5', 'Problem Solving', 'I want to run my shop better', next);
    expect(m.title).toBe('Pick up where you left off: Problem Solving');
    expect(m.body).toBe('You said: “I want to run my shop better”\n\nNext up: Framing the problem, about 12 minutes.\n\nEverything you have done so far is saved, so you can carry on from where you stopped.');
    expect(reminderMessage('quiet_21', 'X', null, null).body).toContain('We have kept your place');
    for (const kind of ['first_step', 'quiet_5', 'quiet_12', 'quiet_21'] as const) {
      const { title, body } = reminderMessage(kind, 'X', 'why', next);
      expect(`${title} ${body}`).not.toContain('!');
    }
  });
});

describe('catch-up list', () => {
  it('lists up to three items not done, required first, in course order', () => {
    const item = (id: string, required = true) => ({ id, title: id, type: 'lesson' as const, moduleTitle: 'M', minutes: 5, required });
    const list = catchUpList([
      { enrollmentId: 'a', courseSlug: 'a', courseTitle: 'A', items: [item('a1'), item('a2', false), item('a3')], done: new Set(['a1']) },
      { enrollmentId: 'b', courseSlug: 'b', courseTitle: 'B', items: [item('b1'), item('b2')], done: new Set() },
    ]);
    expect(list.map((i) => i.itemId)).toEqual(['a3', 'b1', 'b2']);
  });
});

describe('the completion funnel', () => {
  const now = new Date('2026-11-30T12:00:00Z');
  const at = (day: number) => new Date(Date.parse('2026-10-01T09:00:00Z') + day * DAY);
  const unit = (u: Partial<FunnelUnit>): FunnelUnit => ({ enrolledAt: at(0), started: false, firstActivity: null, lastActivity: null, progressPct: 0, completed: false, ...u });

  it('counts each stage with everyone further along', () => {
    const units = [
      unit({}),
      unit({ started: true, firstActivity: at(10), lastActivity: at(12), progressPct: 10 }),
      unit({ started: true, firstActivity: at(1), lastActivity: at(50), progressPct: 60 }),
      unit({ started: true, firstActivity: at(2), lastActivity: at(55), progressPct: 100, completed: true }),
    ];
    expect(funnelCounts(units)).toEqual({ enrolled: 4, started: 3, first_week: 2, quarter: 2, half: 2, three_quarters: 1, completed: 1 });
    // Dropped: not completed and quiet 21 days; the median day of their last activity.
    expect(dropOff(units, now)).toEqual({ dropped: 2, medianDropDay: 6 });
    expect(dropOff([], now)).toEqual({ dropped: 0, medianDropDay: null });
  });

  it('counts weeks from Monday', () => {
    expect(mondayOf('2026-11-08')).toBe('2026-11-02');
    expect(mondayOf('2026-11-09')).toBe('2026-11-09');
    const mondays = lastMondays('Africa/Lagos', 26, new Date('2026-11-08T12:00:00Z'));
    expect(mondays).toHaveLength(26);
    expect(mondays.at(-1)).toBe('2026-11-02');
    expect(mondays[0]).toBe(addDays('2026-11-02', -25 * 7));
  });
});
