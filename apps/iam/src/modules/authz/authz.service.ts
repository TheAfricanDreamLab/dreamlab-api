import { Injectable } from '@nestjs/common';
import { PERMISSIONS, Permission, ScopeType } from '@dreamlab/contracts';
import { authzVersionKey, orgPermissions, Principal } from '@lib/auth';
import { forbidden, InjectRedis } from '@lib/common';
import { InjectConfig } from '@lib/config';
import { InjectDatabase } from '@lib/database';
import { and, eq, gt, inArray, isNull, lte, or, sql } from 'drizzle-orm';
import type Redis from 'ioredis';
import type { IamConfig } from '../../config';
import { IamDatabase, IamTx, schema } from '../../database';
import type { OrgAccess } from './interfaces/grant.interface';
import { isAncestorOrSelf } from './utils/unit-path';

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
    const rows = await tx
      .update(users)
      .set({ authzVersion: sql`${users.authzVersion} + 1` })
      .where(inArray(users.id, [...new Set(userIds)]))
      .returning({ id: users.id, v: users.authzVersion });
    // Every service's guard compares tokens with this; older tokens are re-checked with IAM.
    // Tokens live ACCESS_TOKEN_TTL at most, so the marker only needs to outlive them.
    // A pipeline, not MULTI: each marker stands alone, and users' keys sit in different cluster slots.
    const pipeline = this.redis.pipeline();
    for (const r of rows) pipeline.set(authzVersionKey(r.id), String(r.v), 'EX', this.config.ACCESS_TOKEN_TTL_SECONDS + 120);
    await pipeline.exec();
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

    // Suspended organisations grant nothing; pending ones can be set up by their admins.
    const [membership] = await this.db.sys
      .select({ id: memberships.id })
      .from(memberships)
      .innerJoin(organizations, eq(organizations.id, memberships.orgId))
      .where(
        and(
          eq(memberships.userId, userId),
          eq(memberships.orgId, orgId),
          eq(memberships.status, 'active'),
          inArray(organizations.status, ['active', 'pending']),
        ),
      );
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

  /**
   * No escalation: a grantor hands out only permissions they hold org-wide themselves. Org admins and
   * platform admins may grant any organisation role.
   */
  async assertMayGrant(userId: string, orgId: string, permissions: readonly string[]): Promise<void> {
    if (await this.isPlatformAdmin(userId)) return;
    const orgGrants = ((await this.orgAccess(userId, orgId))?.grants ?? []).filter((g) => g.scopeType === 'org');
    if (orgGrants.some((g) => g.roleKey === 'org_admin')) return;
    const held = new Set<string>(orgGrants.flatMap((g) => g.permissions));
    const missing = [...new Set(permissions)].filter((p) => !held.has(p));
    if (missing.length > 0) throw forbidden('grant_exceeds_own', `You can only grant permissions you hold yourself. Missing: ${missing.join(', ')}`);
  }

  /** Permissions held org-wide in the principal's active context (for /me and UI). */
  static effectivePermissions(principal: Principal): Permission[] {
    return [...orgPermissions(principal)].sort();
  }

  /** Like effectivePermissions, but read from the database, so custom roles (IAM-18) count too. */
  async orgWidePermissions(principal: Principal): Promise<Permission[]> {
    if (principal.platformAdmin || !principal.orgId) return AuthzService.effectivePermissions(principal);
    const access = await this.orgAccess(principal.userId, principal.orgId);
    const perms = new Set<Permission>();
    for (const g of access?.grants ?? []) if (g.scopeType === 'org') for (const p of g.permissions) perms.add(p);
    return [...perms].sort();
  }
}
