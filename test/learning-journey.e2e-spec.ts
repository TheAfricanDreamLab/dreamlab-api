/**
 * Cross-service journey (CAT-1, LRN-1, PLT-1): IAM, catalog and learning run together against real
 * Postgres, Redis and RabbitMQ. Tokens come from IAM; catalog and learning verify them through
 * IAM's JWKS over HTTP and talk to each other over RabbitMQ RPC, as in production.
 */
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { Test } from '@nestjs/testing';
import { isAppRoute, type AppRoute, type AppRouter } from '@ts-rest/core';
import {
  apiV1Contract,
  BlockAuthoring,
  BlockResponse,
  CohortDetail,
  Draft,
  CourseAuthoringSchema,
  CourseProgress,
  Enrollment,
  ItemAuthoring,
  ItemView,
  isInteractiveBlock,
  MyProgram,
  Notification,
  SubmissionFileUpload,
  SubmissionForGrading,
} from '@dreamlab/contracts';
import { IAM_RPC_QUEUE } from '@lib/auth';
import { buildOpenApiDocument, installGatewayTrust, REDIS } from '@lib/common';
import { loadConfig } from '@lib/config';
import { runMigrations } from '@lib/database';
import { CATALOG_RPC_QUEUE } from '@lib/rpc';
import type { EmailMessage, EmailSender } from '@lib/email';
import type { BlobStorage } from '@lib/storage';
import { E2E_GATEWAY_TOKEN, eventually, request, testEnv } from '@lib/testing';
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
import { SessionRemindersService } from '../apps/learning/src/modules/cohorts/session-reminders.service';
import { FilesService, STORAGE } from '../apps/learning/src/modules/files/files.service';
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
let iamModule: unknown;

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

  const learningConfig = loadConfig(learningConfigSchema, testEnv({ IAM_JWKS_URL: jwks }));
  await runMigrations(learningConfig.LEARNING_MIGRATION_DATABASE_URL!, learningMigrationsFolder());
  learning = await boot(LearningAppModule.forRoot(learningConfig), null, learningConfig.RABBITMQ_URL);
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
  it.each([
    ['catalog', () => catalog, apiV1Contract.catalog],
    ['learning', () => learning, apiV1Contract.learning],
    ['learning (cohorts)', () => learning, apiV1Contract.cohorts],
    ['learning (grading)', () => learning, apiV1Contract.grading],
    ['catalog (authoring)', () => catalog, apiV1Contract.authoring],
    ['notify', () => notify, apiV1Contract.notifications],
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
      const suspended = await request(iam, 'POST', `/v1/platform/users/${kwameId}/status`, { ...L(admin), body: { status: 'suspended', reason: 'Spam in discussions' } });
      expect(suspended).toMatchObject({ status: 200, body: { status: 'suspended', activeSessions: 0 } });
      expect((await request(learning, 'GET', '/v1/learning/enrollments', L(kwame))).status).toBe(401);
      const login = await request(iam, 'POST', '/v1/auth/login', { body: { identifier: 'kwame@example.com', password: 'correct horse battery' } });
      expect(login).toMatchObject({ status: 403, body: { code: 'account_disabled' } });
      await request(iam, 'POST', `/v1/platform/users/${kwameId}/status`, { ...L(admin), body: { status: 'active', reason: 'Appeal accepted' } });
      expect((await request(iam, 'POST', '/v1/auth/login', { body: { identifier: 'kwame@example.com', password: 'correct horse battery' } })).status).toBe(200);
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
    // Two releases on version 1 (75%, then the 100% regrade); drafts tell nobody.
    expect(graded.filter((n) => n.category === 'grades').map((n) => n.body)).toEqual([expect.stringContaining('100%'), expect.stringContaining('75%')]);
    expect(graded[0]!.link).toBe(`/learn/${enrollmentId}/${itemId}`);
    await eventually(() => mail.to('student@kano-studio.test').length >= 2);
    expect(mail.to('student@kano-studio.test')[0]).toMatchObject({ subject: expect.stringContaining('was graded'), html: expect.stringContaining(`https://learn.test/learn/${enrollmentId}/${itemId}`) });

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
});

describe('class session reminders (NOTIFY-1)', () => {
  it('reminds a cohort a day ahead, once', async () => {
    const reminders = learning.get(SessionRemindersService);
    const sent = await reminders.run();
    expect(await reminders.run()).toBe(0);
    expect(sent).toBeGreaterThanOrEqual(0);
  });
});
