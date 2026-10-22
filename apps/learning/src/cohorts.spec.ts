import { DREAM_LAB_RHYTHM, type ProgramDetail } from '@dreamlab/contracts';
import { addDays, dateInWeek, isoWeekday, todayIn, weekOf, zonedTime } from './modules/cohorts/calendar-time';
import { plannedRuns, plannedSessions } from './modules/cohorts/cohorts.service';

describe('calendar time', () => {
  it('does date arithmetic on calendar dates', () => {
    expect(addDays('2026-12-30', 3)).toBe('2027-01-02');
    expect(isoWeekday('2026-11-02')).toBe(1); // Monday
    expect(isoWeekday('2026-11-08')).toBe(7); // Sunday
    expect(dateInWeek('2026-11-02', 2)).toBe('2026-11-03');
    // A week that starts on a Wednesday still finds its Tuesday (the following one).
    expect(dateInWeek('2026-11-04', 2)).toBe('2026-11-10');
  });

  it('places wall-clock times in the cohort time zone', () => {
    expect(zonedTime('2026-11-03', '21:00', 'Africa/Lagos').toISOString()).toBe('2026-11-03T20:00:00.000Z');
    expect(zonedTime('2026-11-03', '21:00', 'Africa/Nairobi').toISOString()).toBe('2026-11-03T18:00:00.000Z');
    // Across a daylight-saving change: London is UTC+1 in summer, UTC in winter.
    expect(zonedTime('2026-07-01', '09:00', 'Europe/London').toISOString()).toBe('2026-07-01T08:00:00.000Z');
    expect(zonedTime('2026-12-01', '09:00', 'Europe/London').toISOString()).toBe('2026-12-01T09:00:00.000Z');
  });

  it('knows the cohort week of a date', () => {
    expect(weekOf('2026-11-02', 15, '2026-11-01')).toBeNull();
    expect(weekOf('2026-11-02', 15, '2026-11-02')).toBe(1);
    expect(weekOf('2026-11-02', 15, '2026-11-09')).toBe(2);
    expect(weekOf('2026-11-02', 15, addDays('2026-11-02', 15 * 7))).toBeNull();
    expect(todayIn('Africa/Lagos', new Date('2026-11-02T23:30:00Z'))).toBe('2026-11-03');
  });
});

const course = (slug: string, required = true) => ({ id: `id-${slug}`, slug, creditHours: 3, required }) as ProgramDetail['phases'][number]['courses'][number];
const phase = (name: string, weekFrom: number | null, weekTo: number | null, chooseN: number | null, courses: ReturnType<typeof course>[]) =>
  ({ name, weekFrom, weekTo, chooseN, courses }) as ProgramDetail['phases'][number];

describe('cohort planning', () => {
  const program = {
    phases: [
      phase('Foundations', 1, 4, null, [course('problem-solving'), course('optional-reading', false)]),
      phase('Specialisation', 5, 10, 2, [course('fintech'), course('agritech'), course('healthtech')]),
      phase('Residency', null, null, null, [course('capstone')]),
    ],
  } as ProgramDetail;

  it('makes a run per course, dated by phase, with elective phases optional and grouped', () => {
    const runs = plannedRuns(program, '2026-11-02', '2027-02-14');
    expect(runs.map((r) => [r.course.slug, r.required, r.electiveGroupKey, r.startsOn, r.endsOn])).toEqual([
      ['problem-solving', true, null, '2026-11-02', '2026-11-29'],
      ['optional-reading', false, null, '2026-11-02', '2026-11-29'],
      ['fintech', false, 'Specialisation', '2026-11-30', '2027-01-10'],
      ['agritech', false, 'Specialisation', '2026-11-30', '2027-01-10'],
      ['healthtech', false, 'Specialisation', '2026-11-30', '2027-01-10'],
      ['capstone', true, null, '2026-11-02', '2027-02-14'],
    ]);
  });

  it('schedules the weekly rhythm for every week, in time order', () => {
    const sessions = plannedSessions('2026-11-02', 15, DREAM_LAB_RHYTHM, 'Africa/Lagos');
    expect(sessions).toHaveLength(45);
    expect(sessions.slice(0, 3).map((s) => [s.weekNo, s.slot.title, s.startsAt.toISOString()])).toEqual([
      [1, 'Tuesday class', '2026-11-03T20:00:00.000Z'],
      [1, 'Thursday class', '2026-11-05T20:00:00.000Z'],
      [1, 'Saturday studio', '2026-11-07T07:30:00.000Z'],
    ]);
    expect(sessions.at(-1)!.weekNo).toBe(15);
  });
});
