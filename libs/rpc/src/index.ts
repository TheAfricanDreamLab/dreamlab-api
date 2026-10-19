import { HttpStatus, Logger } from '@nestjs/common';
import { ClientProxy, ClientProxyFactory, Transport } from '@nestjs/microservices';
import type { CourseAuthoring, CourseDetail, CourseSummary, ItemAuthoring, ItemType } from '@dreamlab/contracts';
import { AppException } from '@lib/common';
import { firstValueFrom, timeout } from 'rxjs';

/*
 * Synchronous calls between services over RabbitMQ (D3): patterns, payload shapes and a client.
 * Each service answers on its own durable queue.
 */

export const CATALOG_RPC_QUEUE = 'catalog.rpc';
export const IAM_USERS_QUEUE = 'iam.rpc';

export const CatalogRpc = {
  /** { slug } → CourseContent | null: the course's current published version, answers included. */
  CourseContent: 'catalog.course.content',
  /** { versionId } → CourseContent | null: a specific (pinned) version. */
  VersionContent: 'catalog.version.content',
  /** { ids } → CourseSummary[] */
  CourseSummaries: 'catalog.course.summaries',
  /** { slug, viewer } → CourseDetail | null, as that viewer may see it. */
  CourseDetail: 'catalog.course.detail',
} as const;

export const IamRpc = {
  /** { userIds } → { id, name }[]: display names for people learners see (discussions). */
  UserNames: 'iam.users.names',
  /** { slug } → { id, slug, name } | null */
  ResolveOrg: 'iam.orgs.resolve',
} as const;

export interface ContentItemRef {
  id: string;
  key: string;
  position: number;
  type: ItemType;
  title: string;
  minutes: number;
  required: boolean;
  gradeWeight: number;
  /** The authored item, answers included. Never forward this to a client. */
  authoring: ItemAuthoring;
}

export interface CourseContent {
  course: {
    id: string;
    slug: string;
    title: string;
    ownerOrgId: string;
    visibility: CourseAuthoring['visibility'];
    cover: CourseAuthoring['cover'];
  };
  version: { id: string; versionNo: number; creditHours: number; estimatedMinutes: number };
  modules: Array<{ id: string; key: string; position: number; title: string; summary: string; weekNo: number | null; items: ContentItemRef[] }>;
}

/** Who is asking, for visibility checks across services. */
export interface Viewer {
  orgId: string | null;
  platformAdmin: boolean;
}

export interface UserName {
  id: string;
  name: string;
}

/** A RabbitMQ RPC client with a timeout; failures become 503s for the caller's caller. */
export class RpcClient {
  private readonly logger = new Logger(RpcClient.name);
  private readonly client: ClientProxy;

  constructor(
    rabbitUrl: string,
    private readonly queue: string,
    private readonly timeoutMs = 4000,
  ) {
    this.client = ClientProxyFactory.create({
      transport: Transport.RMQ,
      options: { urls: [rabbitUrl], queue, queueOptions: { durable: true } },
    });
  }

  async send<T>(pattern: string, payload: unknown): Promise<T> {
    try {
      return await firstValueFrom(this.client.send<T>(pattern, payload).pipe(timeout(this.timeoutMs)));
    } catch (err) {
      this.logger.error(`RPC ${pattern} on ${this.queue} failed: ${err instanceof Error ? err.message : String(err)}`);
      throw new AppException(HttpStatus.SERVICE_UNAVAILABLE, 'upstream_unavailable', 'Service temporarily unavailable');
    }
  }

  async close(): Promise<void> {
    await this.client.close();
  }
}

/**
 * Course content for the learning service. Published versions never change, so a version's
 * content is cached for the life of the process; course lookups by slug for a short time.
 */
export class CatalogClient {
  private readonly versions = new Map<string, CourseContent>();
  private readonly summaries = new Map<string, { value: CourseSummary; expires: number }>();
  private static readonly MAX_VERSIONS = 200;
  private static readonly SUMMARY_TTL_MS = 60_000;

  constructor(private readonly rpc: RpcClient) {}

  async current(slug: string): Promise<CourseContent | null> {
    const content = await this.rpc.send<CourseContent | null>(CatalogRpc.CourseContent, { slug });
    if (content) this.remember(content);
    return content;
  }

  async version(versionId: string): Promise<CourseContent | null> {
    const hit = this.versions.get(versionId);
    if (hit) return hit;
    const content = await this.rpc.send<CourseContent | null>(CatalogRpc.VersionContent, { versionId });
    if (content) this.remember(content);
    return content;
  }

  detail(slug: string, viewer: Viewer): Promise<CourseDetail | null> {
    return this.rpc.send<CourseDetail | null>(CatalogRpc.CourseDetail, { slug, viewer });
  }

  async courseSummaries(ids: string[]): Promise<Map<string, CourseSummary>> {
    const now = Date.now();
    const missing = [...new Set(ids)].filter((id) => (this.summaries.get(id)?.expires ?? 0) < now);
    if (missing.length > 0) {
      const fetched = await this.rpc.send<CourseSummary[]>(CatalogRpc.CourseSummaries, { ids: missing });
      for (const s of fetched) this.summaries.set(s.id, { value: s, expires: now + CatalogClient.SUMMARY_TTL_MS });
    }
    const out = new Map<string, CourseSummary>();
    for (const id of ids) {
      const s = this.summaries.get(id);
      if (s) out.set(id, s.value);
    }
    return out;
  }

  private remember(content: CourseContent): void {
    if (this.versions.size >= CatalogClient.MAX_VERSIONS) this.versions.delete(this.versions.keys().next().value!);
    this.versions.set(content.version.id, content);
  }
}
