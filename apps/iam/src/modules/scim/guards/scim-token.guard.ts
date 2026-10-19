import { CanActivate, ExecutionContext, HttpStatus, Injectable } from '@nestjs/common';
import { bearerToken } from '@lib/auth';
import { InjectRedis, RedisRateLimiter, sha256 } from '@lib/common';
import { InjectDatabase } from '@lib/database';
import { eq } from 'drizzle-orm';
import type { FastifyRequest } from 'fastify';
import type Redis from 'ioredis';
import { IamDatabase, schema } from '../../../database';
import { ScimError } from '../utils/scim';

export interface ScimRequest extends FastifyRequest {
  scim?: { orgId: string; directoryId: string };
}

/** SCIM tokens are opaque bearer tokens, one per organisation; only their SHA-256 is stored. */
@Injectable()
export class ScimTokenGuard implements CanActivate {
  private readonly limiter: RedisRateLimiter;

  constructor(
    @InjectDatabase() private readonly db: IamDatabase,
    @InjectRedis() redis: Redis,
  ) {
    this.limiter = new RedisRateLimiter(redis, 'iam:rl:');
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<ScimRequest>();
    const token = bearerToken(req.headers.authorization);
    if (!token || !token.startsWith('scim_')) throw new ScimError(HttpStatus.UNAUTHORIZED, 'A SCIM bearer token is required');
    const [dir] = await this.db.sys
      .select({ id: schema.scimDirectories.id, orgId: schema.scimDirectories.orgId })
      .from(schema.scimDirectories)
      .where(eq(schema.scimDirectories.tokenHash, sha256(token)));
    if (!dir) throw new ScimError(HttpStatus.UNAUTHORIZED, 'The SCIM token is not valid');
    const quota = await this.limiter.hit(`scim:${dir.id}`, 1200, 60);
    if (!quota.allowed) throw new ScimError(HttpStatus.TOO_MANY_REQUESTS, 'Too many SCIM requests; slow down');
    req.scim = { orgId: dir.orgId, directoryId: dir.id };
    return true;
  }
}
