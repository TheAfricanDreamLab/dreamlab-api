import { citext } from '@lib/database';
import { sql } from 'drizzle-orm';
import { check, integer, pgTable, text, timestamp, uniqueIndex, uuid } from 'drizzle-orm/pg-core';
import { timestamps } from '../../../database/columns';

/** One global person. Email and phone are both optional, but at least one is required. */
export const users = pgTable(
  'users',
  {
    id: uuid('id').primaryKey(),
    email: citext('email'),
    phone: text('phone'),
    fullName: text('full_name').notNull(),
    locale: text('locale').notNull().default('en'),
    status: text('status', { enum: ['active', 'suspended', 'deleted'] }).notNull().default('active'),
    emailVerifiedAt: timestamp('email_verified_at', { withTimezone: true }),
    phoneVerifiedAt: timestamp('phone_verified_at', { withTimezone: true }),
    /** Incremented whenever the user's memberships or roles change; tokens carry it as `azv`. */
    authzVersion: integer('authz_version').notNull().default(0),
    ...timestamps,
  },
  (t) => [
    uniqueIndex('users_email_key').on(t.email),
    uniqueIndex('users_phone_key').on(t.phone),
    check('users_contact_present', sql`${t.email} is not null or ${t.phone} is not null`),
  ],
);
