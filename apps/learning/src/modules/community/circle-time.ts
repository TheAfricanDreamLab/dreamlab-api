/**
 * A meetup's time the way its circle reads the calendar: in the cohort's time zone, with the offset,
 * e.g. "Tuesday 10 November at 17:00 GMT+1 (Africa/Lagos)".
 */
export function meetupWhen(at: Date, timeZone: string): string {
  const when = new Intl.DateTimeFormat('en-GB', { weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit', hourCycle: 'h23', timeZoneName: 'shortOffset', timeZone })
    .format(at)
    .replace(/ at |, (?=\d{2}:)/, ' at ');
  return `${when} (${timeZone})`;
}
