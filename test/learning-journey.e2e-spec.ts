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
  CourseAuthoringSchema,
  CourseProgress,
  Enrollment,
  ItemAuthoring,
  ItemView,
  isInteractiveBlock,
} from '@dreamlab/contracts';
import { IAM_RPC_QUEUE } from '@lib/auth';
import { buildOpenApiDocument, installGatewayTrust, REDIS } from '@lib/common';
import { loadConfig } from '@lib/config';
import { runMigrations } from '@lib/database';
import { CATALOG_RPC_QUEUE } from '@lib/rpc';
import { E2E_GATEWAY_TOKEN, request, testEnv } from '@lib/testing';
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

class CapturingNotifier implements Notifier {
  otps: OtpMessage[] = [];
  async sendOtp(m: OtpMessage) {
    this.otps.push(m);
  }
  async sendInvitation() {}
  lastCode(destination: string) {
    return [...this.otps].reverse().find((o) => o.destination === destination)?.code;
  }
}

const notifier = new CapturingNotifier();
const consent = { termsVersion: '2026-10', privacyVersion: '2026-10' };
const course = CourseAuthoringSchema.parse(DATASETS['dream-lab-test'].courses.find((c) => c.slug === 'problem-solving'));
const authored = new Map(course.modules!.flatMap((m) => m.items).map((i) => [i.key, i] as const));

let iam: NestFastifyApplication;
let catalog: NestFastifyApplication;
let learning: NestFastifyApplication;

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
  await request(iam, 'POST', '/v1/auth/register', { body: { email, password: 'correct horse battery', fullName, consent } });
  const res = await request(iam, 'POST', '/v1/auth/verify', { body: { identifier: email, code: notifier.lastCode(email) } });
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
  it.each([
    ['catalog', () => catalog, apiV1Contract.catalog],
    ['learning', () => learning, apiV1Contract.learning],
  ] as const)('the %s service serves every one of its contract routes', (_name, app, router) => {
    const doc = buildOpenApiDocument(app(), { title: 't', description: 'd', version: '0' });
    const missing = routes(router)
      .map((r) => ({ method: r.method.toLowerCase(), path: r.path.replace(/:(\w+)/g, '{$1}') }))
      .filter((r) => !(doc.paths[r.path] as Record<string, unknown> | undefined)?.[r.method]);
    expect(missing).toEqual([]);
  });
});

describe('catalog', () => {
  it('lists the featured Problem Solving course first, the others as coming soon', async () => {
    const res = await request(catalog, 'GET', '/v1/catalog/courses');
    expect(res.status).toBe(200);
    const items = (res.body as { items: { slug: string; featured: boolean; availability: string; programs: { slug: string }[] }[] }).items;
    expect(items[0]).toMatchObject({ slug: 'problem-solving', featured: true, availability: 'available', programs: [{ slug: 'the-african-dream-lab' }] });
    expect(items).toHaveLength(13);
    expect(items.filter((i) => i.availability === 'coming_soon')).toHaveLength(12);
    const search = await request(catalog, 'GET', '/v1/catalog/courses?q=negotiat');
    expect((search.body as { items: { slug: string }[] }).items.map((i) => i.slug)).toEqual(['negotiation']);
  });

  it('shows a syllabus without any lesson content', async () => {
    const res = await request(catalog, 'GET', '/v1/catalog/courses/problem-solving');
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ slug: 'problem-solving', versionNo: 1, availability: 'available' });
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
    const soon = await request(learning, 'POST', '/v1/learning/enrollments', { ...L(amina), body: { courseSlug: 'negotiation' } });
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
