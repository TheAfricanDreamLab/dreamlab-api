import { Global, Injectable, Module } from '@nestjs/common';
import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import {
  PERMISSIONS,
  Permission,
  PermissionSchema,
  ScopeType,
  ScopeTypeSchema,
} from '@dreamlab/contracts';
import {
  AUTHZ_CHECK_PATTERN,
  AUTHZ_CHECKER,
  AuthzChecker,
  AuthzCheckRequest,
  AuthzCheckResponse,
  orgPermissions,
  Principal,
} from '@lib/auth';
import { InjectRedis } from '@lib/common';
import { InjectConfig } from '@lib/config';
import { InjectDatabase, idToLabel } from '@lib/database';
import { and, eq, gt, inArray, isNull, lte, or, sql } from 'drizzle-orm';
import type Redis from 'ioredis';
import { z } from 'zod';
import type { IamConfig } from '../../config';
import { IamDatabase, IamTx, schema } from '../../database';

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

const GRANTS_TTL_SECONDS = 60;
const { memberships, roleAssignments, roles, users, organizations, orgUnits } = schema;

/** Is this assignment in force right now? */
const activeAssignment = () =>
  and(
    or(isNull(roleAssignments.startsAt), lte(roleAssignments.startsAt, sql`now()`)),
    or(isNull(roleAssignments.endsAt), gt(roleAssignments.endsAt, sql`now()`)),
  );

@Injectable()
export class AuthzService {
  constructor(
    @InjectDatabase() private readonly db: IamDatabase,
    @InjectRedis() private readonly redis: Redis,
    @InjectConfig() private readonly config: IamConfig,
  ) {}

  async authzVersion(userId: string): Promise<number> {
    const [row] = await this.db.sys.select({ v: users.authzVersion }).from(users).where(eq(users.id, userId));
    return row?.v ?? 0;
  }

  /** Invalidate every cached authorization answer for these users (call inside the changing tx). */
  async bumpVersion(tx: IamTx, userIds: string[]): Promise<void> {
    if (userIds.length === 0) return;
    await tx
      .update(users)
      .set({ authzVersion: sql`${users.authzVersion} + 1` })
      .where(inArray(users.id, [...new Set(userIds)]));
  }

  async isPlatformAdmin(userId: string): Promise<boolean> {
    const rows = await this.db.sys
      .select({ id: roleAssignments.id })
      .from(roleAssignments)
      .innerJoin(memberships, eq(memberships.id, roleAssignments.membershipId))
      .innerJoin(organizations, eq(organizations.id, memberships.orgId))
      .innerJoin(roles, eq(roles.id, roleAssignments.roleId))
      .where(
        and(
          eq(memberships.userId, userId),
          eq(memberships.status, 'active'),
          eq(organizations.slug, this.config.PLATFORM_ORG_SLUG),
          eq(roles.key, 'platform_admin'),
          activeAssignment(),
        ),
      )
      .limit(1);
    return rows.length > 0;
  }

  /** The user's active membership in an org and every role grant in force there. Cached per authz version. */
  async orgAccess(userId: string, orgId: string, version?: number): Promise<OrgAccess | null> {
    const v = version ?? (await this.authzVersion(userId));
    const cacheKey = `iam:grants:${userId}:${orgId}:v${v}`;
    const cached = await this.redis.get(cacheKey);
    if (cached) return JSON.parse(cached) as OrgAccess | null;

    const [membership] = await this.db.sys
      .select({ id: memberships.id })
      .from(memberships)
      .where(and(eq(memberships.userId, userId), eq(memberships.orgId, orgId), eq(memberships.status, 'active')));
    let access: OrgAccess | null = null;
    if (membership) {
      const rows = await this.db.sys
        .select({
          roleKey: roles.key,
          permissions: roles.permissions,
          scopeType: roleAssignments.scopeType,
          scopeId: roleAssignments.scopeId,
          unitPath: orgUnits.path,
        })
        .from(roleAssignments)
        .innerJoin(roles, eq(roles.id, roleAssignments.roleId))
        .leftJoin(
          orgUnits,
          and(eq(roleAssignments.scopeType, 'org_unit'), eq(orgUnits.id, roleAssignments.scopeId)),
        )
        .where(and(eq(roleAssignments.membershipId, membership.id), activeAssignment()));
      access = {
        membershipId: membership.id,
        grants: rows.map((r) => ({
          roleKey: r.roleKey,
          permissions: r.permissions.filter((p): p is Permission => (PERMISSIONS as readonly string[]).includes(p)),
          scopeType: r.scopeType,
          scopeId: r.scopeId,
          unitPath: r.unitPath,
        })),
      };
    }
    await this.redis.set(cacheKey, JSON.stringify(access), 'EX', GRANTS_TTL_SECONDS);
    return access;
  }

  /** Role keys granted org-wide; these go into the access token. */
  static orgRoleKeys(access: OrgAccess | null): string[] {
    return [...new Set((access?.grants ?? []).filter((g) => g.scopeType === 'org').map((g) => g.roleKey))].sort();
  }

  /**
   * Decide a permission. Org-wide grants always count; otherwise the grant must match the scope.
   * An org_unit grant covers the unit and every unit below it.
   */
  async can(
    userId: string,
    orgId: string,
    permission: Permission,
    scope?: { type: ScopeType; id?: string | null } | 'any',
  ): Promise<boolean> {
    if (await this.isPlatformAdmin(userId)) return true;
    const access = await this.orgAccess(userId, orgId);
    if (!access) return false;
    const holding = access.grants.filter((g) => g.permissions.includes(permission));
    if (holding.some((g) => g.scopeType === 'org')) return true;
    if (!scope) return false;
    if (scope === 'any') return holding.length > 0;
    if (!scope.id) return false;
    if (scope.type === 'org_unit') {
      const target = await this.unitPath(orgId, scope.id);
      return target !== null && holding.some((g) => g.scopeType === 'org_unit' && g.unitPath !== null && isAncestorOrSelf(g.unitPath, target));
    }
    return holding.some((g) => g.scopeType === scope.type && g.scopeId === scope.id);
  }

  /**
   * Units in which the user holds `permission`: 'all' when granted org-wide,
   * otherwise the ltree paths of their unit-scoped grants (empty = none).
   */
  async unitReach(userId: string, orgId: string, permission: Permission): Promise<'all' | string[]> {
    if (await this.isPlatformAdmin(userId)) return 'all';
    const access = await this.orgAccess(userId, orgId);
    const holding = (access?.grants ?? []).filter((g) => g.permissions.includes(permission));
    if (holding.some((g) => g.scopeType === 'org')) return 'all';
    return holding.filter((g) => g.scopeType === 'org_unit' && g.unitPath).map((g) => g.unitPath!);
  }

  async unitPath(orgId: string, unitId: string): Promise<string | null> {
    const [row] = await this.db.sys
      .select({ path: orgUnits.path })
      .from(orgUnits)
      .where(and(eq(orgUnits.id, unitId), eq(orgUnits.orgId, orgId)));
    return row?.path ?? null;
  }

  /** Permissions held org-wide in the principal's active context (for /me and UI). */
  static effectivePermissions(principal: Principal): Permission[] {
    return [...orgPermissions(principal)].sort();
  }
}

export function isAncestorOrSelf(ancestor: string, path: string): boolean {
  return path === ancestor || path.startsWith(`${ancestor}.`);
}

export const unitLabel = idToLabel;

/** In-process checker used by IAM's own PermissionsGuard. */
@Injectable()
export class LocalAuthzChecker implements AuthzChecker {
  constructor(private readonly authz: AuthzService) {}

  check(r: AuthzCheckRequest): Promise<boolean> {
    return this.authz.can(r.userId, r.orgId, r.permission, r.anyScope ? 'any' : r.scopeType ? { type: r.scopeType, id: r.scopeId } : undefined);
  }
}

const AuthzCheckPayload = z.object({
  userId: z.string().uuid(),
  orgId: z.string().uuid(),
  permission: PermissionSchema,
  scopeType: ScopeTypeSchema.optional(),
  scopeId: z.string().uuid().optional(),
  anyScope: z.boolean().optional(),
  authzVersion: z.number().int(),
});

/** RabbitMQ RPC endpoint other services call through RpcAuthzChecker. */
@Controller()
export class AuthzRpcController {
  constructor(private readonly checker: LocalAuthzChecker) {}

  @MessagePattern(AUTHZ_CHECK_PATTERN)
  async check(@Payload() payload: unknown): Promise<AuthzCheckResponse> {
    const parsed = AuthzCheckPayload.safeParse(payload);
    if (!parsed.success) return { allowed: false };
    return { allowed: await this.checker.check(parsed.data) };
  }
}

@Global()
@Module({
  controllers: [AuthzRpcController],
  providers: [AuthzService, LocalAuthzChecker, { provide: AUTHZ_CHECKER, useExisting: LocalAuthzChecker }],
  exports: [AuthzService, AUTHZ_CHECKER],
})
export class AuthzModule {}
