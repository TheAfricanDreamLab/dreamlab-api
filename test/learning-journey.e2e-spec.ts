/**
 * Cross-service journey (CAT-1, LRN-1, PLT-1): IAM, catalog and learning run together against real
 * Postgres, Redis and RabbitMQ. Tokens come from IAM; catalog and learning verify them through
 * IAM's JWKS over HTTP and talk to each other over RabbitMQ RPC, as in production.
 */
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { Test } from '@nestjs/testing';
import { isAppRoute, type AppRoute, type AppRouter } from '@ts-rest/core';
import { AccessToken } from 'livekit-server-sdk';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  AdmissionCycle,
  apiV1Contract,
  Application,
  BlockAuthoring,
  BlockResponse,
  CohortDetail,
  Draft,
  DraftComment,
  LibraryVideo,
  Presence,
  VideoUploadLink,
  VideoManifestSchema,
  ProgramAuthoring,
  ProgramDetail,
  videoBlockId,
  CourseAuthoringSchema,
  CourseProgress,
  Enrollment,
  ItemAuthoring,
  ItemView,
  isInteractiveBlock,
  CircleProgress,
  CirclePost,
  CirclePostPage,
  CohortEngagement,
  CompletionFunnel,
  OnTrack,
  ProgramOnTrack,
  CircleSpace,
  CircleUploadTicket,
  MyCommunity,
  MyProgram,
  Notification,
  SubmissionFileUpload,
  SubmissionForGrading,
} from '@dreamlab/contracts';
import { IAM_RPC_QUEUE } from '@lib/auth';
import { buildOpenApiDocument, installGatewayTrust, installWebhookBodyParser, REDIS } from '@lib/common';
import { loadConfig } from '@lib/config';
import { DATABASE, DatabaseService, runMigrations } from '@lib/database';
import { CATALOG_RPC_QUEUE } from '@lib/rpc';
import type { EmailMessage, EmailSender } from '@lib/email';
import { type LiveRole, MeetKit } from '@lib/meet-kit';
import type { BlobStorage } from '@lib/storage';
import { E2E_GATEWAY_TOKEN, eventually, request, testEnv } from '@lib/testing';
import { and, eq } from 'drizzle-orm';
import type Redis from 'ioredis';
import { Logger } from 'nestjs-pino';
import { CatalogAppModule } from '../apps/catalog/src/app.module';
import { catalogConfigSchema } from '../apps/catalog/src/config';
import { catalogMigrationsFolder } from '../apps/catalog/src/database';
import { CatalogSeedService } from '../apps/catalog/src/modules/seed/catalog-seed.service';
import { STORAGE as CATALOG_STORAGE } from '../apps/catalog/src/modules/authoring/authoring.service';
import { VideoWorker } from '../apps/catalog/src/modules/videos/video-worker';
import { CatalogRpcController } from '../apps/catalog/src/modules/courses/catalog-rpc.controller';
import { DATASETS } from '../apps/catalog/src/modules/seed/datasets';
import { IamAppModule } from '../apps/iam/src/app.module';
import { iamConfigSchema } from '../apps/iam/src/config';
import { iamMigrationsFolder } from '../apps/iam/src/database';
import type { AccountNotice, Notifier, OtpMessage } from '../apps/iam/src/modules/notifications/interfaces/notifier.interface';
import { schema as iamSchema } from '../apps/iam/src/database';
import { NOTIFIER } from '../apps/iam/src/modules/notifications/notifier.service';
import { SeedService } from '../apps/iam/src/modules/seed/seed.service';
import { LearningAppModule } from '../apps/learning/src/app.module';
import { learningConfigSchema } from '../apps/learning/src/config';
import { learningMigrationsFolder, schema as learningSchema } from '../apps/learning/src/database';
import { addDays, todayIn, zonedTime } from '../apps/learning/src/modules/cohorts/calendar-time';
import { SessionRemindersService } from '../apps/learning/src/modules/cohorts/session-reminders.service';
import { CircleSchedulerService } from '../apps/learning/src/modules/community/circle-scheduler.service';
import { ProgressRemindersService } from '../apps/learning/src/modules/engagement/progress-reminders.service';
import { MEET_KIT } from '../apps/learning/src/modules/community/live.service';
import { FilesService, STORAGE } from '../apps/learning/src/modules/files/files.service';
import { AdmissionsAppModule } from '../apps/admissions/src/app.module';
import { admissionsConfigSchema } from '../apps/admissions/src/config';
import { admissionsMigrationsFolder } from '../apps/admissions/src/database';
import { AI_EVALUATOR } from '../apps/admissions/src/modules/admissions/admissions.service';
import { NotifyAppModule } from '../apps/notify/src/app.module';
import { notifyConfigSchema } from '../apps/notify/src/config';
import { notifyMigrationsFolder } from '../apps/notify/src/database';
import { EMAIL_SENDER } from '../apps/notify/src/modules/notifications/notification-intake.service';

class CapturingNotifier implements Notifier {
  otps: OtpMessage[] = [];
  notices: AccountNotice[] = [];
  async sendAccountNotice(m: AccountNotice) {
    this.notices.push(m);
  }
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
  to(address: string) {
    return this.sent.filter((m) => m.to === address);
  }
}
const mail = new CapturingEmail();

/** My notifications, once at least `min` match (they arrive through the outbox and RabbitMQ). */
async function notificationsFor(token: string, match: (n: Notification) => boolean, min = 1): Promise<Notification[]> {
  return eventually(async () => {
    const items = ((await request(notify, 'GET', '/v1/notifications', { token })).body as { items: Notification[] }).items;
    return items.filter(match).length >= min ? items : null;
  }) as Promise<Notification[]>;
}
const consent = { termsVersion: '2026-10', privacyVersion: '2026-10' };
const course = CourseAuthoringSchema.parse(DATASETS['dream-lab-test'].courses.find((c) => c.slug === 'problem-solving'));
const authored = new Map(course.modules!.flatMap((m) => m.items).map((i) => [i.key, i] as const));

let iam: NestFastifyApplication;
let catalog: NestFastifyApplication;
let learning: NestFastifyApplication;
let notify: NestFastifyApplication;
let admissions: NestFastifyApplication;

/** Stands in for Claude: the e2e run never calls the API. */
const fakeEvaluator = {
  enabled: true,
  evaluations: 0,
  async evaluate() {
    this.evaluations += 1;
    const scores = { dream_clarity: 4, problem_insight: 4, evidence_of_action: 3, builder_mindset: 4, commitment: 5, communication: 3 };
    return { model: 'claude-test', promptVersion: 'test-1', scores, rationale: 'Concrete evidence of a dryer built and sold; the plan to test demand is specific.' };
  },
};

async function boot(module: unknown, rpcQueue: string | null, rabbitUrl: string): Promise<NestFastifyApplication> {
  const builder = Test.createTestingModule({ imports: [module as never] });
  if (module === iamModule) builder.overrideProvider(NOTIFIER).useValue(notifier);
  if (module === learningModule) builder.overrideProvider(MEET_KIT).useValue(meetKit);
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
let iamModule: unknown;
let learningModule: unknown;

/** LiveKit settings for learning: the real webhook verification, with no media server behind it. */
const LIVEKIT_ENV = { LIVEKIT_URL: 'ws://livekit.test', LIVEKIT_API_KEY: 'e2e-key', LIVEKIT_API_SECRET: 'e2e-livekit-secret-0123456789', MEETINGS_ROOM_PREFIX: 'dl-e2e' };

/** The real MeetKit (room names, webhook checks) except that joining hands out a token without a server. */
class TestMeetKit extends MeetKit {
  joins: { roomName: string; identity: string; role: LiveRole; participantVideo: boolean }[] = [];
  override async join(roomName: string, identity: string, _name: string, role: LiveRole, _emptyTimeoutMin?: number, options: { participantVideo?: boolean } = {}) {
    this.joins.push({ roomName, identity, role, participantVideo: options.participantVideo ?? false });
    return { url: LIVEKIT_ENV.LIVEKIT_URL, token: `test-token-${role}`, roomName, expiresAt: new Date(Date.now() + 3_600_000) };
  }  override async participantCount() {
    return 0;
  }
}
let meetKit: TestMeetKit;

/** A LiveKit webhook as the server sends it: JSON body, signed with the API key and secret. */
async function liveKitWebhook(event: Record<string, unknown>) {
  const body = JSON.stringify(event);
  const at = new AccessToken(LIVEKIT_ENV.LIVEKIT_API_KEY, LIVEKIT_ENV.LIVEKIT_API_SECRET);
  at.sha256 = createHash('sha256').update(body).digest('base64');
  return learning.inject({ method: 'POST', url: '/v1/learning/meetings/webhook', payload: body, headers: { 'content-type': 'application/webhook+json', authorization: await at.toJwt() } });
}

async function signUp(email: string, fullName: string) {
  const reg = await request(iam, 'POST', '/v1/auth/register', { body: { email, password: 'correct horse battery', fullName, consent } });
  const registrationToken = (reg.body as { registrationToken: string }).registrationToken;
  const res = await request(iam, 'POST', '/v1/auth/verify', { body: { identifier: email, code: notifier.lastCode(email), registrationToken } });
  expect(res.status).toBe(200);
  return (res.body as { accessToken: string }).accessToken;
}

/** The right answer to an authored block (the test knows the answers; learners never receive them). */
function rightAnswer(block: BlockAuthoring): BlockResponse {
  switch (block.type) {
    case 'choice':
      return { type: 'choice', optionIds: block.options.filter((o) => o.correct).map((o) => o.id) };
    case 'order':
      return { type: 'order', itemIds: block.items.map((i) => i.id) };
    case 'match':
      return { type: 'match', matches: Object.fromEntries(block.pairs.map((p) => [p.id, p.id])) };
    case 'poll':
      return { type: 'poll', optionId: block.options[0]!.id };
    case 'scale':
      return { type: 'scale', value: 4 };
    case 'reflection':
      return { type: 'reflection', text: Array.from({ length: Math.max(block.minWords, 1) + 5 }, (_, i) => `word${i}`).join(' ') };
    case 'scenario':
      return { type: 'scenario', optionId: (block.options.find((o) => o.best) ?? block.options[0]!).id };
    default:
      throw new Error(`not interactive: ${block.type}`);
  }
}

function wrongAnswer(block: Extract<BlockAuthoring, { type: 'choice' }>): BlockResponse | null {
  const wrong = block.options.find((o) => !o.correct);
  if (!wrong) return null;
  return { type: 'choice', optionIds: [wrong.id] };
}

const L = (token: string) => ({ token });

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

  const learningConfig = loadConfig(learningConfigSchema, testEnv({ IAM_JWKS_URL: jwks, ...LIVEKIT_ENV }));
  await runMigrations(learningConfig.LEARNING_MIGRATION_DATABASE_URL!, learningMigrationsFolder());
  meetKit = new TestMeetKit(learningConfig);
  learningModule = LearningAppModule.forRoot(learningConfig);
  learning = await boot(learningModule, null, learningConfig.RABBITMQ_URL);
  await learning.init();
  await learning.getHttpAdapter().getInstance().ready();
  await learning.get<BlobStorage>(STORAGE).prepareForDevelopment();

  const notifyConfig = loadConfig(notifyConfigSchema, testEnv({ IAM_JWKS_URL: jwks, PUBLIC_APP_URL: 'https://learn.test' }));
  await runMigrations(notifyConfig.NOTIFY_MIGRATION_DATABASE_URL!, notifyMigrationsFolder());
  const notifyRef = await Test.createTestingModule({ imports: [NotifyAppModule.forRoot(notifyConfig)] }).overrideProvider(EMAIL_SENDER).useValue(mail).compile();
  notify = notifyRef.createNestApplication<NestFastifyApplication>(new FastifyAdapter(), { bufferLogs: true });
  notify.useLogger(notify.get(Logger));
  installGatewayTrust(notify.getHttpAdapter().getInstance(), E2E_GATEWAY_TOKEN);
  await notify.init();
  await notify.getHttpAdapter().getInstance().ready();

  const admissionsConfig = loadConfig(admissionsConfigSchema, testEnv({ IAM_JWKS_URL: jwks }));
  await runMigrations(admissionsConfig.ADMISSIONS_MIGRATION_DATABASE_URL!, admissionsMigrationsFolder());
  const admissionsRef = await Test.createTestingModule({ imports: [AdmissionsAppModule.forRoot(admissionsConfig)] }).overrideProvider(AI_EVALUATOR).useValue(fakeEvaluator).compile();
  admissions = admissionsRef.createNestApplication<NestFastifyApplication>(new FastifyAdapter(), { bufferLogs: true });
  admissions.useLogger(admissions.get(Logger));
  installGatewayTrust(admissions.getHttpAdapter().getInstance(), E2E_GATEWAY_TOKEN);
  await admissions.init();
  await admissions.getHttpAdapter().getInstance().ready();
}, 180_000);

afterAll(async () => {
  await admissions?.close();
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
  it.each([
    ['catalog', () => catalog, apiV1Contract.catalog],
    ['learning', () => learning, apiV1Contract.learning],
    ['learning (cohorts)', () => learning, apiV1Contract.cohorts],
    ['learning (grading)', () => learning, apiV1Contract.grading],
    ['catalog (authoring)', () => catalog, apiV1Contract.authoring],
    ['notify', () => notify, apiV1Contract.notifications],
    ['admissions', () => admissions, apiV1Contract.admissions],
    ['learning (live and community)', () => learning, apiV1Contract.community],
    ['catalog (instructors)', () => catalog, apiV1Contract.instructors],
    ['learning (staying on track)', () => learning, apiV1Contract.engagement],
  ] as const)('the %s service serves every one of its contract routes', (_name, app, router) => {
    const doc = buildOpenApiDocument(app(), { title: 't', description: 'd', version: '0' });
    const missing = routes(router)
      .map((r) => ({ method: r.method.toLowerCase(), path: r.path.replace(/:(\w+)/g, '{$1}') }))
      .filter((r) => !(doc.paths[r.path] as Record<string, unknown> | undefined)?.[r.method]);
    expect(missing).toEqual([]);
  });
});

describe('catalog', () => {
  it('lists the featured Problem Solving course first, and every Dream Lab course open for enrolment', async () => {
    const res = await request(catalog, 'GET', '/v1/catalog/courses');
    expect(res.status).toBe(200);
    const items = (res.body as { items: { slug: string; featured: boolean; availability: string; programs: { slug: string }[] }[] }).items;
    expect(items[0]).toMatchObject({ slug: 'problem-solving', featured: true, availability: 'available', programs: [{ slug: 'the-african-dream-lab' }] });
    expect(items).toHaveLength(13);
    expect(items.filter((i) => i.availability !== 'available').map((i) => i.slug)).toEqual([]);
    const search = await request(catalog, 'GET', '/v1/catalog/courses?q=negotiat');
    expect((search.body as { items: { slug: string }[] }).items.map((i) => i.slug)).toEqual(['negotiation']);
  });

  it('shows a syllabus without any lesson content', async () => {
    const res = await request(catalog, 'GET', '/v1/catalog/courses/problem-solving');
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ slug: 'problem-solving', versionNo: 1, availability: 'available' });
    expect(res.body).toMatchObject({ trailer: { provider: 'youtube', videoId: expect.stringMatching(/^[\w-]{11}$/) }, cover: { imageUrl: expect.stringMatching(/^https:\/\//) } });
    expect(JSON.stringify(res.body)).not.toMatch(/"steps"|"correct"|"payload"/);
    expect((await request(catalog, 'GET', '/v1/catalog/courses/no-such-course')).status).toBe(404);
  });

  it('describes the programme: 100 credits, 7 residency stages, 10 graduation requirements, 15 weeks', async () => {
    const res = await request(catalog, 'GET', '/v1/catalog/programs/the-african-dream-lab');
    expect(res.status).toBe(200);
    const p = res.body as { creditTotal: number; weeks: number; capstoneStages: unknown[]; graduationRequirements: unknown[]; phases: { creditHours: number; chooseN: number | null }[] };
    expect(p.creditTotal).toBe(100);
    expect(p.weeks).toBe(15);
    expect(p.capstoneStages).toHaveLength(7);
    expect(p.graduationRequirements).toHaveLength(10);
    expect(p.phases.map((ph) => ph.creditHours).slice(0, 4)).toEqual([25, 20, 10, 45]);
    expect(p.phases.find((ph) => ph.chooseN === 1)).toBeDefined();
  });

  it('exports a programme for the browser editor; importing it unchanged changes nothing', async () => {
    const admin = ((await request(iam, 'POST', '/v1/auth/login', { body: { identifier: 'admin@theafricandreamlab.com', password: 'e2e-admin-password' } })).body as { accessToken: string }).accessToken;
    const before = (await request(catalog, 'GET', '/v1/catalog/programs/the-african-dream-lab')).body as Record<string, unknown>;
    const exported = await request(catalog, 'GET', '/v1/catalog/admin/programs/the-african-dream-lab', L(admin));
    expect(exported.status).toBe(200);
    expect(exported.body).toMatchObject({ slug: 'the-african-dream-lab', capstoneStages: expect.any(Array), calendar: expect.any(Array) });
    expect((await request(catalog, 'POST', '/v1/catalog/admin/programs/import', { ...L(admin), body: exported.body })).status).toBe(200);
    const after = (await request(catalog, 'GET', '/v1/catalog/programs/the-african-dream-lab')).body as Record<string, unknown>;
    const strip = (d: Record<string, unknown>) => JSON.parse(JSON.stringify(d, (k, v) => (k === 'id' ? undefined : v)));
    expect(strip(after)).toEqual(strip(before));
    expect((await request(catalog, 'GET', '/v1/catalog/admin/programs/the-african-dream-lab', L(await signUp('nosy@example.com', 'Nosy Learner')))).status).toBe(403);

    // LRN-9: weeks are learning weeks unless marked as catch-up weeks; the kind is kept and shown.
    const authored = exported.body as ProgramAuthoring;
    expect(authored.calendar.every((w) => w.kind === 'learning')).toBe(true);
    const calendar = authored.calendar.map((w) => (w.weekNo === 8 ? { ...w, kind: 'catch_up' } : w));
    expect((await request(catalog, 'POST', '/v1/catalog/admin/programs/import', { ...L(admin), body: { ...authored, calendar } })).status).toBe(200);
    const marked = (await request(catalog, 'GET', '/v1/catalog/programs/the-african-dream-lab')).body as ProgramDetail;
    expect(marked.calendar.filter((w) => w.kind === 'catch_up').map((w) => w.weekNo)).toEqual([8]);
    expect((await request(catalog, 'GET', '/v1/catalog/admin/programs/the-african-dream-lab', L(admin))).body).toMatchObject({ calendar: expect.arrayContaining([expect.objectContaining({ weekNo: 8, kind: 'catch_up' })]) });
    // Learning gets the calendar, kind included, over RPC when it schedules a cohort.
    const rpc = (await catalog.get(CatalogRpcController).program({ slug: 'the-african-dream-lab' })) as ProgramDetail;
    expect(rpc.calendar.find((w) => w.weekNo === 8)).toMatchObject({ kind: 'catch_up' });
    // Without the field (older programme files), every week is a learning week again.
    const unmarked = authored.calendar.map(({ kind: _kind, ...w }) => w);
    expect((await request(catalog, 'POST', '/v1/catalog/admin/programs/import', { ...L(admin), body: { ...authored, calendar: unmarked } })).status).toBe(200);
    expect(strip((await request(catalog, 'GET', '/v1/catalog/programs/the-african-dream-lab')).body as Record<string, unknown>)).toEqual(strip(before));
  });

  it('re-seeding identical content publishes no new version', async () => {
    await catalog.get(CatalogSeedService).run(DATASETS['dream-lab-test'], 'platform');
    expect((await request(catalog, 'GET', '/v1/catalog/courses/problem-solving')).body).toMatchObject({ versionNo: 1 });
  });
});

describe('learning journey', () => {
  let amina: string;
  let kwame: string;
  let enrollment: Enrollment;

  beforeAll(async () => {
    amina = await signUp('amina@example.com', 'Amina Bello');
    kwame = await signUp('kwame@example.com', 'Kwame Mensah');
  });

  it('needs a sign-in to enrol, and enrolling twice returns the same enrolment', async () => {
    expect((await request(learning, 'POST', '/v1/learning/enrollments', { body: { courseSlug: 'problem-solving' } })).status).toBe(401);
    const first = await request(learning, 'POST', '/v1/learning/enrollments', { ...L(amina), body: { courseSlug: 'problem-solving' } });
    expect(first.status).toBe(201);
    enrollment = first.body as Enrollment;
    expect(enrollment).toMatchObject({ courseSlug: 'problem-solving', contextOrgId: null, status: 'active', progressPct: 0 });
    const again = await request(learning, 'POST', '/v1/learning/enrollments', { ...L(amina), body: { courseSlug: 'problem-solving' } });
    expect((again.body as Enrollment).id).toBe(enrollment.id);
    // A course with an outline but no content yet cannot be joined.
    const seed = catalog.get(CatalogSeedService);
    await seed.importCourse({ ...course, slug: 'coming-soon-test', title: 'Coming soon (test)', modules: undefined }, await seed.resolveOwner('platform'));
    const soon = await request(learning, 'POST', '/v1/learning/enrollments', { ...L(amina), body: { courseSlug: 'coming-soon-test' } });
    expect(soon).toMatchObject({ status: 409, body: { code: 'course_not_open' } });
  });

  it('plays a lesson: server-checked answers, solutions after two tries, polls, reflections, completion', async () => {
    const progress = (await request(learning, 'GET', '/v1/learning/courses/problem-solving', L(amina))).body as CourseProgress;
    const first = progress.nextItem!;
    const view = (await request(learning, 'GET', `/v1/learning/enrollments/${enrollment.id}/items/${first.id}`, L(amina))).body as ItemView;
    expect(view.item.type).toBe('lesson');
    expect(JSON.stringify(view.content)).not.toMatch(/"correct"|"explanation"|"feedback"|"outcome"/);

    const lesson = authored.get(view.item.key) as Extract<ItemAuthoring, { type: 'lesson' }>;
    const blocks = lesson.payload.steps.flatMap((s) => s.blocks).filter(isInteractiveBlock);
    expect(blocks.length).toBeGreaterThan(0);
    const url = `/v1/learning/enrollments/${enrollment.id}/items/${first.id}`;

    const early = await request(learning, 'PUT', `${url}/progress`, { ...L(amina), body: { stepIndex: 0, complete: true } });
    expect(early).toMatchObject({ status: 409, body: { code: 'lesson_incomplete' } });

    for (const block of blocks) {
      if (block.type === 'choice') {
        const wrong = wrongAnswer(block);
        if (wrong) {
          const once = await request(learning, 'POST', `${url}/checks`, { ...L(amina), body: { blockId: block.id, response: wrong } });
          expect(once.body).toMatchObject({ correct: false, solution: null, canRetry: true });
          const twice = await request(learning, 'POST', `${url}/checks`, { ...L(amina), body: { blockId: block.id, response: wrong } });
          expect(twice.body).toMatchObject({ correct: false, canRetry: false, solution: { optionIds: expect.any(Array) } });
          continue;
        }
      }
      const res = await request(learning, 'POST', `${url}/checks`, { ...L(amina), body: { blockId: block.id, response: rightAnswer(block) } });
      expect(res.status).toBe(200);
      if (block.type === 'poll' || block.type === 'scale') expect(Object.values(res.body.distribution).reduce((a: number, b) => a + (b as number), 0)).toBeGreaterThanOrEqual(1);
      if (['choice', 'order', 'match'].includes(block.type)) expect(res.body.correct).toBe(true);
    }
    const done = await request(learning, 'PUT', `${url}/progress`, { ...L(amina), body: { stepIndex: lesson.payload.steps.length - 1, complete: true } });
    expect(done.status).toBe(200);
    expect(done.body).toMatchObject({ status: 'completed', courseCompleted: false, enrollment: { completedItems: 1 } });
    expect((done.body as { enrollment: Enrollment }).enrollment.progressPct).toBeGreaterThan(0);

    const after = (await request(learning, 'GET', '/v1/learning/courses/problem-solving', L(amina))).body as CourseProgress;
    expect(after.itemStatus[first.id]).toBe('completed');
    expect(after.nextItem!.id).not.toBe(first.id);
  });

  it('grades quizzes: feedback straight away, solutions once passed', async () => {
    const quizKey = [...authored.values()].find((i) => i.type === 'quiz')!.key;
    const quiz = authored.get(quizKey) as Extract<ItemAuthoring, { type: 'quiz' }>;
    const progress = (await request(learning, 'GET', '/v1/learning/courses/problem-solving', L(amina))).body as CourseProgress;
    const itemId = progress.course.modules.flatMap((m) => m.items).find((i) => i.key === quizKey)!.id;
    const url = `/v1/learning/enrollments/${enrollment.id}/items/${itemId}/quiz-attempts`;

    const wrong = Object.fromEntries(
      quiz.payload.questions.map((q) => [q.id, q.type === 'choice' && wrongAnswer(q) ? wrongAnswer(q)! : rightAnswer({ ...q, type: q.type } as BlockAuthoring)]),
    );
    const allWrongPossible = quiz.payload.questions.filter((q) => q.type === 'choice' && wrongAnswer(q)).length;
    if (allWrongPossible / quiz.payload.questions.length > 1 - quiz.payload.passPct / 100) {
      const failed = await request(learning, 'POST', url, { ...L(amina), body: { answers: wrong } });
      expect(failed.status).toBe(201);
      expect(failed.body).toMatchObject({ attemptNo: 1, passed: false });
      expect((failed.body as { results: { solution: unknown }[] }).results.every((r) => r.solution === null)).toBe(true);
    }
    const right = Object.fromEntries(quiz.payload.questions.map((q) => [q.id, rightAnswer(q)]));
    const passed = await request(learning, 'POST', url, { ...L(amina), body: { answers: right } });
    expect(passed.body).toMatchObject({ scorePct: 100, passed: true });
    expect((passed.body as { results: { solution: unknown }[] }).results.every((r) => r.solution !== null)).toBe(true);
  });

  it('takes versioned assignment submissions and discussion posts visible to peers after posting', async () => {
    const progress = (await request(learning, 'GET', '/v1/learning/courses/problem-solving', L(amina))).body as CourseProgress;
    const items = progress.course.modules.flatMap((m) => m.items);
    const assignment = items.find((i) => i.type === 'assignment')!;
    const aUrl = `/v1/learning/enrollments/${enrollment.id}/items/${assignment.id}/submissions`;
    expect((await request(learning, 'POST', aUrl, { ...L(amina), body: { text: 'too short' } })).body).toMatchObject({ code: 'submission_too_short' });
    const canvas = Array.from({ length: 300 }, (_, i) => `w${i}`).join(' ');
    const v1 = await request(learning, 'POST', aUrl, { ...L(amina), body: { text: canvas, link: null, selfAssessment: { nonsense: true } } });
    expect(v1).toMatchObject({ status: 201, body: { version: 1, selfAssessment: {} } });
    const v2 = await request(learning, 'POST', aUrl, { ...L(amina), body: { text: canvas } });
    expect(v2.body).toMatchObject({ version: 2 });

    const discussion = items.find((i) => i.type === 'discussion')!;
    const words = Array.from({ length: 150 }, (_, i) => `thought${i}`).join(' ');
    const aminaUrl = `/v1/learning/enrollments/${enrollment.id}/items/${discussion.id}/discussion`;
    const posted = await request(learning, 'POST', aminaUrl, { ...L(amina), body: { body: words } });
    expect(posted).toMatchObject({ status: 201, body: { hasPosted: true, postCount: 1, posts: [{ author: { name: 'You', isMe: true } }] } });

    const kEnrol = (await request(learning, 'POST', '/v1/learning/enrollments', { ...L(kwame), body: { courseSlug: 'problem-solving' } })).body as Enrollment;
    const kView = (await request(learning, 'GET', `/v1/learning/enrollments/${kEnrol.id}/items/${discussion.id}`, L(kwame))).body as ItemView;
    expect(kView.discussion).toMatchObject({ hasPosted: false, postCount: 1, posts: [] });
    const kUrl = `/v1/learning/enrollments/${kEnrol.id}/items/${discussion.id}/discussion`;
    const kPosted = (await request(learning, 'POST', kUrl, { ...L(kwame), body: { body: words } })).body as ItemView['discussion'];
    expect(kPosted!.posts.map((p) => p.author.name).sort()).toEqual(['Amina Bello', 'You']);
    const reply = await request(learning, 'POST', kUrl, { ...L(kwame), body: { body: 'Great point', parentId: kPosted!.posts.find((p) => !p.author.isMe)!.id } });
    expect((reply.body as NonNullable<ItemView['discussion']>).posts.find((p) => !p.author.isMe)!.replies).toHaveLength(1);

    // Row-level security: Kwame cannot open Amina's enrolment.
    expect((await request(learning, 'GET', `/v1/learning/enrollments/${enrollment.id}/items/${discussion.id}`, L(kwame))).status).toBe(404);
  });

  it('collects reflections in the journal and lists my courses', async () => {
    const journal = await request(learning, 'GET', '/v1/learning/journal', L(amina));
    expect((journal.body as { items: { course: { slug: string } }[] }).items[0]).toMatchObject({ course: { slug: 'problem-solving' } });
    const mine = await request(learning, 'GET', '/v1/learning/enrollments', L(amina));
    expect((mine.body as { items: unknown[] }).items[0]).toMatchObject({ courseSlug: 'problem-solving', course: { title: 'Problem Solving' }, nextItem: expect.any(Object) });
  });

  describe('platform admin', () => {
    let admin: string;
    beforeAll(async () => {
      const res = await request(iam, 'POST', '/v1/auth/login', { body: { identifier: 'admin@theafricandreamlab.com', password: 'e2e-admin-password' } });
      admin = (res.body as { accessToken: string }).accessToken;
    });

    it('is closed to learners', async () => {
      expect((await request(iam, 'GET', '/v1/platform/overview', L(amina))).status).toBe(403);
      expect((await request(catalog, 'GET', '/v1/catalog/admin/courses', L(amina))).status).toBe(403);
      expect((await request(learning, 'GET', '/v1/learning/admin/stats', L(amina))).status).toBe(403);
    });

    it('sees people, organisations and learning across the platform', async () => {
      const overview = await request(iam, 'GET', '/v1/platform/overview', L(admin));
      expect(overview.status).toBe(200);
      expect((overview.body as { users: { total: number }; signups: unknown[] }).signups).toHaveLength(14);
      const found = await request(iam, 'GET', '/v1/platform/users?q=amina', L(admin));
      expect((found.body as { items: { email: string }[] }).items.map((u) => u.email)).toEqual(['amina@example.com']);
      const stats = await request(learning, 'GET', '/v1/learning/admin/stats', L(admin));
      expect(stats.body).toMatchObject({ enrollments: 2, courses: [{ slug: 'problem-solving', title: 'Problem Solving', enrolled: 2 }] });
    });

    it('suspends a person: their sessions end at once and they cannot sign in; reactivating restores access', async () => {
      const kwameId = ((await request(iam, 'GET', '/v1/platform/users?q=kwame', L(admin))).body as { items: { id: string }[] }).items[0]!.id;
      const status = (body: Record<string, unknown>) => request(iam, 'POST', `/v1/platform/users/${kwameId}/status`, { ...L(admin), body });
      const signIn = () => request(iam, 'POST', '/v1/auth/login', { body: { identifier: 'kwame@example.com', password: 'correct horse battery' } });
      notifier.notices.length = 0;

      // Open suspension, with a message for the person.
      const suspended = await status({ status: 'suspended', reason: 'Spam in discussions', message: 'Please read the community rules.' });
      expect(suspended).toMatchObject({
        status: 200,
        body: { status: 'suspended', suspendedUntil: null, activeSessions: 0, statusChange: { status: 'suspended', reason: 'Spam in discussions', message: 'Please read the community rules.', until: null } },
      });
      expect((suspended.body as { statusChange: { by: { name: string } } }).statusChange.by).not.toBeNull();
      expect((await request(learning, 'GET', '/v1/learning/enrollments', L(kwame))).status).toBe(401);
      expect(await signIn()).toMatchObject({ status: 403, body: { code: 'account_suspended', details: { status: 'suspended', until: null, message: 'Please read the community rules.' } } });
      expect(notifier.notices.at(-1)).toMatchObject({ destination: 'kwame@example.com', status: 'suspended', until: null });

      // A timed suspension shows its end; once it has passed it lifts itself.
      const until = new Date(Date.now() + 7 * 86_400_000).toISOString();
      expect((await status({ status: 'suspended', reason: 'A week out', until, notify: false })).body).toMatchObject({ status: 'suspended', suspendedUntil: until });
      expect(await signIn()).toMatchObject({ status: 403, body: { code: 'account_suspended', details: { until } } });
      expect((await request(iam, 'GET', '/v1/platform/users?status=suspended', L(admin))).body).toMatchObject({ items: [{ id: kwameId, suspendedUntil: until }] });
      // Wind the clock forward: the end has passed.
      const iamDb = iam.get<DatabaseService<typeof iamSchema>>(DATABASE);
      await iamDb.sys.update(iamSchema.users).set({ suspendedUntil: new Date(Date.now() - 1000) }).where(eq(iamSchema.users.id, kwameId));
      // Code sign-in works straight away, before anyone opens an admin page (which would lift it too).
      const codesBefore = notifier.otps.filter((o) => o.destination === 'kwame@example.com').length;
      expect((await request(iam, 'POST', '/v1/auth/otp', { body: { identifier: 'kwame@example.com', purpose: 'login' } })).status).toBeLessThan(300);
      const codes = notifier.otps.filter((o) => o.destination === 'kwame@example.com');
      expect(codes).toHaveLength(codesBefore + 1);
      const viaCode = await request(iam, 'POST', '/v1/auth/login/otp', { body: { identifier: 'kwame@example.com', code: codes.at(-1)!.code } });
      expect(viaCode.status).toBe(200);
      expect((await signIn()).status).toBe(200);
      expect((await request(iam, 'GET', `/v1/platform/users/${kwameId}`, L(admin))).body).toMatchObject({ status: 'active', suspendedUntil: null });

      // Banned: closed, counted, and filterable; reinstating lets them back in.
      expect((await status({ status: 'banned', reason: 'Repeated fraud' })).body).toMatchObject({ status: 'banned', activeSessions: 0 });
      expect(await signIn()).toMatchObject({ status: 403, body: { code: 'account_banned', details: { status: 'banned', until: null } } });
      expect(notifier.notices.at(-1)).toMatchObject({ status: 'banned' });
      expect((await request(iam, 'GET', '/v1/platform/overview', L(admin))).body).toMatchObject({ users: { banned: 1 } });
      expect((await request(iam, 'GET', '/v1/platform/users?status=banned', L(admin))).body).toMatchObject({ items: [{ id: kwameId, status: 'banned' }] });
      expect((await status({ status: 'banned', reason: 'x', until })).status).toBe(400);

      await status({ status: 'active', reason: 'Appeal accepted' });
      expect(notifier.notices.at(-1)).toMatchObject({ status: 'active' });
      expect((await signIn()).status).toBe(200);
    });

    it('hides, features and imports courses; enrolled learners stay on their version', async () => {
      const list = (await request(catalog, 'GET', '/v1/catalog/admin/courses', L(admin))).body as { items: { id: string; slug: string }[] };
      const negotiation = list.items.find((c) => c.slug === 'negotiation')!;
      const hidden = await request(catalog, 'PATCH', `/v1/catalog/admin/courses/${negotiation.id}`, { ...L(admin), body: { listed: false } });
      expect(hidden.body).toMatchObject({ listed: false });
      const browse = (await request(catalog, 'GET', '/v1/catalog/courses')).body as { items: { slug: string }[] };
      expect(browse.items.map((c) => c.slug)).not.toContain('negotiation');
      await request(catalog, 'PATCH', `/v1/catalog/admin/courses/${negotiation.id}`, { ...L(admin), body: { listed: true } });

      const edited = { ...course, modules: course.modules!.map((m, i) => (i === 0 ? { ...m, summary: `${m.summary} (revised)` } : m)) };
      const imported = await request(catalog, 'POST', '/v1/catalog/admin/courses/import', { ...L(admin), body: edited });
      expect(imported).toMatchObject({ status: 200, body: { slug: 'problem-solving', published: true, versionNo: 2 } });
      expect((await request(catalog, 'POST', '/v1/catalog/admin/courses/import', { ...L(admin), body: edited })).body).toMatchObject({ published: false, versionNo: 2 });
      const bad = await request(catalog, 'POST', '/v1/catalog/admin/courses/import', { ...L(admin), body: { slug: 'x' } });
      expect(bad.status).toBe(400);

      const aminaView = (await request(learning, 'GET', '/v1/learning/courses/problem-solving', L(amina))).body as CourseProgress;
      expect(aminaView.course.versionNo).toBe(1);
      expect(aminaView.enrollment!.versionId).toBe(enrollment.versionId);
    });
  });
});

describe('cohorts (LRN-2)', () => {
  let host: string;
  let ada: string;
  let tunde: string;
  let hostOrgId: string;
  let cohort: CohortDetail;

  beforeAll(async () => {
    const admin = ((await request(iam, 'POST', '/v1/auth/login', { body: { identifier: 'admin@theafricandreamlab.com', password: 'e2e-admin-password' } })).body as { accessToken: string })
      .accessToken;
    const personal = await signUp('host@lagos-hub.test', 'Halima Host');
    const org = await request(iam, 'POST', '/v1/orgs', {
      token: admin,
      body: { slug: 'lagos-hub', name: 'Lagos Hub', kinds: ['enterprise'], firstAdmin: { email: 'host@lagos-hub.test' } },
    });
    expect(org.status).toBe(201);
    hostOrgId = (org.body as { id: string }).id;
    host = ((await request(iam, 'POST', '/v1/auth/switch-org', { token: personal, body: { orgId: hostOrgId } })).body as { accessToken: string }).accessToken;
    ada = await signUp('ada.obi@cohort.test', 'Ada Obi');
    tunde = await signUp('tunde.bakare@cohort.test', 'Tunde Bakare');
  });

  it('schedules a cohort: dated calendar, a run per course and the weekly classes', async () => {
    const body = { programSlug: 'the-african-dream-lab', name: 'Cohort 01', startsOn: todayIn('Africa/Lagos') };
    expect((await request(learning, 'POST', '/v1/learning/cohorts', { ...L(ada), body })).status).toBe(403);
    const res = await request(learning, 'POST', '/v1/learning/cohorts', { ...L(host), body });
    expect(res.status).toBe(201);
    cohort = res.body as CohortDetail;
    expect(cohort).toMatchObject({ name: 'Cohort 01', hostOrgName: 'Lagos Hub', status: 'draft', enrollmentPolicy: 'invite', timeZone: 'Africa/Lagos', currentWeek: 1, learnerCount: 0 });
    expect(cohort.calendar).toHaveLength(15);
    expect(cohort.calendar[0]).toMatchObject({ weekNo: 1, startsOn: body.startsOn });
    expect(cohort.sessions).toHaveLength(45);
    expect(cohort.rhythm).toHaveLength(3);
    const bad = await request(learning, 'POST', '/v1/learning/cohorts', { ...L(host), body: { ...body, timeZone: 'Mars/Olympus' } });
    expect(bad).toMatchObject({ status: 400, body: { code: 'invalid_time_zone' } });
    expect(((await request(learning, 'GET', '/v1/learning/cohorts', L(host))).body as { items: unknown[] }).items).toHaveLength(1);
  });

  it('shows learners only the intakes they may join', async () => {
    const list = (token?: string) =>
      request(learning, 'GET', '/v1/learning/programs/the-african-dream-lab/cohorts', token ? L(token) : {}).then((r) => (r.body as { items: { id: string }[] }).items.map((c) => c.id));
    expect(await list(ada)).toEqual([]);
    expect(await list(host)).toEqual([cohort.id]);
    expect((await request(learning, 'POST', `/v1/learning/cohorts/${cohort.id}/join`, { ...L(ada), body: {} })).status).toBe(404);

    const opened = await request(learning, 'PATCH', `/v1/learning/cohorts/${cohort.id}`, { ...L(host), body: { status: 'open', enrollmentPolicy: 'open', capacity: 1 } });
    expect(opened.body).toMatchObject({ status: 'open', enrollmentPolicy: 'open', capacity: 1 });
    expect(await list()).toEqual([cohort.id]);
    expect(await list(ada)).toEqual([cohort.id]);
  });

  it('joins a cohort: the programme and its required courses, once; a full cohort turns people away', async () => {
    const joined = await request(learning, 'POST', `/v1/learning/cohorts/${cohort.id}/join`, { ...L(ada), body: {} });
    expect(joined.status).toBe(201);
    const mine = joined.body as MyProgram;
    expect(mine.cohort).toMatchObject({ id: cohort.id, learnerCount: 1 });
    expect(mine.thisWeek).toMatchObject({ weekNo: 1 });
    expect(mine.upcomingSessions.length).toBeGreaterThan(0);
    expect(mine.courses.length).toBeGreaterThan(0);
    expect(mine.courses.every((c) => c.required && c.enrollmentId)).toBe(true);
    expect(mine.electives.length).toBeGreaterThan(0);

    const again = await request(learning, 'POST', `/v1/learning/cohorts/${cohort.id}/join`, { ...L(ada), body: {} });
    expect((again.body as MyProgram).enrollment.id).toBe(mine.enrollment.id);
    expect(await request(learning, 'POST', `/v1/learning/cohorts/${cohort.id}/join`, { ...L(tunde), body: {} })).toMatchObject({ status: 409, body: { code: 'cohort_full' } });
    expect(await request(learning, 'PATCH', `/v1/learning/cohorts/${cohort.id}`, { ...L(host), body: { capacity: null } })).toMatchObject({ status: 200 });

    const courses = (await request(learning, 'GET', '/v1/learning/enrollments', L(ada))).body as { items: { contextOrgId: string }[] };
    expect(courses.items).toHaveLength(mine.courses.length);
    expect(courses.items.every((e) => e.contextOrgId === hostOrgId)).toBe(true);
  });

  it('chooses electives: exactly as many as the phase asks, from one group', async () => {
    const [mine] = ((await request(learning, 'GET', '/v1/learning/me/programs', L(ada))).body as { items: MyProgram[] }).items;
    const group = mine!.electives[0]!;
    expect(group).toMatchObject({ locked: false, chosen: [] });
    const url = `/v1/learning/me/programs/${mine!.enrollment.id}/electives`;
    const tooMany = group.options.slice(0, group.chooseN + 1).map((c) => c.slug);
    if (tooMany.length > group.chooseN) {
      expect(await request(learning, 'POST', url, { ...L(ada), body: { courseSlugs: tooMany } })).toMatchObject({ status: 400, body: { code: 'wrong_number_of_electives' } });
    }
    expect(await request(learning, 'POST', url, { ...L(ada), body: { courseSlugs: ['problem-solving'] } })).toMatchObject({ status: 400 });
    const picks = group.options.slice(0, group.chooseN).map((c) => c.slug);
    const chosen = await request(learning, 'POST', url, { ...L(ada), body: { courseSlugs: picks } });
    expect(chosen.status).toBe(200);
    const after = chosen.body as MyProgram;
    expect(after.electives.find((e) => e.phase === group.phase)!.chosen).toEqual(picks);
    expect(after.courses.filter((c) => !c.required).map((c) => c.course.slug)).toEqual(picks);
    expect((await request(learning, 'POST', url, { ...L(tunde), body: { courseSlugs: picks } })).status).toBe(404);
  });

  it('takes attendance: managers mark, corrections replace, learners see their own count', async () => {
    const session = cohort.sessions[0]!;
    const url = `/v1/learning/cohorts/${cohort.id}/sessions/${session.id}/attendance`;
    expect((await request(learning, 'GET', url, L(ada))).status).toBe(404);
    const sheet = await request(learning, 'GET', url, L(host));
    expect(sheet.body).toMatchObject({ session: { id: session.id }, items: [{ name: 'Ada Obi', status: null }] });
    const adaId = (sheet.body as { items: { userId: string }[] }).items[0]!.userId;

    await request(learning, 'PUT', url, { ...L(host), body: { entries: [{ userId: adaId, status: 'absent' }] } });
    const marked = await request(learning, 'PUT', url, { ...L(host), body: { entries: [{ userId: adaId, status: 'present', minutes: 90 }] } });
    expect(marked.body).toMatchObject({ items: [{ userId: adaId, status: 'present', minutes: 90 }] });
    const stranger = await request(learning, 'PUT', url, { ...L(host), body: { entries: [{ userId: hostOrgId, status: 'present' }] } });
    expect(stranger).toMatchObject({ status: 404, body: { code: 'learner_not_in_cohort' } });

    const moved = await request(learning, 'PATCH', `/v1/learning/cohorts/${cohort.id}/sessions/${session.id}`, { ...L(host), body: { location: 'https://meet.example/dreamlab' } });
    expect(moved.body).toMatchObject({ id: session.id, location: 'https://meet.example/dreamlab' });

    const roster = await request(learning, 'GET', `/v1/learning/cohorts/${cohort.id}/roster`, L(host));
    expect(roster.body).toMatchObject({ items: [{ userId: adaId, name: 'Ada Obi', status: 'active', progressPct: 0 }] });
    const [mine] = ((await request(learning, 'GET', '/v1/learning/me/programs', L(ada))).body as { items: MyProgram[] }).items;
    expect(mine!.attendance.attended).toBe(1);
  });

  it('keeps a closed cohort closed', async () => {
    expect((await request(learning, 'PATCH', `/v1/learning/cohorts/${cohort.id}`, { ...L(host), body: { status: 'closed' } })).body).toMatchObject({ status: 'closed' });
    expect(await request(learning, 'PATCH', `/v1/learning/cohorts/${cohort.id}`, { ...L(host), body: { status: 'open' } })).toMatchObject({ status: 409, body: { code: 'cohort_closed' } });
    expect(await request(learning, 'POST', `/v1/learning/cohorts/${cohort.id}/join`, { ...L(tunde), body: {} })).toMatchObject({ status: 409, body: { code: 'cohort_not_open' } });
  });
});

describe('faculty grading (LRN-3)', () => {
  let owner: string;
  let teacher: string;
  let student: string;
  let orgId: string;
  let enrollmentId: string;
  let itemId: string;
  let submissionId: string;
  const canvas = Array.from({ length: 300 }, (_, i) => `idea${i}`).join(' ');

  const tokenFor = async (email: string, name: string) => {
    const personal = await signUp(email, name);
    const accepted = await request(iam, 'POST', '/v1/invitations/accept', { token: personal, body: { token: notifier.lastInviteToken(email) } });
    expect(accepted.status).toBe(200);
    return ((await request(iam, 'POST', '/v1/auth/switch-org', { token: personal, body: { orgId } })).body as { accessToken: string }).accessToken;
  };

  beforeAll(async () => {
    const admin = ((await request(iam, 'POST', '/v1/auth/login', { body: { identifier: 'admin@theafricandreamlab.com', password: 'e2e-admin-password' } })).body as { accessToken: string })
      .accessToken;
    const personal = await signUp('owner@kano-studio.test', 'Kemi Owner');
    const org = await request(iam, 'POST', '/v1/orgs', { token: admin, body: { slug: 'kano-studio', name: 'Kano Studio', kinds: ['enterprise'], firstAdmin: { email: 'owner@kano-studio.test' } } });
    orgId = (org.body as { id: string }).id;
    owner = ((await request(iam, 'POST', '/v1/auth/switch-org', { token: personal, body: { orgId } })).body as { accessToken: string }).accessToken;
    for (const [email, role] of [
      ['teacher@kano-studio.test', 'instructor'],
      ['student@kano-studio.test', 'learner'],
    ] as const) {
      expect((await request(iam, 'POST', `/v1/orgs/${orgId}/invitations`, { token: owner, body: { email, roleKeys: [role] } })).status).toBe(201);
    }
    teacher = await tokenFor('teacher@kano-studio.test', 'Tayo Teacher');
    student = await tokenFor('student@kano-studio.test', 'Sade Student');

    const enrolled = await request(learning, 'POST', '/v1/learning/enrollments', { ...L(student), body: { courseSlug: 'problem-solving' } });
    enrollmentId = (enrolled.body as Enrollment).id;
    expect(enrolled.body).toMatchObject({ contextOrgId: orgId, finalScore: null });
    const progress = (await request(learning, 'GET', '/v1/learning/courses/problem-solving', L(student))).body as CourseProgress;
    itemId = progress.course.modules.flatMap((m) => m.items).find((i) => i.type === 'assignment')!.id;
    const v1 = await request(learning, 'POST', `/v1/learning/enrollments/${enrollmentId}/items/${itemId}/submissions`, { ...L(student), body: { text: canvas } });
    submissionId = (v1.body as { id: string }).id;
  });

  it('queues the work for people who grade in the organisation, and nobody else', async () => {
    const queue = await request(learning, 'GET', '/v1/learning/grading/queue', L(teacher));
    expect(queue.status).toBe(200);
    expect((queue.body as { items: unknown[] }).items).toEqual([
      expect.objectContaining({ submissionId, version: 1, status: 'awaiting', scorePct: null, learner: expect.objectContaining({ name: 'Sade Student' }), course: expect.objectContaining({ slug: 'problem-solving' }) }),
    ]);
    expect((await request(learning, 'GET', '/v1/learning/grading/queue', L(student))).status).toBe(403);
    expect((await request(learning, 'GET', '/v1/learning/grading/queue', L(owner))).status).toBe(403);
    expect((await request(learning, 'GET', `/v1/learning/grading/submissions/${submissionId}`, L(student))).status).toBe(403);
  });

  it('grades with the rubric: drafts stay private, a release counts, a regrade supersedes', async () => {
    const view = (await request(learning, 'GET', `/v1/learning/grading/submissions/${submissionId}`, L(teacher))).body as SubmissionForGrading;
    expect(view).toMatchObject({ status: 'awaiting', text: canvas, grade: null, versions: [{ version: 1, status: 'awaiting' }] });
    const criteria = view.item.rubric.map((r) => r.id);
    expect(criteria.length).toBeGreaterThan(0);
    const url = `/v1/learning/grading/submissions/${submissionId}/grade`;
    const all = (level: number) => Object.fromEntries(criteria.map((c) => [c, level]));

    expect(await request(learning, 'PUT', url, { ...L(teacher), body: { rubricScores: { [criteria[0]!]: 3 }, release: true } })).toMatchObject({ status: 400, body: { code: 'rubric_incomplete' } });
    expect(await request(learning, 'PUT', url, { ...L(teacher), body: { rubricScores: { ...all(3), extra: 4 }, release: true } })).toMatchObject({ status: 400 });

    const draft = await request(learning, 'PUT', url, { ...L(teacher), body: { rubricScores: all(2), feedback: 'Sharpen the problem statement.', release: false } });
    expect(draft.body).toMatchObject({ status: 'draft', grade: { scorePct: 50, releasedAt: null, graderName: 'Tayo Teacher' } });
    const learnerView = (await request(learning, 'GET', `/v1/learning/enrollments/${enrollmentId}/items/${itemId}`, L(student))).body as ItemView;
    expect(learnerView.submissions[0]!.grade).toBeNull();

    const released = await request(learning, 'PUT', url, { ...L(teacher), body: { rubricScores: all(3), feedback: 'Clear and well evidenced.', release: true } });
    expect(released.body).toMatchObject({ status: 'released', grade: { scorePct: 75 }, history: [{ scorePct: 50, releasedAt: null }] });
    const seen = (await request(learning, 'GET', `/v1/learning/enrollments/${enrollmentId}/items/${itemId}`, L(student))).body as ItemView;
    expect(seen.submissions[0]!.grade).toMatchObject({ scorePct: 75, feedback: 'Clear and well evidenced.' });

    const regrade = await request(learning, 'PUT', url, { ...L(teacher), body: { rubricScores: all(4), feedback: 'Outstanding on a second look.', release: true } });
    expect(regrade.body).toMatchObject({ grade: { scorePct: 100 }, history: [{ scorePct: 75 }, { scorePct: 50 }] });
    const after = (await request(learning, 'GET', `/v1/learning/enrollments/${enrollmentId}/items/${itemId}`, L(student))).body as ItemView;
    expect(after.submissions[0]!.grade).toMatchObject({ scorePct: 100 });
    // Quizzes are still to come, so the course has no final score yet.
    expect(after.enrollment.finalScore).toBeNull();
    expect((await request(learning, 'GET', '/v1/learning/grading/queue?status=released', L(teacher))).body).toMatchObject({ items: [{ submissionId, status: 'released', scorePct: 100 }] });
    expect((await request(learning, 'GET', '/v1/learning/grading/queue', L(teacher))).body).toMatchObject({ items: [] });
  });

  it('only grades the newest version', async () => {
    const v2 = await request(learning, 'POST', `/v1/learning/enrollments/${enrollmentId}/items/${itemId}/submissions`, { ...L(student), body: { text: `${canvas} revised` } });
    const v2Id = (v2.body as { id: string }).id;
    const view = (await request(learning, 'GET', `/v1/learning/grading/submissions/${submissionId}`, L(teacher))).body as SubmissionForGrading;
    const criteria = view.item.rubric.map((r) => r.id);
    const rubricScores = Object.fromEntries(criteria.map((c) => [c, 3]));
    expect(await request(learning, 'PUT', `/v1/learning/grading/submissions/${submissionId}/grade`, { ...L(teacher), body: { rubricScores, release: true } })).toMatchObject({
      status: 409,
      body: { code: 'not_latest_version' },
    });
    expect((await request(learning, 'GET', '/v1/learning/grading/queue', L(teacher))).body).toMatchObject({ items: [{ submissionId: v2Id, version: 2, status: 'awaiting' }] });
  });

  it('tells graders about new work and learners about their grades, in the app and by email (NOTIFY-1)', async () => {
    const toGrade = await notificationsFor(teacher, (n) => n.category === 'submissions', 2);
    expect(toGrade.filter((n) => n.category === 'submissions')).toHaveLength(2);
    expect(toGrade[0]).toMatchObject({ title: expect.stringContaining('New work to grade'), link: expect.stringMatching(/^\/app\/grading\//), readAt: null });
    // Nobody is told about their own work.
    expect(((await request(notify, 'GET', '/v1/notifications', L(student))).body as { items: Notification[] }).items.some((n) => n.category === 'submissions')).toBe(false);

    const graded = await notificationsFor(student, (n) => n.category === 'grades', 2);
    // Two releases on version 1 (75%, then the 100% regrade); drafts tell nobody. Events are handled
    // concurrently, so the two may arrive in either order.
    const gradeBodies = graded.filter((n) => n.category === 'grades').map((n) => n.body);
    expect(gradeBodies).toHaveLength(2);
    expect(gradeBodies).toEqual(expect.arrayContaining([expect.stringContaining('100%'), expect.stringContaining('75%')]));
    expect(graded[0]!.link).toBe(`/learn/${enrollmentId}/${itemId}`);
    await eventually(() => mail.to('student@kano-studio.test').length >= 2);
    // Both grade emails, whichever arrived first.
    expect(mail.to('student@kano-studio.test')).toHaveLength(2);
    for (const m of mail.to('student@kano-studio.test')) {
      expect(m).toMatchObject({ subject: expect.stringContaining('was graded'), html: expect.stringContaining(`https://learn.test/learn/${enrollmentId}/${itemId}`) });
    }

    const unread = (await request(notify, 'GET', '/v1/notifications/unread-count', L(student))).body as { unread: number };
    expect(unread.unread).toBeGreaterThanOrEqual(2);
    expect((await request(notify, 'POST', `/v1/notifications/${graded[0]!.id}/read`, L(student))).status).toBe(204);
    // Another person's notification does not exist for me.
    expect((await request(notify, 'POST', `/v1/notifications/${graded[1]!.id}/read`, L(teacher))).status).toBe(404);
    expect((await request(notify, 'POST', '/v1/notifications/read-all', L(student))).status).toBe(204);
    expect((await request(notify, 'GET', '/v1/notifications/unread-count', L(student))).body).toEqual({ unread: 0 });

    // Turning grade emails off stops the email, not the notification.
    const prefs = await request(notify, 'PUT', '/v1/notifications/preferences', { ...L(student), body: { email: { grades: false } } });
    expect(prefs.body).toMatchObject({ email: { grades: false, sessions: true } });
    const queue = (await request(learning, 'GET', '/v1/learning/grading/queue', L(teacher))).body as { items: { submissionId: string }[] };
    const latest = (await request(learning, 'GET', `/v1/learning/grading/submissions/${queue.items[0]!.submissionId}`, L(teacher))).body as SubmissionForGrading;
    const before = mail.to('student@kano-studio.test').length;
    await request(learning, 'PUT', `/v1/learning/grading/submissions/${latest.submissionId}/grade`, {
      ...L(teacher),
      body: { rubricScores: Object.fromEntries(latest.item.rubric.map((r) => [r.id, 4])), release: true },
    });
    await notificationsFor(student, (n) => n.category === 'grades' && n.readAt === null);
    expect(mail.to('student@kano-studio.test')).toHaveLength(before);
  });

  it('attaches files to a submission: private to the learner and their graders (MEDIA-1)', async () => {
    const files = `/v1/learning/enrollments/${enrollmentId}/items/${itemId}/files`;
    expect((await request(learning, 'POST', files, { ...L(student), body: { fileName: 'tool.exe', contentType: 'application/x-msdownload', size: 10 } })).status).toBe(400);
    const ticket = await request(learning, 'POST', files, { ...L(student), body: { fileName: 'Problem canvas.pdf', contentType: 'application/pdf', size: 11 } });
    expect(ticket.status).toBe(201);
    const { fileId, uploadUrl, headers } = ticket.body as SubmissionFileUpload;

    const submit = (fileIds: string[]) => request(learning, 'POST', `/v1/learning/enrollments/${enrollmentId}/items/${itemId}/submissions`, { ...L(student), body: { text: `${canvas} v3`, fileIds } });
    expect(await submit([fileId])).toMatchObject({ status: 400, body: { code: 'file_not_uploaded' } });
    expect((await fetch(uploadUrl, { method: 'PUT', headers, body: Buffer.from('%PDF-1.7 ok') })).status).toBe(201);
    expect(await submit(['00000000-0000-4000-8000-000000000000'])).toMatchObject({ status: 400, body: { code: 'file_not_found' } });
    const v3 = await submit([fileId]);
    expect(v3.body).toMatchObject({ version: 3, files: [{ id: fileId, name: 'Problem canvas.pdf', size: 11, contentType: 'application/pdf' }] });

    const graderView = (await request(learning, 'GET', `/v1/learning/grading/submissions/${(v3.body as { id: string }).id}`, L(teacher))).body as SubmissionForGrading;
    expect(graderView.files).toEqual([expect.objectContaining({ id: fileId })]);
    const link = await request(learning, 'GET', `/v1/learning/files/${fileId}`, L(teacher));
    expect(link.status).toBe(200);
    const download = await fetch((link.body as { url: string }).url);
    expect(await download.text()).toBe('%PDF-1.7 ok');
    expect(download.headers.get('content-disposition')).toContain('attachment');
    expect((await request(learning, 'GET', `/v1/learning/files/${fileId}`, L(student))).status).toBe(200);
    expect((await request(learning, 'GET', `/v1/learning/files/${fileId}`, L(owner))).status).toBe(404);

    // Upload links are create-only: the submitted file cannot be replaced afterwards.
    expect((await fetch(uploadUrl, { method: 'PUT', headers, body: Buffer.from('swapped') })).ok).toBe(false);
    expect(await (await fetch(((await request(learning, 'GET', `/v1/learning/files/${fileId}`, L(teacher))).body as { url: string }).url)).text()).toBe('%PDF-1.7 ok');

    // A file uploaded but never submitted is swept away; submitted files stay.
    const stray = (await request(learning, 'POST', files, { ...L(student), body: { fileName: 'draft.pdf', contentType: 'application/pdf', size: 5 } })).body as SubmissionFileUpload;
    expect((await fetch(stray.uploadUrl, { method: 'PUT', headers: stray.headers, body: Buffer.from('draft') })).status).toBe(201);
    expect(await learning.get(FilesService).sweep(new Date(Date.now() + 3 * 3_600_000))).toBeGreaterThanOrEqual(1);
    expect((await request(learning, 'GET', `/v1/learning/files/${stray.fileId}`, L(student))).status).toBe(404);
    expect((await request(learning, 'GET', `/v1/learning/files/${fileId}`, L(student))).status).toBe(200);
  });
});

describe('course authoring in the browser (CAT-3)', () => {
  let owner: string;
  let author: string;
  let outsider: string;
  let admin: string;
  let orgId: string;
  const slug = 'benin-bronze-casting';

  const lessonItem = (key: string, title: string) => ({
    key,
    type: 'lesson',
    title,
    minutes: 10,
    payload: { steps: [{ id: 'step-one', blocks: [{ id: 'intro', type: 'text', body: 'The lost-wax method, step by step.' }] }] },
  });
  const fullCourse = (visibility: 'org_private' | 'public') => ({
    slug,
    title: 'Benin Bronze Casting',
    subtitle: 'The lost-wax method',
    description: 'How the guild casts bronze.',
    provider: 'Benin Press',
    level: 'beginner',
    language: 'en',
    visibility,
    creditHours: 1,
    outcomes: ['Explain the lost-wax method'],
    skills: ['Casting'],
    audience: 'Apprentices',
    prerequisites: 'None',
    practicalOutput: null,
    cover: { from: '#7A4A12', to: '#C08A3E', symbol: 'B' },
    instructors: [],
    modules: [{ key: 'wax', title: 'Wax models', summary: 'Shaping the model', weekNo: null, items: [lessonItem('carving', 'Carving the wax')] }],
  });
  const url = (draftId: string, tail = '') => `/v1/catalog/authoring/drafts/${draftId}${tail}`;

  beforeAll(async () => {
    admin = ((await request(iam, 'POST', '/v1/auth/login', { body: { identifier: 'admin@theafricandreamlab.com', password: 'e2e-admin-password' } })).body as { accessToken: string }).accessToken;
    const personal = await signUp('owner@benin-press.test', 'Osa Owner');
    const org = await request(iam, 'POST', '/v1/orgs', { token: admin, body: { slug: 'benin-press', name: 'Benin Press', kinds: ['enterprise'], firstAdmin: { email: 'owner@benin-press.test' } } });
    orgId = (org.body as { id: string }).id;
    owner = ((await request(iam, 'POST', '/v1/auth/switch-org', { token: personal, body: { orgId } })).body as { accessToken: string }).accessToken;
    expect((await request(iam, 'POST', `/v1/orgs/${orgId}/invitations`, { token: owner, body: { email: 'writer@benin-press.test', roleKeys: ['author'] } })).status).toBe(201);
    const writer = await signUp('writer@benin-press.test', 'Ada Author');
    expect((await request(iam, 'POST', '/v1/invitations/accept', { token: writer, body: { token: notifier.lastInviteToken('writer@benin-press.test') } })).status).toBe(200);
    author = ((await request(iam, 'POST', '/v1/auth/switch-org', { token: writer, body: { orgId } })).body as { accessToken: string }).accessToken;
    outsider = await signUp('reader@far-away-press.test', 'Oti Outsider');
  });

  it('an author writes a new course; it cannot go for review until it is complete; stale saves are refused', async () => {
    expect((await request(catalog, 'GET', '/v1/catalog/authoring', L(outsider))).status).toBe(403);
    const overview = await request(catalog, 'GET', '/v1/catalog/authoring', L(author));
    expect(overview.body).toMatchObject({ courses: [], newDrafts: [], can: { author: true, review: false } });

    const created = await request(catalog, 'POST', '/v1/catalog/authoring/drafts', { ...L(author), body: { slug, title: 'Benin Bronze Casting' } });
    expect(created.status).toBe(201);
    const draft = created.body as Draft;
    expect(draft).toMatchObject({ status: 'draft', visibility: 'org_private', revision: 1, can: { edit: true, submit: true, review: false } });
    expect(draft.issues.length).toBeGreaterThan(0);
    expect((await request(catalog, 'POST', '/v1/catalog/authoring/drafts', { ...L(author), body: { slug, title: 'Again' } })).body).toMatchObject({ code: 'draft_exists' });
    expect((await request(catalog, 'POST', url(draft.id, '/submit'), { ...L(author), body: {} })).body).toMatchObject({ code: 'draft_has_issues' });

    const saved = await request(catalog, 'PUT', url(draft.id), { ...L(author), body: { revision: 1, doc: { ...fullCourse('org_private'), slug: 'sneaky-slug' } } });
    expect(saved.body).toMatchObject({ revision: 2, issues: [], doc: { slug } });
    expect((await request(catalog, 'PUT', url(draft.id), { ...L(author), body: { revision: 1, doc: fullCourse('org_private') } })).body).toMatchObject({ code: 'draft_changed' });
    expect((await request(catalog, 'GET', url(draft.id), L(outsider))).status).toBe(404);
    // The platform team reviews public courses only; an organisation's private draft isn't theirs.
    expect((await request(catalog, 'GET', url(draft.id), L(admin))).status).toBe(404);
  });

  it('keeps each save, so an author can look back and restore one (CAT-5)', async () => {
    const draft = (await request(catalog, 'POST', '/v1/catalog/authoring/drafts', { ...L(author), body: { slug: `${slug}-history`, title: 'Lost-wax History' } })).body as Draft;
    const course = { ...fullCourse('org_private'), title: 'Lost-wax History' };
    await request(catalog, 'PUT', url(draft.id), { ...L(author), body: { revision: 1, doc: course, checkpoint: true } });
    const grown = structuredClone(course);
    grown.modules[0]!.items.push(lessonItem('patina', 'Finishing the patina'));
    // Two autosaves a moment apart are kept as one entry: the latest.
    await request(catalog, 'PUT', url(draft.id), { ...L(author), body: { revision: 2, doc: { ...grown, subtitle: 'Typing…' } } });
    await request(catalog, 'PUT', url(draft.id), { ...L(author), body: { revision: 3, doc: grown } });

    // Newest first, with how big the course was at each save.
    const history = (await request(catalog, 'GET', url(draft.id, '/history'), L(author))).body as { items: { revision: number; modules: number; items: number; savedBy: { name: string } }[] };
    expect(history.items.map((s) => s.revision)).toEqual([4, 2, 1]);
    expect(history.items[0]).toMatchObject({ modules: 1, items: course.modules[0]!.items.length + 1, savedBy: { name: expect.any(String) } });
    expect(history.items[2]).toMatchObject({ modules: 0, items: 0 });
    expect(((await request(catalog, 'GET', url(draft.id, '/history/2'), L(author))).body as { doc: { title: string } }).doc.title).toBe('Lost-wax History');
    expect((await request(catalog, 'GET', url(draft.id, '/history/99'), L(author))).status).toBe(404);
    expect((await request(catalog, 'GET', url(draft.id, '/history'), L(outsider))).status).toBe(404);

    // Restoring makes an earlier save the newest; the current one stays in the history.
    expect((await request(catalog, 'POST', url(draft.id, '/restore'), { ...L(author), body: { revision: 3, restore: 2 } })).body).toMatchObject({ code: 'draft_changed' });
    const restored = await request(catalog, 'POST', url(draft.id, '/restore'), { ...L(author), body: { revision: 4, restore: 2 } });
    expect(restored.status).toBe(200);
    expect((restored.body as Draft).revision).toBe(5);
    expect(((restored.body as Draft).doc as { modules: { items: unknown[] }[] }).modules[0]!.items).toHaveLength(course.modules[0]!.items.length);
    expect(((await request(catalog, 'GET', url(draft.id, '/history'), L(author))).body as { items: { revision: number }[] }).items.map((s) => s.revision)).toEqual([5, 4, 2, 1]);
    expect((await request(catalog, 'DELETE', url(draft.id), L(author))).status).toBe(204);
  });

  it('a reviewer asks for changes, then publishes; members see the private course, others do not', async () => {
    const [draft] = ((await request(catalog, 'GET', '/v1/catalog/authoring', L(author))).body as { newDrafts: Draft[] }).newDrafts;
    expect((await request(catalog, 'POST', url(draft!.id, '/submit'), { ...L(author), body: {} })).body).toMatchObject({ status: 'in_review' });
    expect((await request(catalog, 'PUT', url(draft!.id), { ...L(author), body: { revision: 2, doc: fullCourse('org_private') } })).body).toMatchObject({ code: 'draft_in_review' });
    expect((await request(catalog, 'POST', url(draft!.id, '/publish'), { ...L(author), body: {} })).status).toBe(403);

    const queue = (await request(catalog, 'GET', '/v1/catalog/authoring', L(owner))).body as { toReview: Draft[]; can: { review: boolean } };
    expect(queue).toMatchObject({ can: { review: true }, toReview: [{ id: draft!.id, status: 'in_review' }] });
    expect((await request(catalog, 'POST', url(draft!.id, '/request-changes'), { ...L(owner), body: { note: ' ' } })).status).toBe(400);
    const returned = await request(catalog, 'POST', url(draft!.id, '/request-changes'), { ...L(owner), body: { note: 'Add a safety step.' } });
    expect(returned.body).toMatchObject({ status: 'changes_requested', reviewNote: 'Add a safety step.', reviewedBy: { name: 'Osa Owner' } });

    const fixed = fullCourse('org_private');
    fixed.modules[0]!.items.push(lessonItem('safety', 'Working safely with molten bronze'));
    await request(catalog, 'PUT', url(draft!.id), { ...L(author), body: { revision: 2, doc: fixed } });
    await request(catalog, 'POST', url(draft!.id, '/submit'), { ...L(author), body: {} });
    const published = await request(catalog, 'POST', url(draft!.id, '/publish'), { ...L(owner), body: { note: 'Ready.' } });
    expect(published.body).toMatchObject({ status: 'published', publishedVersionNo: 1, courseId: expect.any(String) });

    expect((await request(catalog, 'GET', `/v1/catalog/courses/${slug}`, L(author))).body).toMatchObject({ slug, versionNo: 1, moduleCount: 1 });
    expect((await request(catalog, 'GET', `/v1/catalog/courses/${slug}`)).status).toBe(404);
    expect((await request(catalog, 'GET', `/v1/catalog/courses/${slug}`, L(outsider))).status).toBe(404);
  });

  it('a second draft starts from the published version and publishes version 2; public courses need the platform team', async () => {
    const created = (await request(catalog, 'POST', '/v1/catalog/authoring/drafts', { ...L(author), body: { courseSlug: slug } })).body as Draft;
    expect(created).toMatchObject({ baseVersionNo: 1, issues: [], doc: { slug, modules: [{ key: 'wax', items: [{ key: 'carving' }, { key: 'safety' }] }] } });
    const base = created.doc as ReturnType<typeof fullCourse>;
    // A content change (a new item) makes a new version; details alone are updated in place.
    const doc = {
      ...base,
      subtitle: 'The lost-wax method, revised',
      visibility: 'public' as const,
      modules: [{ ...base.modules[0]!, items: [...base.modules[0]!.items, lessonItem('finishing', 'Chasing and finishing')] }],
    };
    await request(catalog, 'PUT', url(created.id), { ...L(author), body: { revision: created.revision, doc } });
    await request(catalog, 'POST', url(created.id, '/submit'), { ...L(author), body: {} });

    // A public course joins the platform catalogue: the organisation's own reviewer can't publish it.
    expect(await request(catalog, 'POST', url(created.id, '/publish'), { ...L(owner), body: {} })).toMatchObject({ status: 403 });
    const platformQueue = (await request(catalog, 'GET', '/v1/catalog/authoring', L(admin))).body as { toReview: Draft[] };
    expect(platformQueue.toReview.map((d) => d.id)).toContain(created.id);
    const published = await request(catalog, 'POST', url(created.id, '/publish'), { ...L(admin), body: { note: null } });
    expect(published.body).toMatchObject({ status: 'published', publishedVersionNo: 2 });
    expect((await request(catalog, 'GET', `/v1/catalog/courses/${slug}`)).body).toMatchObject({ subtitle: 'The lost-wax method, revised', versionNo: 2 });
    // Now public, it is listed in the catalogue.
    const listed = (await request(catalog, 'GET', '/v1/catalog/courses?q=bronze')).body as { items: { slug: string }[] };
    expect(listed.items.map((c) => c.slug)).toContain(slug);
  });

  it('exports a full published course as a draft that could be published unchanged', async () => {
    const draft = (await request(catalog, 'POST', '/v1/catalog/authoring/drafts', { ...L(admin), body: { courseSlug: 'problem-solving' } })).body as Draft;
    expect(draft).toMatchObject({ slug: 'problem-solving', issues: [] });
    expect((draft.doc as { modules: unknown[] }).modules.length).toBe(5);
    expect((await request(catalog, 'DELETE', url(draft.id), L(admin))).status).toBe(204);
    expect((await request(catalog, 'GET', url(draft.id), L(admin))).status).toBe(404);
  });

  it('an author of one course edits that course only', async () => {
    expect((await request(iam, 'POST', `/v1/orgs/${orgId}/invitations`, { token: owner, body: { email: 'guest@benin-press.test', roleKeys: ['learner'] } })).status).toBe(201);
    const personal = await signUp('guest@benin-press.test', 'Gbenga Guest');
    await request(iam, 'POST', '/v1/invitations/accept', { token: personal, body: { token: notifier.lastInviteToken('guest@benin-press.test') } });
    const members = (await request(iam, 'GET', `/v1/orgs/${orgId}/members?limit=100`, L(owner))).body as { items: { id: string; user: { email: string } }[] };
    const membershipId = members.items.find((m) => m.user.email === 'guest@benin-press.test')!.id;
    const ownerView = (await request(catalog, 'GET', '/v1/catalog/authoring', L(owner))).body as { courses: { courseId: string; slug: string; canEdit: boolean }[] };
    const courseId = ownerView.courses.find((c) => c.slug === slug)!.courseId;
    const assigned = await request(iam, 'POST', `/v1/orgs/${orgId}/members/${membershipId}/roles`, { ...L(owner), body: { roleKey: 'author', scopeType: 'course', scopeId: courseId } });
    expect(assigned.status).toBe(201);
    const guest = ((await request(iam, 'POST', '/v1/auth/switch-org', { token: personal, body: { orgId } })).body as { accessToken: string }).accessToken;

    const view = (await request(catalog, 'GET', '/v1/catalog/authoring', L(guest))).body as { courses: { slug: string; canEdit: boolean }[]; newDrafts: unknown[]; can: { author: boolean } };
    expect(view).toMatchObject({ courses: [{ slug, canEdit: true }], newDrafts: [], can: { author: false } });
    const draft = await request(catalog, 'POST', '/v1/catalog/authoring/drafts', { ...L(guest), body: { courseSlug: slug } });
    expect(draft.status).toBe(201);
    expect((await request(catalog, 'POST', '/v1/catalog/authoring/drafts', { ...L(guest), body: { slug: 'guest-course', title: 'A course of my own' } })).status).toBe(403);
    expect((await request(catalog, 'DELETE', url((draft.body as Draft).id), L(guest))).status).toBe(204);
  });

  it('tells reviewers when a draft is ready, and authors when changes are asked for or it is published (NOTIFY-1)', async () => {
    const forOwner = await notificationsFor(owner, (n) => n.category === 'authoring' && n.title.includes('ready for review'));
    expect(forOwner.find((n) => n.title.includes('ready for review'))).toMatchObject({ link: expect.stringMatching(/^\/app\/authoring\//) });
    const forAuthor = await notificationsFor(author, (n) => n.title.includes('is published'));
    expect(forAuthor.map((n) => n.title)).toEqual(expect.arrayContaining([expect.stringContaining('Changes requested'), expect.stringContaining('is published')]));
    // The platform team reviews public courses.
    await notificationsFor(admin, (n) => n.category === 'authoring' && n.title.includes('ready for review'));
    // An author is never told about their own submission.
    expect(forAuthor.some((n) => n.title.includes('ready for review'))).toBe(false);
  });

  // ---------- CAT-6: the video library, captions, free previews, review comments and presence ----------

  describe('videos and working together (CAT-6)', () => {
    const videos = '/v1/catalog/authoring/videos';
    const hasFfmpeg = spawnSync('ffmpeg', ['-version']).status === 0;
    let clip: Buffer;
    let videoId: string;

    beforeAll(() => {
      if (!hasFfmpeg) return;
      // Four seconds of 720p picture and sound, made here so the test needs no fixture file.
      const out = join(tmpdir(), `cat6-${Date.now()}.mp4`);
      const made = spawnSync('ffmpeg', ['-hide_banner', '-y', '-f', 'lavfi', '-i', 'testsrc=duration=4:size=1280x720:rate=24', '-f', 'lavfi', '-i', 'sine=frequency=440:duration=4', '-shortest', '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-c:a', 'aac', out]);
      expect(made.status).toBe(0);
      clip = readFileSync(out);
    });

    it('uploads a video in blocks, refuses to join it until every block is there, and processes it for streaming', async () => {
      expect((await request(catalog, 'GET', videos, L(outsider))).status).toBe(403);
      const size = hasFfmpeg ? clip.length : 1000;
      const created = await request(catalog, 'POST', videos, { ...L(author), body: { title: 'Pouring the bronze', fileName: 'pour.mp4', contentType: 'video/mp4', size } });
      expect(created.status).toBe(201);
      const { video, upload } = created.body as { video: LibraryVideo; upload: VideoUploadLink };
      videoId = video.id;
      expect(video).toMatchObject({ status: 'uploading', captions: [], usedIn: [] });
      expect(upload).toMatchObject({ blocks: 1, blockBytes: 8 * 1024 * 1024 });
      expect((await request(catalog, 'GET', `${videos}/${videoId}/upload-status`, L(author))).body).toEqual({ received: [], blocks: 1 });
      expect((await request(catalog, 'POST', `${videos}/${videoId}/uploaded`, { ...L(author), body: {} })).body).toMatchObject({ code: 'upload_incomplete' });
      // Another organisation's people can't see it.
      expect((await request(catalog, 'GET', `${videos}/${videoId}`, L(admin))).status).toBe(404);
      if (!hasFfmpeg) return;

      const put = await fetch(`${upload.url}&comp=block&blockid=${encodeURIComponent(videoBlockId(0))}`, { method: 'PUT', body: new Uint8Array(clip) });
      expect(put.status).toBe(201);
      expect((await request(catalog, 'GET', `${videos}/${videoId}/upload-status`, L(author))).body).toEqual({ received: [0], blocks: 1 });
      expect((await request(catalog, 'POST', `${videos}/${videoId}/uploaded`, { ...L(author), body: {} })).body).toMatchObject({ status: 'queued', progress: 0 });

      expect(await catalog.get(VideoWorker).runOnce()).toBe(true);
      const ready = (await request(catalog, 'GET', `${videos}/${videoId}`, L(author))).body as LibraryVideo;
      expect(ready).toMatchObject({ status: 'ready', durationS: 4, width: 1280, height: 720, renditions: [360, 720], manifestUrl: `/media/videos/${videoId}/manifest.json`, posterUrl: `/media/videos/${videoId}/v1/poster.jpg` });
      const storage = catalog.get<BlobStorage>(CATALOG_STORAGE);
      for (const file of ['manifest.json', 'v1/master.m3u8', 'v1/360p/index.m3u8', 'v1/720p/index.m3u8', 'v1/poster.jpg', 'v1/thumb.jpg', 'v1/audio.m4a']) expect(await storage.stat('public', `videos/${videoId}/${file}`)).not.toBeNull();
      // LRN-9: what each stream weighs, and the audio-only version.
      const manifestFile = join(tmpdir(), `manifest-${videoId}.json`);
      await storage.downloadToFile('public', `videos/${videoId}/manifest.json`, manifestFile);
      const manifest = VideoManifestSchema.parse(JSON.parse(readFileSync(manifestFile, 'utf8')));
      expect(manifest.renditions?.map((r) => r.height)).toEqual([360, 720]);
      expect(manifest.renditions![0]!.bytes).toBeGreaterThan(0);
      expect(manifest.renditions![1]!.bytes).toBeGreaterThan(manifest.renditions![0]!.bytes);
      expect(manifest.audio).toEqual({ src: 'v1/audio.m4a', bytes: (await storage.stat('public', `videos/${videoId}/v1/audio.m4a`))!.size });
      // The original stays private.
      expect(await storage.stat('public', `videos/${videoId}/source`)).toBeNull();
      expect(((await request(catalog, 'GET', `${videos}?q=bronze`, L(author))).body as { items: LibraryVideo[] }).items.map((v) => v.id)).toEqual([videoId]);
    });

    it('keeps caption tracks, and reports when automatic captions cannot be made', async () => {
      if (!hasFfmpeg) return;
      const cues = [
        { startS: 0.5, endS: 2, text: 'Heat the crucible.' },
        { startS: 2.2, endS: 3.8, text: 'Pour in one smooth movement.' },
      ];
      const saved = await request(catalog, 'PUT', `${videos}/${videoId}/captions/en`, { ...L(author), body: { label: 'English', cues, fromFile: true } });
      expect((saved.body as LibraryVideo).captions).toEqual([expect.objectContaining({ lang: 'en', label: 'English', source: 'upload', cues: 2 })]);
      expect((await request(catalog, 'GET', `${videos}/${videoId}/captions/en`, L(author))).body).toEqual({ lang: 'en', label: 'English', cues });
      const edited = await request(catalog, 'PUT', `${videos}/${videoId}/captions/en`, { ...L(author), body: { label: 'English', cues: [cues[0]!], fromFile: false } });
      expect((edited.body as LibraryVideo).captions[0]).toMatchObject({ source: 'edited', cues: 1 });
      expect(await catalog.get<BlobStorage>(CATALOG_STORAGE).stat('public', `videos/${videoId}/captions/en.vtt`)).not.toBeNull();
      // Uploaded or edited captions are never overwritten by speech recognition.
      expect((await request(catalog, 'POST', `${videos}/${videoId}/captions-auto`, { ...L(author), body: { lang: 'en' } })).body).toMatchObject({ code: 'captions_exist' });

      const asked = await request(catalog, 'POST', `${videos}/${videoId}/captions-auto`, { ...L(author), body: { lang: 'fr' } });
      expect((asked.body as LibraryVideo).captionJob).toMatchObject({ status: 'queued', lang: 'fr' });
      expect((await request(catalog, 'POST', `${videos}/${videoId}/captions-auto`, { ...L(author), body: { lang: 'fr' } })).body).toMatchObject({ code: 'captions_in_progress' });
      await catalog.get(VideoWorker).runOnce();
      const after = (await request(catalog, 'GET', `${videos}/${videoId}`, L(author))).body as LibraryVideo;
      // This test server has no speech-recognition model: the author hears why, in plain words.
      expect(after.captionJob).toMatchObject({ status: 'failed', error: expect.stringContaining('not available on this server') });
      expect((await request(catalog, 'PATCH', `${videos}/${videoId}`, { ...L(author), body: { title: 'Pouring the bronze (take 2)' } })).body).toMatchObject({ title: 'Pouring the bronze (take 2)' });
    });

    it('publishes only processed library videos, opens free-preview lessons to visitors, and protects videos in use', async () => {
      if (!hasFfmpeg) return;
      const draft = (await request(catalog, 'POST', '/v1/catalog/authoring/drafts', { ...L(author), body: { courseSlug: slug } })).body as Draft;
      const doc = structuredClone(draft.doc) as ReturnType<typeof fullCourse>;
      const carving = doc.modules[0]!.items[0]! as ReturnType<typeof lessonItem> & { preview?: boolean };
      carving.preview = true;
      carving.payload.steps[0]!.blocks = [
        { id: 'pour', type: 'video', provider: 'library', videoId, title: 'Pouring the bronze', channel: 'Benin Press', durationS: 4, chapters: [{ atS: 0, title: 'Heat' }, { atS: 2, title: 'Pour' }], pauses: [{ atS: 2, blockId: 'check' }] },
        { id: 'check', type: 'choice', prompt: 'When do you pour?', options: [{ id: 'hot', text: 'When it glows', correct: true }, { id: 'cold', text: 'When it cools', correct: false }], explanation: 'Bronze must be molten.' },
        { id: 'worksheet', type: 'download', title: 'Casting worksheet', path: `courses/${orgId}/${videoId}/worksheet.pdf`, fileName: 'worksheet.pdf', size: 1200, contentType: 'application/pdf' },
      ] as never;
      // A second video still uploading blocks review.
      const pending = (await request(catalog, 'POST', videos, { ...L(author), body: { title: 'Not yet', fileName: 'b.mp4', contentType: 'video/mp4', size: 10 } })).body as { video: LibraryVideo };
      const withPending = structuredClone(doc);
      (withPending.modules[0]!.items[0]!.payload.steps[0]!.blocks as unknown[]).push({ id: 'later', type: 'video', provider: 'library', videoId: pending.video.id, title: 'Later', channel: 'Benin Press' });
      const blocked = await request(catalog, 'PUT', url(draft.id), { ...L(author), body: { revision: draft.revision, doc: withPending } });
      expect((blocked.body as Draft).issues).toEqual([{ path: 'modules.0.items.0.payload.steps.0.blocks.3.videoId', message: 'This video is still being processed: it can be published once it is ready' }]);
      expect((await request(catalog, 'POST', url(draft.id, '/submit'), { ...L(author), body: {} })).body).toMatchObject({ code: 'draft_has_issues' });
      expect((await request(catalog, 'DELETE', `${videos}/${pending.video.id}`, L(author))).status).toBe(409);

      const saved = (await request(catalog, 'PUT', url(draft.id), { ...L(author), body: { revision: (blocked.body as Draft).revision, doc } })).body as Draft;
      expect(saved.issues).toEqual([]);
      expect((await request(catalog, 'DELETE', `${videos}/${pending.video.id}`, L(author))).status).toBe(204);
      expect(((await request(catalog, 'GET', `${videos}/${videoId}`, L(author))).body as LibraryVideo).usedIn).toEqual([{ title: 'Benin Bronze Casting', slug }]);

      await request(catalog, 'POST', url(draft.id, '/submit'), { ...L(author), body: {} });
      expect((await request(catalog, 'POST', url(draft.id, '/publish'), { ...L(admin), body: { note: null } })).body).toMatchObject({ status: 'published', publishedVersionNo: 3 });

      // Visitors open the free preview from the course page; answers never leave the server.
      const page = (await request(catalog, 'GET', `/v1/catalog/courses/${slug}`)).body as { modules: { items: { key: string; preview: boolean }[] }[] };
      expect(page.modules[0]!.items.filter((i) => i.preview).map((i) => i.key)).toEqual(['carving']);
      const preview = await request(catalog, 'GET', `/v1/catalog/courses/${slug}/preview/carving`);
      expect(preview.status).toBe(200);
      expect(preview.body).toMatchObject({ course: { slug }, item: { key: 'carving', type: 'lesson' }, content: { type: 'lesson', steps: [{ blocks: [{ type: 'video', provider: 'library', videoId, pauses: [{ atS: 2, blockId: 'check' }] }, { type: 'choice' }, { type: 'download' }] }] } });
      expect(JSON.stringify(preview.body)).not.toContain('correct');
      expect((await request(catalog, 'GET', `/v1/catalog/courses/${slug}/preview/safety`)).status).toBe(404);

      // A published course still uses it, so it can't be deleted.
      expect((await request(catalog, 'DELETE', `${videos}/${videoId}`, L(author))).body).toMatchObject({ code: 'video_in_use' });
    });

    it('takes review comments on blocks, with replies and resolving, and shows who else has the draft open', async () => {
      const draft = (await request(catalog, 'POST', '/v1/catalog/authoring/drafts', { ...L(author), body: { courseSlug: slug } })).body as Draft;
      const anchor = { moduleKey: 'wax', itemKey: 'carving', blockId: 'intro', label: 'Module 1 › Lesson “Carving the wax” › Text' };
      expect((await request(catalog, 'POST', url(draft.id, '/comments'), { ...L(outsider), body: { anchor, body: 'Hi' } })).status).toBe(404);
      const first = await request(catalog, 'POST', url(draft.id, '/comments'), { ...L(owner), body: { anchor, body: 'Say how hot the wax gets.' } });
      expect(first.status).toBe(201);
      const comment = first.body as DraftComment;
      expect(comment).toMatchObject({ parentId: null, anchor, author: { name: 'Osa Owner' }, mine: true, resolvedAt: null });
      const reply = (await request(catalog, 'POST', url(draft.id, '/comments'), { ...L(author), body: { anchor: { label: 'ignored' }, body: 'Added: about 60 °C.', parentId: comment.id } })).body as DraftComment;
      expect(reply).toMatchObject({ parentId: comment.id, anchor, mine: true });
      // Replying to a reply joins the same thread.
      const nested = (await request(catalog, 'POST', url(draft.id, '/comments'), { ...L(owner), body: { anchor, body: 'Thanks.', parentId: reply.id } })).body as DraftComment;
      expect(nested.parentId).toBe(comment.id);

      expect((await request(catalog, 'PATCH', url(draft.id, `/comments/${comment.id}`), { ...L(author), body: { body: 'Changed' } })).status).toBe(403);
      expect((await request(catalog, 'PATCH', url(draft.id, `/comments/${reply.id}`), { ...L(author), body: { resolved: true } })).status).toBe(400);
      expect((await request(catalog, 'PATCH', url(draft.id, `/comments/${comment.id}`), { ...L(author), body: { resolved: true } })).body).toMatchObject({ resolvedBy: { name: 'Ada Author' } });
      expect((await request(catalog, 'PATCH', url(draft.id, `/comments/${reply.id}`), { ...L(author), body: { body: 'Added: about 60 degrees.' } })).body).toMatchObject({ body: 'Added: about 60 degrees.', editedAt: expect.any(String) });
      const list = (await request(catalog, 'GET', url(draft.id, '/comments'), L(author))).body as { items: DraftComment[] };
      expect(list.items.map((c) => c.body)).toEqual(['Say how hot the wax gets.', 'Added: about 60 degrees.', 'Thanks.']);
      await notificationsFor(author, (n) => n.title.includes('commented on') || n.title.includes('replied on'));

      // Presence: each sees the other, and whether they are editing.
      expect((await request(catalog, 'POST', url(draft.id, '/presence'), { ...L(author), body: { where: null } })).body).toEqual({ people: [] });
      const seen = (await request(catalog, 'POST', url(draft.id, '/presence'), { ...L(owner), body: { where: { moduleKey: 'wax', itemKey: 'carving', label: 'Carving the wax' }, editing: true } })).body as { people: Presence[] };
      expect(seen.people).toEqual([expect.objectContaining({ name: 'Ada Author', editing: false, where: null })]);
      const back = (await request(catalog, 'POST', url(draft.id, '/presence'), { ...L(author), body: { where: null } })).body as { people: Presence[] };
      expect(back.people).toEqual([expect.objectContaining({ name: 'Osa Owner', editing: true, where: { moduleKey: 'wax', itemKey: 'carving', label: 'Carving the wax' } })]);

      expect((await request(catalog, 'DELETE', url(draft.id, `/comments/${comment.id}`), L(author))).status).toBe(403);
      expect((await request(catalog, 'DELETE', url(draft.id, `/comments/${comment.id}`), L(owner))).status).toBe(204);
      expect(((await request(catalog, 'GET', url(draft.id, '/comments'), L(author))).body as { items: unknown[] }).items).toEqual([]);
      expect((await request(catalog, 'DELETE', url(draft.id), L(author))).status).toBe(204);
    });
  });
});

describe('class session reminders (NOTIFY-1)', () => {
  it('reminds a cohort a day ahead, once', async () => {
    const reminders = learning.get(SessionRemindersService);
    const sent = await reminders.run();
    expect(await reminders.run()).toBe(0);
    expect(sent).toBeGreaterThanOrEqual(0);
  });
});

describe('admissions (ADM-1)', () => {
  let owner: string;
  let officer: string;
  let applicant: string;
  let orgId: string;
  let cohortId: string;
  let cycle: AdmissionCycle;
  let app: Application;
  const long = (n: number, seed: string) => Array.from({ length: Math.ceil(n / seed.length) + 1 }, () => seed).join(' ').slice(0, n + 20);
  const answers = {
    eligibility: { isAdult: true, country: 'Nigeria', educationLevel: 'undergraduate', canCommitFullTime: true, hasDeviceAndInternet: true },
    application: { city: 'Abuja', occupation: 'Agronomist', motivation: long(120, 'I want to turn my crop dryer into a business that serves my whole district.'), howHeard: 'A friend' },
    dream_application: {
      dream: long(90, 'Every smallholder in Kaduna dries grain without losing a third of it.'),
      problem: long(90, 'Post-harvest losses from damp storage ruin grain and income.'),
      whoBenefits: long(45, 'Smallholder farmers and their families.'),
      whyYou: long(90, 'I built the first dryer myself and sold twelve to neighbours.'),
    },
    evidence: { items: [{ title: 'Solar grain dryer', description: 'Built from scrap and sold twelve units to farmers in my village.', link: null }] },
    assessment: { answers: Object.fromEntries(['build', 'setback', 'resource', 'people', 'learning'].map((id) => [id, long(70, `My answer about ${id}, with what I did and what happened next.`)])) },
    video: { url: 'https://video.example.com/my-pitch', note: '' },
  };

  const tokenFor = async (email: string, name: string) => {
    const personal = await signUp(email, name);
    expect((await request(iam, 'POST', '/v1/invitations/accept', { token: personal, body: { token: notifier.lastInviteToken(email) } })).status).toBe(200);
    return ((await request(iam, 'POST', '/v1/auth/switch-org', { token: personal, body: { orgId } })).body as { accessToken: string }).accessToken;
  };

  beforeAll(async () => {
    const admin = ((await request(iam, 'POST', '/v1/auth/login', { body: { identifier: 'admin@theafricandreamlab.com', password: 'e2e-admin-password' } })).body as { accessToken: string })
      .accessToken;
    const personal = await signUp('owner@abuja-academy.test', 'Amina Owner');
    const org = await request(iam, 'POST', '/v1/orgs', { token: admin, body: { slug: 'abuja-academy', name: 'Abuja Academy', kinds: ['institution'], firstAdmin: { email: 'owner@abuja-academy.test' } } });
    orgId = (org.body as { id: string }).id;
    owner = ((await request(iam, 'POST', '/v1/auth/switch-org', { token: personal, body: { orgId } })).body as { accessToken: string }).accessToken;
    expect((await request(iam, 'POST', `/v1/orgs/${orgId}/invitations`, { token: owner, body: { email: 'officer@abuja-academy.test', roleKeys: ['admissions_officer'] } })).status).toBe(201);
    officer = await tokenFor('officer@abuja-academy.test', 'Obi Officer');
    applicant = await signUp('builder@applicant.test', 'Bola Builder');
    const cohort = await request(learning, 'POST', '/v1/learning/cohorts', { ...L(owner), body: { programSlug: 'the-african-dream-lab', name: 'Abuja 01', startsOn: todayIn('Africa/Lagos') } });
    expect(cohort.status).toBe(201);
    cohortId = (cohort.body as CohortDetail).id;
  });

  it('runs a cycle: created as a draft by admissions managers, open to everyone once opened', async () => {
    const body = {
      name: 'Abuja intake 2027',
      programSlug: 'the-african-dream-lab',
      cohortId,
      opensAt: new Date(Date.now() - 60_000).toISOString(),
      closesAt: new Date(Date.now() + 30 * 86_400_000).toISOString(),
    };
    expect((await request(admissions, 'POST', '/v1/admissions/admin/cycles', { ...L(officer), body })).status).toBe(403);
    expect((await request(admissions, 'POST', '/v1/admissions/admin/cycles', { ...L(owner), body: { ...body, programSlug: 'no-such-programme' } })).status).toBe(404);
    const created = await request(admissions, 'POST', '/v1/admissions/admin/cycles', { ...L(owner), body });
    expect(created).toMatchObject({ status: 201, body: { status: 'draft', orgName: 'Abuja Academy', programTitle: expect.any(String), cohortId } });
    cycle = created.body as AdmissionCycle;
    const open = () => request(admissions, 'GET', '/v1/admissions/cycles?programSlug=the-african-dream-lab').then((r) => (r.body as { items: AdmissionCycle[] }).items.map((c) => c.id));
    expect(await open()).not.toContain(cycle.id);
    expect((await request(admissions, 'PATCH', `/v1/admissions/admin/cycles/${cycle.id}`, { ...L(owner), body: { status: 'open' } })).status).toBe(200);
    expect(await open()).toContain(cycle.id);
    expect(((await request(admissions, 'GET', '/v1/admissions/admin/cycles', L(officer))).body as { items: unknown[] }).items).toHaveLength(1);
    expect((await request(admissions, 'GET', '/v1/admissions/admin/cycles', L(applicant))).status).toBe(403);
  });

  it('takes the applicant through their six stages, checking each before it moves on', async () => {
    const started = await request(admissions, 'POST', '/v1/admissions/applications', { ...L(applicant), body: { cycleId: cycle.id } });
    expect(started).toMatchObject({ status: 201, body: { stage: 'eligibility', status: 'in_progress', can: { edit: true, review: false, decide: false } } });
    app = started.body as Application;
    // Starting again resumes the same application.
    expect(((await request(admissions, 'POST', '/v1/admissions/applications', { ...L(applicant), body: { cycleId: cycle.id } })).body as Application).id).toBe(app.id);

    const incomplete = await request(admissions, 'POST', `/v1/admissions/applications/${app.id}/stages/eligibility/submit`, L(applicant));
    expect(incomplete).toMatchObject({ status: 400, body: { code: 'stage_incomplete' } });
    expect((await request(admissions, 'PUT', `/v1/admissions/applications/${app.id}/stages/application`, { ...L(applicant), body: { answers: {} } })).status).toBe(409);
    for (const [stage, value] of Object.entries(answers)) {
      expect((await request(admissions, 'PUT', `/v1/admissions/applications/${app.id}/stages/${stage}`, { ...L(applicant), body: { answers: value } })).status).toBe(200);
      const submitted = await request(admissions, 'POST', `/v1/admissions/applications/${app.id}/stages/${stage}/submit`, L(applicant));
      expect(submitted.status).toBe(200);
      app = submitted.body as Application;
    }
    expect(app).toMatchObject({ stage: 'interview', status: 'under_review', can: { edit: false } });
    expect(Object.keys(app.submitted)).toHaveLength(6);
    expect(app.transitions.map((t) => t.to)).toEqual(['eligibility', 'application', 'dream_application', 'evidence', 'assessment', 'video', 'interview']);
    await notificationsFor(officer, (n) => n.category === 'admissions' && n.title.includes('New application'));
    // Applicants never reach the staff routes, and other people never see the application.
    expect((await request(admissions, 'POST', `/v1/admissions/admin/applications/${app.id}/advance`, { ...L(applicant), body: {} })).status).toBe(403);
    const nosy = await signUp('nosy@applicant.test', 'Nosy Neighbour');
    expect((await request(admissions, 'GET', `/v1/admissions/applications/${app.id}`, L(nosy))).status).toBe(404);
    expect(((await request(admissions, 'GET', '/v1/admissions/applications/mine', L(applicant))).body as { items: { id: string }[] }).items.map((i) => i.id)).toEqual([app.id]);
  });

  it('moves staff stages only with their records, keeps reviews and AI evaluations immutable, and leaves decisions to people', async () => {
    const act = (path: string, token: string, method: 'POST' | 'PUT' = 'POST', body: unknown = {}) =>
      request(admissions, method, `/v1/admissions/admin/applications/${app.id}/${path}`, { ...L(token), body });
    expect(await act('advance', officer)).toMatchObject({ status: 409, body: { code: 'interview_missing' } });
    const when = new Date(Date.now() + 3 * 86_400_000).toISOString();
    expect((await act('interview', officer, 'PUT', { scheduledAt: when, interviewerUserId: null, notes: 'Strong on evidence.' })).status).toBe(200);
    await notificationsFor(applicant, (n) => n.title === 'Your admissions interview');
    expect((await act('advance', officer, 'POST', { note: 'Interview went well' })).body).toMatchObject({ stage: 'scholarship' });
    expect((await act('scholarship', officer, 'PUT', { percent: 50, note: 'Need shown' })).status).toBe(403);
    expect((await act('scholarship', owner, 'PUT', { percent: 50, note: 'Need shown' })).status).toBe(200);
    expect((await act('advance', officer)).body).toMatchObject({ stage: 'committee' });
    expect(await act('advance', officer)).toMatchObject({ status: 409, body: { code: 'review_missing' } });

    const scores = { dream_clarity: 5, problem_insight: 4, evidence_of_action: 5, builder_mindset: 4, commitment: 5, communication: 3 };
    const reviewed = await act('reviews', officer, 'POST', { scores, recommendation: 'advance', comment: 'Built and sold a working product already.' });
    expect(reviewed.status).toBe(201);
    expect((reviewed.body as Application).reviews[0]).toMatchObject({ reviewer: 'Obi Officer', dbpi: 83, dsi: 83 });
    const evaluated = await act('ai-evaluations', officer);
    expect(evaluated.status).toBe(201);
    expect((evaluated.body as Application).aiEvaluations[0]).toMatchObject({ model: 'claude-test', promptVersion: 'test-1', requestedBy: 'Obi Officer' });
    const db = admissions.get<DatabaseService<Record<string, unknown>>>(DATABASE);
    for (const table of ['ai_evaluations', 'application_reviews', 'stage_transitions']) {
      await expect(db.systemPool.query(`update ${table} set org_id = org_id`)).rejects.toThrow(/permission denied/);
      await expect(db.systemPool.query(`delete from ${table}`)).rejects.toThrow(/permission denied/);
    }

    expect((await act('advance', officer)).body).toMatchObject({ stage: 'decision', can: { review: true, decide: false } });
    expect((await act('decision', officer, 'POST', { outcome: 'admitted', note: 'Committee agreed' })).status).toBe(403);
    expect((await act('decision', owner, 'POST', { outcome: 'admitted', note: 'Committee agreed' })).body).toMatchObject({ status: 'admitted', decision: { outcome: 'admitted' } });

    // The applicant sees the outcome and their award, never staff notes, reviews or the AI's view.
    const mine = (await request(admissions, 'GET', `/v1/admissions/applications/${app.id}`, L(applicant))).body as Application;
    expect(mine).toMatchObject({
      status: 'admitted',
      reviews: [],
      aiEvaluations: [],
      decision: { outcome: 'admitted', note: '', decidedBy: 'Admissions team' },
      scholarship: { percent: 50, note: '' },
      interview: { notes: '' },
    });
    await notificationsFor(applicant, (n) => n.title.startsWith('You are admitted'));
  });

  it('enrols the admitted applicant in the cohort of the cycle', async () => {
    const programs = (await eventually(async () => {
      const items = ((await request(learning, 'GET', '/v1/learning/me/programs', L(applicant))).body as { items: MyProgram[] }).items;
      return items.length > 0 ? items : null;
    })) as MyProgram[];
    expect(programs.map((p) => p.cohort.id)).toEqual([cohortId]);
  });
});

describe('live classes, mentors and Dream Circles (LIVE-1, COMM-1)', () => {
  let owner: string;
  let mentor: string;
  let ada: string;
  let bayo: string;
  let outsider: string;
  let orgId: string;
  let cohort: CohortDetail;
  let session: CohortDetail['sessions'][number];
  const ids: Record<string, string> = {};
  const start = new Date(Math.floor(Date.now() / 60_000) * 60_000 - 60 * 60_000);
  const at = (minutes: number) => String(Math.floor((start.getTime() + minutes * 60_000) / 1000));

  const tokenFor = async (email: string, name: string) => {
    const personal = await signUp(email, name);
    expect((await request(iam, 'POST', '/v1/invitations/accept', { token: personal, body: { token: notifier.lastInviteToken(email) } })).status).toBe(200);
    const switched = (await request(iam, 'POST', '/v1/auth/switch-org', { token: personal, body: { orgId } })).body as { accessToken: string };
    ids[email] = ((await request(iam, 'GET', '/v1/me', L(switched.accessToken))).body as { user: { id: string } }).user.id;
    return switched.accessToken;
  };

  beforeAll(async () => {
    const admin = ((await request(iam, 'POST', '/v1/auth/login', { body: { identifier: 'admin@theafricandreamlab.com', password: 'e2e-admin-password' } })).body as { accessToken: string })
      .accessToken;
    const personal = await signUp('owner@enugu-hub.test', 'Ebere Owner');
    orgId = ((await request(iam, 'POST', '/v1/orgs', { token: admin, body: { slug: 'enugu-hub', name: 'Enugu Hub', kinds: ['enterprise'], firstAdmin: { email: 'owner@enugu-hub.test' } } })).body as { id: string }).id;
    owner = ((await request(iam, 'POST', '/v1/auth/switch-org', { token: personal, body: { orgId } })).body as { accessToken: string }).accessToken;
    for (const [email, role] of [
      ['mentor@enugu-hub.test', 'mentor'],
      ['ada@enugu-hub.test', 'learner'],
      ['bayo@enugu-hub.test', 'learner'],
    ] as const) {
      expect((await request(iam, 'POST', `/v1/orgs/${orgId}/invitations`, { token: owner, body: { email, roleKeys: [role] } })).status).toBe(201);
    }
    mentor = await tokenFor('mentor@enugu-hub.test', 'Mma Mentor');
    ada = await tokenFor('ada@enugu-hub.test', 'Ada Eze');
    bayo = await tokenFor('bayo@enugu-hub.test', 'Bayo Ade');
    outsider = await signUp('outsider@live.test', 'Olu Outsider');

    cohort = (await request(learning, 'POST', '/v1/learning/cohorts', { ...L(owner), body: { programSlug: 'the-african-dream-lab', name: 'Enugu 01', startsOn: todayIn('Africa/Lagos') } })).body as CohortDetail;
    expect((await request(learning, 'PATCH', `/v1/learning/cohorts/${cohort.id}`, { ...L(owner), body: { status: 'open' } })).status).toBe(200);
    for (const t of [ada, bayo]) expect((await request(learning, 'POST', `/v1/learning/cohorts/${cohort.id}/join`, { ...L(t), body: {} })).status).toBe(201);
    // An online class that started an hour ago: its room is open.
    session = cohort.sessions.find((s) => s.mode === 'virtual')!;
    const moved = await request(learning, 'PATCH', `/v1/learning/cohorts/${cohort.id}/sessions/${session.id}`, { ...L(owner), body: { startsAt: start.toISOString() } });
    expect(moved.status).toBe(200);
  });

  it('lets the cohort’s learners join a class as participants and its staff as hosts, nobody else', async () => {
    const path = `/v1/learning/cohorts/${cohort.id}/sessions/${session.id}`;
    expect((await request(learning, 'GET', `${path}/live`, L(ada))).body).toMatchObject({ joinable: true, recordings: [] });
    expect((await request(learning, 'POST', `${path}/join`, { ...L(ada), body: {} })).body).toMatchObject({ role: 'participant', roomName: `dl-e2e-session-${session.id}`, url: 'ws://livekit.test' });
    expect((await request(learning, 'POST', `${path}/join`, { ...L(owner), body: {} })).body).toMatchObject({ role: 'host' });
    expect((await request(learning, 'POST', `${path}/join`, { ...L(outsider), body: {} })).status).toBe(404);
    const inPerson = cohort.sessions.find((s) => s.mode === 'physical')!;
    expect(await request(learning, 'POST', `/v1/learning/cohorts/${cohort.id}/sessions/${inPerson.id}/join`, { ...L(ada), body: {} })).toMatchObject({ status: 403 });
  });

  it('takes attendance from the room’s signed join and leave events, never over a faculty correction', async () => {
    const room = { name: `dl-e2e-session-${session.id}` };
    const event = (id: string, kind: string, identity: string, minutes: number) => ({ id, event: kind, createdAt: at(minutes), room, participant: { identity } });
    expect((await liveKitWebhook(event('EV_ada_in', 'participant_joined', ids['ada@enugu-hub.test']!, 2))).statusCode).toBe(200);
    expect((await liveKitWebhook(event('EV_ada_out', 'participant_left', ids['ada@enugu-hub.test']!, 47))).statusCode).toBe(200);
    expect((await liveKitWebhook(event('EV_bayo_in', 'participant_joined', ids['bayo@enugu-hub.test']!, 20))).statusCode).toBe(200);
    expect((await liveKitWebhook(event('EV_bayo_out', 'participant_left', ids['bayo@enugu-hub.test']!, 50))).statusCode).toBe(200);
    // Redelivered events change nothing; events for another environment's rooms are ignored.
    expect((await liveKitWebhook(event('EV_ada_in', 'participant_joined', ids['ada@enugu-hub.test']!, 2))).statusCode).toBe(200);
    expect((await liveKitWebhook({ ...event('EV_other', 'participant_joined', ids['ada@enugu-hub.test']!, 1), room: { name: `dl-prod-session-${session.id}` } })).statusCode).toBe(200);
    // A forged event is refused.
    const forged = await learning.inject({ method: 'POST', url: '/v1/learning/meetings/webhook', payload: JSON.stringify(event('EV_x', 'participant_left', ids['ada@enugu-hub.test']!, 3)), headers: { 'content-type': 'application/webhook+json', authorization: 'not-a-token' } });
    expect(forged.statusCode).toBe(400);

    const sheet = async () => ((await request(learning, 'GET', `/v1/learning/cohorts/${cohort.id}/sessions/${session.id}/attendance`, L(owner))).body as { items: { name: string; status: string | null; minutes: number | null }[] }).items;
    expect(await sheet()).toEqual(expect.arrayContaining([expect.objectContaining({ name: 'Ada Eze', status: 'present', minutes: 45 }), expect.objectContaining({ name: 'Bayo Ade', status: 'late', minutes: 30 })]));
    expect((await request(learning, 'PUT', `/v1/learning/cohorts/${cohort.id}/sessions/${session.id}/attendance`, { ...L(owner), body: { entries: [{ userId: ids['bayo@enugu-hub.test'], status: 'excused' }] } })).status).toBe(200);
    expect((await liveKitWebhook(event('EV_bayo_in2', 'participant_joined', ids['bayo@enugu-hub.test']!, 55))).statusCode).toBe(200);
    expect((await sheet()).find((i) => i.name === 'Bayo Ade')).toMatchObject({ status: 'excused' });
  });

  it('takes recordings from the class’s staff only, and lists them for its learners', async () => {
    const path = `/v1/learning/cohorts/${cohort.id}/sessions/${session.id}/recordings`;
    const body = { title: 'Week 1 class', fileName: 'class.mp4', contentType: 'video/mp4', size: 1024 };
    expect((await request(learning, 'POST', path, { ...L(ada), body })).status).toBe(403);
    const ticket = await request(learning, 'POST', path, { ...L(owner), body });
    expect(ticket).toMatchObject({ status: 201, body: { recordingId: expect.any(String), uploadUrl: expect.any(String) } });
    expect(((await request(learning, 'GET', `/v1/learning/cohorts/${cohort.id}/sessions/${session.id}/live`, L(ada))).body as { recordings: { title: string }[] }).recordings.map((r) => r.title)).toEqual(['Week 1 class']);
    expect(((await request(learning, 'GET', '/v1/learning/me/community', L(ada))).body as MyCommunity).recordings).toMatchObject([{ title: 'Week 1 class', weekNo: session.weekNo, cohortName: 'Enugu 01' }]);
    expect(((await request(learning, 'GET', '/v1/learning/me/community', L(outsider))).body as MyCommunity).recordings).toEqual([]);
    // The file never arrived: no link to it.
    expect((await request(learning, 'GET', `/v1/learning/recordings/${(ticket.body as { recordingId: string }).recordingId}`, L(ada))).status).toBe(404);
  });

  it('pairs mentors with learners, who meet one to one with camera allowed', async () => {
    const candidates = (await request(learning, 'GET', `/v1/learning/cohorts/${cohort.id}/mentors`, L(owner))).body as { candidates: { userId: string; name: string }[] };
    expect(candidates.candidates.map((c) => c.name)).toContain('Mma Mentor');
    expect((await request(learning, 'GET', `/v1/learning/cohorts/${cohort.id}/mentors`, L(ada))).status).toBe(403);
    const notMentor = await request(learning, 'POST', `/v1/learning/cohorts/${cohort.id}/mentors`, { ...L(owner), body: { mentorUserId: ids['bayo@enugu-hub.test'], learnerUserIds: [ids['ada@enugu-hub.test']] } });
    expect(notMentor).toMatchObject({ status: 400, body: { code: 'not_a_mentor' } });
    const assigned = await request(learning, 'POST', `/v1/learning/cohorts/${cohort.id}/mentors`, { ...L(owner), body: { mentorUserId: ids['mentor@enugu-hub.test'], learnerUserIds: [ids['ada@enugu-hub.test']] } });
    expect(assigned.status).toBe(201);
    const assignmentId = (assigned.body as { items: { id: string }[] }).items[0]!.id;

    const mine = (await request(learning, 'GET', '/v1/learning/mentoring', L(mentor))).body as { learners: { learner: { name: string } }[] };
    expect(mine.learners.map((l) => l.learner.name)).toEqual(['Ada Eze']);
    const scheduled = await request(learning, 'POST', '/v1/learning/mentoring/meetings', { ...L(mentor), body: { assignmentId, scheduledAt: new Date(Date.now() + 5 * 60_000).toISOString(), durationMin: 30 } });
    expect(scheduled).toMatchObject({ status: 201, body: { joinable: true, mode: 'virtual' } });
    const meetingId = (scheduled.body as { id: string }).id;
    expect((await request(learning, 'POST', '/v1/learning/mentoring/meetings', { ...L(bayo), body: { assignmentId, scheduledAt: new Date().toISOString() } })).status).toBe(404);

    const community = (await request(learning, 'GET', '/v1/learning/me/community', L(ada))).body as MyCommunity;
    expect(community.mentors).toMatchObject([{ name: 'Mma Mentor', cohortName: 'Enugu 01' }]);
    expect(community.meetings.map((m) => m.id)).toEqual([meetingId]);
    expect((await request(learning, 'POST', `/v1/learning/mentoring/meetings/${meetingId}/join`, { ...L(ada), body: {} })).body).toMatchObject({ role: 'participant' });
    expect(meetKit.joins.at(-1)).toMatchObject({ role: 'participant', participantVideo: true });
    expect((await request(learning, 'POST', `/v1/learning/mentoring/meetings/${meetingId}/join`, { ...L(bayo), body: {} })).status).toBe(404);
    await notificationsFor(ada, (n) => n.category === 'community');
    // Once the mentorship ends, its meetings can no longer be joined.
    expect((await request(learning, 'DELETE', `/v1/learning/mentor-assignments/${assignmentId}`, L(owner))).status).toBe(204);
    expect((await request(learning, 'POST', `/v1/learning/mentoring/meetings/${meetingId}/join`, { ...L(ada), body: {} })).status).toBe(404);
  });

  it('forms Dream Circles from the cohort’s learners', async () => {
    const members = [ids['ada@enugu-hub.test']!, ids['bayo@enugu-hub.test']!];
    expect((await request(learning, 'POST', `/v1/learning/cohorts/${cohort.id}/circles`, { ...L(owner), body: { name: 'Circle A', memberUserIds: [members[0], ids['mentor@enugu-hub.test']] } })).status).toBe(400);
    const created = await request(learning, 'POST', `/v1/learning/cohorts/${cohort.id}/circles`, { ...L(owner), body: { name: 'Circle A', memberUserIds: members } });
    expect(created.status).toBe(201);
    const circles = ((await request(learning, 'GET', '/v1/learning/me/community', L(bayo))).body as MyCommunity).circles;
    expect(circles).toMatchObject([{ name: 'Circle A', cohortName: 'Enugu 01' }]);
    expect(circles[0]!.members.map((m) => m.name).sort()).toEqual(['Ada Eze', 'Bayo Ade']);
  });

  it('gives a circle its own space: posts, replies, files, links, moderation and a call (COMM-2)', async () => {
    const circleId = ((await request(learning, 'GET', '/v1/learning/me/community', L(bayo))).body as MyCommunity).circles[0]!.id;
    const base = `/v1/learning/circles/${circleId}`;
    // The mentorship above has ended; Ada gets her mentor back, which brings the mentor into the circle.
    expect((await request(learning, 'GET', `${base}/space`, L(mentor))).status).toBe(404);
    const again = await request(learning, 'POST', `/v1/learning/cohorts/${cohort.id}/mentors`, { ...L(owner), body: { mentorUserId: ids['mentor@enugu-hub.test'], learnerUserIds: [ids['ada@enugu-hub.test']] } });
    expect(again.status).toBe(201);
    expect((await request(learning, 'GET', '/v1/learning/mentoring', L(mentor))).body).toMatchObject({ circles: [{ id: circleId, name: 'Circle A', cohortName: 'Enugu 01' }] });

    // Who may enter: members, the members' mentors, and the cohort's staff; nobody else learns it exists.
    expect((await request(learning, 'GET', `${base}/space`, L(outsider))).status).toBe(404);
    expect((await request(learning, 'GET', `${base}/space`, L(ada))).body as CircleSpace).toMatchObject({ name: 'Circle A', you: { role: 'member' }, can: { moderate: false }, call: { active: false } });
    expect((await request(learning, 'GET', `${base}/space`, L(mentor))).body as CircleSpace).toMatchObject({ you: { role: 'mentor' }, can: { moderate: true } });
    const staffView = (await request(learning, 'GET', `${base}/space`, L(owner))).body as CircleSpace;
    expect(staffView).toMatchObject({ you: { role: 'staff' }, can: { moderate: true } });
    expect(staffView.members.map((m) => `${m.name}:${m.role}`)).toEqual(['Ada Eze:member', 'Bayo Ade:member', 'Mma Mentor:mentor']);

    // A post with a picture uploaded straight to storage, and a link to an internal address, which is
    // never fetched: its preview is the bare link.
    const ticket = await request(learning, 'POST', `${base}/uploads`, { ...L(ada), body: { fileName: 'idea.png', contentType: 'image/png', size: 9, width: 640, height: 480 } });
    expect(ticket.status).toBe(201);
    const { attachmentId, uploadUrl, headers } = ticket.body as CircleUploadTicket;
    expect((await request(learning, 'POST', `${base}/posts`, { ...L(ada), body: { body: 'Too early', attachmentIds: [attachmentId] } })).status).toBe(400);
    expect((await fetch(uploadUrl, { method: 'PUT', headers, body: Buffer.from('png bytes') })).status).toBe(201);
    expect((await request(learning, 'POST', `${base}/uploads`, { ...L(ada), body: { fileName: 'x.html', contentType: 'text/html', size: 10 } })).status).toBe(400);
    const disguised = (await request(learning, 'POST', `${base}/uploads`, { ...L(ada), body: { fileName: 'cat.png', contentType: 'image/png', size: 30 } })).body as CircleUploadTicket;
    const html = await fetch(disguised.uploadUrl, { method: 'PUT', headers: { ...disguised.headers, 'content-type': 'text/html' }, body: '<script>alert(1)</script>' });
    expect(html.status).toBe(201);
    expect((await request(learning, 'POST', `${base}/posts`, { ...L(ada), body: { attachmentIds: [disguised.attachmentId] } })).body).toMatchObject({ code: 'file_type_mismatch' });
    expect((await request(learning, 'POST', `${base}/uploads`, { ...L(ada), body: { fileName: 'big.mp4', contentType: 'video/mp4', size: 500 * 1024 * 1024 } })).status).toBe(400);
    const made = await request(learning, 'POST', `${base}/posts`, { ...L(ada), body: { body: 'My prototype, see https://127.0.0.1/admin', attachmentIds: [attachmentId] } });
    expect(made.status).toBe(201);
    const post = made.body as CirclePost;
    expect(post).toMatchObject({
      author: { name: 'Ada Eze', role: 'member' },
      links: [{ url: 'https://127.0.0.1/admin', title: null }],
      attachments: [{ kind: 'image', fileName: 'idea.png', width: 640 }],
    });
    expect(post.attachments[0]!.url).toContain('sig=');
    // A file is used once, by its uploader.
    expect((await request(learning, 'POST', `${base}/posts`, { ...L(bayo), body: { body: 'Mine now', attachmentIds: [attachmentId] } })).status).toBe(400);
    expect((await request(learning, 'POST', `${base}/posts`, { ...L(outsider), body: { body: 'Hello?' } })).status).toBe(404);

    // Replies count on their post and read oldest first.
    const reply = (await request(learning, 'POST', `${base}/posts`, { ...L(bayo), body: { body: 'Looks great', parentId: post.id } })).body as CirclePost;
    expect((await request(learning, 'POST', `${base}/posts`, { ...L(ada), body: { body: 'Nested', parentId: reply.id } })).status).toBe(400);
    const second = (await request(learning, 'POST', `${base}/posts`, { ...L(ada), body: { body: 'Thanks!', parentId: post.id } })).body as CirclePost;
    const replies = (await request(learning, 'GET', `${base}/posts?parentId=${post.id}&limit=1`, L(ada))).body as CirclePostPage;
    expect(replies.items.map((r) => r.body)).toEqual(['Looks great']);
    const more = (await request(learning, 'GET', `${base}/posts?parentId=${post.id}&limit=1&before=${encodeURIComponent(replies.nextCursor!)}`, L(ada))).body as CirclePostPage;
    expect(more).toMatchObject({ items: [{ body: 'Thanks!' }], nextCursor: null });
    expect((await request(learning, 'DELETE', `/v1/learning/circle-posts/${second.id}`, L(ada))).status).toBe(204);

    // Pages: newest first, with a cursor for older posts.
    for (const n of [1, 2, 3]) await request(learning, 'POST', `${base}/posts`, { ...L(bayo), body: { body: `Update ${n}` } });
    const first = (await request(learning, 'GET', `${base}/posts?limit=2`, L(ada))).body as CirclePostPage;
    expect(first.items.map((x) => x.body)).toEqual(['Update 3', 'Update 2']);
    const older = (await request(learning, 'GET', `${base}/posts?limit=2&before=${encodeURIComponent(first.nextCursor!)}`, L(ada))).body as CirclePostPage;
    expect(older.items.map((x) => x.body)).toEqual(['Update 1', 'My prototype, see https://127.0.0.1/admin']);
    expect(older.items[1]!.replyCount).toBe(1);
    expect(older.nextCursor).toBeNull();

    // Moderation: members remove only their own posts; mentors and staff pin and remove.
    expect((await request(learning, 'DELETE', `/v1/learning/circle-posts/${post.id}`, L(bayo))).status).toBe(403);
    expect((await request(learning, 'PUT', `/v1/learning/circle-posts/${post.id}/pin`, { ...L(ada), body: { pinned: true } })).status).toBe(403);
    expect((await request(learning, 'PUT', `/v1/learning/circle-posts/${post.id}/pin`, { ...L(mentor), body: { pinned: true } })).body).toMatchObject({ pinned: true });
    expect(((await request(learning, 'GET', `${base}/posts?limit=2`, L(ada))).body as CirclePostPage).items[0]!.id).toBe(post.id);
    expect((await request(learning, 'DELETE', `/v1/learning/circle-posts/${reply.id}`, L(bayo))).status).toBe(204);
    expect(((await request(learning, 'GET', `${base}/posts?parentId=${post.id}`, L(ada))).body as CirclePostPage).items).toEqual([]);
    expect((await request(learning, 'DELETE', `/v1/learning/circle-posts/${post.id}`, L(owner))).status).toBe(204);

    // The call: everyone may use their camera; mentors and staff host. Never recorded.
    meetKit.joins.length = 0;
    expect((await request(learning, 'POST', `${base}/call`, L(bayo))).body).toMatchObject({ role: 'participant', roomName: `dl-e2e-circle-${circleId}` });
    expect((await request(learning, 'POST', `${base}/call`, L(mentor))).body).toMatchObject({ role: 'host' });
    expect(meetKit.joins.map((j) => j.participantVideo)).toEqual([true, true]);
    expect((await request(learning, 'POST', `${base}/call`, L(outsider))).status).toBe(404);

    // Dissolving a circle takes its files with it.
    const formed = await request(learning, 'POST', `/v1/learning/cohorts/${cohort.id}/circles`, {
      ...L(owner),
      body: { name: 'Short-lived', memberUserIds: [ids['ada@enugu-hub.test'], ids['bayo@enugu-hub.test']] },
    });
    expect(formed.status).toBe(201);
    const brief = formed.body as { id: string };
    const uploading = await request(learning, 'POST', `/v1/learning/circles/${brief.id}/uploads`, { ...L(ada), body: { fileName: 'notes.pdf', contentType: 'application/pdf', size: 9 } });
    expect(uploading.body).toMatchObject({ kind: 'file' });
    const file = uploading.body as CircleUploadTicket;
    expect((await fetch(file.uploadUrl, { method: 'PUT', headers: file.headers, body: Buffer.from('pdf bytes') })).status).toBe(201);
    const storage = learning.get<BlobStorage>(STORAGE);
    const path = `circles/${brief.id}/${file.attachmentId}/notes.pdf`;
    expect(await storage.stat('private', path)).not.toBeNull();
    expect((await request(learning, 'DELETE', `/v1/learning/circles/${brief.id}`, L(owner))).status).toBe(204);
    expect(await storage.stat('private', path)).toBeNull();
  });

  it('shares contacts only by choice, schedules meetups with reminders and tells the circle what happens (COMM-3)', async () => {
    const circleId = ((await request(learning, 'GET', '/v1/learning/me/community', L(bayo))).body as MyCommunity).circles[0]!.id;
    const base = `/v1/learning/circles/${circleId}`;
    const space = async (token: string) => (await request(learning, 'GET', `${base}/space`, L(token))).body as CircleSpace;

    // Nothing is shared until someone chooses to share it.
    expect((await space(ada)).members.map((m) => m.contact)).toEqual([null, null, null]);
    expect((await request(learning, 'PUT', `${base}/contact`, { ...L(ada), body: { linkedin: 'https://evil.example/in/ada' } })).status).toBe(400);
    const shared = await request(learning, 'PUT', `${base}/contact`, { ...L(ada), body: { email: 'ada@circle.test', phone: '+2348012345678', whatsapp: true } });
    expect(shared).toMatchObject({ status: 200, body: { email: 'ada@circle.test', phone: '+2348012345678', whatsapp: true, linkedin: null } });
    expect((await space(bayo)).members.find((m) => m.name === 'Ada Eze')!.contact).toMatchObject({ email: 'ada@circle.test', whatsapp: true });
    expect((await space(ada)).you.contact).toMatchObject({ phone: '+2348012345678' });
    // Cohort staff can open the circle, but contact details stay within it.
    expect((await space(owner)).members.find((m) => m.name === 'Ada Eze')!.contact).toBeNull();
    // WhatsApp needs a number; staff are not listed in the circle, so they share nothing here.
    expect((await request(learning, 'PUT', `${base}/contact`, { ...L(bayo), body: { whatsapp: true } })).body).toEqual({ email: null, phone: null, whatsapp: false, linkedin: null });
    expect((await space(ada)).members.find((m) => m.name === 'Bayo Ade')!.contact).toBeNull();
    expect((await request(learning, 'PUT', `${base}/contact`, { ...L(owner), body: { email: 'owner@circle.test' } })).status).toBe(403);
    expect((await request(learning, 'PUT', `${base}/contact`, { ...L(outsider), body: {} })).status).toBe(404);
    // Clearing the form stops sharing.
    expect((await request(learning, 'PUT', `${base}/contact`, { ...L(ada), body: {} })).status).toBe(200);
    expect((await space(bayo)).members.find((m) => m.name === 'Ada Eze')!.contact).toBeNull();

    // Meetups: anyone in the circle schedules one; online ones use the circle call.
    const inHalfAnHour = new Date(Date.now() + 30 * 60_000).toISOString();
    const inThreeHours = new Date(Date.now() + 3 * 3_600_000).toISOString();
    expect((await request(learning, 'POST', `${base}/meetups`, { ...L(bayo), body: { title: 'Too late', startsAt: new Date(Date.now() - 3_600_000).toISOString() } })).status).toBe(400);
    expect((await request(learning, 'POST', `${base}/meetups`, { ...L(bayo), body: { title: 'Nowhere', startsAt: inThreeHours, mode: 'physical' } })).status).toBe(400);
    const soon = await request(learning, 'POST', `${base}/meetups`, { ...L(bayo), body: { title: 'Pitch practice', startsAt: inHalfAnHour } });
    expect(soon).toMatchObject({ status: 201, body: { mode: 'virtual', location: null, durationMin: 60, createdBy: { name: 'Bayo Ade' }, can: { cancel: true } } });
    const walk = await request(learning, 'POST', `${base}/meetups`, {
      ...L(ada),
      body: { title: 'Market walk', startsAt: inThreeHours, mode: 'physical', location: 'Ogbete Market', durationMin: 90 },
    });
    expect(walk.status).toBe(201);
    const walkId = (walk.body as { id: string }).id;
    expect((await space(mentor)).meetups.map((m) => `${m.title}:${m.can.cancel}`)).toEqual(['Pitch practice:true', 'Market walk:true']);
    expect((await space(ada)).meetups.map((m) => `${m.title}:${m.can.cancel}`)).toEqual(['Pitch practice:false', 'Market walk:true']);
    expect((await request(learning, 'DELETE', `/v1/learning/circle-meetups/${(soon.body as { id: string }).id}`, L(ada))).status).toBe(403);
    await notificationsFor(ada, (n) => n.category === 'circles' && n.title === 'Bayo Ade set up a meetup: Pitch practice');
    await notificationsFor(mentor, (n) => n.title === 'Ada Eze set up a meetup: Market walk' && n.body.includes('Ogbete Market'));

    // Reminders go out an hour ahead, once. One set up within the hour was its own reminder.
    const scheduler = learning.get(CircleSchedulerService);
    expect(await scheduler.remind()).toBe(0);
    const walkHour = new Date(Date.parse(inThreeHours) - 50 * 60_000);
    expect(await scheduler.remind(walkHour)).toBe(1);
    expect(await scheduler.remind(walkHour)).toBe(0);
    await notificationsFor(bayo, (n) => n.title === 'Soon: Market walk');

    // A mentor cancels; the circle is told, and the meetup leaves the space.
    expect((await request(learning, 'DELETE', `/v1/learning/circle-meetups/${walkId}`, L(mentor))).status).toBe(204);
    await notificationsFor(ada, (n) => n.title === 'Cancelled: Market walk');
    expect((await space(ada)).meetups.map((m) => m.title)).toEqual(['Pitch practice']);

    // Posts reach the circle and its mentors; replies reach the thread; the earlier call reached everyone.
    await notificationsFor(ada, (n) => n.category === 'circles' && n.title.endsWith('started a call in Circle A') && n.link === `/app/circles/${circleId}/call`);
    expect((await request(notify, 'PUT', '/v1/notifications/preferences', { ...L(ada), body: { email: { circles: false } } })).body).toMatchObject({ email: { circles: false, community: true } });
    const postEmails = (address: string) => mail.to(address).filter((m) => m.subject.includes('Bayo Ade posted in Circle A')).length;
    const before = { ada: postEmails('ada@enugu-hub.test'), mentor: postEmails('mentor@enugu-hub.test') };
    const news =(await request(learning, 'POST', `${base}/posts`, { ...L(bayo), body: { body: 'Demo day is Friday' } })).body as CirclePost;
    await notificationsFor(ada, (n) => n.title === 'Bayo Ade posted in Circle A' && n.body === 'Demo day is Friday');
    await notificationsFor(mentor, (n) => n.title === 'Bayo Ade posted in Circle A');
    expect((await notificationsFor(bayo, () => true)).some((n) => n.title === 'Bayo Ade posted in Circle A')).toBe(false);
    // Ada switched circle emails off: the mentor's email arrives, hers does not.
    await eventually(() => postEmails('mentor@enugu-hub.test') > before.mentor);
    expect(postEmails('ada@enugu-hub.test')).toBe(before.ada);
    await request(learning, 'POST', `${base}/posts`, { ...L(ada), body: { body: 'I will be there', parentId: news.id } });
    await notificationsFor(bayo, (n) => n.title === 'Ada Eze replied in Circle A' && n.body === 'I will be there');

    // Files uploaded for a post that was never made are tidied away after a day.
    const orphan = (await request(learning, 'POST', `${base}/uploads`, { ...L(ada), body: { fileName: 'draft.pdf', contentType: 'application/pdf', size: 12 } })).body as CircleUploadTicket;
    expect(await scheduler.tidy()).toBe(0);
    expect(await scheduler.tidy(new Date(Date.now() + 25 * 3_600_000))).toBeGreaterThanOrEqual(1);
    expect((await request(learning, 'POST', `${base}/posts`, { ...L(ada), body: { attachmentIds: [orphan.attachmentId] } })).status).toBe(400);
  });
});

describe('staying on track (LRN-9)', () => {
  let owner: string;
  let teacher: string;
  let ada: string;
  let bayo: string;
  let solo: string;
  let outsider: string;
  let orgId: string;
  let cohort: CohortDetail;
  let adaProgram: MyProgram;
  let bayoProgram: MyProgram;
  let soloEnrollment: Enrollment;
  const ids: Record<string, string> = {};
  const db = () => learning.get<DatabaseService<typeof learningSchema>>(DATABASE);
  const lagos = 'Africa/Lagos';
  // Reminders go in the daytime, so the scheduler runs at noon in Lagos and timestamps are set around it.
  const noon = zonedTime(todayIn(lagos), '12:00', lagos);
  const daysBefore = (days: number, from = noon) => new Date(from.getTime() - days * 86_400_000);
  const userId = async (token: string) => ((await request(iam, 'GET', '/v1/me', L(token))).body as { user: { id: string } }).user.id;
  const progressNotes = (token: string, min = 1) => notificationsFor(token, (n) => n.category === 'progress', min);

  const tokenFor = async (email: string, name: string) => {
    const personal = await signUp(email, name);
    expect((await request(iam, 'POST', '/v1/invitations/accept', { token: personal, body: { token: notifier.lastInviteToken(email) } })).status).toBe(200);
    const switched = (await request(iam, 'POST', '/v1/auth/switch-org', { token: personal, body: { orgId } })).body as { accessToken: string };
    ids[email] = await userId(switched.accessToken);
    return switched.accessToken;
  };

  beforeAll(async () => {
    const admin = ((await request(iam, 'POST', '/v1/auth/login', { body: { identifier: 'admin@theafricandreamlab.com', password: 'e2e-admin-password' } })).body as { accessToken: string })
      .accessToken;
    const personal = await signUp('owner@ilorin-hub.test', 'Ebun Owner');
    orgId = ((await request(iam, 'POST', '/v1/orgs', { token: admin, body: { slug: 'ilorin-hub', name: 'Ilorin Hub', kinds: ['enterprise'], firstAdmin: { email: 'owner@ilorin-hub.test' } } })).body as { id: string })
      .id;
    owner = ((await request(iam, 'POST', '/v1/auth/switch-org', { token: personal, body: { orgId } })).body as { accessToken: string }).accessToken;
    for (const [email, role] of [
      ['teacher@ilorin-hub.test', 'instructor'],
      ['ada@ilorin-hub.test', 'learner'],
      ['bayo@ilorin-hub.test', 'learner'],
    ] as const) {
      expect((await request(iam, 'POST', `/v1/orgs/${orgId}/invitations`, { token: owner, body: { email, roleKeys: [role] } })).status).toBe(201);
    }
    teacher = await tokenFor('teacher@ilorin-hub.test', 'Tola Teacher');
    ada = await tokenFor('ada@ilorin-hub.test', 'Ada Ige');
    bayo = await tokenFor('bayo@ilorin-hub.test', 'Bayo Ojo');
    solo = await signUp('solo@learner.test', 'Sola Solo');
    outsider = await signUp('outsider@ontrack.test', 'Olu Outsider');

    // Started two weeks ago, so this is week 3: half way through the first phase (weeks 1–4).
    const created = await request(learning, 'POST', '/v1/learning/cohorts', { ...L(owner), body: { programSlug: 'the-african-dream-lab', name: 'Ilorin 01', startsOn: addDays(todayIn(lagos), -14) } });
    expect(created.status).toBe(201);
    cohort = created.body as CohortDetail;
    expect(cohort.calendar.every((w) => w.kind === 'learning')).toBe(true);
    expect((await request(learning, 'PATCH', `/v1/learning/cohorts/${cohort.id}`, { ...L(owner), body: { status: 'open' } })).status).toBe(200);
    adaProgram = (await request(learning, 'POST', `/v1/learning/cohorts/${cohort.id}/join`, { ...L(ada), body: {} })).body as MyProgram;
    bayoProgram = (await request(learning, 'POST', `/v1/learning/cohorts/${cohort.id}/join`, { ...L(bayo), body: {} })).body as MyProgram;
    expect((await request(learning, 'PATCH', `/v1/learning/cohorts/${cohort.id}`, { ...L(owner), body: { status: 'running' } })).status).toBe(200);
    soloEnrollment = (await request(learning, 'POST', '/v1/learning/enrollments', { ...L(solo), body: { courseSlug: 'problem-solving' } })).body as Enrollment;
  });

  it('keeps a goal and study plan in the learner’s own words, for their own enrolments only', async () => {
    const url = `/v1/learning/me/goals/program/${adaProgram.enrollment.id}`;
    expect(await request(learning, 'GET', url, L(ada))).toMatchObject({ status: 200, body: { goal: null } });
    expect((await request(learning, 'PUT', url, { ...L(ada), body: { why: 'Too short', studyDays: ['mon'], minutesPerWeek: 120 } })).status).toBe(400);
    const goal = { why: 'I want to grow my tailoring shop into a brand', success: 'Two new stores', studyDays: ['tue', 'thu'], studyTime: '19:30', minutesPerWeek: 180 };
    const saved = await request(learning, 'PUT', url, { ...L(ada), body: goal });
    expect(saved).toMatchObject({ status: 200, body: { ...goal, scope: 'program', enrollmentId: adaProgram.enrollment.id } });
    const changed = await request(learning, 'PUT', url, { ...L(ada), body: { ...goal, minutesPerWeek: 240 } });
    expect(changed.body).toMatchObject({ id: (saved.body as { id: string }).id, minutesPerWeek: 240 });
    expect((await request(learning, 'GET', url, L(ada))).body).toMatchObject({ goal: { why: goal.why, minutesPerWeek: 240 } });
    // Someone else's enrolment, or a course enrolment under the programme's scope: not found.
    expect((await request(learning, 'GET', url, L(bayo))).status).toBe(404);
    expect((await request(learning, 'PUT', url, { ...L(bayo), body: goal })).status).toBe(404);
    expect((await request(learning, 'GET', `/v1/learning/me/goals/program/${soloEnrollment.id}`, L(solo))).status).toBe(404);
    const course = `/v1/learning/me/goals/course/${soloEnrollment.id}`;
    expect((await request(learning, 'PUT', course, { ...L(solo), body: { why: 'I keep starting things and never finishing them', studyDays: ['sat'], minutesPerWeek: 60 } })).status).toBe(200);
  });

  it('shows a course’s pace, a short catch-up list and the first steps', async () => {
    const url = `/v1/learning/enrollments/${soloEnrollment.id}/on-track`;
    expect((await request(learning, 'GET', url, L(ada))).status).toBe(404);
    const fresh = (await request(learning, 'GET', url, L(solo))).body as OnTrack;
    expect(fresh).toMatchObject({ pace: 'not_started', progressPct: 0, expectedPct: null, daysQuiet: 0, onboarding: { goalSet: true, firstItemDone: false, introducedInCircle: null, done: false } });
    expect(fresh.goal).toMatchObject({ scope: 'course', studyDays: ['sat'] });
    expect(fresh.catchUp).toHaveLength(3);
    expect(fresh.catchUp[0]).toMatchObject({ enrollmentId: soloEnrollment.id, courseSlug: 'problem-solving', courseTitle: 'Problem Solving' });

    // Opening the first item starts the course: on track while learning on their own, until they go quiet.
    expect((await request(learning, 'GET', `/v1/learning/enrollments/${soloEnrollment.id}/items/${fresh.catchUp[0]!.itemId}`, L(solo))).status).toBe(200);
    expect((await request(learning, 'GET', url, L(solo))).body).toMatchObject({ pace: 'on_track', catchUp: [] });
    await db().sys.update(learningSchema.courseEnrollments).set({ lastActiveAt: daysBefore(8, new Date()) }).where(eq(learningSchema.courseEnrollments.id, soloEnrollment.id));
    const quiet = (await request(learning, 'GET', url, L(solo))).body as OnTrack;
    expect(quiet).toMatchObject({ pace: 'behind', daysQuiet: 8 });
    expect(quiet.catchUp[0]!.itemId).toBe(fresh.catchUp[0]!.itemId);
  });

  it('measures a programme against the cohort calendar, leaving catch-up weeks out, and shows the way to the certificate', async () => {
    const url = `/v1/learning/me/programs/${adaProgram.enrollment.id}/on-track`;
    expect((await request(learning, 'GET', url, L(bayo))).status).toBe(404);
    const before = (await request(learning, 'GET', url, L(ada))).body as ProgramOnTrack;
    expect(before).toMatchObject({ pace: 'not_started', catchUpWeek: false, onboarding: { goalSet: true, firstItemDone: false, introducedInCircle: null } });
    expect(before.expectedPct).toBeGreaterThan(0);
    expect(before.catchUp.length).toBeGreaterThan(0);
    const keys = before.certificate.steps.map((s) => s.key);
    expect(keys).toContain('course:problem-solving');
    expect(keys.some((k) => k.startsWith('stage:'))).toBe(true);
    expect(before.certificate).toMatchObject({ done: 0, total: before.certificate.steps.length });
    expect(before.certificate.steps.find((s) => s.key.startsWith('course:'))!.href).toMatch(/^\/learn\//);

    // A course of the first phase: week 3 of 4, two weeks and a day of lessons gone.
    const first = adaProgram.courses.find((c) => c.course.slug === 'problem-solving')!;
    const course = `/v1/learning/enrollments/${first.enrollmentId}/on-track`;
    const item = ((await request(learning, 'GET', course, L(ada))).body as OnTrack).catchUp[0]!;
    expect((await request(learning, 'GET', `/v1/learning/enrollments/${first.enrollmentId}/items/${item.itemId}`, L(ada))).status).toBe(200);
    expect((await request(learning, 'GET', course, L(ada))).body).toMatchObject({ pace: 'far_behind', expectedPct: 54, goal: { scope: 'program' } });

    // This week becomes a catch-up week: no new lessons, so less is expected by now.
    await db().sys.update(learningSchema.calendarWeeks).set({ kind: 'catch_up' }).where(and(eq(learningSchema.calendarWeeks.cohortId, cohort.id), eq(learningSchema.calendarWeeks.weekNo, 3)));
    expect((await request(learning, 'GET', course, L(ada))).body).toMatchObject({ expectedPct: 67 });
    expect((await request(learning, 'GET', url, L(ada))).body).toMatchObject({ catchUpWeek: true });
    const mine = ((await request(learning, 'GET', '/v1/learning/me/programs', L(ada))).body as { items: MyProgram[] }).items.find((p) => p.cohort.id === cohort.id)!;
    expect(mine.thisWeek).toMatchObject({ weekNo: 3, kind: 'catch_up' });
  });

  it('reminds quiet learners by email, at most once every three days, about their programme rather than each course', async () => {
    const reminders = learning.get(ProgressRemindersService);
    // Bayo joined two days ago and has not started; Sola went quiet six days ago; Ada is active.
    await db().sys.update(learningSchema.programEnrollments).set({ enrolledAt: daysBefore(2) }).where(eq(learningSchema.programEnrollments.id, bayoProgram.enrollment.id));
    await db().sys.update(learningSchema.courseEnrollments).set({ enrolledAt: daysBefore(2) }).where(eq(learningSchema.courseEnrollments.programEnrollmentId, bayoProgram.enrollment.id));
    await db().sys.update(learningSchema.courseEnrollments).set({ enrolledAt: daysBefore(10), lastActiveAt: daysBefore(6) }).where(eq(learningSchema.courseEnrollments.id, soloEnrollment.id));
    await db().sys.update(learningSchema.courseEnrollments).set({ lastActiveAt: noon }).where(eq(learningSchema.courseEnrollments.programEnrollmentId, adaProgram.enrollment.id));
    // Not at night.
    expect(await reminders.run(zonedTime(todayIn(lagos), '22:00', lagos))).toBe(0);

    expect(await reminders.run(noon)).toBeGreaterThanOrEqual(2);
    const [soloNote] = await progressNotes(solo);
    expect(soloNote).toMatchObject({ title: 'Pick up where you left off: Problem Solving', link: expect.stringMatching(new RegExp(`^/learn/${soloEnrollment.id}/[0-9a-f-]{36}$`)) });
    expect(soloNote!.body).toContain('You said: “I keep starting things and never finishing them”');
    expect(soloNote!.body).toContain('Everything you have done so far is saved');
    const [bayoNote] = await progressNotes(bayo);
    expect(bayoNote).toMatchObject({ title: `Ready when you are: ${cohort.programTitle}`, link: '/app/programme' });
    await eventually(() => mail.to('solo@learner.test').some((m) => m.subject.includes('Pick up where you left off')));
    expect(((await request(notify, 'GET', '/v1/notifications', L(ada))).body as { items: Notification[] }).items.filter((n) => n.category === 'progress')).toEqual([]);

    // Twelve quiet days now, but the last reminder was today: nothing until three days have passed.
    await db().sys.update(learningSchema.courseEnrollments).set({ lastActiveAt: daysBefore(12) }).where(eq(learningSchema.courseEnrollments.id, soloEnrollment.id));
    await reminders.run(new Date(noon.getTime() + 3_600_000));
    await reminders.run(new Date(noon.getTime() + 2 * 86_400_000));
    const later = new Date(noon.getTime() + 3 * 86_400_000 + 3_600_000);
    await reminders.run(later);
    await progressNotes(solo, 2);
    const log = await db().sys.select().from(learningSchema.progressReminders).where(eq(learningSchema.progressReminders.enrollmentId, soloEnrollment.id));
    expect(log.map((r) => r.kind).sort()).toEqual(['quiet_12', 'quiet_5']);
    expect(await reminders.run(later)).toBe(0);
    expect(log.every((r) => r.returnedAt === null)).toBe(true);

    // Coming back counts as answering the reminders.
    const back = (await request(learning, 'GET', `/v1/learning/enrollments/${soloEnrollment.id}/on-track`, L(solo))).body as OnTrack;
    expect((await request(learning, 'GET', `/v1/learning/enrollments/${soloEnrollment.id}/items/${back.catchUp[0]!.itemId}`, L(solo))).status).toBe(200);
    const after = await db().sys.select().from(learningSchema.progressReminders).where(eq(learningSchema.progressReminders.enrollmentId, soloEnrollment.id));
    expect(after.every((r) => r.returnedAt !== null)).toBe(true);
  });

  it('shows cohort staff who is at risk, and lets them check in personally', async () => {
    ids.bayo = await userId(bayo);
    ids.ada = await userId(ada);
    // Bayo joined a month ago and has done nothing since.
    await db().sys.update(learningSchema.programEnrollments).set({ enrolledAt: daysBefore(30, new Date()) }).where(eq(learningSchema.programEnrollments.id, bayoProgram.enrollment.id));
    const url = `/v1/learning/cohorts/${cohort.id}/engagement`;
    expect((await request(learning, 'GET', url, L(outsider))).status).toBe(404);
    expect((await request(learning, 'GET', url, L(ada))).status).toBe(403);
    const view = (await request(learning, 'GET', url, L(owner))).body as CohortEngagement;
    expect(view.summary).toMatchObject({ learners: 2, inactive: 1 });
    expect(view.items.map((i) => i.name)).toEqual(['Bayo Ojo', 'Ada Ige']);
    expect(view.items[0]).toMatchObject({ risk: 'inactive', pace: 'not_started', goalSet: false, lastActiveAt: null, lastReminderAt: expect.any(String), lastCheckInAt: null });
    expect(view.items[1]).toMatchObject({ goalSet: true, lastReminderAt: null });
    expect(view.items[1]!.daysQuiet).toBeLessThan(2);
    expect((await request(learning, 'GET', `${url}?risk=inactive`, L(teacher))).body).toMatchObject({ items: [{ name: 'Bayo Ojo' }] });

    const checkIns = `/v1/learning/cohorts/${cohort.id}/check-ins`;
    const message = 'Hello Bayo, how are things going? Tell me if anything is in the way.';
    expect((await request(learning, 'POST', checkIns, { ...L(ada), body: { userIds: [ids.bayo], message } })).status).toBe(403);
    expect(await request(learning, 'POST', checkIns, { ...L(owner), body: { userIds: [ids.bayo, await userId(outsider)], message } })).toMatchObject({ status: 404, body: { code: 'learner_not_in_cohort' } });
    expect(await request(learning, 'POST', checkIns, { ...L(teacher), body: { userIds: [ids.bayo], message } })).toMatchObject({ status: 200, body: { sent: 1 } });
    const notes = await notificationsFor(bayo, (n) => n.title === 'Tola sent you a note');
    expect(notes.find((n) => n.title === 'Tola sent you a note')).toMatchObject({ category: 'progress', body: message, link: '/app/programme' });
    expect(((await request(learning, 'GET', url, L(owner))).body as CohortEngagement).items[0]).toMatchObject({ name: 'Bayo Ojo', lastCheckInAt: expect.any(String) });
  });

  it('counts the completion funnel for a cohort and for a course', async () => {
    const url = `/v1/learning/cohorts/${cohort.id}/funnel`;
    expect((await request(learning, 'GET', url, L(teacher))).status).toBe(403);
    expect((await request(learning, 'GET', url, L(outsider))).status).toBe(403);
    const funnel = (await request(learning, 'GET', url, L(owner))).body as CompletionFunnel;
    expect(funnel.scope).toEqual({ kind: 'cohort', id: cohort.id, title: 'Ilorin 01' });
    expect(Object.fromEntries(funnel.stages.map((s) => [s.key, s.count]))).toEqual({ enrolled: 2, started: 1, first_week: 1, quarter: 0, half: 0, three_quarters: 0, completed: 0 });
    expect(funnel.stages[0]).toMatchObject({ key: 'enrolled', label: 'Enrolled' });
    expect(funnel).toMatchObject({ dropped: 1, medianDropDay: 0, reminders: { sent: 1, returnedWithin7Days: 0 }, checkIns: { sent: 1, returnedWithin7Days: 0 } });
    expect(funnel.weekly).toHaveLength(26);
    expect(funnel.weekly.at(-1)!.active).toBe(1);

    const course = '/v1/learning/admin/courses/problem-solving/funnel';
    expect((await request(learning, 'GET', course, L(owner))).status).toBe(403);
    const admin = ((await request(iam, 'POST', '/v1/auth/login', { body: { identifier: 'admin@theafricandreamlab.com', password: 'e2e-admin-password' } })).body as { accessToken: string })
      .accessToken;
    const byCourse = (await request(learning, 'GET', course, L(admin))).body as CompletionFunnel;
    expect(byCourse.scope).toMatchObject({ kind: 'course', title: 'Problem Solving' });
    expect(byCourse.stages[0]!.count).toBeGreaterThanOrEqual(3);
    expect(byCourse.reminders.sent).toBeGreaterThanOrEqual(2);
    expect(byCourse.reminders.returnedWithin7Days).toBeGreaterThanOrEqual(1);
    expect((await request(learning, 'GET', '/v1/learning/admin/courses/no-such-course/funnel', L(admin))).status).toBe(404);
  });

  it('shares a member’s week with their circle only when they choose to', async () => {
    const created = await request(learning, 'POST', `/v1/learning/cohorts/${cohort.id}/circles`, { ...L(owner), body: { name: 'Circle One', memberUserIds: [ids.ada, ids.bayo] } });
    expect(created.status).toBe(201);
    const circleId = ((await request(learning, 'GET', '/v1/learning/me/community', L(ada))).body as MyCommunity).circles.find((c) => c.cohortName === 'Ilorin 01')!.id;
    const url = `/v1/learning/circles/${circleId}/progress`;
    expect((await request(learning, 'GET', url, L(outsider))).status).toBe(404);
    expect((await request(learning, 'GET', url, L(ada))).body).toMatchObject({ sharing: false, members: [], notSharing: 2 });

    const shared = (await request(learning, 'PUT', `${url}/sharing`, { ...L(ada), body: { share: true } })).body as CircleProgress;
    expect(shared).toMatchObject({ sharing: true, notSharing: 1, members: [{ userId: ids.ada, name: 'Ada Ige' }] });
    expect(shared.members[0]!.activeDaysThisWeek).toBeGreaterThanOrEqual(1);
    const today = todayIn(lagos);
    expect(shared.weekStart).toBe(addDays(today, -((new Date(`${today}T00:00:00Z`).getUTCDay() + 6) % 7)));
    expect((await request(learning, 'GET', url, L(bayo))).body).toMatchObject({ sharing: false, members: [{ name: 'Ada Ige' }], notSharing: 1 });
    expect((await request(learning, 'GET', url, L(owner))).body).toMatchObject({ members: [{ name: 'Ada Ige' }] });
    expect((await request(learning, 'PUT', `${url}/sharing`, { ...L(owner), body: { share: true } })).status).toBe(403);
    expect((await request(learning, 'PUT', `${url}/sharing`, { ...L(ada), body: { share: false } })).body).toMatchObject({ sharing: false, members: [], notSharing: 2 });

    // Saying hello in the circle is one of the first steps.
    const onTrack = `/v1/learning/me/programs/${adaProgram.enrollment.id}/on-track`;
    expect((await request(learning, 'GET', onTrack, L(ada))).body).toMatchObject({ onboarding: { introducedInCircle: false } });
    expect((await request(learning, 'POST', `/v1/learning/circles/${circleId}/posts`, { ...L(ada), body: { body: 'Hello everyone, I am Ada from Ilorin.', attachmentIds: [] } })).status).toBe(201);
    expect((await request(learning, 'GET', onTrack, L(ada))).body).toMatchObject({ onboarding: { introducedInCircle: true } });
  });
});

describe('instructors and course staff (INSTR-1)', () => {
  it('keeps the organisation’s instructor profiles and shows a course’s staff on its page', async () => {
    const admin = ((await request(iam, 'POST', '/v1/auth/login', { body: { identifier: 'admin@theafricandreamlab.com', password: 'e2e-admin-password' } })).body as { accessToken: string })
      .accessToken;
    const learner = await signUp('reader@instructors.test', 'Rita Reader');
    expect((await request(catalog, 'GET', '/v1/catalog/instructors', L(learner))).status).toBe(403);
    const created = await request(catalog, 'POST', '/v1/catalog/instructors', { ...L(admin), body: { name: 'Dr Funmi Lead', title: 'Programme lead', bio: 'Teaches problem solving.' } });
    expect(created).toMatchObject({ status: 201, body: { name: 'Dr Funmi Lead', courses: [] } });
    const profileId = (created.body as { id: string }).id;
    const bad = await request(catalog, 'POST', '/v1/catalog/instructors', { ...L(admin), body: { name: 'Bad Photo', photoUrl: 'https://evil.example/x.png' } });
    expect(bad.status).toBe(400);

    expect((await request(catalog, 'PUT', '/v1/catalog/courses/problem-solving/staff', { ...L(learner), body: { staff: [{ profileId, role: 'lead' }] } })).status).toBe(404);
    expect((await request(catalog, 'PUT', '/v1/catalog/courses/problem-solving/staff', { ...L(admin), body: { staff: [{ profileId, role: 'lead' }] } })).status).toBe(200);
    const page = (await request(catalog, 'GET', '/v1/catalog/courses/problem-solving')).body as { instructors: { name: string; role?: string }[] };
    expect(page.instructors).toMatchObject([{ name: 'Dr Funmi Lead', role: 'lead' }]);
    expect(((await request(catalog, 'GET', '/v1/catalog/instructors', L(admin))).body as { items: { id: string; courses: { slug: string }[] }[] }).items.find((i) => i.id === profileId)!.courses).toMatchObject([{ slug: 'problem-solving' }]);

    // Removing the staff brings back the instructors in the course's file.
    expect((await request(catalog, 'PUT', '/v1/catalog/courses/problem-solving/staff', { ...L(admin), body: { staff: [] } })).status).toBe(200);
    expect(((await request(catalog, 'GET', '/v1/catalog/courses/problem-solving')).body as { instructors: { name: string }[] }).instructors.map((i) => i.name)).not.toContain('Dr Funmi Lead');
    expect((await request(catalog, 'DELETE', `/v1/catalog/instructors/${profileId}`, L(admin))).status).toBe(204);
  });
});

describe('an organisation in review (ORG-003)', () => {
  it('lets its admins set it up, and nothing more until a platform admin approves it', async () => {
    const personal = await signUp('head@uyo-school.test', 'Uche Head');
    const created = await request(iam, 'POST', '/v1/orgs/signup', { token: personal, body: { name: 'Uyo School', kind: 'institution' } });
    expect(created).toMatchObject({ status: 201, body: { status: 'pending' } });
    const orgId = (created.body as { id: string }).id;
    const enter = async () => ((await request(iam, 'POST', '/v1/auth/switch-org', { token: personal, body: { orgId } })).body as { accessToken: string }).accessToken;
    const permissions = async (token: string) => ((await request(iam, 'GET', '/v1/me', L(token))).body as { permissions: string[] }).permissions;
    const cohort = { programSlug: 'the-african-dream-lab', name: 'Uyo 01', startsOn: todayIn('Africa/Lagos') };

    // Set-up only: settings, people and roles, but no cohorts (or courses, admissions, assigned learning).
    const head = await enter();
    expect(await permissions(head)).toEqual(expect.arrayContaining(['org.settings.update', 'org.members.invite']));
    expect(await permissions(head)).not.toContain('cohort.manage');
    expect((await request(learning, 'POST', '/v1/learning/cohorts', { ...L(head), body: cohort })).status).toBe(403);
    expect((await request(iam, 'POST', `/v1/orgs/${orgId}/invitations`, { token: head, body: { email: 'deputy@uyo-school.test', roleKeys: ['org_admin'] } })).status).toBe(201);

    // Approval takes effect at once, even for the token issued while it was in review.
    const admin = ((await request(iam, 'POST', '/v1/auth/login', { body: { identifier: 'admin@theafricandreamlab.com', password: 'e2e-admin-password' } })).body as { accessToken: string })
      .accessToken;
    expect((await request(iam, 'PATCH', `/v1/orgs/${orgId}`, { token: admin, body: { status: 'active' } })).status).toBe(200);
    expect((await request(learning, 'POST', '/v1/learning/cohorts', { ...L(head), body: cohort })).status).toBe(201);
    expect(await permissions(await enter())).toContain('cohort.manage');
  });
});
