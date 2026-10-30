/**
 * Slice 3: the Dream Score™ (SCORE-1) and assigned learning (ASSIGN-1), with IAM, catalog, learning
 * and notify running together against real Postgres, Redis and RabbitMQ.
 */
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { Test } from '@nestjs/testing';
import { isAppRoute, type AppRoute, type AppRouter } from '@ts-rest/core';
import { apiV1Contract, type CohortDetail, DEFAULT_DREAM_SCORE_WEIGHTS, type DreamScore, type MyProgram, type Notification } from '@dreamlab/contracts';
import { IAM_RPC_QUEUE } from '@lib/auth';
import { buildOpenApiDocument, installGatewayTrust, installWebhookBodyParser, newId, REDIS } from '@lib/common';
import { loadConfig } from '@lib/config';
import { DATABASE, DatabaseService, runMigrations } from '@lib/database';
import type { EmailMessage, EmailSender } from '@lib/email';
import { CATALOG_RPC_QUEUE } from '@lib/rpc';
import { eventually, E2E_GATEWAY_TOKEN, request, testEnv } from '@lib/testing';
import type Redis from 'ioredis';
import { Logger } from 'nestjs-pino';
import { CatalogAppModule } from '../apps/catalog/src/app.module';
import { catalogConfigSchema } from '../apps/catalog/src/config';
import { catalogMigrationsFolder } from '../apps/catalog/src/database';
import { CatalogSeedService } from '../apps/catalog/src/modules/seed/catalog-seed.service';
import { DATASETS } from '../apps/catalog/src/modules/seed/datasets';
import { IamAppModule } from '../apps/iam/src/app.module';
import { iamConfigSchema } from '../apps/iam/src/config';
import { iamMigrationsFolder } from '../apps/iam/src/database';
import type { Notifier, OtpMessage } from '../apps/iam/src/modules/notifications/interfaces/notifier.interface';
import { NOTIFIER } from '../apps/iam/src/modules/notifications/notifier.service';
import { SeedService } from '../apps/iam/src/modules/seed/seed.service';
import { LearningAppModule } from '../apps/learning/src/app.module';
import { learningConfigSchema } from '../apps/learning/src/config';
import { learningMigrationsFolder, schema as learningSchema } from '../apps/learning/src/database';
import { todayIn } from '../apps/learning/src/modules/cohorts/calendar-time';
import { NotifyAppModule } from '../apps/notify/src/app.module';
import { notifyConfigSchema } from '../apps/notify/src/config';
import { notifyMigrationsFolder } from '../apps/notify/src/database';
import { EMAIL_SENDER } from '../apps/notify/src/modules/notifications/notification-intake.service';

class CapturingNotifier implements Notifier {
  otps: OtpMessage[] = [];
  async sendOtp(m: OtpMessage) {
    this.otps.push(m);
  }
  invitations: { destination: string; acceptUrl: string }[] = [];
  async sendInvitation(m: { destination: string; acceptUrl: string }) {
    this.invitations.push(m);
  }
  lastInviteToken(destination: string) {
    const url = [...this.invitations].reverse().find((i) => i.destination === destination)?.acceptUrl;
    return url ? new URL(url).searchParams.get('token')! : undefined;
  }
  lastCode(destination: string) {
    return [...this.otps].reverse().find((o) => o.destination === destination)?.code;
  }
}
const notifier = new CapturingNotifier();

class CapturingEmail implements EmailSender {
  readonly name = 'capture';
  sent: EmailMessage[] = [];
  async send(m: EmailMessage) {
    this.sent.push(m);
  }
}

let iam: NestFastifyApplication;
let catalog: NestFastifyApplication;
let learning: NestFastifyApplication;
let notify: NestFastifyApplication;

const consent = { termsVersion: '2026-10', privacyVersion: '2026-10' };
const L = (token: string) => ({ token });

async function boot(module: unknown, rpcQueue: string | null, rabbitUrl: string, withNotifier = false): Promise<NestFastifyApplication> {
  const builder = Test.createTestingModule({ imports: [module as never] });
  if (withNotifier) builder.overrideProvider(NOTIFIER).useValue(notifier);
  const ref = await builder.compile();
  const app = ref.createNestApplication<NestFastifyApplication>(new FastifyAdapter(), { bufferLogs: true });
  app.useLogger(app.get(Logger));
  installGatewayTrust(app.getHttpAdapter().getInstance(), E2E_GATEWAY_TOKEN);
  installWebhookBodyParser(app.getHttpAdapter().getInstance());
  if (rpcQueue) {
    app.connectMicroservice<MicroserviceOptions>({ transport: Transport.RMQ, options: { urls: [rabbitUrl], queue: rpcQueue, queueOptions: { durable: true } } }, { inheritAppConfig: true });
    await app.startAllMicroservices();
  }
  return app;
}

async function signUp(email: string, fullName: string) {
  const reg = await request(iam, 'POST', '/v1/auth/register', { body: { email, password: 'correct horse battery', fullName, consent } });
  const registrationToken = (reg.body as { registrationToken: string }).registrationToken;
  const res = await request(iam, 'POST', '/v1/auth/verify', { body: { identifier: email, code: notifier.lastCode(email), registrationToken } });
  expect(res.status).toBe(200);
  return (res.body as { accessToken: string }).accessToken;
}

async function notificationsFor(token: string, match: (n: Notification) => boolean): Promise<Notification[]> {
  return eventually(async () => {
    const items = ((await request(notify, 'GET', '/v1/notifications', { token })).body as { items: Notification[] }).items;
    return items.some(match) ? items : null;
  }) as Promise<Notification[]>;
}

/** An organisation with an owner, and members who accepted their invitations (tokens in that organisation). */
async function organisation(slug: string, name: string, people: [email: string, fullName: string, role: string][]) {
  const admin = ((await request(iam, 'POST', '/v1/auth/login', { body: { identifier: 'admin@theafricandreamlab.com', password: 'e2e-admin-password' } })).body as { accessToken: string })
    .accessToken;
  const ownerEmail = `owner@${slug}.test`;
  const personal = await signUp(ownerEmail, `${name} Owner`);
  const orgId = ((await request(iam, 'POST', '/v1/orgs', { token: admin, body: { slug, name, kinds: ['enterprise'], firstAdmin: { email: ownerEmail } } })).body as { id: string }).id;
  const switchTo = async (token: string) => ((await request(iam, 'POST', '/v1/auth/switch-org', { token, body: { orgId } })).body as { accessToken: string }).accessToken;
  const owner = await switchTo(personal);
  const tokens: Record<string, string> = {};
  const ids: Record<string, string> = {};
  for (const [email, fullName, role] of people) {
    expect((await request(iam, 'POST', `/v1/orgs/${orgId}/invitations`, { token: owner, body: { email, roleKeys: [role] } })).status).toBe(201);
    const p = await signUp(email, fullName);
    expect((await request(iam, 'POST', '/v1/invitations/accept', { token: p, body: { token: notifier.lastInviteToken(email) } })).status).toBe(200);
    tokens[email] = await switchTo(p);
    ids[email] = ((await request(iam, 'GET', '/v1/me', L(tokens[email]!))).body as { user: { id: string } }).user.id;
  }
  return { orgId, owner, tokens, ids };
}

beforeAll(async () => {
  const iamConfig = loadConfig(iamConfigSchema, testEnv());
  await runMigrations(iamConfig.IAM_MIGRATION_DATABASE_URL!, iamMigrationsFolder());
  iam = await boot(IamAppModule.forRoot(iamConfig), IAM_RPC_QUEUE, iamConfig.RABBITMQ_URL, true);
  await iam.listen(0, '127.0.0.1');
  await iam.get(SeedService).run();
  const jwks = `${await iam.getUrl()}/.well-known/jwks.json`.replace('[::1]', '127.0.0.1');

  const catalogConfig = loadConfig(catalogConfigSchema, testEnv({ IAM_JWKS_URL: jwks }));
  await runMigrations(catalogConfig.CATALOG_MIGRATION_DATABASE_URL!, catalogMigrationsFolder());
  catalog = await boot(CatalogAppModule.forRoot(catalogConfig), CATALOG_RPC_QUEUE, catalogConfig.RABBITMQ_URL);
  await catalog.init();
  await catalog.getHttpAdapter().getInstance().ready();
  await catalog.get(CatalogSeedService).run(DATASETS['dream-lab-test'], 'platform');

  const learningConfig = loadConfig(learningConfigSchema, testEnv({ IAM_JWKS_URL: jwks }));
  await runMigrations(learningConfig.LEARNING_MIGRATION_DATABASE_URL!, learningMigrationsFolder());
  learning = await boot(LearningAppModule.forRoot(learningConfig), null, learningConfig.RABBITMQ_URL);
  await learning.init();
  await learning.getHttpAdapter().getInstance().ready();

  const notifyConfig = loadConfig(notifyConfigSchema, testEnv({ IAM_JWKS_URL: jwks, PUBLIC_APP_URL: 'https://learn.test' }));
  await runMigrations(notifyConfig.NOTIFY_MIGRATION_DATABASE_URL!, notifyMigrationsFolder());
  const notifyRef = await Test.createTestingModule({ imports: [NotifyAppModule.forRoot(notifyConfig)] }).overrideProvider(EMAIL_SENDER).useValue(new CapturingEmail()).compile();
  notify = notifyRef.createNestApplication<NestFastifyApplication>(new FastifyAdapter(), { bufferLogs: true });
  notify.useLogger(notify.get(Logger));
  installGatewayTrust(notify.getHttpAdapter().getInstance(), E2E_GATEWAY_TOKEN);
  await notify.init();
  await notify.getHttpAdapter().getInstance().ready();
}, 180_000);

afterAll(async () => {
  await notify?.close();
  await learning?.close();
  await catalog?.close();
  await iam?.close();
});

beforeEach(async () => {
  const redis = iam.get<Redis>(REDIS);
  const keys = await redis.keys('iam:rl:*');
  if (keys.length > 0) await keys.reduce((p, k) => p.del(k), redis.pipeline()).exec();
});

describe('contract parity', () => {
  const routes = (router: AppRouter): AppRoute[] => Object.values(router).flatMap((v) => (isAppRoute(v) ? [v] : routes(v as AppRouter)));
  const { dreamScore, dreamScoreWeights, setDreamScoreWeights } = apiV1Contract.outcomes;
  it.each([
    ['assigned learning', apiV1Contract.assignedLearning as AppRouter],
    ['Dream Score', { dreamScore, dreamScoreWeights, setDreamScoreWeights } as AppRouter],
  ])('learning serves every %s route', (_name, router) => {
    const doc = buildOpenApiDocument(learning, { title: 't', description: 'd', version: '0' });
    const missing = routes(router)
      .map((r) => ({ method: r.method.toLowerCase(), path: r.path.replace(/:(\w+)/g, '{$1}') }))
      .filter((r) => !(doc.paths[r.path] as Record<string, unknown> | undefined)?.[r.method]);
    expect(missing).toEqual([]);
  });
});

describe('assigned learning (ASSIGN-1)', () => {
  let org: Awaited<ReturnType<typeof organisation>>;
  let groupId: string;
  let assignmentId: string;
  const ada = 'ada@ibadan-works.test';
  const bayo = 'bayo@ibadan-works.test';

  beforeAll(async () => {
    org = await organisation('ibadan-works', 'Ibadan Works', [
      [ada, 'Ada Assignee', 'learner'],
      [bayo, 'Bayo Grouped', 'learner'],
    ]);
    groupId = ((await request(iam, 'POST', `/v1/orgs/${org.orgId}/groups`, { ...L(org.owner), body: { name: 'Sales team' } })).body as { id: string }).id;
    const members = (await request(iam, 'GET', `/v1/orgs/${org.orgId}/members?limit=100`, L(org.owner))).body as { items: { id: string; user: { email: string } }[] };
    const bayoMembership = members.items.find((m) => m.user.email === bayo)!.id;
    expect((await request(iam, 'POST', `/v1/orgs/${org.orgId}/groups/${groupId}/members`, { ...L(org.owner), body: { membershipIds: [bayoMembership] } })).status).toBe(204);
  });

  it('assigns a course to people and groups, enrols them in the organisation and tells them', async () => {
    const outsider = await signUp('stranger@assigned.test', 'Sam Stranger');
    const outsiderId = ((await request(iam, 'GET', '/v1/me', L(outsider))).body as { user: { id: string } }).user.id;
    const body = { courseSlug: 'negotiation', userIds: [org.ids[ada], outsiderId], groupIds: [groupId], dueOn: '2099-12-31', note: 'Before the client season.' };
    expect((await request(learning, 'POST', '/v1/learning/org/assignments', { ...L(org.tokens[ada]!), body })).status).toBe(403);
    expect((await request(learning, 'POST', '/v1/learning/org/assignments', { ...L(org.owner), body: { ...body, courseSlug: 'no-such-course' } })).status).toBe(404);
    const created = await request(learning, 'POST', '/v1/learning/org/assignments', { ...L(org.owner), body });
    expect(created.status).toBe(201);
    const detail = created.body as { id: string; counts: Record<string, number>; assignees: { name: string; status: string }[] };
    assignmentId = detail.id;
    // People outside the organisation are left out; group members are in.
    expect(detail.assignees.map((a) => a.name)).toEqual(['Ada Assignee', 'Bayo Grouped']);
    expect(detail.counts).toEqual({ not_started: 2, in_progress: 0, completed: 0, overdue: 0 });

    const mine = (await request(learning, 'GET', '/v1/learning/me/assigned', L(org.tokens[bayo]!))).body as { items: { course: { slug: string }; orgName: string; dueOn: string; status: string; enrollmentId: string }[] };
    expect(mine.items).toMatchObject([{ course: { slug: 'negotiation' }, orgName: 'Ibadan Works', dueOn: '2099-12-31', status: 'not_started' }]);
    const enrolments = (await request(learning, 'GET', '/v1/learning/enrollments', L(org.tokens[bayo]!))).body as { items: { id: string; course: { slug: string } }[] };
    expect(enrolments.items.map((e) => e.id)).toContain(mine.items[0]!.enrollmentId);
    await notificationsFor(org.tokens[ada]!, (n) => n.title === 'New course to take: Negotiation');
    expect(((await request(learning, 'GET', '/v1/learning/me/assigned', L(outsider))).body as { items: unknown[] }).items).toEqual([]);
  });

  it('shows the organisation who is overdue, and withdraws an assignment without losing enrolments', async () => {
    const updated = await request(learning, 'PATCH', `/v1/learning/org/assignments/${assignmentId}`, { ...L(org.owner), body: { dueOn: '2020-01-31' } });
    expect((updated.body as { counts: Record<string, number> }).counts).toMatchObject({ overdue: 2 });
    expect(((await request(learning, 'GET', '/v1/learning/org/assignments', L(org.owner))).body as { items: { id: string }[] }).items.map((i) => i.id)).toEqual([assignmentId]);
    expect((await request(learning, 'DELETE', `/v1/learning/org/assignments/${assignmentId}`, L(org.owner))).status).toBe(204);
    expect(((await request(learning, 'GET', '/v1/learning/org/assignments', L(org.owner))).body as { items: unknown[] }).items).toEqual([]);
    expect(((await request(learning, 'GET', '/v1/learning/me/assigned', L(org.tokens[ada]!))).body as { items: unknown[] }).items).toEqual([]);
    expect((await request(learning, 'GET', `/v1/learning/org/assignments/${assignmentId}`, L(org.owner))).status).toBe(404);
    const enrolments = (await request(learning, 'GET', '/v1/learning/enrollments', L(org.tokens[ada]!))).body as { items: { course: { slug: string } }[] };
    expect(enrolments.items.map((e) => e.course.slug)).toContain('negotiation');
  });
});

describe('Dream Score (SCORE-1)', () => {
  let org: Awaited<ReturnType<typeof organisation>>;
  let cohort: CohortDetail;
  let enrollmentId: string;
  const learner = 'chika@owerri-academy.test';
  const mentorEmail = 'mentor@owerri-academy.test';

  beforeAll(async () => {
    org = await organisation('owerri-academy', 'Owerri Academy', [
      [learner, 'Chika Learner', 'learner'],
      [mentorEmail, 'Musa Mentor', 'mentor'],
    ]);
    cohort = (await request(learning, 'POST', '/v1/learning/cohorts', { ...L(org.owner), body: { programSlug: 'the-african-dream-lab', name: 'Owerri 01', startsOn: todayIn('Africa/Lagos') } })).body as CohortDetail;
    expect((await request(learning, 'PATCH', `/v1/learning/cohorts/${cohort.id}`, { ...L(org.owner), body: { status: 'open' } })).status).toBe(200);
    const joined = await request(learning, 'POST', `/v1/learning/cohorts/${cohort.id}/join`, { ...L(org.tokens[learner]!), body: {} });
    enrollmentId = (joined.body as MyProgram).enrollment.id;
  });

  const score = (token: string) => request(learning, 'GET', `/v1/learning/programs/enrollments/${enrollmentId}/dream-score`, L(token));

  it('starts with no score, and only the learner and the cohort’s staff see it', async () => {
    const res = await score(org.tokens[learner]!);
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ overall: null, recent: [] });
    expect((res.body as DreamScore).dimensions).toHaveLength(10);
    expect((await score(org.owner)).status).toBe(200);
    // The mentor sees it only once they mentor this learner.
    expect((await score(org.tokens[mentorEmail]!)).status).toBe(404);
    expect((await score(await signUp('nosy@scores.test', 'Nosy Person'))).status).toBe(404);
  });

  it('turns attendance, mentoring and residency reviews into explained evidence, once each', async () => {
    // A class that ended days ago (its attendance has settled), marked present.
    const session = cohort.sessions.find((s) => s.mode === 'virtual')!;
    const started = new Date(Date.now() - 3 * 86_400_000).toISOString();
    expect((await request(learning, 'PATCH', `/v1/learning/cohorts/${cohort.id}/sessions/${session.id}`, { ...L(org.owner), body: { startsAt: started } })).status).toBe(200);
    expect(
      (await request(learning, 'PUT', `/v1/learning/cohorts/${cohort.id}/sessions/${session.id}/attendance`, { ...L(org.owner), body: { entries: [{ userId: org.ids[learner], status: 'present' }] } })).status,
    ).toBe(200);

    // A held mentor meeting.
    const assigned = await request(learning, 'POST', `/v1/learning/cohorts/${cohort.id}/mentors`, { ...L(org.owner), body: { mentorUserId: org.ids[mentorEmail], learnerUserIds: [org.ids[learner]] } });
    const assignmentId = (assigned.body as { items: { id: string }[] }).items[0]!.id;
    const meeting = await request(learning, 'POST', '/v1/learning/mentoring/meetings', { ...L(org.tokens[mentorEmail]!), body: { assignmentId, scheduledAt: new Date(Date.now() + 60_000).toISOString(), durationMin: 30 } });
    const meetingId = (meeting.body as { id: string }).id;
    expect((await request(learning, 'PATCH', `/v1/learning/mentoring/meetings/${meetingId}`, { ...L(org.tokens[mentorEmail]!), body: { status: 'held', notes: 'Talked through the build plan.' } })).status).toBe(200);

    // An approved residency stage (Prototype and Build, position 4), as faculty review leaves it.
    const db = learning.get<DatabaseService<typeof learningSchema>>(DATABASE);
    await db.system((tx) =>
      tx.insert(learningSchema.residencyStages).values({
        id: newId(),
        programEnrollmentId: enrollmentId,
        hostOrgId: org.orgId,
        userId: org.ids[learner]!,
        position: 4,
        status: 'approved',
        text: 'Build log',
        decision: 'approved',
        scorePct: 86,
        feedback: 'Strong build log.',
        reviewerUserId: org.ids[mentorEmail]!,
        reviewedAt: new Date(),
      }),
    );

    const s = (await score(org.tokens[learner]!)).body as DreamScore;
    const dim = (key: string) => s.dimensions.find((d) => d.key === key)!;
    // Execution: attendance 9 and the build stage 8.6; resilience: the meeting, 8.
    expect(dim('execution')).toMatchObject({ score: 8.8, evidence: 2 });
    expect(dim('resilience')).toMatchObject({ score: 8, evidence: 1 });
    expect(dim('vision')).toMatchObject({ score: null, evidence: 0 });
    expect(s.overall).toBe(8.4);
    expect(s.recent.map((e) => e.label)).toEqual(expect.arrayContaining(['Mentor meeting held', 'Prototype and Build approved at 86%', `${session.title}, week ${session.weekNo}: present`]));
    expect(s.growth).toMatchObject([{ weekNo: 1, dream: 8.4, building: 8.5, learning: null }]);
    // Reading again adds nothing.
    expect(((await score(org.tokens[learner]!)).body as DreamScore).recent).toHaveLength(3);
    // Now the mentor mentors the learner, they see the score too.
    expect((await score(org.tokens[mentorEmail]!)).status).toBe(200);
  });

  it('weights dimensions the organisation’s way; the weights must total 100%', async () => {
    const path = '/v1/learning/dream-score/weights';
    expect(((await request(learning, 'GET', path, L(org.owner))).body as { weights: Record<string, number> }).weights).toEqual(DEFAULT_DREAM_SCORE_WEIGHTS);
    expect((await request(learning, 'GET', path, L(org.tokens[learner]!))).status).toBe(403);
    expect((await request(learning, 'PUT', path, { ...L(org.owner), body: { weights: { ...DEFAULT_DREAM_SCORE_WEIGHTS, execution: 50 } } })).status).toBe(400);
    const weights = { ...DEFAULT_DREAM_SCORE_WEIGHTS, execution: 30, resilience: 10, vision: 0, digital: 0 };
    expect((await request(learning, 'PUT', path, { ...L(org.owner), body: { weights } })).status).toBe(200);
    // (8.8 × 30 + 8 × 10) / 40
    expect(((await score(org.tokens[learner]!)).body as DreamScore).overall).toBe(8.6);
  });
});
