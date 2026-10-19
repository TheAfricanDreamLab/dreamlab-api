import type { Organization, OrgKind } from '@dreamlab/contracts';
import type { organizations } from '../../modules/organizations/entities/organization.entity';

type OrgRow = typeof organizations.$inferSelect;

export const toOrganization = (o: OrgRow): Organization => ({
  id: o.id,
  slug: o.slug,
  name: o.name,
  kinds: o.kinds as OrgKind[],
  parentOrgId: o.parentOrgId,
  status: o.status,
  branding: o.branding,
  terminology: o.terminology,
  dataRegion: o.dataRegion,
  createdAt: o.createdAt.toISOString(),
});

export const toPublicOrganization = (o: OrgRow) => ({
  id: o.id,
  slug: o.slug,
  name: o.name,
  kinds: o.kinds as OrgKind[],
  branding: o.branding,
  terminology: o.terminology,
});
