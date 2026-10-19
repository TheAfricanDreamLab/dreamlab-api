import { Inject, Injectable } from '@nestjs/common';
import type { OtpPurpose } from '@dreamlab/contracts';
import { InjectRedis, RedisRateLimiter, safeEqual, sha256, tooManyRequests } from '@lib/common';
import { InjectConfig } from '@lib/config';
import type Redis from 'ioredis';
import { randomInt } from 'node:crypto';
import type { IamConfig } from '../../config';
import type { Notifier } from '../notifications/interfaces/notifier.interface';
import { NOTIFIER } from '../notifications/notifier.service';
import { channelFor } from '../notifications/utils/channel-for';
import { maskDestination } from '../notifications/utils/mask-destination';

export type OtpVerification = 'ok' | 'invalid' | 'expired' | 'exhausted';

/**
 * Six-digit one-time codes in Redis. Only a peppered hash is stored, attempts are capped,
 * resends have a cooldown, and each identifier has an hourly send limit.
 */
@Injectable()
export class OtpService {
  private readonly limiter: RedisRateLimiter;

  constructor(
    @InjectRedis() private readonly redis: Redis,
    @InjectConfig() private readonly config: IamConfig,
    @Inject(NOTIFIER) private readonly notifier: Notifier,
  ) {
    this.limiter = new RedisRateLimiter(redis, 'iam:rl:');
  }

  private key(purpose: OtpPurpose, identifier: string): string {
    return `iam:otp:${purpose}:${sha256(identifier)}`;
  }

  private hash(code: string, purpose: OtpPurpose, identifier: string): string {
    return sha256(`${this.config.IAM_KEY_ENCRYPTION_SECRET}:${purpose}:${identifier}:${code}`);
  }

  /** Create and send a code. Throws 429 inside the cooldown or over the hourly limit. */
  async issue(purpose: OtpPurpose, identifier: string): Promise<{ channel: 'email' | 'sms'; destination: string; expiresInSeconds: number }> {
    const channel = channelFor(identifier);
    const idHash = sha256(identifier);
    const cooldown = this.config.OTP_RESEND_COOLDOWN_SECONDS;
    if (cooldown > 0) {
      const set = await this.redis.set(`iam:otp-cd:${purpose}:${idHash}`, '1', 'EX', cooldown, 'NX');
      if (set !== 'OK') {
        const ttl = await this.redis.ttl(`iam:otp-cd:${purpose}:${idHash}`);
        throw tooManyRequests('otp_cooldown', 'Please wait before requesting another code', Math.max(ttl, 1));
      }
    }
    const hourly = await this.limiter.hit(`otp:${idHash}`, this.config.OTP_HOURLY_LIMIT, 3600);
    if (!hourly.allowed) throw tooManyRequests('otp_limit', 'Too many codes requested; try again later', hourly.retryAfterSeconds);

    const code = randomInt(0, 1_000_000).toString().padStart(6, '0');
    const key = this.key(purpose, identifier);
    await this.redis
      .multi()
      .set(key, this.hash(code, purpose, identifier), 'EX', this.config.OTP_TTL_SECONDS)
      .del(`${key}:attempts`)
      .exec();
    await this.notifier.sendOtp({ channel, destination: identifier, code, purpose, expiresInSeconds: this.config.OTP_TTL_SECONDS });
    return { channel, destination: maskDestination(channel, identifier), expiresInSeconds: this.config.OTP_TTL_SECONDS };
  }

  /** Check a code. A correct code is consumed; every attempt counts towards the cap (atomically). */
  async verify(purpose: OtpPurpose, identifier: string, code: string): Promise<OtpVerification> {
    const key = this.key(purpose, identifier);
    const attemptsKey = `${key}:attempts`;
    const stored = await this.redis.get(key);
    if (!stored) return 'expired';
    const attempts = await this.redis.incr(attemptsKey);
    if (attempts === 1) await this.redis.expire(attemptsKey, this.config.OTP_TTL_SECONDS);
    if (attempts > this.config.OTP_MAX_ATTEMPTS) {
      await this.redis.del(key, attemptsKey);
      return 'exhausted';
    }
    if (safeEqual(stored, this.hash(code, purpose, identifier))) {
      // GETDEL makes the code single-use even under concurrent submissions.
      const consumed = await this.redis.getdel(key);
      await this.redis.del(attemptsKey);
      return consumed ? 'ok' : 'expired';
    }
    if (attempts >= this.config.OTP_MAX_ATTEMPTS) {
      await this.redis.del(key, attemptsKey);
      return 'exhausted';
    }
    return 'invalid';
  }
}
