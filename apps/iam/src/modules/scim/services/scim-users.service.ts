import { Injectable } from '@nestjs/common';
import { revokedSessionKey } from '@lib/auth';
import { InjectRedis, newId } from '@lib/common';
import { InjectConfig } from '@lib/config';
import { InjectDatabase } from '@lib/database';
import { InjectOutbox, OutboxWriter, SYSTEM_ACTOR } from '@lib/messaging';
import { and, asc, count, eq, inArray, isNotNull, isNull, ne, or, SQL, sql } from 'drizzle-orm';
import type Redis from 'ioredis';
import type { IamConfig } from '../../../config';
import { IamDatabase, IamTx, schema } from '../../../database';
import { IamEvents } from '../../../events';
import { pendingPasswordKey } from '../../auth/auth.service';
import { emailDomain } from '../../auth/utils/email-domain';
import { AuthzService } from '../../authz/authz.service';
import { lockUserRow, UsersRepository } from '../../users/users.repository';
import { listResponse, paging, parseEqFilter, patchOperations, SCIM, scimBadRequest, scimBoolean, scimConflict, scimNotFound } from '../utils/scim';

const { memberships, users, orgDomains, roleAssignments, roles, groupMembers, ssoConnections, sessions, scimDirectories } = schema;
type MembershipRow = typeof memberships.$inferSelect;
type UserRow = typeof users.$inferSelect;

/** The fields IAM keeps from a SCIM User. */
interface UserInput {
  email: string;
  fullName: string;
  externalId: string | null;
  active: boolean;
  title: string | null;
}

/**
 * SCIM Users (IAM-17). The SCIM id is the membership id: a person is global, and what the
 * directory manages is their membership of this organisation. Only addresses at the
 * organisation's verified domains can be provisioned.
 */
@Injectable()
export class ScimUsersService {
  constructor(
    @InjectDatabase() private readonly db: IamDatabase,
    @InjectRedis() private readonly redis: Redis,
    @InjectConfig() private readonly config: IamConfig,
    @InjectOutbox() private readonly outbox: OutboxWriter,
    private readonly users: UsersRepository,
    private readonly authz: AuthzService,
  ) {}

  base(): string {
    return `${this.config.PUBLIC_API_URL.replace(/\/$/, '')}/scim/v2`;
  }

  toScim(m: MembershipRow, u: UserRow) {
    return {
      schemas: [SCIM.user],
      id: m.id,
      externalId: m.externalId ?? undefined,
      userName: u.email ?? u.phone ?? m.id,
      name: { formatted: u.fullName },
      displayName: u.fullName,
      emails: u.email ? [{ value: u.email, type: 'work', primary: true }] : [],
      active: m.status === 'active',
      ...(m.jobTitle ? { title: m.jobTitle } : {}),
      meta: { resourceType: 'User', created: m.createdAt.toISOString(), lastModified: m.updatedAt.toISOString(), location: `${this.base()}/Users/${m.id}` },
    };
  }

  async list(orgId: string, query: { filter?: string; startIndex?: string; count?: string }) {
    const f = parseEqFilter(query.filter, ['userName', 'externalId', 'emails.value']);
    const { offset, limit, startIndex } = paging(query);
    const visible = and(eq(memberships.orgId, orgId), eq(memberships.source, 'scim'), ne(memberships.status, 'left'));
    let where: SQL | undefined = visible;
    if (f?.attribute === 'externalId') where = and(visible, eq(memberships.externalId, f.value));
    else if (f) where = and(visible, eq(users.email, f.value.toLowerCase()));
    const [total] = await this.db.sys.select({ n: count() }).from(memberships).innerJoin(users, eq(users.id, memberships.userId)).where(where);
    const rows = await this.db.sys
      .select({ m: memberships, u: users })
      .from(memberships)
      .innerJoin(users, eq(users.id, memberships.userId))
      .where(where)
      .orderBy(asc(memberships.createdAt))
      .limit(limit)
      .offset(offset);
    return listResponse(rows.map((r) => this.toScim(r.m, r.u)), Number(total?.n ?? 0), startIndex);
  }

  async get(orgId: string, id: string) {
    const row = await this.find(this.db.sys, orgId, id);
    return this.toScim(row.m, row.u);
  }

  async create(orgId: string, body: unknown) {
    const input = this.parse(body);
    await this.assertDomain(orgId, input.email);
    return this.db.system(async (tx) => {
      if (input.externalId) await this.assertExternalIdFree(tx, orgId, input.externalId, null);
      let user = await this.users.findByIdentifier(input.email, tx);
      if (!user) {
        user = await this.users.create(tx, { email: input.email, phone: null, fullName: input.fullName, locale: 'en' });
        await this.outbox.add(tx, { type: IamEvents.UserRegistered, actor: SYSTEM_ACTOR, requestId: null, payload: { userId: user.id, channel: 'scim' } });
      }
      // The organisation controls the mailbox's domain, so the address counts as verified. A password
      // set before anyone proved the address is dropped (see AuthService.register).
      if (!UsersRepository.isAnyVerified(user)) {
        await this.users.dropPassword(tx, user.id);
        await this.redis.del(pendingPasswordKey(user.id));
      }
      if (!user.emailVerifiedAt) await this.users.markVerified(tx, user.id, input.email);
      const [existing] = await tx.select().from(memberships).where(and(eq(memberships.orgId, orgId), eq(memberships.userId, user.id)));
      if (existing && existing.status !== 'left' && existing.source === 'scim') throw scimConflict('A user with that userName already exists');
      const status = input.active ? ('active' as const) : ('suspended' as const);
      let membership: MembershipRow;
      if (existing) {
        [membership] = (await tx
          .update(memberships)
          .set({ status, source: 'scim', externalId: input.externalId, jobTitle: input.title, joinedAt: existing.joinedAt ?? new Date() })
          .where(eq(memberships.id, existing.id))
          .returning()) as [MembershipRow];
      } else {
        [membership] = (await tx
          .insert(memberships)
          .values({ id: newId(), userId: user.id, orgId, status, source: 'scim', externalId: input.externalId, jobTitle: input.title, joinedAt: new Date() })
          .returning()) as [MembershipRow];
      }
      await this.ensureDefaultRole(tx, orgId, membership.id);
      await this.authz.bumpVersion(tx, [user.id]);
      await this.touch(tx, orgId);
      await this.outbox.add(tx, { type: IamEvents.MemberJoined, orgId, actor: SYSTEM_ACTOR, requestId: null, payload: { orgId, membershipId: membership.id, userId: user.id, via: 'scim' } });
      const fresh = (await this.users.findById(user.id, tx))!;
      return this.toScim(membership, fresh);
    });
  }

  async replace(orgId: string, id: string, body: unknown) {
    return this.apply(orgId, id, this.parse(body));
  }

  /** PATCH: apply the operations to the current representation, then save it like a PUT. */
  async patch(orgId: string, id: string, body: unknown) {
    const current = await this.find(this.db.sys, orgId, id);
    const input: UserInput = {
      email: current.u.email ?? '',
      fullName: current.u.fullName,
      externalId: current.m.externalId,
      active: current.m.status === 'active',
      title: current.m.jobTitle,
    };
    for (const op of patchOperations(body)) {
      const entries: [string, unknown][] = op.path ? [[op.path, op.value]] : Object.entries((op.value as Record<string, unknown>) ?? {});
      for (const [rawPath, value] of entries) {
        const path = rawPath.toLowerCase();
        const removing = op.op === 'remove';
        if (path === 'active') input.active = removing ? false : scimBoolean(value);
        else if (path === 'displayname' || path === 'name.formatted') input.fullName = removing ? input.fullName : String(value);
        else if (path === 'name' && typeof value === 'object' && value) input.fullName = nameFrom(value as Record<string, unknown>) ?? input.fullName;
        else if (path === 'name.givenname' || path === 'name.familyname') input.fullName = mergeName(input.fullName, path, String(value ?? ''));
        else if (path === 'externalid') input.externalId = removing ? null : String(value);
        else if (path === 'title') input.title = removing ? null : String(value);
        else if (path === 'username' || path.startsWith('emails')) {
          const email = typeof value === 'string' ? value : Array.isArray(value) ? (value[0] as { value?: string })?.value : (value as { value?: string })?.value;
          if (email && !removing) input.email = email.trim().toLowerCase();
        }
        // Other attributes (phone numbers, addresses, enterprise extension) are not stored.
      }
    }
    return this.apply(orgId, id, input);
  }

  /** Deprovision: the membership ends, its roles and groups go, and sessions in this organisation end. */
  async remove(orgId: string, id: string): Promise<void> {
    const row = await this.find(this.db.sys, orgId, id);
    const sessionIds = await this.db.system(async (tx) => {
      await tx.update(memberships).set({ status: 'left', externalId: null }).where(eq(memberships.id, row.m.id));
      await tx.delete(roleAssignments).where(eq(roleAssignments.membershipId, row.m.id));
      await tx.delete(groupMembers).where(eq(groupMembers.membershipId, row.m.id));
      await this.authz.bumpVersion(tx, [row.u.id]);
      const ended = await tx
        .update(sessions)
        .set({ revokedAt: new Date(), revokedReason: 'scim_deprovisioned' })
        .where(and(eq(sessions.userId, row.u.id), eq(sessions.activeOrgId, orgId), isNull(sessions.revokedAt)))
        .returning({ id: sessions.id });
      await this.touch(tx, orgId);
      await this.outbox.add(tx, { type: IamEvents.MemberRemoved, orgId, actor: SYSTEM_ACTOR, requestId: null, payload: { orgId, membershipId: row.m.id, userId: row.u.id, via: 'scim' } });
      return ended.map((s) => s.id);
    });
    for (const sid of sessionIds) await this.redis.set(revokedSessionKey(sid), 'scim_deprovisioned', 'EX', this.config.ACCESS_TOKEN_TTL_SECONDS + 60);
  }

  // ---------- helpers ----------

  private async apply(orgId: string, id: string, input: UserInput) {
    const row = await this.find(this.db.sys, orgId, id);
    const owned = await this.ownsAccount(orgId, row.u);
    if (input.email !== row.u.email) {
      // The email is the person's sign-in everywhere: only an organisation that owns the account may change it.
      if (!owned) throw scimBadRequest('This person also uses their account outside the organisation, so its email address cannot be changed through SCIM');
      await this.assertDomain(orgId, input.email);
    }
    return this.db.system(async (tx) => {
      // Decided again under the user's lock: a membership elsewhere may have been added since the check above.
      await lockUserRow(tx, row.u.id);
      const ownedNow = owned && (await this.ownsAccount(orgId, row.u, tx));
      if (input.email !== row.u.email && !ownedNow) throw scimBadRequest('This person also uses their account outside the organisation, so its email address cannot be changed through SCIM');
      if (input.externalId) await this.assertExternalIdFree(tx, orgId, input.externalId, row.m.id);
      if (input.email !== row.u.email) {
        const taken = await this.users.findByIdentifier(input.email, tx);
        if (taken && taken.id !== row.u.id) throw scimConflict('Another account already uses that email address');
        await tx.update(users).set({ email: input.email, emailVerifiedAt: new Date() }).where(eq(users.id, row.u.id));
      }
      if (ownedNow && input.fullName !== row.u.fullName) await tx.update(users).set({ fullName: input.fullName.slice(0, 120) }).where(eq(users.id, row.u.id));
      const status = input.active ? ('active' as const) : ('suspended' as const);
      const [m] = await tx
        .update(memberships)
        .set({ status, externalId: input.externalId, jobTitle: input.title })
        .where(eq(memberships.id, row.m.id))
        .returning();
      if (status !== row.m.status) {
        await this.authz.bumpVersion(tx, [row.u.id]);
        await this.outbox.add(tx, { type: IamEvents.MemberUpdated, orgId, actor: SYSTEM_ACTOR, requestId: null, payload: { orgId, membershipId: row.m.id, userId: row.u.id, status } });
      }
      await this.touch(tx, orgId);
      return this.toScim(m!, (await this.users.findById(row.u.id, tx))!);
    });
  }

  private parse(body: unknown): UserInput {
    const b = (body ?? {}) as Record<string, unknown>;
    const emails = Array.isArray(b.emails) ? (b.emails as { value?: string; primary?: boolean }[]) : [];
    const candidate = [typeof b.userName === 'string' ? b.userName : null, emails.find((e) => e.primary)?.value, emails[0]?.value].find((v) => v?.includes('@'));
    if (!candidate) throw scimBadRequest('userName (or a primary email) must be an email address');
    const email = candidate.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw scimBadRequest('userName must be an email address');
    const fullName =
      (typeof b.displayName === 'string' && b.displayName.trim()) ||
      (b.name && typeof b.name === 'object' ? nameFrom(b.name as Record<string, unknown>) : null) ||
      email.split('@')[0]!;
    return {
      email,
      fullName: fullName.slice(0, 120),
      externalId: typeof b.externalId === 'string' && b.externalId ? b.externalId.slice(0, 255) : null,
      active: b.active === undefined ? true : scimBoolean(b.active),
      title: typeof b.title === 'string' && b.title ? b.title.slice(0, 160) : null,
    };
  }

  private async assertDomain(orgId: string, email: string): Promise<void> {
    const domain = emailDomain(email);
    const [ok] = await this.db.sys
      .select({ id: orgDomains.id })
      .from(orgDomains)
      .where(and(eq(orgDomains.orgId, orgId), eq(orgDomains.domain, domain ?? ''), isNotNull(orgDomains.verifiedAt)));
    if (!ok) throw scimBadRequest(`${domain ?? email} is not one of the organisation’s verified email domains`);
  }

  private async assertExternalIdFree(tx: IamTx, orgId: string, externalId: string, exceptId: string | null): Promise<void> {
    const [clash] = await tx
      .select({ id: memberships.id })
      .from(memberships)
      .where(and(eq(memberships.orgId, orgId), eq(memberships.externalId, externalId), exceptId ? ne(memberships.id, exceptId) : undefined));
    if (clash) throw scimConflict('Another user already has that externalId');
  }

  private async ensureDefaultRole(tx: IamTx, orgId: string, membershipId: string): Promise<void> {
    const [anyRole] = await tx.select({ id: roleAssignments.id }).from(roleAssignments).where(eq(roleAssignments.membershipId, membershipId));
    if (anyRole) return;
    const [conn] = await tx.select({ key: ssoConnections.defaultRoleKey }).from(ssoConnections).where(eq(ssoConnections.orgId, orgId));
    const key = conn?.key ?? 'learner';
    const [role] = await tx.select({ id: roles.id }).from(roles).where(and(eq(roles.key, key), or(isNull(roles.orgId), eq(roles.orgId, orgId))));
    if (role) await tx.insert(roleAssignments).values({ id: newId(), orgId, membershipId, roleId: role.id, scopeType: 'org', grantedByUserId: null });
  }

  /**
   * The organisation owns the account when the person signs in with an address at one of its verified
   * domains, belongs to no other organisation and is not a platform admin. Only then may SCIM change
   * the account itself (email, name); otherwise it manages just the membership.
   */
  private async ownsAccount(orgId: string, user: typeof users.$inferSelect, db: IamDatabase['sys'] | IamTx = this.db.sys): Promise<boolean> {
    if (!user.email) return false;
    const domain = emailDomain(user.email);
    const [verified] = await db
      .select({ id: orgDomains.id })
      .from(orgDomains)
      .where(and(eq(orgDomains.orgId, orgId), eq(orgDomains.domain, domain ?? ''), isNotNull(orgDomains.verifiedAt)));
    if (!verified) return false;
    const [elsewhere] = await db
      .select({ id: memberships.id })
      .from(memberships)
      .where(and(eq(memberships.userId, user.id), ne(memberships.orgId, orgId), inArray(memberships.status, ['active', 'suspended', 'invited', 'requested'])));
    if (elsewhere) return false;
    return !(await this.authz.isPlatformAdmin(user.id));
  }

  /** SCIM sees only the memberships it provisioned, never people who joined another way. */
  private async find(db: IamDatabase['sys'] | IamTx, orgId: string, id: string) {
    if (!/^[0-9a-f-]{36}$/i.test(id)) throw scimNotFound();
    const [row] = await db
      .select({ m: memberships, u: users })
      .from(memberships)
      .innerJoin(users, eq(users.id, memberships.userId))
      .where(and(eq(memberships.id, id), eq(memberships.orgId, orgId), eq(memberships.source, 'scim'), inArray(memberships.status, ['active', 'suspended'])));
    if (!row) throw scimNotFound();
    return row;
  }

  private async touch(tx: IamTx, orgId: string): Promise<void> {
    await tx.update(scimDirectories).set({ lastSyncAt: sql`now()` }).where(eq(scimDirectories.orgId, orgId));
  }
}

function nameFrom(name: Record<string, unknown>): string | null {
  if (typeof name.formatted === 'string' && name.formatted.trim()) return name.formatted.trim();
  const parts = [name.givenName, name.familyName].filter((p): p is string => typeof p === 'string' && p.trim() !== '');
  return parts.length ? parts.join(' ') : null;
}

function mergeName(current: string, path: string, value: string): string {
  const [first, ...rest] = current.split(' ');
  return path === 'name.givenname' ? [value, ...rest].join(' ').trim() : [first, value].join(' ').trim();
}
