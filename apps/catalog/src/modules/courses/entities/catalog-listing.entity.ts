import { boolean, pgTable, text, timestamp, uniqueIndex, uuid } from 'drizzle-orm/pg-core';

/** Where a course or programme appears. No public listing = hidden from the catalog. */
export const catalogListings = pgTable(
  'catalog_listings',
  {
    id: uuid('id').primaryKey(),
    ownerOrgId: uuid('owner_org_id').notNull(),
    itemType: text('item_type', { enum: ['course', 'program'] }).notNull(),
    itemId: uuid('item_id').notNull(),
    channel: text('channel', { enum: ['public', 'enterprise_library'] }).notNull().default('public'),
    freeAudit: boolean('free_audit').notNull().default(true),
    /** Shown first in the catalog and on the home page (platform admin). */
    featured: boolean('featured').notNull().default(false),
    listedAt: timestamp('listed_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex('catalog_listings_item_channel').on(t.itemType, t.itemId, t.channel)],
);
