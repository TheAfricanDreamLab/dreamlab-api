import { CanActivate, ExecutionContext, Inject, Injectable, Optional } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { forbidden, REDIS, unauthorized } from '@lib/common';
import type Redis from 'ioredis';
import { AUTHZ_CHECKER, AuthzChecker } from './authz';
import { AuthenticatedRequest, IS_PUBLIC, PermissionRequirement, REQUIRED_PERMISSION } from './decorators';
import { bearerToken, JwtVerifier, TokenInvalidError } from './jwt-verifier';
import { hasOrgPermission, principalFromClaims } from './principal';

export const JWT_VERIFIER = Symbol('JWT_VERIFIER');

/** Redis key marking a session as revoked, so its unexpired access tokens stop working at once. */
export const revokedSessionKey = (sessionId: string): string => `auth:revoked-sid:${sessionId}`;

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
      const principal = principalFromClaims(await this.verifier.verify(token));
      if (this.redis && (await this.redis.exists(revokedSessionKey(principal.sessionId)))) {
        throw new TokenInvalidError('Session has ended', 'invalid');
      }
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

/** Global authorization guard for routes decorated with @RequirePermission. */
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
    if (principal.platformAdmin) return true;

    const params = req.params ?? {};
    const routeOrgId = params[requirement.orgParam ?? 'orgId'];
    if (routeOrgId && routeOrgId !== principal.orgId) {
      throw forbidden(
        'org_context_mismatch',
        'Your session is for a different organisation. Switch to this organisation first (POST /v1/auth/switch-org).',
      );
    }
    const orgId = routeOrgId ?? principal.orgId;
    if (!orgId) throw forbidden('org_context_required', 'This action needs an organisation context');

    if (hasOrgPermission(principal, requirement.permission)) return true;

    if (this.checker && (requirement.scope || requirement.anyScope)) {
      const scopeId = requirement.scope ? params[requirement.scope.param] : undefined;
      const allowed = await this.checker.check({
        userId: principal.userId,
        orgId,
        permission: requirement.permission,
        scopeType: requirement.scope?.type,
        scopeId,
        anyScope: requirement.anyScope && !requirement.scope,
        authzVersion: principal.authzVersion,
      });
      if (allowed) return true;
    }
    throw forbidden('permission_denied', `Missing permission: ${requirement.permission}`);
  }
}
