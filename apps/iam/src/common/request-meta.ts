import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { FastifyRequest } from 'fastify';
import type { RequestMeta } from '../modules/auth/sessions.service';

/** Header the gateway sets after resolving the request's subdomain. Clients cannot set it: the gateway strips it. */
export const TENANT_ORG_HEADER = 'x-tenant-org-id';
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function requestMeta(req: FastifyRequest): RequestMeta {
  const tenant = req.headers[TENANT_ORG_HEADER];
  const ua = req.headers['user-agent'];
  return {
    ip: req.ip ?? null,
    userAgent: typeof ua === 'string' ? ua : null,
    requestId: typeof req.id === 'string' ? req.id : null,
    tenantOrgId: typeof tenant === 'string' && UUID.test(tenant) ? tenant : null,
  };
}

export const Meta = createParamDecorator((_: unknown, ctx: ExecutionContext): RequestMeta =>
  requestMeta(ctx.switchToHttp().getRequest<FastifyRequest>()),
);
