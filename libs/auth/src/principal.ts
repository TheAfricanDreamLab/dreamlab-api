import {
  AccessTokenClaims,
  MFA_PROTECTED_PERMISSIONS,
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
  /** How the session authenticated; contains 'mfa' once a second factor passed. */
  amr: string[];
  /** The active context requires a second factor for admin permissions. */
  mfaRequired: boolean;
  /**
   * The user's roles changed after this token was issued. Its role claims can no longer be
   * trusted, so permissions are re-checked with IAM instead of read from the token.
   */
  stale?: boolean;
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
    amr: claims.amr ?? [],
    mfaRequired: claims.mfr ?? false,
  };
}

/** The context requires a second factor for this permission, and the session has not passed one. */
export function needsMfa(principal: Pick<Principal, 'amr' | 'mfaRequired'>, permission: Permission): boolean {
  return principal.mfaRequired && !principal.amr.includes('mfa') && MFA_PROTECTED_PERMISSIONS.includes(permission);
}

/** Permissions the principal holds across its whole active organisation. */
export function orgPermissions(principal: Pick<Principal, 'roles' | 'platformAdmin' | 'orgId'>): Set<Permission> {
  if (principal.platformAdmin) return new Set(PERMISSIONS);
  if (!principal.orgId) return new Set();
  return new Set(principal.roles.flatMap((r) => [...permissionsForRole(r)]));
}

export function hasOrgPermission(principal: Principal, permission: Permission): boolean {
  if (principal.stale) return false;
  return orgPermissions(principal).has(permission);
}
