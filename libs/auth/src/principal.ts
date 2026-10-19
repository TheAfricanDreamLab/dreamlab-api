import {
  AccessTokenClaims,
  PERMISSIONS,
  Permission,
  permissionsForRole,
} from '@dreamlab/contracts';

/** The authenticated caller, derived from a verified access token. */
export interface Principal {
  userId: string;
  sessionId: string;
  /** Active organisation, or null in the personal context. */
  orgId: string | null;
  membershipId: string | null;
  /** Org-scoped role keys in the active organisation. */
  roles: string[];
  platformAdmin: boolean;
  authzVersion: number;
  tokenId: string;
  expiresAt: number;
}

export function principalFromClaims(claims: AccessTokenClaims): Principal {
  return {
    userId: claims.sub,
    sessionId: claims.sid,
    orgId: claims.org,
    membershipId: claims.mid,
    roles: claims.roles,
    platformAdmin: claims.pla,
    authzVersion: claims.azv,
    tokenId: claims.jti,
    expiresAt: claims.exp,
  };
}

/** Permissions the principal holds across its whole active organisation. */
export function orgPermissions(principal: Pick<Principal, 'roles' | 'platformAdmin' | 'orgId'>): Set<Permission> {
  if (principal.platformAdmin) return new Set(PERMISSIONS);
  if (!principal.orgId) return new Set();
  return new Set(principal.roles.flatMap((r) => [...permissionsForRole(r)]));
}

export function hasOrgPermission(principal: Principal, permission: Permission): boolean {
  return orgPermissions(principal).has(permission);
}
