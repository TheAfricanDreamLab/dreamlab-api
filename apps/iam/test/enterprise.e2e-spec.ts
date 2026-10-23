import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { Test } from '@nestjs/testing';
import { REDIS } from '@lib/common';
import { loadConfig } from '@lib/config';
import { DATABASE, runMigrations } from '@lib/database';
import { E2E_GATEWAY_TOKEN, request, testEnv } from '@lib/testing';
import { eq } from 'drizzle-orm';
import { exportJWK, exportPKCS8, generateKeyPair, KeyLike, SignJWT } from 'jose';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { createServer, Server } from 'node:http';
import { AddressInfo } from 'node:net';
import { tmpdir } from 'node:os';
import type Redis from 'ioredis';
import { join } from 'node:path';
import { inflateRawSync } from 'node:zlib';
import { Logger } from 'nestjs-pino';
import { SignedXml } from 'xml-crypto';
import { IamAppModule } from '../src/app.module';
import { iamConfigSchema } from '../src/config';
import { IamDatabase, iamMigrationsFolder, schema } from '../src/database';
import { installGatewayTrust } from '@lib/common';
import { totp } from '../src/modules/auth/utils/totp';
import { TXT_LOOKUP } from '../src/modules/domains/domains.service';
import { verificationRecordName } from '../src/modules/domains/utils/dns-txt';
import type { Notifier, OtpMessage } from '../src/modules/notifications/interfaces/notifier.interface';
import { NOTIFIER } from '../src/modules/notifications/notifier.service';
import { SeedService } from '../src/modules/seed/seed.service';

/** Enterprise identity: domains (IAM-14), OIDC and SAML sign-on (15, 16), SCIM (17), custom roles (18), MFA (19), WhatsApp codes (20). */

class CapturingNotifier implements Notifier {
  otps: OtpMessage[] = [];
  async sendOtp(m: OtpMessage) {
    this.otps.push(m);
  }
  async sendInvitation() {}
  last(destination: string) {
    return [...this.otps].reverse().find((o) => o.destination === destination);
  }
}

const consent = { termsVersion: '2026-10', privacyVersion: '2026-10' };
const APP = 'http://app.test';
const config = loadConfig(iamConfigSchema, testEnv({ SSO_ALLOW_PRIVATE_URLS: 'true', PUBLIC_APP_URL: APP, PUBLIC_API_URL: 'http://api.test' }));
const notifier = new CapturingNotifier();
/** Fake DNS: TXT records the test publishes. */
const dns = new Map<string, string[][]>();

let app: NestFastifyApplication;
let db: IamDatabase;

type Tokens = { accessToken: string; refreshToken: string; context: { orgId: string | null } };
const claims = (token: string) => JSON.parse(Buffer.from(token.split('.')[1]!, 'base64url').toString()) as Record<string, unknown>;

async function signUp(email: string): Promise<Tokens> {
  const reg = await request(app, 'POST', '/v1/auth/register', { body: { email, password: 'correct horse battery', fullName: 'Test Person', consent } });
  const registrationToken = (reg.body as { registrationToken: string }).registrationToken;
  const res = await request(app, 'POST', '/v1/auth/verify', { body: { identifier: email, code: notifier.last(email)!.code, registrationToken } });
  expect(res.status).toBe(200);
  return res.body as Tokens;
}

/** Sign up a founder and an enterprise; returns tokens in the new org's context. */
async function enterprise(founder: string, name: string): Promise<{ orgId: string; tokens: Tokens }> {
  const personal = await signUp(founder);
  const org = await request(app, 'POST', '/v1/orgs/signup', { token: personal.accessToken, body: { name, kind: 'enterprise' } });
  expect(org.status).toBe(201);
  const orgId = (org.body as { id: string }).id;
  const tokens = (await request(app, 'POST', '/v1/auth/switch-org', { token: personal.accessToken, body: { orgId } })).body as Tokens;
  return { orgId, tokens };
}

async function verifiedDomain(orgId: string, token: string, domain: string): Promise<string> {
  const added = await request(app, 'POST', `/v1/orgs/${orgId}/domains`, { token, body: { domain } });
  expect(added.status).toBe(201);
  const d = added.body as { id: string; verification: { recordName: string; recordValue: string } };
  dns.set(d.verification.recordName, [[d.verification.recordValue]]);
  const verified = await request(app, 'POST', `/v1/orgs/${orgId}/domains/${d.id}/verify`, { token });
  expect(verified.body).toMatchObject({ verified: true });
  return d.id;
}

beforeAll(async () => {
  await runMigrations(config.IAM_MIGRATION_DATABASE_URL!, iamMigrationsFolder());
  const moduleRef = await Test.createTestingModule({ imports: [IamAppModule.forRoot(config)] })
    .overrideProvider(NOTIFIER)
    .useValue(notifier)
    .overrideProvider(TXT_LOOKUP)
    .useValue(async (name: string) => dns.get(name) ?? [])
    .compile();
  app = moduleRef.createNestApplication<NestFastifyApplication>(new FastifyAdapter({ trustProxy: true }), { bufferLogs: true });
  app.useLogger(app.get(Logger));
  installGatewayTrust(app.getHttpAdapter().getInstance(), config.INTERNAL_GATEWAY_TOKEN);
  await app.init();
  await app.getHttpAdapter().getInstance().ready();
  await app.get(SeedService).run();
  db = app.get(DATABASE);
});

afterAll(async () => {
  await app?.close();
});

// Every spec signs people up from the same address; start each test with fresh rate limits.
beforeEach(async () => {
  const redis = app.get<Redis>(REDIS);
  const keys = await redis.keys('iam:rl:*');
  // One key per DEL: the test Redis is clustered like Azure's, and these keys sit in different slots.
  if (keys.length > 0) await keys.reduce((p, k) => p.del(k), redis.pipeline()).exec();
});

describe('email domains and joining (IAM-14)', () => {
  it('verifies a domain through DNS; only one organisation can hold it', async () => {
    const { orgId, tokens } = await enterprise('founder@initech.test', 'Initech');
    const pub = await request(app, 'POST', `/v1/orgs/${orgId}/domains`, { token: tokens.accessToken, body: { domain: 'gmail.com' } });
    expect(pub.body).toMatchObject({ code: 'domain_public' });

    const added = await request(app, 'POST', `/v1/orgs/${orgId}/domains`, { token: tokens.accessToken, body: { domain: 'Initech.TEST' } });
    expect(added.body).toMatchObject({ domain: 'initech.test', verified: false, verification: { recordType: 'TXT', recordName: verificationRecordName('initech.test') } });
    const id = (added.body as { id: string }).id;
    const missing = await request(app, 'POST', `/v1/orgs/${orgId}/domains/${id}/verify`, { token: tokens.accessToken });
    expect(missing.body).toMatchObject({ code: 'domain_record_missing' });
    dns.set(verificationRecordName('initech.test'), [[(added.body as { verification: { recordValue: string } }).verification.recordValue]]);
    expect((await request(app, 'POST', `/v1/orgs/${orgId}/domains/${id}/verify`, { token: tokens.accessToken })).body).toMatchObject({ verified: true });

    // A squatter can claim it unverified, but cannot verify it once Initech holds it.
    const rival = await enterprise('rival@rival.test', 'Rival');
    const claim = await request(app, 'POST', `/v1/orgs/${rival.orgId}/domains`, { token: rival.tokens.accessToken, body: { domain: 'initech.test' } });
    expect(claim.status).toBe(409);
    expect(claim.body).toMatchObject({ code: 'domain_taken' });
  });

  it('people at a verified domain join at once (auto) or ask to join (request)', async () => {
    const { orgId, tokens } = await enterprise('founder@hooli.test', 'Hooli');
    const domainId = await verifiedDomain(orgId, tokens.accessToken, 'hooli.test');
    await request(app, 'PATCH', `/v1/orgs/${orgId}/domains/${domainId}`, { token: tokens.accessToken, body: { joinPolicy: 'request' } });

    const gavin = await signUp('gavin@hooli.test');
    const offers = await request(app, 'GET', '/v1/me/joinable-orgs', { token: gavin.accessToken });
    expect(offers.body).toMatchObject({ items: [{ org: { id: orgId }, joinPolicy: 'request', domain: 'hooli.test' }] });
    const asked = await request(app, 'POST', `/v1/orgs/${orgId}/join`, { token: gavin.accessToken });
    expect(asked.body).toMatchObject({ status: 'requested' });
    const pending = await request(app, 'GET', `/v1/orgs/${orgId}/members?status=requested`, { token: tokens.accessToken });
    expect((pending.body as { items: unknown[] }).items).toHaveLength(1);

    await request(app, 'PATCH', `/v1/orgs/${orgId}/domains/${domainId}`, { token: tokens.accessToken, body: { joinPolicy: 'auto' } });
    const peter = await signUp('peter@hooli.test');
    const joined = await request(app, 'POST', `/v1/orgs/${orgId}/join`, { token: peter.accessToken });
    expect(joined.body).toMatchObject({ status: 'active' });
    const inOrg = await request(app, 'POST', '/v1/auth/switch-org', { token: peter.accessToken, body: { orgId } });
    expect(claims((inOrg.body as Tokens).accessToken).roles).toEqual(['learner']);

    // Someone with another address cannot.
    const outsider = await signUp('outsider@elsewhere.test');
    expect((await request(app, 'POST', `/v1/orgs/${orgId}/join`, { token: outsider.accessToken })).body).toMatchObject({ code: 'join_not_allowed' });
  });
});

describe('custom roles (IAM-18)', () => {
  it('an organisation defines a role; holders get exactly its permissions, and changes apply at once', async () => {
    const { orgId, tokens } = await enterprise('founder@umbrella.test', 'Umbrella');
    const bad = await request(app, 'POST', `/v1/orgs/${orgId}/roles`, { token: tokens.accessToken, body: { name: 'Root', permissions: ['platform.orgs.manage'] } });
    // The contract refuses platform permissions and built-in keys before the service sees them.
    expect(bad.body).toMatchObject({ code: 'validation_failed' });
    const reserved = await request(app, 'POST', `/v1/orgs/${orgId}/roles`, { token: tokens.accessToken, body: { key: 'org_admin', name: 'Admin', permissions: ['org.read'] } });
    expect(reserved.body).toMatchObject({ code: 'validation_failed' });

    const role = await request(app, 'POST', `/v1/orgs/${orgId}/roles`, {
      token: tokens.accessToken,
      body: { name: 'Regional lead', permissions: ['org.read', 'org.members.read'] },
    });
    expect(role.body).toMatchObject({ key: 'regional_lead', system: false });

    // Invite someone straight into the custom role.
    const lead = await signUp('lead@umbrella-people.test');
    const inv = await request(app, 'POST', `/v1/orgs/${orgId}/invitations`, { token: tokens.accessToken, body: { email: 'lead@umbrella-people.test', roleKeys: ['regional_lead'] } });
    expect(inv.status).toBe(201);
    const [invitation] = await db.sys.select().from(schema.invitations).where(eq(schema.invitations.orgId, orgId));
    expect(invitation!.roleKeys).toEqual(['regional_lead']);
    const membershipId = await db.system(async (tx) => {
      const [u] = await tx.select().from(schema.users).where(eq(schema.users.email, 'lead@umbrella-people.test'));
      const [r] = await tx.select().from(schema.roles).where(eq(schema.roles.key, 'regional_lead'));
      const id = crypto.randomUUID();
      await tx.insert(schema.memberships).values({ id, userId: u!.id, orgId, status: 'active', source: 'invite', joinedAt: new Date() });
      await tx.insert(schema.roleAssignments).values({ id: crypto.randomUUID(), orgId, membershipId: id, roleId: r!.id, scopeType: 'org' });
      return id;
    });
    void membershipId;
    const leadInOrg = (await request(app, 'POST', '/v1/auth/switch-org', { token: lead.accessToken, body: { orgId } })).body as Tokens;
    expect(claims(leadInOrg.accessToken).roles).toEqual(['regional_lead']);
    expect((await request(app, 'GET', `/v1/orgs/${orgId}/members`, { token: leadInOrg.accessToken })).status).toBe(200);
    expect((await request(app, 'GET', '/v1/me', { token: leadInOrg.accessToken })).body).toMatchObject({ permissions: ['org.members.read', 'org.read'] });
    expect((await request(app, 'POST', `/v1/orgs/${orgId}/invitations`, { token: leadInOrg.accessToken, body: { email: 'x@y.test' } })).status).toBe(403);

    // Narrow the role: the same token loses access straight away.
    await request(app, 'PATCH', `/v1/orgs/${orgId}/roles/regional_lead`, { token: tokens.accessToken, body: { permissions: ['org.read'] } });
    expect((await request(app, 'GET', `/v1/orgs/${orgId}/members`, { token: leadInOrg.accessToken })).status).toBe(403);

    expect((await request(app, 'DELETE', `/v1/orgs/${orgId}/roles/regional_lead`, { token: tokens.accessToken })).body).toMatchObject({ code: 'role_in_use' });
    const list = await request(app, 'GET', `/v1/orgs/${orgId}/roles`, { token: tokens.accessToken });
    expect((list.body as { items: { key: string; assignedCount: number }[] }).items.find((r) => r.key === 'regional_lead')).toMatchObject({ assignedCount: 1 });
  });
});

describe('authenticator apps (IAM-19)', () => {
  const email = 'mfa@mfa-corp.test';
  let secret = '';
  let recovery: string[] = [];

  it('adds an authenticator app; sign-in then needs a code, used once', async () => {
    const first = await signUp(email);
    const setup = await request(app, 'POST', '/v1/auth/mfa/totp/setup', { token: first.accessToken, body: {} });
    secret = (setup.body as { secret: string; otpauthUrl: string }).secret;
    expect((setup.body as { otpauthUrl: string }).otpauthUrl).toContain('otpauth://totp/');
    expect((await request(app, 'POST', '/v1/auth/mfa/totp/confirm', { token: first.accessToken, body: { code: '000000' } })).status).toBe(400);
    const confirmed = await request(app, 'POST', '/v1/auth/mfa/totp/confirm', { token: first.accessToken, body: { code: totp(secret, Date.now() - 30_000) } });
    recovery = (confirmed.body as { recoveryCodes: string[] }).recoveryCodes;
    expect(recovery).toHaveLength(10);

    const login = await request(app, 'POST', '/v1/auth/login', { body: { identifier: email, password: 'correct horse battery' } });
    expect(login.body).toMatchObject({ mfaRequired: true, methods: ['totp', 'recovery_code'] });
    expect(login.body).not.toHaveProperty('accessToken');
    const mfaToken = (login.body as { mfaToken: string }).mfaToken;
    expect((await request(app, 'POST', '/v1/auth/mfa/verify', { body: { mfaToken, code: '123456' } })).body).toMatchObject({ code: 'mfa_code_invalid' });
    const code = totp(secret);
    const done = await request(app, 'POST', '/v1/auth/mfa/verify', { body: { mfaToken, code } });
    expect(done.status).toBe(200);
    expect(claims((done.body as Tokens).accessToken).amr).toEqual(['pwd', 'mfa']);
    // The challenge is single-use, and so is the code.
    expect((await request(app, 'POST', '/v1/auth/mfa/verify', { body: { mfaToken, code } })).status).toBe(401);
    const again = await request(app, 'POST', '/v1/auth/login', { body: { identifier: email, password: 'correct horse battery' } });
    const replay = await request(app, 'POST', '/v1/auth/mfa/verify', { body: { mfaToken: (again.body as { mfaToken: string }).mfaToken, code } });
    expect(replay.body).toMatchObject({ code: 'mfa_code_invalid' });
  });

  it('a recovery code works once', async () => {
    const login = await request(app, 'POST', '/v1/auth/login', { body: { identifier: email, password: 'correct horse battery' } });
    const mfaToken = (login.body as { mfaToken: string }).mfaToken;
    expect((await request(app, 'POST', '/v1/auth/mfa/verify', { body: { mfaToken, code: recovery[0]!.toUpperCase() } })).status).toBe(200);
    const second = await request(app, 'POST', '/v1/auth/login', { body: { identifier: email, password: 'correct horse battery' } });
    const reuse = await request(app, 'POST', '/v1/auth/mfa/verify', { body: { mfaToken: (second.body as { mfaToken: string }).mfaToken, code: recovery[0] } });
    expect(reuse.body).toMatchObject({ code: 'mfa_code_invalid' });
  });

  it('an organisation can require MFA for admin actions; reading stays open', async () => {
    const { orgId, tokens } = await enterprise('boss@mfa-required.test', 'Strict Ltd');
    // You cannot require what you have not passed yourself.
    expect((await request(app, 'PATCH', `/v1/orgs/${orgId}/security`, { token: tokens.accessToken, body: { requireAdminMfa: true } })).body).toMatchObject({ code: 'mfa_needed_first' });

    const setup = await request(app, 'POST', '/v1/auth/mfa/totp/setup', { token: tokens.accessToken, body: {} });
    const s = (setup.body as { secret: string }).secret;
    await request(app, 'POST', '/v1/auth/mfa/totp/confirm', { token: tokens.accessToken, body: { code: totp(s) } });
    const stepped = (await request(app, 'POST', '/v1/auth/mfa/step-up', { token: tokens.accessToken, body: { code: totp(s, Date.now() + 30_000) } })).body as Tokens;
    expect(claims(stepped.accessToken).amr).toContain('mfa');
    expect((await request(app, 'PATCH', `/v1/orgs/${orgId}/security`, { token: stepped.accessToken, body: { requireAdminMfa: true } })).body).toEqual({ requireAdminMfa: true });

    // A co-admin without MFA can read but not manage.
    const co = await signUp('coadmin@mfa-required.test');
    await db.system(async (tx) => {
      const [u] = await tx.select().from(schema.users).where(eq(schema.users.email, 'coadmin@mfa-required.test'));
      const [r] = await tx.select().from(schema.roles).where(eq(schema.roles.key, 'org_admin'));
      const id = crypto.randomUUID();
      await tx.insert(schema.memberships).values({ id, userId: u!.id, orgId, status: 'active', source: 'invite', joinedAt: new Date() });
      await tx.insert(schema.roleAssignments).values({ id: crypto.randomUUID(), orgId, membershipId: id, roleId: r!.id, scopeType: 'org' });
    });
    const coInOrg = (await request(app, 'POST', '/v1/auth/switch-org', { token: co.accessToken, body: { orgId } })).body as Tokens;
    expect(claims(coInOrg.accessToken).mfr).toBe(true);
    expect((await request(app, 'GET', `/v1/orgs/${orgId}/members`, { token: coInOrg.accessToken })).status).toBe(200);
    expect((await request(app, 'POST', `/v1/orgs/${orgId}/invitations`, { token: coInOrg.accessToken, body: { email: 'new@person.test' } })).body).toMatchObject({ code: 'mfa_required' });
  });
});

describe('single sign-on with OIDC (IAM-15)', () => {
  let idp: Server;
  let issuer = '';
  const codes = new Map<string, { sub: string; email: string; name: string; nonce: string; challenge: string }>();
  let signingKey: KeyLike;

  beforeAll(async () => {
    const { publicKey, privateKey } = await generateKeyPair('RS256');
    signingKey = privateKey;
    const jwk = { ...(await exportJWK(publicKey)), kid: 'k1', alg: 'RS256', use: 'sig' };
    idp = createServer((req, res) => {
      const send = (status: number, body: unknown) => {
        res.writeHead(status, { 'content-type': 'application/json' }).end(JSON.stringify(body));
      };
      if (req.url === '/.well-known/openid-configuration') {
        return send(200, { issuer, authorization_endpoint: `${issuer}/authorize`, token_endpoint: `${issuer}/token`, jwks_uri: `${issuer}/jwks`, token_endpoint_auth_methods_supported: ['client_secret_basic'] });
      }
      if (req.url === '/jwks') return send(200, { keys: [jwk] });
      if (req.url === '/token' && req.method === 'POST') {
        let raw = '';
        req.on('data', (c: Buffer) => (raw += c.toString()));
        req.on('end', () => {
          void (async () => {
            if (req.headers.authorization !== `Basic ${Buffer.from('dreamlab:s3cret').toString('base64')}`) return send(401, { error: 'invalid_client' });
            const body = new URLSearchParams(raw);
            const grant = codes.get(body.get('code') ?? '');
            const verifier = body.get('code_verifier') ?? '';
            if (!grant || createHash('sha256').update(verifier).digest('base64url') !== grant.challenge) return send(400, { error: 'invalid_grant' });
            const idToken = await new SignJWT({ email: grant.email, name: grant.name, nonce: grant.nonce })
              .setProtectedHeader({ alg: 'RS256', kid: 'k1' })
              .setIssuer(issuer)
              .setAudience('dreamlab')
              .setSubject(grant.sub)
              .setIssuedAt()
              .setExpirationTime('5m')
              .sign(signingKey);
            send(200, { id_token: idToken, access_token: 'x', token_type: 'Bearer' });
          })();
        });
        return;
      }
      send(404, {});
    });
    await new Promise<void>((r) => idp.listen(0, '127.0.0.1', r));
    issuer = `http://127.0.0.1:${(idp.address() as AddressInfo).port}`;
  });

  afterAll(() => idp?.close());

  /** What the browser does: follow the redirect, sign in at the IdP, come back with a code. */
  function idpSignsIn(redirectUrl: string, who: { sub: string; email: string; name: string }) {
    const url = new URL(redirectUrl);
    expect(url.searchParams.get('code_challenge_method')).toBe('S256');
    const code = `code-${Math.random()}`;
    codes.set(code, { ...who, nonce: url.searchParams.get('nonce')!, challenge: url.searchParams.get('code_challenge')! });
    return { state: url.searchParams.get('state')!, code };
  }

  it('an admin connects, tests and enforces OIDC; people sign in and join; passwords are refused', async () => {
    const { orgId, tokens } = await enterprise('it@wayne.test', 'Wayne Enterprises');
    const early = await request(app, 'PUT', `/v1/orgs/${orgId}/sso`, { token: tokens.accessToken, body: { protocol: 'oidc', issuer, clientId: 'dreamlab', clientSecret: 's3cret' } });
    expect(early.body).toMatchObject({ code: 'domain_required' });
    await verifiedDomain(orgId, tokens.accessToken, 'wayne.test');

    const saved = await request(app, 'PUT', `/v1/orgs/${orgId}/sso`, { token: tokens.accessToken, body: { protocol: 'oidc', issuer, clientId: 'dreamlab', clientSecret: 's3cret' } });
    expect(saved.body).toMatchObject({ protocol: 'oidc', enabled: false, enforced: false, testedAt: null, oidc: { issuer, clientId: 'dreamlab', hasClientSecret: true } });
    expect(JSON.stringify(saved.body)).not.toContain('s3cret');
    const settings = await request(app, 'GET', `/v1/orgs/${orgId}/sso`, { token: tokens.accessToken });
    expect(settings.body).toMatchObject({ serviceProvider: { oidcRedirectUri: `${APP}/sso/oidc/callback` } });

    expect((await request(app, 'PATCH', `/v1/orgs/${orgId}/sso`, { token: tokens.accessToken, body: { enabled: true, enforced: true } })).body).toMatchObject({ code: 'sso_untested' });

    // Test sign-on as the admin: nothing is created, the connection is marked tested.
    const anon = await request(app, 'POST', '/v1/auth/sso/start', { body: { orgId, mode: 'test' } });
    expect(anon.status).toBe(403);
    const test = await request(app, 'POST', '/v1/auth/sso/start', { token: tokens.accessToken, body: { orgId, mode: 'test' } });
    const t = idpSignsIn((test.body as { redirectUrl: string }).redirectUrl, { sub: 'it-1', email: 'it@wayne.test', name: 'IT' });
    const tested = await request(app, 'POST', '/v1/auth/sso/oidc/callback', { body: t });
    expect(tested.body).toMatchObject({ kind: 'test', orgId, email: 'it@wayne.test' });
    expect((await request(app, 'POST', '/v1/auth/sso/oidc/callback', { body: t })).body).toMatchObject({ code: 'sso_state_invalid' });

    const on = await request(app, 'PATCH', `/v1/orgs/${orgId}/sso`, { token: tokens.accessToken, body: { enabled: true, enforced: true } });
    expect(on.body).toMatchObject({ enabled: true, enforced: true });

    // Discovery by work email or by address.
    expect((await request(app, 'POST', '/v1/auth/sso/discover', { body: { email: 'bruce@wayne.test' } })).body).toMatchObject({ orgId, protocol: 'oidc' });
    const slug = (await db.sys.select({ slug: schema.organizations.slug }).from(schema.organizations).where(eq(schema.organizations.id, orgId)))[0]!.slug;
    expect((await request(app, 'POST', '/v1/auth/sso/discover', { body: { slug } })).body).toMatchObject({ orgId });

    // A new person signs in, is created and joins with the default role, in the org context.
    const start = await request(app, 'POST', '/v1/auth/sso/start', { body: { orgId, consent, returnTo: '/app' } });
    const s = idpSignsIn((start.body as { redirectUrl: string }).redirectUrl, { sub: 'bruce-1', email: 'Bruce@Wayne.test', name: 'Bruce Wayne' });
    const signedIn = await request(app, 'POST', '/v1/auth/sso/oidc/callback', { body: s });
    expect(signedIn.body).toMatchObject({ kind: 'session', returnTo: '/app', tokens: { context: { orgId } } });
    const access = (signedIn.body as { tokens: Tokens }).tokens.accessToken;
    expect(claims(access)).toMatchObject({ roles: ['learner'], amr: ['sso', 'mfa'] });

    // Enforced: the same person cannot use passwords or codes any more.
    await request(app, 'POST', '/v1/auth/register', { body: { email: 'alfred@wayne.test', password: 'correct horse battery', fullName: 'Alfred', consent } }).then((r) =>
      expect(r.body).toMatchObject({ code: 'sso_required' }),
    );
    expect((await request(app, 'POST', '/v1/auth/otp', { body: { identifier: 'bruce@wayne.test', purpose: 'login' } })).body).toMatchObject({ code: 'sso_required' });

    // The IdP vouching for an address outside the verified domains is refused.
    const other = await request(app, 'POST', '/v1/auth/sso/start', { body: { orgId, consent } });
    const o = idpSignsIn((other.body as { redirectUrl: string }).redirectUrl, { sub: 'evil', email: 'ceo@gotham-bank.test', name: 'Not Wayne' });
    expect((await request(app, 'POST', '/v1/auth/sso/oidc/callback', { body: o })).body).toMatchObject({ code: 'sso_domain_not_verified' });

    // Changing the identity provider clears the test and the enforcement.
    const changed = await request(app, 'PUT', `/v1/orgs/${orgId}/sso`, { token: tokens.accessToken, body: { protocol: 'oidc', issuer, clientId: 'dreamlab' } });
    expect(changed.body).toMatchObject({ testedAt: null, enforced: false, oidc: { hasClientSecret: true } });
  });

  it('refuses identity-provider URLs on private networks in production mode', async () => {
    const { assertSafeUrl } = await import('../src/modules/sso/utils/safe-url');
    await expect(assertSafeUrl(issuer, false)).rejects.toThrow();
  });
});

describe('single sign-on with SAML (IAM-16)', () => {
  let dir = '';
  let key = '';
  let cert = '';

  beforeAll(() => {
    dir = mkdtempSync(join(tmpdir(), 'saml-'));
    execFileSync('openssl', ['req', '-x509', '-newkey', 'rsa:2048', '-nodes', '-keyout', join(dir, 'k.pem'), '-out', join(dir, 'c.pem'), '-days', '2', '-subj', '/CN=idp.test'], { stdio: 'ignore' });
    key = readFileSync(join(dir, 'k.pem'), 'utf8');
    cert = readFileSync(join(dir, 'c.pem'), 'utf8');
  });

  afterAll(() => rmSync(dir, { recursive: true, force: true }));

  function samlResponse(p: { requestId: string; acs: string; audience: string; email: string; issuer: string; signWith?: string }): string {
    const now = new Date();
    const iso = (offsetMs: number) => new Date(now.getTime() + offsetMs).toISOString();
    const assertion =
      `<saml:Assertion xmlns:saml="urn:oasis:names:tc:SAML:2.0:assertion" ID="_a${Date.now()}" Version="2.0" IssueInstant="${iso(0)}">` +
      `<saml:Issuer>${p.issuer}</saml:Issuer>` +
      `<saml:Subject><saml:NameID Format="urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress">${p.email}</saml:NameID>` +
      `<saml:SubjectConfirmation Method="urn:oasis:names:tc:SAML:2.0:cm:bearer"><saml:SubjectConfirmationData NotOnOrAfter="${iso(300_000)}" Recipient="${p.acs}" InResponseTo="${p.requestId}"/></saml:SubjectConfirmation></saml:Subject>` +
      `<saml:Conditions NotBefore="${iso(-60_000)}" NotOnOrAfter="${iso(300_000)}"><saml:AudienceRestriction><saml:Audience>${p.audience}</saml:Audience></saml:AudienceRestriction></saml:Conditions>` +
      `<saml:AuthnStatement AuthnInstant="${iso(0)}" SessionIndex="_s1"><saml:AuthnContext><saml:AuthnContextClassRef>urn:oasis:names:tc:SAML:2.0:ac:classes:Password</saml:AuthnContextClassRef></saml:AuthnContext></saml:AuthnStatement>` +
      `<saml:AttributeStatement><saml:Attribute Name="displayName"><saml:AttributeValue>Selina Kyle</saml:AttributeValue></saml:Attribute></saml:AttributeStatement>` +
      `</saml:Assertion>`;
    const sig = new SignedXml({ privateKey: p.signWith ?? key, publicCert: cert, signatureAlgorithm: 'http://www.w3.org/2001/04/xmldsig-more#rsa-sha256', canonicalizationAlgorithm: 'http://www.w3.org/2001/10/xml-exc-c14n#' });
    sig.addReference({
      xpath: "//*[local-name(.)='Assertion']",
      digestAlgorithm: 'http://www.w3.org/2001/04/xmlenc#sha256',
      transforms: ['http://www.w3.org/2000/09/xmldsig#enveloped-signature', 'http://www.w3.org/2001/10/xml-exc-c14n#'],
    });
    sig.computeSignature(assertion, { location: { reference: "//*[local-name(.)='Issuer']", action: 'after' }, prefix: 'ds' });
    const xml =
      `<samlp:Response xmlns:samlp="urn:oasis:names:tc:SAML:2.0:protocol" xmlns:saml="urn:oasis:names:tc:SAML:2.0:assertion" ID="_r${Date.now()}" Version="2.0" IssueInstant="${iso(0)}" Destination="${p.acs}" InResponseTo="${p.requestId}">` +
      `<saml:Issuer>${p.issuer}</saml:Issuer><samlp:Status><samlp:StatusCode Value="urn:oasis:names:tc:SAML:2.0:status:Success"/></samlp:Status>` +
      sig.getSignedXml() +
      `</samlp:Response>`;
    return Buffer.from(xml).toString('base64');
  }

  const requestIdOf = (redirectUrl: string) => {
    const req = inflateRawSync(Buffer.from(new URL(redirectUrl).searchParams.get('SAMLRequest')!, 'base64')).toString();
    return /ID="([^"]+)"/.exec(req)![1]!;
  };

  it('signs people in with a signed assertion, finishing in the same browser; forgeries and replays fail', async () => {
    const { orgId, tokens } = await enterprise('it@kyle.test', 'Kyle Co');
    await verifiedDomain(orgId, tokens.accessToken, 'kyle.test');
    const saved = await request(app, 'PUT', `/v1/orgs/${orgId}/sso`, {
      token: tokens.accessToken,
      body: { protocol: 'saml', idpEntityId: 'https://idp.kyle.test', idpSsoUrl: 'http://idp.kyle.test/sso', certificate: cert },
    });
    expect(saved.body).toMatchObject({ protocol: 'saml', saml: { idpEntityId: 'https://idp.kyle.test' } });
    const { connection, serviceProvider } = (await request(app, 'GET', `/v1/orgs/${orgId}/sso`, { token: tokens.accessToken })).body as {
      connection: { id: string };
      serviceProvider: { samlAcsUrl: string; samlEntityId: string };
    };
    expect(serviceProvider.samlEntityId).toBe(`${APP}/sso/saml/${orgId}`);
    const meta = await app.inject({ method: 'GET', url: `/v1/auth/sso/saml/${connection.id}/metadata` });
    expect(meta.headers['content-type']).toContain('samlmetadata+xml');
    expect(meta.body).toContain(serviceProvider.samlAcsUrl);
    await request(app, 'PATCH', `/v1/orgs/${orgId}/sso`, { token: tokens.accessToken, body: { enabled: true } });

    const start = await request(app, 'POST', '/v1/auth/sso/start', { body: { orgId, consent } });
    const { redirectUrl, state } = start.body as { redirectUrl: string; state: string };
    expect(redirectUrl.startsWith('http://idp.kyle.test/sso?')).toBe(true);
    const requestId = requestIdOf(redirectUrl);
    const base = { requestId, acs: serviceProvider.samlAcsUrl, audience: serviceProvider.samlEntityId, issuer: 'https://idp.kyle.test' };

    // Signed by someone else: refused (and the state is spent).
    const { privateKey } = await generateKeyPair('RS256', { extractable: true });
    const otherPem = exportPKCS8(privateKey);
    expect((await request(app, 'POST', '/v1/auth/sso/saml/acs', { body: { samlResponse: samlResponse({ ...base, email: 'selina@kyle.test', signWith: await otherPem }), relayState: state } })).body).toMatchObject({
      code: 'sso_failed',
    });

    const again = await request(app, 'POST', '/v1/auth/sso/start', { body: { orgId, consent } });
    const fresh = again.body as { redirectUrl: string; state: string };
    const good = samlResponse({ ...base, requestId: requestIdOf(fresh.redirectUrl), email: 'selina@kyle.test' });
    const acs = await request(app, 'POST', '/v1/auth/sso/saml/acs', { body: { samlResponse: good, relayState: fresh.state } });
    expect(acs.body).toEqual({ state: fresh.state });
    const finished = await request(app, 'POST', '/v1/auth/sso/finish', { body: { state: fresh.state } });
    expect(finished.body).toMatchObject({ kind: 'session', tokens: { context: { orgId } } });
    expect((await request(app, 'POST', '/v1/auth/sso/finish', { body: { state: fresh.state } })).status).toBe(401);

    // Replaying the same response against a new sign-on: InResponseTo no longer matches.
    const third = (await request(app, 'POST', '/v1/auth/sso/start', { body: { orgId, consent } })).body as { state: string };
    expect((await request(app, 'POST', '/v1/auth/sso/saml/acs', { body: { samlResponse: good, relayState: third.state } })).status).toBe(401);
  });
});

describe('SCIM provisioning (IAM-17)', () => {
  it('an identity provider creates, updates, groups and removes people', async () => {
    const { orgId, tokens } = await enterprise('it@stark.test', 'Stark Industries');
    expect((await request(app, 'POST', `/v1/orgs/${orgId}/scim/token`, { token: tokens.accessToken })).body).toMatchObject({ code: 'domain_required' });
    await verifiedDomain(orgId, tokens.accessToken, 'stark.test');
    const created = await request(app, 'POST', `/v1/orgs/${orgId}/scim/token`, { token: tokens.accessToken });
    const { token, baseUrl } = created.body as { token: string; baseUrl: string };
    expect(baseUrl).toBe('http://api.test/scim/v2');
    const scim = (method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE', url: string, body?: unknown) => request(app, method, `/scim/v2${url}`, { token, body });

    expect((await request(app, 'GET', '/scim/v2/Users', { token: 'scim_wrong' })).status).toBe(401);
    expect((await request(app, 'GET', '/scim/v2/Users', { token: tokens.accessToken })).status).toBe(401);
    expect((await scim('GET', '/ServiceProviderConfig')).body).toMatchObject({ patch: { supported: true } });

    const outside = await scim('POST', '/Users', { schemas: ['urn:ietf:params:scim:schemas:core:2.0:User'], userName: 'pepper@gmail.com' });
    expect(outside.body).toMatchObject({ status: '400', scimType: 'invalidValue' });

    const user = await scim('POST', '/Users', {
      schemas: ['urn:ietf:params:scim:schemas:core:2.0:User'],
      userName: 'Pepper@Stark.test',
      externalId: 'entra-1',
      name: { givenName: 'Pepper', familyName: 'Potts' },
      emails: [{ value: 'pepper@stark.test', primary: true }],
      active: true,
    });
    expect(user.status).toBe(201);
    expect(user.body).toMatchObject({ userName: 'pepper@stark.test', externalId: 'entra-1', displayName: 'Pepper Potts', active: true });
    const id = (user.body as { id: string }).id;
    expect((await scim('POST', '/Users', { userName: 'pepper@stark.test' })).status).toBe(409);
    expect((await scim('GET', `/Users?filter=${encodeURIComponent('userName eq "pepper@stark.test"')}`)).body).toMatchObject({ totalResults: 1, Resources: [{ id }] });

    const group = await scim('POST', '/Groups', { displayName: 'Engineering', members: [{ value: id }] });
    expect(group.body).toMatchObject({ displayName: 'Engineering', members: [{ value: id, display: 'Pepper Potts' }] });
    const gid = (group.body as { id: string }).id;
    await scim('PATCH', `/Groups/${gid}`, { Operations: [{ op: 'remove', path: `members[value eq "${id}"]` }] });
    expect((await scim('GET', `/Groups/${gid}`)).body).toMatchObject({ members: [] });

    // Microsoft Entra deactivates with a string boolean.
    await scim('PATCH', `/Users/${id}`, { schemas: ['urn:ietf:params:scim:api:messages:2.0:PatchOp'], Operations: [{ op: 'Replace', path: 'active', value: 'False' }] });
    const [m] = await db.sys.select().from(schema.memberships).where(eq(schema.memberships.id, id));
    expect(m!.status).toBe('suspended');

    expect((await scim('DELETE', `/Users/${id}`)).status).toBe(204);
    expect((await scim('GET', `/Users/${id}`)).status).toBe(404);
    const settings = await request(app, 'GET', `/v1/orgs/${orgId}/scim`, { token: tokens.accessToken });
    expect(settings.body).toMatchObject({ enabled: true, tokenHint: token.slice(0, 10) });
    expect((settings.body as { lastSyncAt: string | null }).lastSyncAt).not.toBeNull();
  });
});

describe('phone codes (IAM-20)', () => {
  it('sends a sign-in code by WhatsApp when asked', async () => {
    const phone = '+2348030000777';
    await request(app, 'POST', '/v1/auth/register', { body: { phone, password: 'correct horse battery', fullName: 'Phone Person', consent } });
    expect(notifier.last(phone)?.channel).toBe('sms');
    await request(app, 'POST', '/v1/auth/verify', { body: { identifier: phone, code: notifier.last(phone)!.code } });
    await request(app, 'POST', '/v1/auth/otp', { body: { identifier: phone, purpose: 'login', channel: 'whatsapp' } });
    expect(notifier.last(phone)).toMatchObject({ channel: 'whatsapp', purpose: 'login' });
    const tokens = await request(app, 'POST', '/v1/auth/login/otp', { body: { identifier: phone, code: notifier.last(phone)!.code } });
    expect(tokens.status).toBe(200);
  });
});

void E2E_GATEWAY_TOKEN;

describe('security regressions (23 Oct 2026 review)', () => {
  /** A membership written straight to the database, as an invitation or join would leave it. */
  const addMember = (orgId: string, email: string, source: 'invite' | 'scim', roleKey?: string) =>
    db.system(async (tx) => {
      const [u] = await tx.select().from(schema.users).where(eq(schema.users.email, email));
      const id = crypto.randomUUID();
      await tx.insert(schema.memberships).values({ id, userId: u!.id, orgId, status: 'active', source, joinedAt: new Date() });
      if (roleKey) {
        const [r] = await tx.select().from(schema.roles).where(eq(schema.roles.key, roleKey));
        await tx.insert(schema.roleAssignments).values({ id: crypto.randomUUID(), orgId, membershipId: id, roleId: r!.id, scopeType: 'org' });
      }
      return id;
    });

  it('SCIM cannot reach people it did not provision, nor rename accounts used elsewhere', async () => {
    const { orgId, tokens } = await enterprise('it@evil-corp.test', 'Evil Corp');
    await verifiedDomain(orgId, tokens.accessToken, 'evil-corp.test');
    const { token } = (await request(app, 'POST', `/v1/orgs/${orgId}/scim/token`, { token: tokens.accessToken })).body as { token: string };
    const scim = (method: 'GET' | 'POST' | 'PATCH', url: string, body?: unknown) => request(app, method, `/scim/v2${url}`, { token, body });

    // An invited member is not SCIM's to change: their address must not become one the org controls.
    await signUp('victim@personal-mail.test');
    const invited = await addMember(orgId, 'victim@personal-mail.test', 'invite');
    const hijack = await scim('PATCH', `/Users/${invited}`, { Operations: [{ op: 'replace', path: 'userName', value: 'victim@evil-corp.test' }] });
    expect(hijack.status).toBe(404);
    const [victim] = await db.sys.select().from(schema.users).where(eq(schema.users.id, (await db.sys.select().from(schema.memberships).where(eq(schema.memberships.id, invited)))[0]!.userId));
    expect(victim!.email).toBe('victim@personal-mail.test');

    // A provisioned person who also belongs to another organisation keeps their email.
    const created = await scim('POST', '/Users', { userName: 'shared@evil-corp.test', name: { givenName: 'Shared', familyName: 'Person' } });
    const other = await enterprise('founder@elsewhere.test', 'Elsewhere');
    await addMember(other.orgId, 'shared@evil-corp.test', 'invite');
    const renamed = await scim('PATCH', `/Users/${(created.body as { id: string }).id}`, { Operations: [{ op: 'replace', path: 'userName', value: 'renamed@evil-corp.test' }] });
    expect(renamed.status).toBe(400);
  });

  it('a password set before the owner proved the address does not survive verification', async () => {
    const consentBody = { password: 'attacker chose this one', fullName: 'Not Me', consent };
    // Someone registers another person's address and never verifies it.
    await request(app, 'POST', '/v1/auth/register', { body: { email: 'owner@inbox.test', ...consentBody } });
    // The owner signs in with a code instead: the stranger's password is gone.
    await request(app, 'POST', '/v1/auth/otp', { body: { identifier: 'owner@inbox.test', purpose: 'login' } });
    expect((await request(app, 'POST', '/v1/auth/login/otp', { body: { identifier: 'owner@inbox.test', code: notifier.last('owner@inbox.test')!.code } })).status).toBe(200);
    expect((await request(app, 'POST', '/v1/auth/login', { body: { identifier: 'owner@inbox.test', password: 'attacker chose this one' } })).status).toBe(401);

    // A code that reached the inbox from someone else's registration verifies the address but sets no password.
    await request(app, 'POST', '/v1/auth/register', { body: { email: 'second@inbox.test', ...consentBody } });
    expect((await request(app, 'POST', '/v1/auth/verify', { body: { identifier: 'second@inbox.test', code: notifier.last('second@inbox.test')!.code } })).status).toBe(200);
    expect((await request(app, 'POST', '/v1/auth/login', { body: { identifier: 'second@inbox.test', password: 'attacker chose this one' } })).status).toBe(401);
  });

  it('nobody grants more than they hold', async () => {
    const { orgId, tokens } = await enterprise('founder@escalate.test', 'Escalate Ltd');
    await request(app, 'POST', `/v1/orgs/${orgId}/roles`, { token: tokens.accessToken, body: { name: 'Coordinator', permissions: ['org.read', 'org.members.read', 'org.roles.assign', 'org.roles.manage'] } });
    const coordinator = await signUp('coord@escalate.test');
    const membershipId = await addMember(orgId, 'coord@escalate.test', 'invite', 'coordinator');
    const inOrg = (await request(app, 'POST', '/v1/auth/switch-org', { token: coordinator.accessToken, body: { orgId } })).body as Tokens;

    const toAdmin = await request(app, 'POST', `/v1/orgs/${orgId}/members/${membershipId}/roles`, { token: inOrg.accessToken, body: { roleKey: 'org_admin' } });
    expect(toAdmin).toMatchObject({ status: 403, body: { code: 'grant_exceeds_own' } });
    const widen = await request(app, 'PATCH', `/v1/orgs/${orgId}/roles/coordinator`, { token: inOrg.accessToken, body: { permissions: ['org.read', 'org.security.manage'] } });
    expect(widen).toMatchObject({ status: 403, body: { code: 'grant_exceeds_own' } });
    // Within what they hold, they may grant.
    expect((await request(app, 'POST', `/v1/orgs/${orgId}/members/${membershipId}/roles`, { token: inOrg.accessToken, body: { roleKey: 'learner' } })).status).toBe(201);
  });
});
