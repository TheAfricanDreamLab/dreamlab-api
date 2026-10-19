import { Injectable, Logger, OnApplicationBootstrap, OnModuleDestroy } from '@nestjs/common';
import { ClientProxy, ClientProxyFactory, Transport } from '@nestjs/microservices';
import { RESERVED_SLUGS } from '@dreamlab/contracts';
import { IAM_RPC_QUEUE } from '@lib/auth';
import { AppException, notFound } from '@lib/common';
import { InjectConfig } from '@lib/config';
import { InjectRabbit, RabbitConnection } from '@lib/messaging';
import { HttpStatus } from '@nestjs/common';
import { firstValueFrom, timeout } from 'rxjs';
import type { GatewayConfig } from '../config';

export interface Tenant {
  id: string;
  slug: string;
  name: string;
}

const ORG_RESOLVE_PATTERN = 'iam.orgs.resolve';
const POSITIVE_TTL_MS = 5 * 60_000;
const NEGATIVE_TTL_MS = 30_000;
const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const RESERVED = new Set<string>(RESERVED_SLUGS);

/**
 * Maps a request's host (or, in development, the X-Tenant header) to an organisation.
 * Lookups go to IAM over RabbitMQ RPC and are cached; org.created / org.updated events clear the cache.
 */
@Injectable()
export class TenantService implements OnApplicationBootstrap, OnModuleDestroy {
  private readonly logger = new Logger(TenantService.name);
  private readonly cache = new Map<string, { tenant: Tenant | null; expires: number }>();
  private readonly client: ClientProxy;

  constructor(
    @InjectConfig() private readonly config: GatewayConfig,
    @InjectRabbit() private readonly rabbit: RabbitConnection,
  ) {
    this.client = ClientProxyFactory.create({
      transport: Transport.RMQ,
      options: { urls: [config.RABBITMQ_URL], queue: IAM_RPC_QUEUE, queueOptions: { durable: true } },
    });
  }

  onApplicationBootstrap(): void {
    this.rabbit.subscribe({
      queue: `${this.config.SERVICE_NAME}.tenant-cache`,
      bindings: ['org.created', 'org.updated'],
      handler: async () => this.cache.clear(),
    });
  }

  async onModuleDestroy(): Promise<void> {
    await this.client.close();
  }

  /**
   * The tenant slug a request addresses, or null for the platform (B2C) host. Checked in order:
   * the Host (API served on the tenant's own subdomain), then the browser Origin (a tenant site
   * calling api.<base>), then X-Tenant when enabled for development. The tenant is context only;
   * access is still decided by the token and the user's memberships.
   */
  slugFor(host: string | undefined, origin: string | undefined, tenantHeader: string | undefined): string | null {
    if (this.config.GATEWAY_ALLOW_TENANT_HEADER && tenantHeader) return tenantHeader.trim().toLowerCase();
    const fromHost = this.slugFromHostname((host ?? '').split(':')[0]!);
    if (fromHost) return fromHost;
    if (origin) {
      try {
        return this.slugFromHostname(new URL(origin).hostname);
      } catch {
        return null;
      }
    }
    return null;
  }

  private slugFromHostname(raw: string): string | null {
    const hostname = raw.trim().toLowerCase();
    for (const base of this.config.GATEWAY_BASE_DOMAINS) {
      if (hostname.endsWith(`.${base}`)) {
        const label = hostname.slice(0, -(base.length + 1));
        return !label.includes('.') && !RESERVED.has(label) ? label : null;
      }
    }
    return null;
  }

  async resolve(slug: string): Promise<Tenant> {
    if (!SLUG.test(slug)) throw notFound('tenant_not_found', 'Unknown organisation');
    const hit = this.cache.get(slug);
    if (hit && hit.expires > Date.now()) {
      if (!hit.tenant) throw notFound('tenant_not_found', 'Unknown organisation');
      return hit.tenant;
    }
    let tenant: Tenant | null;
    try {
      const org = await firstValueFrom(
        this.client.send<{ id: string; slug: string; name: string } | null>(ORG_RESOLVE_PATTERN, { slug }).pipe(timeout(3000)),
      );
      tenant = org ? { id: org.id, slug: org.slug, name: org.name } : null;
    } catch (err) {
      this.logger.error(`Tenant lookup failed: ${err instanceof Error ? err.message : String(err)}`);
      throw new AppException(HttpStatus.SERVICE_UNAVAILABLE, 'upstream_unavailable', 'Service temporarily unavailable');
    }
    this.cache.set(slug, { tenant, expires: Date.now() + (tenant ? POSITIVE_TTL_MS : NEGATIVE_TTL_MS) });
    if (!tenant) throw notFound('tenant_not_found', 'Unknown organisation');
    return tenant;
  }
}
