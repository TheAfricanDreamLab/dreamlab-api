import { index, pgTable, text, timestamp, uniqueIndex, uuid } from 'drizzle-orm/pg-core';
import { timestamps } from '../../../database/columns';
import { users } from './user.entity';

/** Ways a user authenticates. The password hash lives on the `password` identity. */
export const userIdentities = pgTable(
  'user_identities',
  {
    id: uuid('id').primaryKey(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    provider: text('provider', { enum: ['password', 'otp', 'google', 'oidc', 'saml'] }).notNull(),
    subject: text('subject').notNull(),
    secretHash: text('secret_hash'),
    ssoConnectionId: uuid('sso_connection_id'),
    lastUsedAt: timestamp('last_used_at', { withTimezone: true }),
    ...timestamps,
  },
  (t) => [uniqueIndex('user_identities_provider_subject_key').on(t.provider, t.subject), index('user_identities_user_idx').on(t.userId)],
);
