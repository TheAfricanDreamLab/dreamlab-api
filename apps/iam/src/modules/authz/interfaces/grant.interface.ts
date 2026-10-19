import type { Permission, ScopeType } from '@dreamlab/contracts';

export interface Grant {
  roleKey: string;
  permissions: Permission[];
  scopeType: ScopeType;
  scopeId: string | null;
  /** ltree path of the unit, for org_unit grants. */
  unitPath: string | null;
}

export interface OrgAccess {
  membershipId: string;
  grants: Grant[];
}
