import { Inject, Injectable } from '@nestjs/common';
import { z } from 'zod';
import type { CreateOrganizationSchema, SignUpOrganizationSchema, UpdateOrganizationSchema } from '@dreamlab/contracts';
import type { Principal } from '@lib/auth';
import { badRequest, conflict, forbidden, InjectRedis, likeContains, newId, notFound, randomToken, RedisRateLimiter, sha256, tooManyRequests } from '@lib/common';
import type Redis from 'ioredis';
import { InjectConfig } from '@lib/config';
import { InjectDatabase } from '@lib/database';
import { InjectOutbox, OutboxWriter, userActor } from '@lib/messaging';
import { and, arrayContains, asc, eq, gt, ilike, inArray, or, sql } from 'drizzle-orm';
import { toOrganization, toPublicOrganization } from '../../common/mappers/organization.mapper';
import { pageResult } from '../../common/mappers/pagination';
import type { RequestMeta } from '../../common/interfaces/request-meta.interface';
import type { IamConfig } from '../../config';
import { IamDatabase, IamTx, schema } from '../../database';
import { IamEvents } from '../../events';
import { AuthzService } from '../authz/authz.service';
import type { Notifier } from '../notifications/interfaces/notifier.interface';
import { NOTIFIER } from '../notifications/notifier.service';
import { UsersRepository } from '../users/users.repository';
import { pickSlug } from './utils/slug';

type CreateOrg = z.infer<typeof CreateOrganizationSchema>;
type UpdateOrg = z.infer<typeof UpdateOrganizationSchema>;
type SignUpOrg = z.infer<typeof SignUpOrganizationSchema>;

/** Organisations of these kinds publish content or handle funds, so a platform admin approves them first. */
const NEEDS_APPROVAL = new Set(['institution', 'partner', 'sponsor']);
const SIGNUPS_PER_DAY = 3;
const { organizations, memberships, roleAssignments, roles, invitations } = schema;

const PROFILE_TABLES = {
  institution: schema.institutionProfiles,
  enterprise: schema.enterpriseProfiles,
  partner: schema.partnerProfiles,
  sponsor: schema.sponsorProfiles,
} as const;

@Injectable()
export class OrganizationsService {
  constructor(
    @InjectDatabase() private readonly db: IamDatabase,
    @InjectConfig() private readonly config: IamConfig,
    @InjectOutbox() private readonly outbox: OutboxWriter,
    @Inject(NOTIFIER) private readonly notifier: Notifier,
    @InjectRedis() private readonly redis: Redis,
    private readonly authz: AuthzService,
    private readonly users: UsersRepository,
  ) {}

  /**
   * Self-service sign-up: the caller becomes org_admin. Enterprises are live at once; institutions,
   * partners and sponsors stay pending (set-up only) until a platform admin approves them.
   */
  async signUp(principal: Principal, dto: SignUpOrg, meta: RequestMeta) {
    const user = await this.users.findById(principal.userId);
    if (!user || !UsersRepository.isAnyVerified(user)) {
      throw forbidden('account_unverified', 'Verify your email or phone before creating an organisation');
    }
    const quota = await new RedisRateLimiter(this.redis, 'iam:rl:').hit(`org-signup:${user.id}`, SIGNUPS_PER_DAY, 86_400);
    if (!quota.allowed) throw tooManyRequests('signup_limit', 'You have created several organisations today; try again tomorrow', quota.retryAfterSeconds);

    const status = NEEDS_APPROVAL.has(dto.kind) ? ('pending' as const) : ('active' as const);
    const org = await this.db.system(async (tx) => {
      const slug = await this.resolveSlug(tx, dto.slug, dto.name);
      const [row] = await tx
        .insert(organizations)
        .values({ id: newId(), slug, name: dto.name, kinds: [dto.kind], status, dataRegion: dto.dataRegion })
        .returning();
      const orgId = row!.id;
      if (dto.kind === 'enterprise') {
        await tx.insert(schema.enterpriseProfiles).values({ orgId, industry: dto.profile.industry ?? null, sizeBand: dto.profile.sizeBand ?? null, accountOwnerUserId: user.id });
      } else {
        await tx.insert(PROFILE_TABLES[dto.kind]).values({ orgId });
      }
      const [orgAdmin] = await tx.select().from(roles).where(and(eq(roles.key, 'org_admin'), eq(roles.system, true)));
      const membershipId = newId();
      await tx.insert(memberships).values({ id: membershipId, userId: user.id, orgId, status: 'active', source: 'self', joinedAt: new Date() });
      await tx.insert(roleAssignments).values({ id: newId(), orgId, membershipId, roleId: orgAdmin!.id, scopeType: 'org', grantedByUserId: user.id });
      await this.authz.bumpVersion(tx, [user.id]);
      await this.outbox.add(
        tx,
        { type: IamEvents.OrgCreated, orgId, actor: userActor(user.id), requestId: meta.requestId, payload: { orgId, slug: row!.slug, kinds: [dto.kind], status, selfService: true } },
        { type: IamEvents.MemberJoined, orgId, actor: userActor(user.id), requestId: meta.requestId, payload: { orgId, membershipId, userId: user.id } },
        { type: IamEvents.RoleGranted, orgId, actor: userActor(user.id), requestId: meta.requestId, payload: { orgId, membershipId, userId: user.id, roleKey: 'org_admin', scopeType: 'org' } },
      );
      return row!;
    });
    return toOrganization(org);
  }

  /** Platform admins create tenants. Optionally makes (or invites) the first org admin. */
  async create(principal: Principal, dto: CreateOrg, meta: RequestMeta) {
    const pendingInvite = await this.db.system(async (tx) => {
      const slug = await this.resolveSlug(tx, dto.slug, dto.name);
      if (dto.parentOrgId) {
        const [parent] = await tx.select({ id: organizations.id }).from(organizations).where(eq(organizations.id, dto.parentOrgId));
        if (!parent) throw badRequest('parent_not_found', 'Parent organisation not found');
      }
      const [org] = await tx
        .insert(organizations)
        .values({
          id: newId(),
          slug,
          name: dto.name,
          kinds: [...new Set(dto.kinds)],
          parentOrgId: dto.parentOrgId ?? null,
          branding: dto.branding,
          terminology: dto.terminology,
          dataRegion: dto.dataRegion,
        })
        .returning();
      for (const kind of new Set(dto.kinds)) {
        await tx.insert(PROFILE_TABLES[kind]).values({ orgId: org!.id });
      }
      await this.outbox.add(tx, {
        type: IamEvents.OrgCreated,
        orgId: org!.id,
        actor: userActor(principal.userId),
        requestId: meta.requestId,
        payload: { orgId: org!.id, slug: org!.slug, kinds: org!.kinds },
      });
      const invite = dto.firstAdmin ? await this.addFirstAdmin(tx, org!.id, dto.firstAdmin, principal, meta) : null;
      return { org: org!, invite };
    });
    if (pendingInvite.invite) {
      await this.notifier.sendInvitation({
        ...pendingInvite.invite,
        orgName: pendingInvite.org.name,
        inviterName: null,
      });
    }
    return toOrganization(pendingInvite.org);
  }

  /**
   * An explicit slug must be free (409 otherwise); without one, a free slug is generated from the
   * name. The advisory lock serialises generation so two sign-ups cannot pick the same slug.
   */
  private async resolveSlug(tx: IamTx, requested: string | undefined, name: string): Promise<string> {
    await tx.execute(sql`select pg_advisory_xact_lock(hashtext('iam.org_slugs'))`);
    if (requested) {
      const [taken] = await tx.select({ id: organizations.id }).from(organizations).where(eq(organizations.slug, requested));
      if (taken) throw conflict('slug_taken', 'That organisation address is already in use');
      return requested;
    }
    return pickSlug(name, async (candidates) => {
      const rows = await tx.select({ slug: organizations.slug }).from(organizations).where(inArray(organizations.slug, candidates));
      return new Set(rows.map((r) => r.slug));
    });
  }

  async list(query: { limit: number; cursor?: string; q?: string; kind?: string; status?: 'pending' | 'active' | 'suspended' }) {
    const rows = await this.db.sys
      .select()
      .from(organizations)
      .where(
        and(
          query.cursor ? gt(organizations.id, query.cursor) : undefined,
          query.q ? or(ilike(organizations.name, likeContains(query.q)), ilike(organizations.slug, likeContains(query.q))) : undefined,
          query.status ? eq(organizations.status, query.status) : undefined,
          query.kind ? arrayContains(organizations.kinds, [query.kind]) : undefined,
        ),
      )
      .orderBy(asc(organizations.id))
      .limit(query.limit + 1);
    const page = pageResult(rows, query.limit);
    return { items: page.items.map(toOrganization), nextCursor: page.nextCursor };
  }

  /** Public tenant lookup by subdomain slug. Only active organisations resolve. */
  async names(ids: string[]): Promise<{ id: string; name: string }[]> {
    if (ids.length === 0) return [];
    return this.db.sys.select({ id: organizations.id, name: organizations.name }).from(organizations).where(inArray(organizations.id, ids));
  }

  async resolve(slug: string) {
    const [org] = await this.db.sys
      .select()
      .from(organizations)
      .where(and(eq(organizations.slug, slug), eq(organizations.status, 'active')));
    return org ? toPublicOrganization(org) : null;
  }

  async get(principal: Principal, orgId: string) {
    const org = await this.db.tenant({ orgId, userId: principal.userId }, async (tx) => {
      const [row] = await tx.select().from(organizations).where(eq(organizations.id, orgId));
      return row;
    });
    if (!org) throw notFound('org_not_found', 'Organisation not found');
    return toOrganization(org);
  }

  async update(principal: Principal, orgId: string, dto: UpdateOrg, meta: RequestMeta) {
    if (dto.status && !principal.platformAdmin) {
      throw forbidden('permission_denied', 'Only platform admins can suspend or reactivate organisations');
    }
    const org = await this.db.tenant({ orgId, userId: principal.userId }, async (tx) => {
      const [row] = await tx.update(organizations).set(dto).where(eq(organizations.id, orgId)).returning();
      if (!row) return null;
      await this.outbox.add(tx, {
        type: IamEvents.OrgUpdated,
        orgId,
        actor: userActor(principal.userId),
        requestId: meta.requestId,
        payload: { orgId, slug: row.slug, changed: Object.keys(dto) },
      });
      return row;
    });
    if (!org) throw notFound('org_not_found', 'Organisation not found');
    return toOrganization(org);
  }

  private async addFirstAdmin(
    tx: IamTx,
    orgId: string,
    who: { email?: string; phone?: string },
    principal: Principal,
    meta: RequestMeta,
  ) {
    const [orgAdmin] = await tx.select().from(roles).where(and(eq(roles.key, 'org_admin'), eq(roles.system, true)));
    if (!orgAdmin) throw new Error('System roles are not seeded');
    const user = await this.users.findByEmailOrPhone(who.email ?? null, who.phone ?? null, tx);
    if (user && UsersRepository.isAnyVerified(user)) {
      const [membership] = await tx
        .insert(memberships)
        .values({ id: newId(), userId: user.id, orgId, status: 'active', source: 'bootstrap', joinedAt: new Date() })
        .returning();
      await tx.insert(roleAssignments).values({
        id: newId(),
        orgId,
        membershipId: membership!.id,
        roleId: orgAdmin.id,
        scopeType: 'org',
        grantedByUserId: principal.userId,
      });
      await this.authz.bumpVersion(tx, [user.id]);
      await this.outbox.add(
        tx,
        { type: IamEvents.MemberJoined, orgId, actor: userActor(principal.userId), requestId: meta.requestId, payload: { orgId, membershipId: membership!.id, userId: user.id } },
        { type: IamEvents.RoleGranted, orgId, actor: userActor(principal.userId), requestId: meta.requestId, payload: { orgId, membershipId: membership!.id, userId: user.id, roleKey: 'org_admin', scopeType: 'org' } },
      );
      return null;
    }
    const token = randomToken(32);
    const expiresAt = new Date(Date.now() + this.config.INVITATION_TTL_HOURS * 3600_000);
    const [invitation] = await tx
      .insert(invitations)
      .values({
        id: newId(),
        orgId,
        email: who.email ?? null,
        phone: who.phone ?? null,
        roleKeys: ['org_admin'],
        tokenHash: sha256(token),
        invitedByUserId: principal.userId,
        expiresAt,
      })
      .returning();
    await this.outbox.add(tx, {
      type: IamEvents.MemberInvited,
      orgId,
      actor: userActor(principal.userId),
      requestId: meta.requestId,
      payload: { orgId, invitationId: invitation!.id, roleKeys: ['org_admin'] },
    });
    return {
      channel: who.email ? ('email' as const) : ('sms' as const),
      destination: (who.email ?? who.phone)!,
      acceptUrl: `${this.config.PUBLIC_APP_URL}/invitations/accept?token=${token}`,
      expiresAt,
    };
  }
}
