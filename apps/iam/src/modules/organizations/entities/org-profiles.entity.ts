import { jsonb, numeric, pgTable, text, uuid } from 'drizzle-orm/pg-core';
import { timestamps } from '../../../database/columns';
import { users } from '../../users/entities/user.entity';
import { orgRef } from './organization.entity';

export const institutionProfiles = pgTable('institution_profiles', {
  orgId: orgRef().primaryKey(),
  academicCalendar: jsonb('academic_calendar').notNull().default({}),
  ...timestamps,
});

export const enterpriseProfiles = pgTable('enterprise_profiles', {
  orgId: orgRef().primaryKey(),
  industry: text('industry'),
  sizeBand: text('size_band'),
  accountOwnerUserId: uuid('account_owner_user_id').references(() => users.id),
  ...timestamps,
});

export const partnerProfiles = pgTable('partner_profiles', {
  orgId: orgRef().primaryKey(),
  revenueShareDefaultPct: numeric('revenue_share_default_pct', { precision: 5, scale: 2 }),
  payoutAccountRef: text('payout_account_ref'),
  ...timestamps,
});

export const sponsorProfiles = pgTable('sponsor_profiles', {
  orgId: orgRef().primaryKey(),
  fundingType: text('funding_type'),
  reportingCadence: text('reporting_cadence'),
  ...timestamps,
});
