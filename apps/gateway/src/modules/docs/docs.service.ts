import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import type { OpenAPIObject } from '@nestjs/swagger';
import { InjectConfig } from '@lib/config';
import type { GatewayConfig } from '../../config';

const REFRESH_MS = 30_000;

/**
 * One OpenAPI document for the whole public API: the gateway's own routes plus every upstream
 * service's document, refreshed in the background so /docs always reflects what is deployed.
 */
@Injectable()
export class DocsService implements OnModuleDestroy {
  private readonly logger = new Logger(DocsService.name);
  private own: OpenAPIObject | null = null;
  private merged: OpenAPIObject | null = null;
  private timer: NodeJS.Timeout | null = null;

  constructor(@InjectConfig() private readonly config: GatewayConfig) {}

  start(own: OpenAPIObject): void {
    this.own = own;
    this.merged = own;
    void this.refresh();
    this.timer = setInterval(() => void this.refresh(), REFRESH_MS);
    this.timer.unref();
  }

  onModuleDestroy(): void {
    if (this.timer) clearInterval(this.timer);
  }

  document(): OpenAPIObject {
    return this.merged ?? this.own!;
  }

  async refresh(): Promise<OpenAPIObject> {
    if (!this.own) throw new Error('DocsService not started');
    const upstreams = [
      { name: 'iam', url: this.config.IAM_URL },
      { name: 'catalog', url: this.config.CATALOG_URL },
      { name: 'learning', url: this.config.LEARNING_URL },
      { name: 'notify', url: this.config.NOTIFY_URL },
    ];
    let merged: OpenAPIObject = structuredClone(this.own);
    for (const upstream of upstreams) {
      try {
        const res = await fetch(new URL('/docs-json', upstream.url), { signal: AbortSignal.timeout(5000) });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        merged = mergeDocuments(merged, (await res.json()) as OpenAPIObject);
      } catch (err) {
        this.logger.warn(`Could not load ${upstream.name} API docs: ${err instanceof Error ? err.message : String(err)}`);
      }
    }
    merged.servers = [{ url: '/', description: 'This gateway' }];
    this.merged = merged;
    return merged;
  }
}

export function mergeDocuments(base: OpenAPIObject, other: OpenAPIObject): OpenAPIObject {
  return {
    ...base,
    paths: { ...base.paths, ...other.paths },
    tags: [...(base.tags ?? []), ...(other.tags ?? []).filter((t) => !(base.tags ?? []).some((b) => b.name === t.name))],
    components: {
      ...base.components,
      ...other.components,
      schemas: { ...(base.components?.schemas ?? {}), ...(other.components?.schemas ?? {}) },
      securitySchemes: { ...(base.components?.securitySchemes ?? {}), ...(other.components?.securitySchemes ?? {}) },
    },
  };
}
