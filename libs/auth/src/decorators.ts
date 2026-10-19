import { applyDecorators, createParamDecorator, ExecutionContext, SetMetadata, UnauthorizedException } from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';
import type { Permission, ScopeType } from '@dreamlab/contracts';
import type { Principal } from './principal';

export const IS_PUBLIC = 'auth:public';
export const REQUIRED_PERMISSION = 'auth:permission';

/** No access token needed. Without this, every route requires a valid token. */
export const Public = (): MethodDecorator & ClassDecorator => SetMetadata(IS_PUBLIC, true);

export interface PermissionOptions {
  /**
   * Route param that holds the organisation id. The token's active organisation must match it
   * (platform admins excepted). Defaults to `orgId` when the route has that param.
   */
  orgParam?: string;
  /** If the permission is not granted org-wide, check it at this narrower scope. */
  scope?: { type: ScopeType; param: string };
  /** Pass when the permission is granted at any scope in the organisation; the handler narrows it. */
  anyScope?: boolean;
}

export interface PermissionRequirement extends PermissionOptions {
  permission: Permission;
}

/** Require a permission. Also documents the route as bearer-authenticated in Swagger. */
export const RequirePermission = (permission: Permission, options: PermissionOptions = {}) =>
  applyDecorators(SetMetadata(REQUIRED_PERMISSION, { permission, ...options } satisfies PermissionRequirement), ApiBearerAuth('bearer'));

/** Mark an authenticated route in Swagger (the guard already enforces authentication). */
export const Authenticated = () => ApiBearerAuth('bearer');

export interface AuthenticatedRequest {
  principal?: Principal;
  headers: Record<string, string | string[] | undefined>;
  params?: Record<string, string>;
  ip?: string;
  id?: string;
}

/** The caller's principal. Throws 401 when used on a route that allowed anonymous access. */
export const CurrentPrincipal = createParamDecorator((_data: unknown, ctx: ExecutionContext): Principal => {
  const req = ctx.switchToHttp().getRequest<AuthenticatedRequest>();
  if (!req.principal) throw new UnauthorizedException('Authentication required');
  return req.principal;
});

/** The caller's principal, or null on a public route called anonymously. */
export const OptionalPrincipal = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): Principal | null => ctx.switchToHttp().getRequest<AuthenticatedRequest>().principal ?? null,
);
