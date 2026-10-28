import { Injectable } from '@nestjs/common';
import type { PlatformOverview, PlatformUser, PlatformUserDetail } from '@dreamlab/contracts';
import type { Principal } from '@lib/auth';
import { conflict, notFound } from '@lib/common';
import { InjectConfig } from '@lib/config';
import { InjectDatabase } from '@lib/database';
import { InjectOutbox, OutboxWriter, userActor } from '@lib/messaging';
import type { UserContact } from '@lib/rpc';
import { and, desc, eq, gt, ilike, inArray, isNull, lt, or, sql } from 'drizzle-orm';
import type { IamConfig } from '../../config';
import { IamDatabase, schema } from '../../database';
import { IamEvents } from '../../events';
import { activeAssignment, AuthzService } from '../authz/authz.service';
import { SessionsService } from '../auth/services/sessions.service';

const { users, userIdentities, sessions, memberships, organizations, roleAssignments, roles } = schema;
type UserRow = typeof users.$inferSelect;

/** Platform administration (PLT-1): people and organisations across every tenant. */
@Injectable()
export class PlatformService {
  constructor(
    @InjectDatabase() private readonly db: IamDatabase,
    @InjectOutbox() private readonly outbox: OutboxWriter,
    @InjectConfig() private readonly config: IamConfig,
    private readonly sessions: SessionsService,
    private readonly authz: AuthzService,
  ) {}

  async overview(): Promise<PlatformOverview> {
    const [u] = await this.db.sys
      .select({
        total: sql<number>`count(*) filter (where ${users.status} <> 'deleted')::int`,
        new7d: sql<number>`count(*) filter (where ${users.createdAt} > now() - interval '7 days')::int`,
        suspended: sql<number>`count(*) filter (where ${users.status} = 'suspended')::int`,
        withMfa: sql<number>`count(*) filter (where ${users.mfaEnabledAt} is not null)::int`,
      })
      .from(users);
    const orgRows = await this.db.sys.select({ kinds: organizations.kinds, status: organizations.status, slug: organizations.slug }).from(organizations);
    const real = orgRows.filter((o) => o.slug !== this.config.PLATFORM_ORG_SLUG);
    const byKind: Record<string, number> = {};
    for (const o of real) for (const k of o.kinds) byKind[k] = (byKind[k] ?? 0) + 1;
    const days = await this.db.sys.execute<{ day: string; n: number }>(sql`
      select to_char(d, 'YYYY-MM-DD') as day, coalesce(count(${users.id}), 0)::int as n
      from generate_series(current_date - 13, current_date, interval '1 day') d
      left join ${users} on ${users.createdAt}::date = d::date
      group by d order by d`);
    return {
      users: { total: u?.total ?? 0, new7d: u?.new7d ?? 0, suspended: u?.suspended ?? 0, withMfa: u?.withMfa ?? 0 },
      organizations: { total: real.length, pending: real.filter((o) => o.status === 'pending').length, byKind },
      signups: days.rows.map((r) => ({ date: r.day, count: Number(r.n) })),
    };
  }

  /** Newest first; the cursor is the last row's created_at. */
  async listUsers(query: { q?: string; status?: 'active' | 'suspended'; limit: number; cursor?: string }) {
    const conditions = [sql`${users.status} <> 'deleted'`];
    if (query.status) conditions.push(eq(users.status, query.status));
    if (query.q) {
      const like = `%${query.q.replace(/[%_\\]/g, (c) => `\\${c}`)}%`;
      conditions.push(or(ilike(users.fullName, like), ilike(sql`${users.email}::text`, like), ilike(users.phone, like))!);
    }
    if (query.cursor) {
      const at = new Date(query.cursor);
      if (!Number.isNaN(at.getTime())) conditions.push(lt(users.createdAt, at));
    }
    const rows = await this.db.sys.select().from(users).where(and(...conditions)).orderBy(desc(users.createdAt)).limit(query.limit + 1);
    const page = rows.slice(0, query.limit);
    return { items: await this.toPlatformUsers(page), nextCursor: rows.length > query.limit ? page.at(-1)!.createdAt.toISOString() : null };
  }

  async getUser(userId: string): Promise<PlatformUserDetail> {
    const [user] = await this.db.sys.select().from(users).where(eq(users.id, userId));
    if (!user || user.status === 'deleted') throw notFound('user_not_found', 'Person not found');
    const [base] = await this.toPlatformUsers([user]);
    const identities = await this.db.sys.select().from(userIdentities).where(eq(userIdentities.userId, userId));
    const ms = await this.db.sys
      .select({ m: memberships, org: organizations })
      .from(memberships)
      .innerJoin(organizations, eq(organizations.id, memberships.orgId))
      .where(and(eq(memberships.userId, userId), sql`${memberships.status} <> 'left'`));
    const assignments = ms.length
      ? await this.db.sys
          .select({ membershipId: roleAssignments.membershipId, key: roles.key })
          .from(roleAssignments)
          .innerJoin(roles, eq(roles.id, roleAssignments.roleId))
          .where(inArray(roleAssignments.membershipId, ms.map((r) => r.m.id)))
      : [];
    const [active] = await this.db.sys
      .select({ n: sql<number>`count(*)::int` })
      .from(sessions)
      .where(and(eq(sessions.userId, userId), isNull(sessions.revokedAt), gt(sessions.expiresAt, sql`now()`)));
    return {
      ...base!,
      identities: identities.map((i) => ({ provider: i.provider, createdAt: i.createdAt.toISOString() })),
      memberships: ms.map(({ m, org }) => ({
        orgId: org.id,
        orgName: org.name,
        orgSlug: org.slug,
        orgStatus: org.status,
        status: m.status,
        roles: assignments.filter((a) => a.membershipId === m.id).map((a) => a.key),
      })),
      activeSessions: active?.n ?? 0,
    };
  }

  /** Suspending ends every session at once; the person cannot sign in until reactivated. */
  async setStatus(principal: Principal, userId: string, status: 'active' | 'suspended', reason: string, requestId?: string): Promise<PlatformUserDetail> {
    if (userId === principal.userId) throw conflict('cannot_suspend_self', 'You can’t change your own account status.');
    const [user] = await this.db.sys.select().from(users).where(eq(users.id, userId));
    if (!user || user.status === 'deleted') throw notFound('user_not_found', 'Person not found');
    if (status === 'suspended' && (await this.authz.isPlatformAdmin(userId))) {
      throw conflict('cannot_suspend_admin', 'Remove their platform admin role before suspending a platform admin.');
    }
    if (user.status !== status) {
      await this.db.system(async (tx) => {
        await tx.update(users).set({ status }).where(eq(users.id, userId));
        await this.authz.bumpVersion(tx, [userId]);
        await this.outbox.add(tx, {
          type: status === 'suspended' ? IamEvents.UserSuspended : IamEvents.UserReactivated,
          actor: userActor(principal.userId),
          requestId,
          payload: { userId, reason },
        });
      });
      if (status === 'suspended') await this.sessions.revoke({ userId }, `suspended: ${reason}`.slice(0, 200), principal.userId, requestId ?? null);
    }
    return this.getUser(userId);
  }

  /** Display names for people other learners see (discussions). Names only; nothing else leaves IAM. */
  async names(userIds: string[]): Promise<{ id: string; name: string }[]> {
    if (userIds.length === 0) return [];
    const rows = await this.db.sys.select({ id: users.id, name: users.fullName }).from(users).where(inArray(users.id, userIds.slice(0, 500)));
    return rows;
  }

  /**
   * Where to reach people for notifications: the verified email of each active user, nothing else.
   * Unverified or missing addresses come back null, so mail never goes to an address nobody proved.
   */
  async contacts(userIds: string[]): Promise<UserContact[]> {
    if (userIds.length === 0) return [];
    const rows = await this.db.sys
      .select({ id: users.id, name: users.fullName, email: users.email, verified: users.emailVerifiedAt, locale: users.locale })
      .from(users)
      .where(and(inArray(users.id, userIds.slice(0, 500)), eq(users.status, 'active')));
    return rows.map((r) => ({ id: r.id, name: r.name, email: r.verified ? r.email : null, locale: r.locale }));
  }

  /** Active members of an organisation holding a permission through an org-wide role in force now. */
  async holders(orgId: string, permission: string): Promise<string[]> {
    const rows = await this.db.sys
      .selectDistinct({ userId: memberships.userId })
      .from(roleAssignments)
      .innerJoin(memberships, eq(memberships.id, roleAssignments.membershipId))
      .innerJoin(roles, eq(roles.id, roleAssignments.roleId))
      .innerJoin(users, eq(users.id, memberships.userId))
      .where(
        and(
          eq(memberships.orgId, orgId),
          eq(memberships.status, 'active'),
          eq(users.status, 'active'),
          eq(roleAssignments.scopeType, 'org'),
          sql`${permission} = any(${roles.permissions})`,
          activeAssignment(),
        ),
      )
      .limit(500);
    return rows.map((r) => r.userId);
  }

  private async toPlatformUsers(rows: UserRow[]): Promise<PlatformUser[]> {
    if (rows.length === 0) return [];
    const ids = rows.map((r) => r.id);
    const [counts, lastSeen, admins] = await Promise.all([
      this.db.sys
        .select({ userId: memberships.userId, n: sql<number>`count(*)::int` })
        .from(memberships)
        .where(and(inArray(memberships.userId, ids), eq(memberships.status, 'active')))
        .groupBy(memberships.userId),
      this.db.sys
        .select({ userId: sessions.userId, at: sql<Date>`max(${sessions.createdAt})` })
        .from(sessions)
        .where(inArray(sessions.userId, ids))
        .groupBy(sessions.userId),
      this.db.sys
        .select({ userId: memberships.userId })
        .from(roleAssignments)
        .innerJoin(memberships, eq(memberships.id, roleAssignments.membershipId))
        .innerJoin(roles, eq(roles.id, roleAssignments.roleId))
        .innerJoin(organizations, eq(organizations.id, memberships.orgId))
        .where(and(inArray(memberships.userId, ids), eq(roles.key, 'platform_admin'), eq(organizations.slug, this.config.PLATFORM_ORG_SLUG), eq(memberships.status, 'active'))),
    ]);
    const adminIds = new Set(admins.map((a) => a.userId));
    return rows.map((r) => {
      const seen = lastSeen.find((l) => l.userId === r.id)?.at;
      return {
        id: r.id,
        fullName: r.fullName,
        email: r.email,
        phone: r.phone,
        status: r.status === 'suspended' ? 'suspended' : 'active',
        verified: !!(r.emailVerifiedAt || r.phoneVerifiedAt),
        mfaEnabled: !!r.mfaEnabledAt,
        platformAdmin: adminIds.has(r.id),
        membershipCount: counts.find((c) => c.userId === r.id)?.n ?? 0,
        createdAt: r.createdAt.toISOString(),
        lastSignInAt: seen ? new Date(seen).toISOString() : null,
      };
    });
  }
}
