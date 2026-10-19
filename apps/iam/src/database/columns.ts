import { timestamp } from 'drizzle-orm/pg-core';

/** created_at / updated_at, shared by most tables. updated_at is bumped by Drizzle on every update. */
export const timestamps = {
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
};
