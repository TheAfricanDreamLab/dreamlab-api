import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { Test } from '@nestjs/testing';
import { isAppRoute, type AppRoute, type AppRouter } from '@ts-rest/core';
import { apiV1Contract, wellKnownContract } from '@dreamlab/contracts';
import { IAM_RPC_QUEUE, RpcAuthzChecker } from '@lib/auth';
import { buildOpenApiDocument, newId, REDIS, sha256 } from '@lib/common';
import type Redis from 'ioredis';
import { loadConfig } from '@lib/config';
import { DATABASE, runMigrations } from '@lib/database';
import { EventEnvelope, processOnce, RabbitConnection } from '@lib/messaging';
import { E2E_GATEWAY_TOKEN, eventually, request, testEnv } from '@lib/testing';
import { and, count, eq, sql } from 'drizzle-orm';
import { Logger } from 'nestjs-pino';
import { IamAppModule } from '../src/app.module';
import { iamConfigSchema } from '../src/config';
import { IamDatabase, iamMigrationsFolder, schema } from '../src/database';
import type { Notifier, OtpMessage } from '../src/modules/notifications/interfaces/notifier.interface';
import { NOTIFIER } from '../src/modules/notifications/notifier.service';
import { installGatewayTrust } from '@lib/common';
import { SeedService } from '../src/modules/seed/seed.service';

/** Headers the gateway adds after resolving a tenant subdomain. */
const viaGateway = (orgId: string) => ({ 'x-tenant-org-id': orgId, 'x-gateway-token': E2E_GATEWAY_TOKEN });

/** Captures outbound messages instead of sending them. */
class CapturingNotifier implements Notifier {
  otps: OtpMessage[] = [];
  invitations: { destination: string; acceptUrl: string }[] = [];
  async sendOtp(m: OtpMessage) {
    this.otps.push(m);
  }
  async sendInvitation(m: { destination: string; acceptUrl: string }) {
    this.invitations.push(m);
  }
  lastCode(destination: string) {
    return [...this.otps].reverse().find((o) => o.destination === destination)?.code;
  }
  lastInviteToken(destination: string) {
    const url = [...this.invitations].reverse().find((i) => i.destination === destination)?.acceptUrl;
    return url ? new URL(url).searchParams.get('token')! : undefined;
  }
}

const consent = { termsVersion: '2026-10', privacyVersion: '2026-10' };
const config = loadConfig(iamConfigSchema, testEnv());

let app: NestFastifyApplication;
let db: IamDatabase;
const notifier = new CapturingNotifier();

/** Register + verify an individual; returns their tokens. */
async function signUp(email: string, tenantOrgId?: string) {
  const reg = await request(app, 'POST', '/v1/auth/register', { body: { email, password: 'correct horse battery', fullName: 'Test User', consent } });
  const res = await request(app, 'POST', '/v1/auth/verify', {
    body: { identifier: email, code: notifier.lastCode(email), registrationToken: (reg.body as { registrationToken: string }).registrationToken },
    headers: tenantOrgId ? viaGateway(tenantOrgId) : {},
  });
  expect(res.status).toBe(200);
  return res.body as { accessToken: string; refreshToken: string; context: { orgId: string | null } };
}

async function orgId(slug: string): Promise<string> {
  const [row] = await db.sys.select({ id: schema.organizations.id }).from(schema.organizations).where(eq(schema.organizations.slug, slug));
  return row!.id;
}

/** Give a user a role at org scope directly in the database (test setup only). */
async function grant(userEmail: string, org: string, roleKey: string): Promise<string> {
  return db.system(async (tx) => {
    const [user] = await tx.select().from(schema.users).where(eq(schema.users.email, userEmail));
    const [role] = await tx.select().from(schema.roles).where(eq(schema.roles.key, roleKey));
    const membershipId = newId();
    await tx.insert(schema.memberships).values({ id: membershipId, userId: user!.id, orgId: org, status: 'active', source: 'import', joinedAt: new Date() });
    await tx.insert(schema.roleAssignments).values({ id: newId(), orgId: org, membershipId, roleId: role!.id, scopeType: 'org' });
    await tx.update(schema.users).set({ authzVersion: sql`authz_version + 1` }).where(eq(schema.users.id, user!.id));
    return membershipId;
  });
}

beforeAll(async () => {
  await runMigrations(config.IAM_MIGRATION_DATABASE_URL!, iamMigrationsFolder());
  const moduleRef = await Test.createTestingModule({ imports: [IamAppModule.forRoot(config)] })
    .overrideProvider(NOTIFIER)
    .useValue(notifier)
    .compile();
  app = moduleRef.createNestApplication<NestFastifyApplication>(new FastifyAdapter({ trustProxy: true }), { bufferLogs: true });
  app.useLogger(app.get(Logger));
  installGatewayTrust(app.getHttpAdapter().getInstance(), config.INTERNAL_GATEWAY_TOKEN);
  app.connectMicroservice<MicroserviceOptions>(
    { transport: Transport.RMQ, options: { urls: [config.RABBITMQ_URL], queue: IAM_RPC_QUEUE, queueOptions: { durable: true } } },
    { inheritAppConfig: true },
  );
  await app.startAllMicroservices();
  await app.init();
  await app.getHttpAdapter().getInstance().ready();
  await app.get(SeedService).run();
  db = app.get(DATABASE);
});

afterAll(async () => {
  await app?.close();
});

// Spec files share Redis and sign people up from the same address; start each test with fresh rate limits.
beforeEach(async () => {
  const redis = app.get<Redis>(REDIS);
  const keys = await redis.keys('iam:rl:*');
  // One key per DEL: the test Redis is clustered like Azure's, and these keys sit in different slots.
  if (keys.length > 0) await keys.reduce((p, k) => p.del(k), redis.pipeline()).exec();
});

describe('contract parity', () => {
  it('serves every IAM route in @dreamlab/contracts, documented in OpenAPI', () => {
    const doc = buildOpenApiDocument(app, { title: 't', description: 'd', version: '0' });
    const routes = (router: AppRouter): AppRoute[] =>
      Object.values(router).flatMap((v) => (isAppRoute(v) ? [v] : routes(v as AppRouter)));
    // Catalog, learning, cohort and grading routes are served by their own services (test/learning-journey.e2e-spec.ts).
    const { catalog: _catalog, learning: _learning, cohorts: _cohorts, grading: _grading, authoring: _authoring, ...iamRoutes } = apiV1Contract;
    const missing = [...routes(iamRoutes as AppRouter), ...routes(wellKnownContract)]
      .map((r) => ({ method: r.method.toLowerCase(), path: r.path.replace(/:(\w+)/g, '{$1}') }))
      .filter((r) => !(doc.paths[r.path] as Record<string, unknown> | undefined)?.[r.method]);
    expect(missing).toEqual([]);
  });
});

describe('authentication', () => {
  it('an individual signs up without any organisation and lands in the personal context', async () => {
    const tokens = await signUp('ada@example.com');
    expect(tokens.context.orgId).toBeNull();
    const me = await request(app, 'GET', '/v1/me', { token: tokens.accessToken });
    expect(me.body).toMatchObject({ memberships: [], platformAdmin: false, user: { emailVerified: true } });
  });

  it('refresh tokens rotate, and reusing one ends the session', async () => {
    const tokens = await signUp('rotate@example.com');
    const first = await request(app, 'POST', '/v1/auth/refresh', { body: { refreshToken: tokens.refreshToken } });
    expect(first.status).toBe(200);
    const newAccess = (first.body as { accessToken: string }).accessToken;

    // A parallel request racing with the same token right away is benign: refused, session kept.
    const race = await request(app, 'POST', '/v1/auth/refresh', { body: { refreshToken: tokens.refreshToken } });
    expect(race.body).toMatchObject({ code: 'refresh_token_superseded' });
    expect((await request(app, 'GET', '/v1/me', { token: newAccess })).status).toBe(200);

    // The same token presented after the grace window means it leaked: the whole session ends.
    const redis = app.get<Redis>(REDIS);
    const usedKey = `iam:rt-used:{${tokens.refreshToken.split('.')[0]}}:${sha256(tokens.refreshToken)}`;
    const used = JSON.parse((await redis.get(usedKey))!) as { sid: string; at: number };
    await redis.set(usedKey, JSON.stringify({ ...used, at: used.at - 60_000 }), 'KEEPTTL');
    const reuse = await request(app, 'POST', '/v1/auth/refresh', { body: { refreshToken: tokens.refreshToken } });
    expect(reuse.body).toMatchObject({ code: 'refresh_token_reused' });
    expect((await request(app, 'GET', '/v1/me', { token: newAccess })).status).toBe(401);
  });

  it('locks an identifier after repeated failures', async () => {
    await signUp('lock@example.com');
    const attempts = [];
    for (let i = 0; i < config.LOGIN_MAX_FAILURES + 1; i++) {
      attempts.push((await request(app, 'POST', '/v1/auth/login', { body: { identifier: 'lock@example.com', password: 'wrong-password' } })).status);
    }
    expect(attempts.slice(0, config.LOGIN_MAX_FAILURES)).toEqual(Array(config.LOGIN_MAX_FAILURES).fill(401));
    expect(attempts.at(-1)).toBe(429);
    const correct = await request(app, 'POST', '/v1/auth/login', { body: { identifier: 'lock@example.com', password: 'correct horse battery' } });
    expect(correct.body).toMatchObject({ code: 'account_locked' });
  });

  it('a password reset ends every session', async () => {
    const tokens = await signUp('reset@example.com');
    await request(app, 'POST', '/v1/auth/otp', { body: { identifier: 'reset@example.com', purpose: 'reset' } });
    const reset = await request(app, 'POST', '/v1/auth/password/reset', {
      body: { identifier: 'reset@example.com', code: notifier.lastCode('reset@example.com'), newPassword: 'a brand new password' },
    });
    expect(reset.status).toBe(204);
    expect((await request(app, 'GET', '/v1/me', { token: tokens.accessToken })).status).toBe(401);
  });

  it('OTP requests answer the same way for unknown accounts', async () => {
    const res = await request(app, 'POST', '/v1/auth/otp', { body: { identifier: 'nobody@example.com', purpose: 'login' } });
    expect(res.status).toBe(202);
    expect(notifier.lastCode('nobody@example.com')).toBeUndefined();
  });

  it('signs in to the tenant the request came through when the user belongs to it', async () => {
    await signUp('member@example.com');
    const dreamlab = await orgId('dreamlab');
    await grant('member@example.com', dreamlab, 'student');
    const login = await request(app, 'POST', '/v1/auth/login', {
      body: { identifier: 'member@example.com', password: 'correct horse battery' },
      headers: viaGateway(dreamlab),
    });
    expect(login.body).toMatchObject({ context: { orgId: dreamlab } });
  });

  it('ignores tenant headers that did not come through the gateway', async () => {
    await signUp('forged@example.com');
    const dreamlab = await orgId('dreamlab');
    await grant('forged@example.com', dreamlab, 'student');
    const login = await request(app, 'POST', '/v1/auth/login', {
      body: { identifier: 'forged@example.com', password: 'correct horse battery' },
      headers: { 'x-tenant-org-id': dreamlab },
    });
    expect(login.body).toMatchObject({ context: { orgId: null } });
  });

  it('signs in on the main site to where the person last worked, and remembers "just me"', async () => {
    await signUp('returning@example.com');
    const dreamlab = await orgId('dreamlab');
    await grant('returning@example.com', dreamlab, 'student');
    // They work in Dream Lab once, through its own site.
    const viaSite = await request(app, 'POST', '/v1/auth/login', {
      body: { identifier: 'returning@example.com', password: 'correct horse battery' },
      headers: viaGateway(dreamlab),
    });
    expect(viaSite.body).toMatchObject({ context: { orgId: dreamlab } });
    const back = await request(app, 'POST', '/v1/auth/login', { body: { identifier: 'returning@example.com', password: 'correct horse battery' } });
    expect(back.body).toMatchObject({ context: { orgId: dreamlab } });
    const personal = await request(app, 'POST', '/v1/auth/switch-org', { token: (back.body as { accessToken: string }).accessToken, body: { orgId: null } });
    expect(personal.body).toMatchObject({ context: { orgId: null } });
    const again = await request(app, 'POST', '/v1/auth/login', { body: { identifier: 'returning@example.com', password: 'correct horse battery' } });
    expect(again.body).toMatchObject({ context: { orgId: null } });
  });

  it('refuses Google sign-in when no client ids are configured', async () => {
    const res = await request(app, 'POST', '/v1/auth/google', { body: { idToken: 'x'.repeat(50) } });
    expect(res.body).toMatchObject({ code: 'google_not_configured' });
  });
});

describe('tenant isolation', () => {
  it('row-level security hides other tenants and blocks cross-tenant writes', async () => {
    const [dreamlab, acme] = [await orgId('dreamlab'), await orgId('acme')];
    await signUp('rls-a@example.com');
    await signUp('rls-b@example.com');
    await grant('rls-a@example.com', dreamlab, 'learner');
    await grant('rls-b@example.com', acme, 'learner');

    const visible = await db.tenant({ orgId: dreamlab }, (tx) => tx.select({ orgId: schema.memberships.orgId }).from(schema.memberships));
    expect(visible.length).toBeGreaterThan(0);
    expect(visible.every((m) => m.orgId === dreamlab)).toBe(true);

    // No tenant context at all: the app role sees nothing.
    const [{ n }] = (await db.app.select({ n: count() }).from(schema.memberships)) as [{ n: number }];
    expect(n).toBe(0);

    const [user] = await db.sys.select().from(schema.users).where(eq(schema.users.email, 'rls-a@example.com'));
    await expect(
      db.tenant({ orgId: dreamlab }, (tx) =>
        tx.insert(schema.memberships).values({ id: newId(), userId: user!.id, orgId: acme, status: 'active', source: 'import' }),
      ),
    ).rejects.toThrow();
  });

  it('an org admin cannot reach another organisation through the API', async () => {
    const [dreamlab, acme] = [await orgId('dreamlab'), await orgId('acme')];
    await signUp('admin-a@example.com');
    await grant('admin-a@example.com', dreamlab, 'org_admin');
    const login = await request(app, 'POST', '/v1/auth/login', {
      body: { identifier: 'admin-a@example.com', password: 'correct horse battery' },
      headers: viaGateway(dreamlab),
    });
    const token = (login.body as { accessToken: string }).accessToken;
    expect((await request(app, 'GET', `/v1/orgs/${dreamlab}/members`, { token })).status).toBe(200);
    expect((await request(app, 'GET', `/v1/orgs/${acme}/members`, { token })).body).toMatchObject({ code: 'org_context_mismatch' });
    const switchToAcme = await request(app, 'POST', '/v1/auth/switch-org', { token, body: { orgId: acme } });
    expect(switchToAcme.body).toMatchObject({ code: 'not_a_member' });
  });
});

describe('messaging', () => {
  it('publishes outbox events to RabbitMQ after the transaction commits', async () => {
    const rabbit = new RabbitConnection(config.RABBITMQ_URL, 'e2e');
    const received: EventEnvelope[] = [];
    const consumer = rabbit.subscribe({ queue: `e2e.${newId()}`, bindings: ['user.registered'], handler: async (e) => void received.push(e) });
    await rabbit.waitForConnect();
    await consumer.waitForConnect(); // queue declared and bound before anything is published
    const registered = await request(app, 'POST', '/v1/auth/register', { body: { email: 'events@example.com', password: 'correct horse battery', fullName: 'Events Person', consent } });
    expect(registered.body).toMatchObject({ userId: expect.any(String) });
    const [user] = await db.sys.select().from(schema.users).where(eq(schema.users.email, 'events@example.com'));
    const row = await eventually(async () => {
      const [r] = await db.sys
        .select()
        .from(schema.outbox)
        .where(and(eq(schema.outbox.type, 'user.registered'), sql`${schema.outbox.envelope}->'payload'->>'userId' = ${user!.id}`));
      return r?.publishedAt ? r : null;
    });
    expect(row!.attempts).toBe(0);
    const event = await eventually(() => received.find((e) => e.type === 'user.registered' && (e.payload as { userId: string }).userId === user!.id));
    expect(event).toMatchObject({ source: 'iam', version: 1, actor: { type: 'user' } });
    await rabbit.close();
  });

  it('the inbox makes a redelivered event take effect exactly once', async () => {
    const eventId = newId();
    let effects = 0;
    const handle = () => processOnce(db, 'e2e-consumer', eventId, async () => void effects++);
    const results = await Promise.allSettled([handle(), handle(), handle()]);
    await handle();
    expect(effects).toBe(1);
    expect(results.filter((r) => r.status === 'fulfilled' && r.value === true)).toHaveLength(1);
  });

  it('answers authorization checks for other services over RPC', async () => {
    const dreamlab = await orgId('dreamlab');
    await signUp('rpc@example.com');
    await grant('rpc@example.com', dreamlab, 'instructor');
    const [user] = await db.sys.select().from(schema.users).where(eq(schema.users.email, 'rpc@example.com'));
    const checker = new RpcAuthzChecker(config.RABBITMQ_URL, null);
    const base = { userId: user!.id, orgId: dreamlab, authzVersion: user!.authzVersion };
    await expect(checker.check({ ...base, permission: 'submission.grade' })).resolves.toBe(true);
    await expect(checker.check({ ...base, permission: 'org.members.invite' })).resolves.toBe(false);
    await checker.close();
  });
});

describe('directory', () => {
  it('invitation → accept → scoped unit admin, end to end', async () => {
    const platform = await request(app, 'POST', '/v1/auth/login', {
      body: { identifier: 'admin@theafricandreamlab.com', password: 'e2e-admin-password' },
    });
    const adminToken = (platform.body as { accessToken: string }).accessToken;
    await signUp('owner@example.com');
    const created = await request(app, 'POST', '/v1/orgs', {
      token: adminToken,
      body: { slug: 'e2e-corp', name: 'E2E Corp', kinds: ['enterprise'], firstAdmin: { email: 'owner@example.com' } },
    });
    expect(created.status).toBe(201);
    const corp = (created.body as { id: string }).id;
    const owner = await request(app, 'POST', '/v1/auth/login', {
      body: { identifier: 'owner@example.com', password: 'correct horse battery' },
      headers: viaGateway(corp),
    });
    const ownerToken = (owner.body as { accessToken: string }).accessToken;

    const sales = (await request(app, 'POST', `/v1/orgs/${corp}/units`, { token: ownerToken, body: { name: 'Sales' } })).body as { id: string };
    const lagos = (await request(app, 'POST', `/v1/orgs/${corp}/units`, { token: ownerToken, body: { name: 'Lagos', parentUnitId: sales.id } }))
      .body as { id: string; path: string[] };
    expect(lagos.path).toEqual([sales.id, lagos.id]);

    await request(app, 'POST', `/v1/orgs/${corp}/invitations`, { token: ownerToken, body: { email: 'lead@example.com', roleKeys: ['learner'], orgUnitId: sales.id } });
    const lead = await signUp('lead@example.com');
    const accepted = await request(app, 'POST', '/v1/invitations/accept', { token: lead.accessToken, body: { token: notifier.lastInviteToken('lead@example.com') } });
    expect(accepted.body).toMatchObject({ status: 'active', orgUnitId: sales.id });
    const leadMembership = (accepted.body as { id: string }).id;

    // The invitation page can tell who it is for.
    const invToken = notifier.lastInviteToken('lead@example.com')!;
    expect((await request(app, 'POST', '/v1/invitations/preview', { body: { token: invToken } })).body).toMatchObject({ accountExists: true, matchesSignedInUser: null });
    expect((await request(app, 'POST', '/v1/invitations/preview', { token: lead.accessToken, body: { token: invToken } })).body).toMatchObject({ matchesSignedInUser: true });
    // Someone else cannot use the same invitation.
    const stranger = await signUp('stranger@example.com');
    const stolen = await request(app, 'POST', '/v1/invitations/accept', { token: stranger.accessToken, body: { token: notifier.lastInviteToken('lead@example.com') } });
    expect(stolen.status).toBe(409);
    expect((await request(app, 'POST', '/v1/invitations/preview', { token: stranger.accessToken, body: { token: invToken } })).body).toMatchObject({ matchesSignedInUser: false });

    await request(app, 'POST', `/v1/orgs/${corp}/members/${leadMembership}/roles`, {
      token: ownerToken,
      body: { roleKey: 'unit_admin', scopeType: 'org_unit', scopeId: sales.id },
    });
    const leadInCorp = await request(app, 'POST', '/v1/auth/switch-org', { token: lead.accessToken, body: { orgId: corp } });
    const leadToken = (leadInCorp.body as { accessToken: string }).accessToken;

    // The unit admin manages Sales (and Lagos below it) but not the rest of the org.
    const list = await request(app, 'GET', `/v1/orgs/${corp}/members`, { token: leadToken });
    expect(list.status).toBe(200);
    expect((list.body as { items: { orgUnitId: string }[] }).items.every((m) => m.orgUnitId === sales.id)).toBe(true);
    const inviteLagos = await request(app, 'POST', `/v1/orgs/${corp}/invitations`, {
      token: leadToken,
      body: { email: 'rep@example.com', roleKeys: ['learner'], orgUnitId: lagos.id },
    });
    expect(inviteLagos.status).toBe(201);
    const inviteOrgWide = await request(app, 'POST', `/v1/orgs/${corp}/invitations`, { token: leadToken, body: { email: 'x@example.com' } });
    expect(inviteOrgWide.status).toBe(403);
    const escalate = await request(app, 'POST', `/v1/orgs/${corp}/invitations`, {
      token: leadToken,
      body: { email: 'y@example.com', roleKeys: ['org_admin'], orgUnitId: lagos.id },
    });
    expect(escalate.status).toBe(403);

    const [{ n }] = (await db.sys
      .select({ n: count() })
      .from(schema.outbox)
      .where(and(eq(schema.outbox.orgId, corp), eq(schema.outbox.type, 'role.granted')))) as [{ n: number }];
    expect(n).toBeGreaterThanOrEqual(2);
  });
});

describe('organisation sign-up', () => {
  const signUpOrg = (token: string, body: object) => request(app, 'POST', '/v1/orgs/signup', { token, body });
  const switchTo = async (token: string, orgId: string) =>
    ((await request(app, 'POST', '/v1/auth/switch-org', { token, body: { orgId } })).body as { accessToken: string }).accessToken;

  it('an enterprise signs up and is live at once, with the founder as org admin', async () => {
    const founder = await signUp('founder@acme-two.com');
    const res = await signUpOrg(founder.accessToken, { slug: 'acme-two', name: 'Acme Two', kind: 'enterprise', profile: { sizeBand: '51-200' } });
    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ status: 'active', kinds: ['enterprise'] });
    const org = (res.body as { id: string }).id;
    expect((await request(app, 'GET', '/v1/orgs/resolve/acme-two')).status).toBe(200);
    const token = await switchTo(founder.accessToken, org);
    expect((await request(app, 'POST', `/v1/orgs/${org}/invitations`, { token, body: { email: 'staff@acme-two.com' } })).status).toBe(201);
  });

  it('an institution waits for approval: set-up allowed, not live', async () => {
    const dean = await signUp('dean@uni.example');
    const res = await signUpOrg(dean.accessToken, { slug: 'lagos-uni', name: 'Lagos University', kind: 'institution' });
    expect(res.body).toMatchObject({ status: 'pending' });
    const org = (res.body as { id: string }).id;
    expect((await request(app, 'GET', '/v1/orgs/resolve/lagos-uni')).status).toBe(404);

    const token = await switchTo(dean.accessToken, org);
    expect((await request(app, 'POST', `/v1/orgs/${org}/units`, { token, body: { name: 'Faculty of Science' } })).status).toBe(201);
    expect((await request(app, 'POST', `/v1/orgs/${org}/invitations`, { token, body: { email: 'student@uni.example' } })).body).toMatchObject({
      code: 'org_pending',
    });
    expect(
      (await request(app, 'POST', `/v1/orgs/${org}/invitations`, { token, body: { email: 'registrar@uni.example', roleKeys: ['org_admin'] } })).status,
    ).toBe(201);
    expect((await request(app, 'PATCH', `/v1/orgs/${org}`, { token, body: { status: 'active' } })).status).toBe(403);

    const admin = await request(app, 'POST', '/v1/auth/login', { body: { identifier: 'admin@theafricandreamlab.com', password: 'e2e-admin-password' } });
    const adminToken = (admin.body as { accessToken: string }).accessToken;
    const pending = await request(app, 'GET', '/v1/orgs?status=pending', { token: adminToken });
    expect((pending.body as { items: { id: string }[] }).items.map((o) => o.id)).toContain(org);
    expect((await request(app, 'PATCH', `/v1/orgs/${org}`, { token: adminToken, body: { status: 'active' } })).body).toMatchObject({ status: 'active' });
    expect((await request(app, 'GET', '/v1/orgs/resolve/lagos-uni')).status).toBe(200);
    expect((await request(app, 'POST', `/v1/orgs/${org}/invitations`, { token, body: { email: 'student@uni.example' } })).status).toBe(201);
  });

  it('rejects reserved and taken names', async () => {
    const user = await signUp('reserved@example.com');
    expect((await signUpOrg(user.accessToken, { slug: 'api', name: 'API', kind: 'enterprise' })).status).toBe(400);
    expect((await signUpOrg(user.accessToken, { slug: 'acme-two', name: 'Dup', kind: 'enterprise' })).body).toMatchObject({ code: 'slug_taken' });
  });

  it('a removed admin loses access at once, before their token expires', async () => {
    const owner = await signUp('owner2@corp.example');
    const org = ((await signUpOrg(owner.accessToken, { slug: 'corp-two', name: 'Corp Two', kind: 'enterprise' })).body as { id: string }).id;
    const ownerToken = await switchTo(owner.accessToken, org);
    const second = await signUp('second@corp.example');
    await request(app, 'POST', `/v1/orgs/${org}/invitations`, { token: ownerToken, body: { email: 'second@corp.example', roleKeys: ['org_admin'] } });
    const joined = await request(app, 'POST', '/v1/invitations/accept', { token: second.accessToken, body: { token: notifier.lastInviteToken('second@corp.example') } });
    const roles = (joined.body as { roles: { id: string; roleKey: string }[] }).roles;
    const secondToken = await switchTo(second.accessToken, org);
    expect((await request(app, 'GET', `/v1/orgs/${org}/members`, { token: secondToken })).status).toBe(200);

    const assignment = roles.find((r) => r.roleKey === 'org_admin')!;
    expect((await request(app, 'DELETE', `/v1/orgs/${org}/role-assignments/${assignment.id}`, { token: ownerToken })).status).toBe(204);
    // Same unexpired token: its org_admin claim is stale now, so IAM is asked and says no.
    expect((await request(app, 'GET', `/v1/orgs/${org}/members`, { token: secondToken })).status).toBe(403);
  });
});

describe('organisation slugs', () => {
  it('generates a free slug from the name when none is given', async () => {
    const user = await signUp('slugs@example.com');
    const first = await request(app, 'POST', '/v1/orgs/signup', { token: user.accessToken, body: { name: 'Kano Coding Club', kind: 'enterprise' } });
    const second = await request(app, 'POST', '/v1/orgs/signup', { token: user.accessToken, body: { name: 'Kano Coding Club', kind: 'enterprise' } });
    expect(first.body).toMatchObject({ slug: 'kano-coding-club' });
    expect(second.body).toMatchObject({ slug: 'kano-coding-club-2' });
    const explicit = await request(app, 'POST', '/v1/orgs/signup', {
      token: user.accessToken,
      body: { slug: 'kano-coding-club', name: 'Copycat', kind: 'enterprise' },
    });
    expect(explicit.body).toMatchObject({ code: 'slug_taken' });
  });
});

describe('invitation preview', () => {
  it('shows what the invitee is joining without signing in, and hides the full address', async () => {
    const owner = await signUp('preview-owner@example.com');
    const org = ((await request(app, 'POST', '/v1/orgs/signup', { token: owner.accessToken, body: { name: 'Preview Labs', kind: 'enterprise' } })).body as { id: string }).id;
    const token = ((await request(app, 'POST', '/v1/auth/switch-org', { token: owner.accessToken, body: { orgId: org } })).body as { accessToken: string }).accessToken;
    await request(app, 'POST', `/v1/orgs/${org}/invitations`, { token, body: { email: 'joiner@example.com', roleKeys: ['analyst'] } });
    const preview = await request(app, 'POST', '/v1/invitations/preview', { body: { token: notifier.lastInviteToken('joiner@example.com') } });
    expect(preview.status).toBe(200);
    expect(preview.body).toMatchObject({
      organization: { name: 'Preview Labs', slug: 'preview-labs' },
      roles: [{ key: 'analyst', name: 'Analyst' }],
      invitedBy: 'Test User',
      channel: 'email',
      destination: 'j***@example.com',
      status: 'pending',
    });
    expect((await request(app, 'POST', '/v1/invitations/preview', { body: { token: 'x'.repeat(43) } })).status).toBe(404);
  });
});
