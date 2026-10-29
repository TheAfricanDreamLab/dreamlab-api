import { index, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

/** Raw events from the meeting provider (Plan §10.2): attendance is derived from these, never typed in. */
export const meetingEvents = pgTable(
  'meeting_events',
  {
    id: uuid('id').primaryKey(),
    /** The provider's event id: a redelivered webhook adds nothing. */
    eventId: text('event_id').notNull().unique(),
    event: text('event').notNull(),
    roomName: text('room_name').notNull(),
    identity: text('identity'),
    occurredAt: timestamp('occurred_at', { withTimezone: true }).notNull(),
    receivedAt: timestamp('received_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('meeting_events_room_identity').on(t.roomName, t.identity, t.occurredAt)],
);
