import { Injectable } from '@nestjs/common';
import type { AccessTokenClaims } from '@dreamlab/contracts';
import { InjectRedis, newId, randomToken, sha256 } from '@lib/common';
import { InjectConfig } from '@lib/config';
import type Redis from 'ioredis';
import { SignJWT } from 'jose';
import type { IamConfig } from '../../../config';
import { SigningKeysService } from '../../keys/signing-keys.service';

export interface AccessTokenInput {
  userId: string;
  sessionId: string;
  orgId: string | null;
  membershipId: string | null;
  roles: string[];
  platformAdmin: boolean;
  authzVersion: number;
  amr: string[];
  mfaRequired: boolean;
}

interface RefreshRecord {
  sid: string;
  uid: string;
}

/**
 * Browsers and web servers refresh in parallel (prefetches, several tabs). The same token presented
 * again within this window is the losing side of that race; later reuse means the token leaked.
 */
const REUSE_GRACE_MS = 20_000;

/*
 * A session's refresh-token keys share the hash tag {sessionId}, so they sit in one cluster slot and
 * can change in one MULTI (Azure Managed Redis is clustered and refuses cross-slot transactions).
 * Refresh tokens start with their session id, which gives the tag back when one is presented.
 */
const recordKey = (sid: string, hash: string): string => `iam:rt:{${sid}}:${hash}`;
const currentKey = (sid: string): string => `iam:rt-cur:{${sid}}`;
export const usedRefreshKey = (sid: string, hash: string): string => `iam:rt-used:{${sid}}:${hash}`;

export type RefreshOutcome =
  | { kind: 'ok'; sessionId: string; userId: string }
  | { kind: 'reused'; sessionId: string }
  /** Reused within the grace window: a benign race between parallel requests, not theft. */
  | { kind: 'superseded' }
  | { kind: 'invalid' };

/**
 * Access tokens: short-lived EdDSA JWTs. Refresh tokens: opaque, single-use, rotated on every
 * refresh. Only their SHA-256 is stored. Presenting an already-used refresh token means it
 * leaked, so the caller revokes the whole session.
 */
@Injectable()
export class TokenService {
  constructor(
    private readonly keys: SigningKeysService,
    @InjectRedis() private readonly redis: Redis,
    @InjectConfig() private readonly config: IamConfig,
  ) {}

  get accessTtl(): number {
    return this.config.ACCESS_TOKEN_TTL_SECONDS;
  }

  get refreshTtl(): number {
    return this.config.REFRESH_TOKEN_TTL_SECONDS;
  }

  async signAccessToken(input: AccessTokenInput): Promise<string> {
    const { kid, key } = await this.keys.signingKey();
    const claims: Omit<AccessTokenClaims, 'iss' | 'aud' | 'iat' | 'exp' | 'jti' | 'sub'> = {
      sid: input.sessionId,
      org: input.orgId,
      mid: input.membershipId,
      roles: input.roles,
      pla: input.platformAdmin,
      azv: input.authzVersion,
      amr: input.amr,
      mfr: input.mfaRequired,
    };
    return new SignJWT(claims)
      .setProtectedHeader({ alg: 'EdDSA', kid, typ: 'at+jwt' })
      .setIssuer(this.config.AUTH_ISSUER)
      .setAudience(this.config.AUTH_AUDIENCE)
      .setSubject(input.userId)
      .setIssuedAt()
      .setExpirationTime(`${this.accessTtl}s`)
      .setJti(newId())
      .sign(key);
  }

  async issueRefreshToken(sessionId: string, userId: string): Promise<string> {
    const token = `${sessionId}.${randomToken(32)}`;
    const hash = sha256(token);
    const previous = await this.redis.get(currentKey(sessionId));
    const multi = this.redis.multi();
    if (previous) multi.del(recordKey(sessionId, previous));
    multi
      .set(recordKey(sessionId, hash), JSON.stringify({ sid: sessionId, uid: userId } satisfies RefreshRecord), 'EX', this.refreshTtl)
      .set(currentKey(sessionId), hash, 'EX', this.refreshTtl);
    await multi.exec();
    return token;
  }

  /** Consume a refresh token. Exactly one caller can consume a given token. */
  async consumeRefreshToken(token: string): Promise<RefreshOutcome> {
    const sid = token.split('.', 1)[0];
    if (!sid || sid === token) return { kind: 'invalid' };
    const hash = sha256(token);
    const raw = await this.redis.getdel(recordKey(sid, hash));
    if (!raw) {
      const used = await this.redis.get(usedRefreshKey(sid, hash));
      if (!used) return { kind: 'invalid' };
      const { sid: usedSid, at } = JSON.parse(used) as { sid: string; at: number };
      return Date.now() - at < REUSE_GRACE_MS ? { kind: 'superseded' } : { kind: 'reused', sessionId: usedSid };
    }
    const record = JSON.parse(raw) as RefreshRecord;
    await this.redis.set(usedRefreshKey(sid, hash), JSON.stringify({ sid: record.sid, at: Date.now() }), 'EX', this.refreshTtl);
    return { kind: 'ok', sessionId: record.sid, userId: record.uid };
  }

  async revokeRefreshTokens(sessionId: string): Promise<void> {
    const current = await this.redis.get(currentKey(sessionId));
    const multi = this.redis.multi().del(currentKey(sessionId));
    if (current) multi.del(recordKey(sessionId, current));
    await multi.exec();
  }
}
