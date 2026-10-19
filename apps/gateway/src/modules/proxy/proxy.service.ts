import { HttpStatus, Inject, Injectable, Logger } from '@nestjs/common';
import { bearerToken, checkTokenFreshness, JWT_VERIFIER, JwtVerifier, principalFromClaims, TokenInvalidError } from '@lib/auth';
import { AppException, forbidden, InjectRedis, unauthorized } from '@lib/common';
import { InjectConfig } from '@lib/config';
import type { FastifyReply, FastifyRequest } from 'fastify';
import type Redis from 'ioredis';
import type { GatewayConfig } from '../../config';
import { TenantService } from '../tenancy/tenancy.service';

/** Headers only the gateway may set. Anything a client sends under these names is dropped. */
const INTERNAL_HEADERS = ['x-tenant-org-id', 'x-tenant-slug', 'x-gateway-token', 'x-forwarded-for', 'x-forwarded-host', 'x-forwarded-proto', 'x-real-ip'];
const FORWARD_REQUEST_HEADERS = ['authorization', 'content-type', 'accept', 'accept-language', 'user-agent'];
const FORWARD_RESPONSE_HEADERS = ['content-type', 'retry-after', 'cache-control', 'www-authenticate'];
/** A token for one organisation may still use these paths on another organisation's site (to switch). */
const CONTEXT_NEUTRAL = [/^\/v1\/auth\//, /^\/v1\/me$/, /^\/v1\/invitations\/accept$/, /^\/v1\/roles$/];

@Injectable()
export class ProxyService {
  private readonly logger = new Logger(ProxyService.name);

  constructor(
    @InjectConfig() private readonly config: GatewayConfig,
    @Inject(JWT_VERIFIER) private readonly verifier: JwtVerifier,
    @InjectRedis() private readonly redis: Redis,
    private readonly tenants: TenantService,
  ) {}

  async forward(req: FastifyRequest, reply: FastifyReply, upstreamBase: string): Promise<void> {
    const path = req.url.split('?')[0]!;
    const header = (name: string) => {
      const v = req.headers[name];
      return Array.isArray(v) ? v[0] : v;
    };

    // 1. Tenant from host / origin.
    const slug = this.tenants.slugFor(header('host'), header('origin'), header('x-tenant'));
    const tenant = slug ? await this.tenants.resolve(slug) : null;

    // 2. Reject bad tokens at the edge, and tokens issued for a different organisation.
    const token = bearerToken(req.headers.authorization);
    if (token) {
      let principal;
      try {
        principal = principalFromClaims(await this.verifier.verify(token));
      } catch (err) {
        if (err instanceof TokenInvalidError) {
          throw unauthorized(err.reason === 'expired' ? 'token_expired' : 'token_invalid', err.message);
        }
        throw err;
      }
      try {
        principal = await checkTokenFreshness(this.redis, principal);
      } catch {
        throw unauthorized('token_invalid', 'Session has ended');
      }
      if (tenant && principal.orgId && principal.orgId !== tenant.id && !CONTEXT_NEUTRAL.some((re) => re.test(path))) {
        throw forbidden('org_context_mismatch', `This session is for another organisation. Switch to ${tenant.name} first.`);
      }
    }

    // 3. Forward with gateway-owned headers only.
    const headers: Record<string, string> = {};
    for (const name of FORWARD_REQUEST_HEADERS) {
      const v = header(name);
      if (v) headers[name] = v;
    }
    for (const name of INTERNAL_HEADERS) delete headers[name];
    headers['x-request-id'] = String(req.id);
    headers['x-gateway-token'] = this.config.INTERNAL_GATEWAY_TOKEN;
    headers['x-forwarded-for'] = req.ip;
    headers['x-forwarded-proto'] = req.protocol;
    if (tenant) {
      headers['x-tenant-org-id'] = tenant.id;
      headers['x-tenant-slug'] = tenant.slug;
    }

    const hasBody = !['GET', 'HEAD', 'DELETE'].includes(req.method) && req.body !== undefined && req.body !== null;
    if (hasBody) headers['content-type'] = 'application/json';
    let upstream: Response;
    try {
      upstream = await fetch(new URL(req.url, upstreamBase), {
        method: req.method,
        headers,
        body: hasBody ? JSON.stringify(req.body) : undefined,
        redirect: 'manual',
        signal: AbortSignal.timeout(this.config.GATEWAY_UPSTREAM_TIMEOUT_MS),
      });
    } catch (err) {
      this.logger.error(`Upstream ${upstreamBase} failed for ${req.method} ${path}: ${err instanceof Error ? err.message : String(err)}`);
      throw new AppException(HttpStatus.BAD_GATEWAY, 'upstream_unavailable', 'Service temporarily unavailable');
    }

    for (const name of FORWARD_RESPONSE_HEADERS) {
      const v = upstream.headers.get(name);
      if (v) void reply.header(name, v);
    }
    const body = Buffer.from(await upstream.arrayBuffer());
    void reply.status(upstream.status).send(body.length > 0 ? body : undefined);
  }
}
