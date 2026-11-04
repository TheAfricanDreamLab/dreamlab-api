import { boolean, index, integer, pgTable, primaryKey, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { dreamCircles } from './dream-circle.entity';

/**
 * Contact details a person shares with one circle (COMM-3). There is no row until they choose to
 * share something, and an empty row shares nothing.
 */
export const circleContacts = pgTable(
  'circle_contacts',
  {
    circleId: uuid('circle_id')
      .notNull()
      .references(() => dreamCircles.id, { onDelete: 'cascade' }),
    userId: uuid('user_id').notNull(),
    hostOrgId: uuid('host_org_id').notNull(),
    email: text('email'),
    phone: text('phone'),
    whatsapp: boolean('whatsapp').notNull().default(false),
    linkedin: text('linkedin'),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.circleId, t.userId] })],
);

/**
 * A circle meetup (COMM-3): online in the circle's call, or in person. Everyone in the circle is told
 * when one is scheduled or cancelled, and reminded shortly before it starts.
 */
export const circleMeetups = pgTable(
  'circle_meetups',
  {
    id: uuid('id').primaryKey(),
    circleId: uuid('circle_id')
      .notNull()
      .references(() => dreamCircles.id, { onDelete: 'cascade' }),
    hostOrgId: uuid('host_org_id').notNull(),
    createdByUserId: uuid('created_by_user_id').notNull(),
    title: text('title').notNull(),
    startsAt: timestamp('starts_at', { withTimezone: true }).notNull(),
    durationMin: integer('duration_min').notNull(),
    mode: text('mode', { enum: ['virtual', 'physical'] }).notNull(),
    location: text('location'),
    details: text('details').notNull().default(''),
    cancelledAt: timestamp('cancelled_at', { withTimezone: true }),
    reminderSentAt: timestamp('reminder_sent_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    // A circle's coming meetups, and the reminder sweep across circles.
    index('circle_meetups_circle').on(t.circleId, t.startsAt),
    index('circle_meetups_due').on(t.startsAt),
  ],
);
