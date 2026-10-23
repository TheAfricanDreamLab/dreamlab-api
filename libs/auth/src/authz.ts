import { Logger } from '@nestjs/common';
import { ClientProxy, ClientProxyFactory, Transport } from '@nestjs/microservices';
import type { Permission, ScopeType } from '@dreamlab/contracts';
import type Redis from 'ioredis';
import { firstValueFrom, timeout } from 'rxjs';

export const AUTHZ_CHECKER = Symbol('AUTHZ_CHECKER');
export const IAM_RPC_QUEUE = 'iam.rpc';
export const AUTHZ_CHECK_PATTERN = 'iam.authz.check';

export interface AuthzCheckRequest {
  userId: string;
  orgId: string;
  permission: Permission;
  scopeType?: ScopeType;
  scopeId?: string;
  /** Granted at any scope in the organisation. */
  anyScope?: boolean;
  /** The caller's authorization version, so cached answers die when roles change. */
  authzVersion: number;
  /**
   * The token's roles are known to be out of date (Principal.stale): ask IAM afresh. Its version is
   * the old one, so a cached answer under that version could still say yes to a revoked role.
   */
  fresh?: boolean;
}

export interface AuthzCheckResponse {
  allowed: boolean;
}

/** Decides scoped permissions. IAM answers locally; every other service asks IAM over RabbitMQ. */
export interface AuthzChecker {
  check(request: AuthzCheckRequest): Promise<boolean>;
}

export function authzCacheKey(r: AuthzCheckRequest): string {
  const scope = r.anyScope ? 'any' : `${r.scopeType ?? 'org'}:${r.scopeId ?? ''}`;
  return `authz:chk:${r.userId}:${r.orgId}:v${r.authzVersion}:${r.permission}:${scope}`;
}

/** RPC client for `iam.authz.check`, with answers cached in Redis for a short time. */
export class RpcAuthzChecker implements AuthzChecker {
  private readonly logger = new Logger('AuthzRpc');
  private readonly client: ClientProxy;

  constructor(
    rabbitUrl: string,
    private readonly redis: Redis | null,
    private readonly ttlSeconds = 60,
    private readonly timeoutMs = 2000,
  ) {
    this.client = ClientProxyFactory.create({
      transport: Transport.RMQ,
      options: { urls: [rabbitUrl], queue: IAM_RPC_QUEUE, queueOptions: { durable: true } },
    });
  }

  async check(request: AuthzCheckRequest): Promise<boolean> {
    const key = authzCacheKey(request);
    const cached = request.fresh ? null : await this.redis?.get(key).catch(() => null);
    if (cached === '1' || cached === '0') return cached === '1';
    try {
      const res = await firstValueFrom(
        this.client.send<AuthzCheckResponse, AuthzCheckRequest>(AUTHZ_CHECK_PATTERN, request).pipe(timeout(this.timeoutMs)),
      );
      if (!request.fresh) await this.redis?.set(key, res.allowed ? '1' : '0', 'EX', this.ttlSeconds).catch(() => undefined);
      return res.allowed;
    } catch (err) {
      this.logger.error(`Authorization check failed closed: ${err instanceof Error ? err.message : String(err)}`);
      return false;
    }
  }

  async close(): Promise<void> {
    await this.client.close();
  }
}
