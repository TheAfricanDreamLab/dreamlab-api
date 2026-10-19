import { Injectable } from '@nestjs/common';
import { revokedSessionKey } from '@lib/auth';
import { InjectRedis, newId } from '@lib/common';
import { InjectDatabase } from '@lib/database';
import { InjectOutbox, OutboxWriter, userActor } from '@lib/messaging';
import { and, desc, eq, gt, isNull, ne, sql } from 'drizzle-orm';
import type Redis from 'ioredis';
import { IamDatabase, IamTx, schema } from '../../database';
import { IamEvents } from '../../events';
import { TokenService } from './token.service';

export interface RequestMeta {
  ip: string | null;
  userAgent: string | null;
  requestId: string | null;
  /** Organisation the request's subdomain resolved to (set by the gateway). */
  tenantOrgId: string | null;
}

export type SessionRow = typeof schema.sessions.$inferSelect;
type AuthMethod = SessionRow['authMethod'];

@Injectable()
export class SessionsService {
  constructor(
    @InjectDatabase() private readonly db: IamDatabase,
    @InjectRedis() private readonly redis: Redis,
    @InjectOutbox() private readonly outbox: OutboxWriter,
    private readonly tokens: TokenService,
  ) {}

  async create(
    tx: IamTx,
    userId: string,
    method: AuthMethod,
    context: { orgId: string | null; membershipId: string | null },
    meta: RequestMeta,
  ): Promise<SessionRow> {
    const [row] = await tx
      .insert(schema.sessions)
      .values({
        id: newId(),
        userId,
        authMethod: method,
        activeOrgId: context.orgId,
        activeMembershipId: context.membershipId,
        ip: meta.ip,
        userAgent: meta.userAgent?.slice(0, 512) ?? null,
        expiresAt: new Date(Date.now() + this.tokens.refreshTtl * 1000),
      })
      .returning();
    await this.outbox.add(tx, {
      type: IamEvents.SessionCreated,
      actor: userActor(userId),
      requestId: meta.requestId,
      payload: { sessionId: row!.id, userId, method },
    });
    return row!;
  }

  /** A session that can still be used: not revoked, not expired. */
  async findUsable(sessionId: string): Promise<SessionRow | null> {
    const [row] = await this.db.sys
      .select()
      .from(schema.sessions)
      .where(and(eq(schema.sessions.id, sessionId), isNull(schema.sessions.revokedAt), gt(schema.sessions.expiresAt, sql`now()`)));
    return row ?? null;
  }

  async touch(tx: IamTx, sessionId: string, patch: Partial<Pick<SessionRow, 'activeOrgId' | 'activeMembershipId'>> = {}): Promise<void> {
    await tx
      .update(schema.sessions)
      .set({ lastUsedAt: new Date(), expiresAt: new Date(Date.now() + this.tokens.refreshTtl * 1000), ...patch })
      .where(eq(schema.sessions.id, sessionId));
  }

  async list(userId: string): Promise<SessionRow[]> {
    return this.db.sys
      .select()
      .from(schema.sessions)
      .where(and(eq(schema.sessions.userId, userId), isNull(schema.sessions.revokedAt), gt(schema.sessions.expiresAt, sql`now()`)))
      .orderBy(desc(schema.sessions.lastUsedAt));
  }

  /** End sessions: refresh tokens deleted, and unexpired access tokens rejected by every service's guard. */
  async revoke(
    where: { sessionId: string } | { userId: string; exceptSessionId?: string },
    reason: string,
    actorUserId: string | null,
    requestId: string | null = null,
  ): Promise<string[]> {
    const ids = await this.db.system(async (tx) => {
      const condition =
        'sessionId' in where
          ? eq(schema.sessions.id, where.sessionId)
          : and(
              eq(schema.sessions.userId, where.userId),
              where.exceptSessionId ? ne(schema.sessions.id, where.exceptSessionId) : undefined,
            );
      const revoked = await tx
        .update(schema.sessions)
        .set({ revokedAt: new Date(), revokedReason: reason })
        .where(and(condition, isNull(schema.sessions.revokedAt)))
        .returning({ id: schema.sessions.id, userId: schema.sessions.userId });
      for (const s of revoked) {
        await this.outbox.add(tx, {
          type: IamEvents.SessionRevoked,
          actor: userActor(actorUserId),
          requestId,
          payload: { sessionId: s.id, userId: s.userId, reason },
        });
      }
      return revoked.map((s) => s.id);
    });
    // Access tokens live at most ACCESS_TOKEN_TTL; mark the sessions revoked for that long.
    for (const id of ids) {
      await this.tokens.revokeRefreshTokens(id);
      await this.redis.set(revokedSessionKey(id), reason, 'EX', this.tokens.accessTtl + 60);
    }
    return ids;
  }
}
