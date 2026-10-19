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
}

interface RefreshRecord {
  sid: string;
  uid: string;
}

export type RefreshOutcome =
  | { kind: 'ok'; sessionId: string; userId: string }
  | { kind: 'reused'; sessionId: string }
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
    const previous = await this.redis.get(`iam:rt-cur:${sessionId}`);
    const multi = this.redis.multi();
    if (previous) multi.del(`iam:rt:${previous}`);
    multi
      .set(`iam:rt:${hash}`, JSON.stringify({ sid: sessionId, uid: userId } satisfies RefreshRecord), 'EX', this.refreshTtl)
      .set(`iam:rt-cur:${sessionId}`, hash, 'EX', this.refreshTtl);
    await multi.exec();
    return token;
  }

  /** Consume a refresh token. Exactly one caller can consume a given token. */
  async consumeRefreshToken(token: string): Promise<RefreshOutcome> {
    const hash = sha256(token);
    const raw = await this.redis.getdel(`iam:rt:${hash}`);
    if (!raw) {
      const reusedSid = await this.redis.get(`iam:rt-used:${hash}`);
      return reusedSid ? { kind: 'reused', sessionId: reusedSid } : { kind: 'invalid' };
    }
    const record = JSON.parse(raw) as RefreshRecord;
    await this.redis.set(`iam:rt-used:${hash}`, record.sid, 'EX', this.refreshTtl);
    return { kind: 'ok', sessionId: record.sid, userId: record.uid };
  }

  async revokeRefreshTokens(sessionId: string): Promise<void> {
    const current = await this.redis.get(`iam:rt-cur:${sessionId}`);
    const multi = this.redis.multi().del(`iam:rt-cur:${sessionId}`);
    if (current) multi.del(`iam:rt:${current}`);
    await multi.exec();
  }
}
