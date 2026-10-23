import { CanActivate, ExecutionContext, Inject, Injectable, Optional } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { isSystemRoleKey, type ScopeType } from '@dreamlab/contracts';
import { forbidden, REDIS, unauthorized } from '@lib/common';
import type Redis from 'ioredis';
import { AUTHZ_CHECKER, AuthzChecker } from './authz';
import { AuthenticatedRequest, IS_PUBLIC, PermissionRequirement, REQUIRED_PERMISSION } from './decorators';
import { bearerToken, JwtVerifier, TokenInvalidError } from './jwt-verifier';
import { hasOrgPermission, needsMfa, Principal, principalFromClaims } from './principal';

export const JWT_VERIFIER = Symbol('JWT_VERIFIER');

/** Redis key marking a session as revoked, so its unexpired access tokens stop working at once. */
export const revokedSessionKey = (sessionId: string): string => `auth:revoked-sid:${sessionId}`;

/** Redis key holding a user's current authorization version (IAM sets it whenever their roles change). */
export const authzVersionKey = (userId: string): string => `auth:azv:${userId}`;

/** Placeholder org id for platform-level checks that have no organisation. */
export const NO_ORG = '00000000-0000-0000-0000-000000000000';

/** Revoked session: throws. Roles changed since the token was issued: marks the principal stale. */
export async function checkTokenFreshness(redis: Redis, principal: Principal): Promise<Principal> {
  // Two GETs in one round trip rather than MGET: the keys sit in different cluster slots.
  const results = (await redis.pipeline().get(revokedSessionKey(principal.sessionId)).get(authzVersionKey(principal.userId)).exec()) ?? [];
  for (const [err] of results) if (err) throw err;
  const [revoked, version] = results.map(([, value]) => value as string | null);
  if (revoked) throw new TokenInvalidError('Session has ended', 'invalid');
  return version !== null && Number(version) > principal.authzVersion ? { ...principal, stale: true } : principal;
}

/**
 * Global authentication guard. Every route needs a valid bearer token unless marked @Public;
 * on public routes a valid token is still attached so handlers can personalise.
 */
@Injectable()
export class AuthenticationGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    @Inject(JWT_VERIFIER) private readonly verifier: JwtVerifier,
    @Optional() @Inject(REDIS) private readonly redis?: Redis,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    if (context.getType() !== 'http') return true;
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC, [context.getHandler(), context.getClass()]);
    const req = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const token = bearerToken(req.headers.authorization);

    if (!token) {
      if (isPublic) return true;
      throw unauthorized('token_missing', 'Authentication required');
    }
    try {
      let principal = principalFromClaims(await this.verifier.verify(token));
      if (this.redis) principal = await checkTokenFreshness(this.redis, principal);
      req.principal = principal;
      return true;
    } catch (err) {
      if (isPublic) return true;
      if (err instanceof TokenInvalidError) {
        throw unauthorized(err.reason === 'expired' ? 'token_expired' : 'token_invalid', err.message);
      }
      throw err;
    }
  }
}

interface ScopeQuery {
  scopeType?: ScopeType;
  scopeId?: string;
  anyScope?: boolean;
}

/**
 * Global authorization guard for routes decorated with @RequirePermission.
 * Fresh tokens are decided from their role claims. Stale tokens (roles changed since issue) and
 * narrower scopes are decided by IAM through the AuthzChecker.
 */
@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    @Optional() @Inject(AUTHZ_CHECKER) private readonly checker?: AuthzChecker,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    if (context.getType() !== 'http') return true;
    const requirement = this.reflector.getAllAndOverride<PermissionRequirement | undefined>(REQUIRED_PERMISSION, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!requirement) return true;

    const req = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const principal = req.principal;
    if (!principal) throw unauthorized('token_missing', 'Authentication required');
    // Checked before anything else, so no path below can grant an admin permission without it.
    if (needsMfa(principal, requirement.permission)) {
      throw forbidden('mfa_required', 'This needs your authenticator app. Confirm a code (POST /v1/auth/mfa/step-up) and try again.');
    }
    if (principal.platformAdmin && !principal.stale) return true;

    const params = req.params ?? {};
    const routeOrgId = params[requirement.orgParam ?? 'orgId'];
    const ask = (orgId: string, scope: ScopeQuery = {}): Promise<boolean> =>
      this.checker
        ? this.checker.check({ userId: principal.userId, orgId, permission: requirement.permission, authzVersion: principal.authzVersion, fresh: principal.stale, ...scope })
        : Promise.resolve(false);

    // A stale platform-admin claim is re-checked; platform admins act in any organisation.
    if (principal.platformAdmin && principal.stale && (await ask(routeOrgId ?? principal.orgId ?? NO_ORG))) return true;

    if (routeOrgId && routeOrgId !== principal.orgId) {
      throw forbidden(
        'org_context_mismatch',
        'Your session is for a different organisation. Switch to this organisation first (POST /v1/auth/switch-org).',
      );
    }
    const orgId = routeOrgId ?? principal.orgId;
    if (!orgId) throw forbidden('org_context_required', 'This action needs an organisation context');

    if (hasOrgPermission(principal, requirement.permission)) return true;
    // Custom roles (IAM-18) are defined per organisation, so only IAM knows what they grant.
    if ((principal.stale || principal.roles.some((r) => !isSystemRoleKey(r))) && (await ask(orgId))) return true;
    if (requirement.scope) {
      const scopeId = params[requirement.scope.param];
      if (scopeId && (await ask(orgId, { scopeType: requirement.scope.type, scopeId }))) return true;
    } else if (requirement.anyScope && (await ask(orgId, { anyScope: true }))) {
      return true;
    }
    throw forbidden('permission_denied', `Missing permission: ${requirement.permission}`);
  }
}
