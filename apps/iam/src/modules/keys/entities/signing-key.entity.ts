import { jsonb, pgTable, text, timestamp } from 'drizzle-orm/pg-core';

/** EdDSA signing keys. Private keys are AES-256-GCM encrypted with IAM_KEY_ENCRYPTION_SECRET. */
export const signingKeys = pgTable('signing_keys', {
  kid: text('kid').primaryKey(),
  alg: text('alg').notNull().default('EdDSA'),
  publicJwk: jsonb('public_jwk').notNull(),
  privateJwkEncrypted: text('private_jwk_encrypted').notNull(),
  status: text('status', { enum: ['active', 'retiring', 'retired'] }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  retiredAt: timestamp('retired_at', { withTimezone: true }),
});
