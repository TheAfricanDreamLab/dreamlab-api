/**
 * Slice 3 outcomes (CAP-1, GRAD-1, PORT-1, CRED-1): the Dream Residency workspace, the 12-month
 * action plan, the graduation checklist, the portfolio and credentials, with IAM, catalog and learning
 * running together against real Postgres, Redis and RabbitMQ.
 */
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { Test } from '@nestjs/testing';
import { isAppRoute, type AppRoute, type AppRouter } from '@ts-rest/core';
import { type ActionPlan, apiV1Contract, type CohortDetail, type Credential, type Graduation, type MyProgram, type Portfolio, type Residency } from '@dreamlab/contracts';
import { IAM_RPC_QUEUE } from '@lib/auth';
import { buildOpenApiDocument, installGatewayTrust, REDIS } from '@lib/common';
import { loadConfig } from '@lib/config';
import { DATABASE, DatabaseService, runMigrations } from '@lib/database';
import { CATALOG_RPC_QUEUE } from '@lib/rpc';
import { E2E_GATEWAY_TOKEN, request, testEnv } from '@lib/testing';
import { newId } from '@lib/common';
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
import { learningMigrationsFolder } from '../apps/learning/src/database';
import { todayIn } from '../apps/learning/src/modules/cohorts/calendar-time';
import { CertificatesIntake } from '../apps/learning/src/modules/outcomes/certificates-intake.service';

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
const consent = { termsVersion: '2026-10', privacyVersion: '2026-10' };
const L = (token: string) => ({ token });

let iam: NestFastifyApplication;
let catalog: NestFastifyApplication;
let learning: NestFastifyApplication;
let iamModule: unknown;

async function boot(module: unknown, rpcQueue: string | null, rabbitUrl: string): Promise<NestFastifyApplication> {
  const builder = Test.createTestingModule({ imports: [module as never] });
  if (module === iamModule) builder.overrideProvider(NOTIFIER).useValue(notifier);
  const ref = await builder.compile();
  const app = ref.createNestApplication<NestFastifyApplication>(new FastifyAdapter(), { bufferLogs: true });
  app.useLogger(app.get(Logger));
  installGatewayTrust(app.getHttpAdapter().getInstance(), E2E_GATEWAY_TOKEN);
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

beforeAll(async () => {
  const iamConfig = loadConfig(iamConfigSchema, testEnv());
  await runMigrations(iamConfig.IAM_MIGRATION_DATABASE_URL!, iamMigrationsFolder());
  iamModule = IamAppModule.forRoot(iamConfig);
  iam = await boot(iamModule, IAM_RPC_QUEUE, iamConfig.RABBITMQ_URL);
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
}, 180_000);

afterAll(async () => {
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
  it('the learning service serves every outcomes route', () => {
    // The Dream Score routes belong to the scores module and are checked with it.
    const { dreamScore: _score, dreamScoreWeights: _weights, setDreamScoreWeights: _setWeights, ...outcomes } = apiV1Contract.outcomes;
    const doc = buildOpenApiDocument(learning, { title: 't', description: 'd', version: '0' });
    const missing = routes(outcomes as AppRouter)
      .map((r) => ({ method: r.method.toLowerCase(), path: r.path.replace(/:(\w+)/g, '{$1}') }))
      .filter((r) => !(doc.paths[r.path] as Record<string, unknown> | undefined)?.[r.method]);
    expect(missing).toEqual([]);
  });
});

describe('outcomes (CAP-1, GRAD-1, PORT-1, CRED-1)', () => {
  let owner: string;
  let teacher: string;
  let learner: string;
  let outsider: string;
  let orgId: string;
  let enrollmentId: string;
  let learnerId: string;
  let cohort: CohortDetail;
  const base = () => `/v1/learning/programs/enrollments/${enrollmentId}`;
  const document = Array.from({ length: 40 }, (_, i) => `Evidence line ${i} about the dream.`).join(' ');

  const tokenFor = async (email: string, name: string) => {
    const personal = await signUp(email, name);
    expect((await request(iam, 'POST', '/v1/invitations/accept', { token: personal, body: { token: notifier.lastInviteToken(email) } })).status).toBe(200);
    return ((await request(iam, 'POST', '/v1/auth/switch-org', { token: personal, body: { orgId } })).body as { accessToken: string }).accessToken;
  };

  beforeAll(async () => {
    const admin = ((await request(iam, 'POST', '/v1/auth/login', { body: { identifier: 'admin@theafricandreamlab.com', password: 'e2e-admin-password' } })).body as { accessToken: string })
      .accessToken;
    const personal = await signUp('owner@ibadan-lab.test', 'Ife Owner');
    orgId = ((await request(iam, 'POST', '/v1/orgs', { token: admin, body: { slug: 'ibadan-lab', name: 'Ibadan Lab', kinds: ['enterprise'], firstAdmin: { email: 'owner@ibadan-lab.test' } } })).body as { id: string }).id;
    owner = ((await request(iam, 'POST', '/v1/auth/switch-org', { token: personal, body: { orgId } })).body as { accessToken: string }).accessToken;
    for (const [email, role] of [
      ['teacher@ibadan-lab.test', 'instructor'],
      ['learner@ibadan-lab.test', 'learner'],
    ] as const) {
      expect((await request(iam, 'POST', `/v1/orgs/${orgId}/invitations`, { token: owner, body: { email, roleKeys: [role] } })).status).toBe(201);
    }
    teacher = await tokenFor('teacher@ibadan-lab.test', 'Tolu Teacher');
    learner = await tokenFor('learner@ibadan-lab.test', 'Lara Learner');
    outsider = await signUp('outsider@outcomes.test', 'Odun Outsider');
    cohort = (await request(learning, 'POST', '/v1/learning/cohorts', { ...L(owner), body: { programSlug: 'the-african-dream-lab', name: 'Ibadan 01', startsOn: todayIn('Africa/Lagos') } })).body as CohortDetail;
    expect((await request(learning, 'PATCH', `/v1/learning/cohorts/${cohort.id}`, { ...L(owner), body: { status: 'open' } })).status).toBe(200);
    const joined = await request(learning, 'POST', `/v1/learning/cohorts/${cohort.id}/join`, { ...L(learner), body: {} });
    expect(joined.status).toBe(201);
    enrollmentId = (joined.body as MyProgram).enrollment.id;
    learnerId = ((await request(iam, 'GET', '/v1/me', L(learner))).body as { user: { id: string } }).user.id;
  });

  it('lets the learner write and submit residency stages, and the cohort’s faculty review them', async () => {
    const empty = (await request(learning, 'GET', `${base()}/residency`, L(learner))).body as Residency;
    expect(empty.stages.map((s) => s.status)).toEqual(Array(7).fill('not_started'));
    expect(empty).toMatchObject({ creditsEarned: 0, creditsTotal: 45, can: { edit: true, review: false } });
    expect((await request(learning, 'GET', `${base()}/residency`, L(outsider))).status).toBe(404);

    expect((await request(learning, 'PUT', `${base()}/residency/1`, { ...L(learner), body: { text: 'Too short', links: [] } })).status).toBe(200);
    expect(await request(learning, 'POST', `${base()}/residency/1/submit`, L(learner))).toMatchObject({ status: 400, body: { code: 'stage_incomplete' } });
    expect((await request(learning, 'PUT', `${base()}/residency/1`, { ...L(learner), body: { text: document, links: [{ label: 'Survey', url: 'https://forms.example.com/s' }] } })).status).toBe(200);
    expect(((await request(learning, 'POST', `${base()}/residency/1/submit`, L(learner))).body as Residency).stages[0]).toMatchObject({ status: 'submitted' });
    // Locked while with faculty; learners never review.
    expect((await request(learning, 'PUT', `${base()}/residency/1`, { ...L(learner), body: { text: document, links: [] } })).status).toBe(409);
    expect((await request(learning, 'POST', `${base()}/residency/1/review`, { ...L(learner), body: { decision: 'approved', scorePct: 90, feedback: 'Looks great to me.' } })).status).toBe(403);

    expect((await request(learning, 'POST', `${base()}/residency/1/review`, { ...L(teacher), body: { decision: 'approved', feedback: 'Strong and specific.' } })).status).toBe(400);
    const changes = await request(learning, 'POST', `${base()}/residency/1/review`, { ...L(teacher), body: { decision: 'changes_requested', feedback: 'Add who benefits and how you know.' } });
    expect((changes.body as Residency).stages[0]).toMatchObject({ status: 'changes_requested', review: { decision: 'changes_requested', reviewer: 'Tolu Teacher' } });
    expect((await request(learning, 'POST', `${base()}/residency/1/submit`, L(learner))).status).toBe(200);
    const approved = (await request(learning, 'POST', `${base()}/residency/1/review`, { ...L(teacher), body: { decision: 'approved', scorePct: 80, feedback: 'Strong and specific.' } })).body as Residency;
    expect(approved.stages[0]).toMatchObject({ status: 'approved', review: { scorePct: 80 } });
    expect(approved.creditsEarned).toBe(5);

    // The approved stage counts in the Programme Score, for the learner and on the roster.
    const program = ((await request(learning, 'GET', '/v1/learning/me/programs', L(learner))).body as { items: MyProgram[] }).items[0]!;
    expect(program.score.programmeScore).toBe(80);
    const roster = (await request(learning, 'GET', `/v1/learning/cohorts/${cohort.id}/roster`, L(owner))).body as { items: { name: string; programmeScore: number | null }[] };
    expect(roster.items.find((r) => r.name === 'Lara Learner')?.programmeScore).toBe(80);
    const board = (await request(learning, 'GET', `/v1/learning/cohorts/${cohort.id}/residency`, L(teacher))).body as { learners: { statuses: string[]; creditsEarned: number }[] };
    expect(board.learners[0]).toMatchObject({ creditsEarned: 5, statuses: ['approved', 'not_started', 'not_started', 'not_started', 'not_started', 'not_started', 'not_started'] });
    expect((await request(learning, 'GET', `/v1/learning/cohorts/${cohort.id}/residency`, L(learner))).status).toBe(404);
  });

  it('takes a 12-month action plan through review', async () => {
    const draft = { vision: 'Short', milestones: [], resources: '', risks: '' };
    expect((await request(learning, 'PUT', `${base()}/action-plan`, { ...L(learner), body: draft })).status).toBe(200);
    expect(await request(learning, 'POST', `${base()}/action-plan/submit`, L(learner))).toMatchObject({ status: 400, body: { code: 'plan_incomplete' } });
    const plan = {
      vision: 'A solar drying service in three districts, run by a team of four, paying for itself by month nine.',
      milestones: [1, 4, 9].map((month) => ({ month, milestone: `Milestone for month ${month}`, measure: 'Measured by paying customers' })),
      resources: 'Two dryers, a motorbike and a bookkeeper.',
      risks: 'A poor harvest; a competitor copying the design.',
    };
    expect((await request(learning, 'PUT', `${base()}/action-plan`, { ...L(learner), body: plan })).status).toBe(200);
    expect(((await request(learning, 'POST', `${base()}/action-plan/submit`, L(learner))).body as ActionPlan).status).toBe('submitted');
    const reviewed = (await request(learning, 'POST', `${base()}/action-plan/review`, { ...L(teacher), body: { decision: 'approved', feedback: 'Clear milestones and measures.' } })).body as ActionPlan;
    expect(reviewed).toMatchObject({ status: 'approved', review: { reviewer: 'Tolu Teacher' }, can: { edit: false } });
  });

  it('assembles the portfolio from approved work, and publishes it at a link only while shared', async () => {
    const mine = (await request(learning, 'GET', `${base()}/portfolio`, L(learner))).body as Portfolio;
    expect(mine.sections.map((s) => s.key)).toHaveLength(8);
    expect(mine.sections.find((s) => s.key === 'my_dream')).toMatchObject({ complete: true, entries: [{ title: 'Dream Statement', scorePct: 80 }] });
    expect(mine.sections.find((s) => s.key === 'action_plan')).toMatchObject({ complete: true });
    expect(mine.sections.find((s) => s.key === 'final_demonstration')).toMatchObject({ complete: false, entries: [] });
    expect(mine.shareToken).toBeNull();

    const shared = (await request(learning, 'POST', `${base()}/portfolio/share`, { ...L(learner), body: { shared: true } })).body as Portfolio;
    expect(shared.shareToken).toMatch(/^[A-Za-z0-9_-]{40,}$/);
    expect((await request(learning, 'POST', `${base()}/portfolio/share`, { ...L(teacher), body: { shared: true } })).status).toBe(403);
    const published = await request(learning, 'GET', `/v1/learning/portfolios/${shared.shareToken}`);
    expect(published).toMatchObject({ status: 200, body: { learner: { name: 'Lara Learner' }, programTitle: expect.any(String), shareToken: null } });
    expect((await request(learning, 'POST', `${base()}/portfolio/share`, { ...L(learner), body: { shared: false } })).status).toBe(200);
    expect((await request(learning, 'GET', `/v1/learning/portfolios/${shared.shareToken}`)).status).toBe(404);
  });

  it('graduates only once faculty confirm every requirement, and issues a checkable credential', async () => {
    const before = (await request(learning, 'GET', `${base()}/graduation`, L(learner))).body as Graduation;
    expect(before.requirements).toHaveLength(10);
    expect(before).toMatchObject({ eligible: false, graduatedAt: null, can: { confirm: false, graduate: false } });
    expect(before.requirements.find((r) => r.key === 'post_lab_action_plan')).toMatchObject({ evidence: 'Approved', evidenceMet: true });
    expect(before.requirements.find((r) => r.key === 'residency_completion')).toMatchObject({ evidence: '1 of 7 residency stages approved', evidenceMet: false });

    expect((await request(learning, 'PUT', `${base()}/graduation/final_assessment`, { ...L(learner), body: { confirmed: true } })).status).toBe(403);
    expect((await request(learning, 'POST', `${base()}/graduate`, L(owner))).status).toBe(409);
    for (const r of before.requirements) {
      expect((await request(learning, 'PUT', `${base()}/graduation/${r.key}`, { ...L(teacher), body: { confirmed: true, note: 'Checked at review' } })).status).toBe(200);
    }
    const ready = (await request(learning, 'GET', `${base()}/graduation`, L(teacher))).body as Graduation;
    expect(ready).toMatchObject({ eligible: true, can: { confirm: true, graduate: false } });
    expect((await request(learning, 'POST', `${base()}/graduate`, L(teacher))).status).toBe(403);
    const graduated = (await request(learning, 'POST', `${base()}/graduate`, L(owner))).body as Graduation;
    expect(graduated.graduatedAt).not.toBeNull();
    expect(graduated.credentialCode).toMatch(/^DL-[2-9A-HJ-NP-Z]{4}-[2-9A-HJ-NP-Z]{4}-[2-9A-HJ-NP-Z]{4}$/);
    // Graduating again changes nothing; confirmations are closed.
    expect(((await request(learning, 'POST', `${base()}/graduate`, L(owner))).body as Graduation).credentialCode).toBe(graduated.credentialCode);
    expect((await request(learning, 'PUT', `${base()}/graduation/final_assessment`, { ...L(teacher), body: { confirmed: false } })).status).toBe(409);

    const code = graduated.credentialCode!;
    const checked = await request(learning, 'GET', `/v1/learning/credentials/${code}`);
    expect(checked).toMatchObject({ status: 200, body: { kind: 'programme_graduation', recipientName: 'Lara Learner', issuerName: 'Ibadan Lab', revoked: null } });
    expect(((await request(learning, 'GET', '/v1/learning/me/credentials', L(learner))).body as { items: Credential[] }).items.map((c) => c.code)).toContain(code);
    expect((await request(learning, 'GET', '/v1/learning/credentials/DL-AAAA-BBBB-CCCC')).status).toBe(404);

    expect((await request(learning, 'POST', `/v1/learning/credentials/${code}/revoke`, { ...L(learner), body: { reason: 'Mistake in records' } })).status).toBe(403);
    expect((await request(learning, 'POST', `/v1/learning/credentials/${code}/revoke`, { ...L(owner), body: { reason: 'Issued in error' } })).body).toMatchObject({ revoked: { reason: 'Issued in error' } });
    expect(((await request(learning, 'GET', `/v1/learning/credentials/${code}`)).body as Credential).revoked).toMatchObject({ reason: 'Issued in error' });
  });

  it('gives a course certificate once per completed course enrolment', async () => {
    const db = learning.get<DatabaseService<Record<string, unknown>>>(DATABASE);
    const { rows } = await db.systemPool.query<{ id: string }>(`update course_enrollments set status = 'completed', completed_at = now() where id = (select id from course_enrollments where program_enrollment_id = $1 limit 1) returning id`, [enrollmentId]);
    const event = { id: newId(), type: 'course_enrollment.completed', version: 1, source: 'learning', occurredAt: new Date().toISOString(), orgId, actor: { type: 'user' as const, id: learnerId }, payload: { enrollmentId: rows[0]!.id, userId: learnerId, finalScore: null } };
    const intake = learning.get(CertificatesIntake);
    await intake.handle(event);
    await intake.handle(event);
    await intake.handle({ ...event, id: newId() });
    const certificates = ((await request(learning, 'GET', '/v1/learning/me/credentials', L(learner))).body as { items: Credential[] }).items.filter((c) => c.kind === 'course_completion');
    expect(certificates).toHaveLength(1);
    expect(certificates[0]).toMatchObject({ recipientName: 'Lara Learner', issuerName: 'Ibadan Lab', revoked: null });
  });
});
