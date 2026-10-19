import { sql } from 'drizzle-orm';
import { index, integer, jsonb, pgTable, primaryKey, text, timestamp, uuid } from 'drizzle-orm/pg-core';

/**
 * Transactional outbox. Rows are written in the same transaction as the state change they
 * describe, then published to RabbitMQ by the relay. Every service includes this table.
 */
export const outbox = pgTable(
  'outbox',
  {
    id: uuid('id').primaryKey(),
    type: text('type').notNull(),
    version: integer('version').notNull().default(1),
    orgId: uuid('org_id'),
    envelope: jsonb('envelope').notNull(),
    occurredAt: timestamp('occurred_at', { withTimezone: true }).notNull().defaultNow(),
    availableAt: timestamp('available_at', { withTimezone: true }).notNull().defaultNow(),
    publishedAt: timestamp('published_at', { withTimezone: true }),
    attempts: integer('attempts').notNull().default(0),
    lastError: text('last_error'),
  },
  (t) => [index('outbox_pending_idx').on(t.availableAt).where(sql`published_at is null`)],
);

/** Idempotent-consumer record: one row per (consumer, event) already handled. */
export const inbox = pgTable(
  'inbox',
  {
    consumer: text('consumer').notNull(),
    eventId: uuid('event_id').notNull(),
    processedAt: timestamp('processed_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.consumer, t.eventId] })],
);
