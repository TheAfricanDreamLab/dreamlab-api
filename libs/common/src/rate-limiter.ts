import type Redis from 'ioredis';

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds: number;
}

/**
 * Fixed-window counter in Redis. `hit` counts an attempt; `peek` reads without counting.
 * Keys are namespaced by the caller, e.g. `login:id:<identifier>`.
 */
export class RedisRateLimiter {
  constructor(
    private readonly redis: Redis,
    private readonly prefix = 'rl:',
  ) {}

  async hit(key: string, limit: number, windowSeconds: number): Promise<RateLimitResult> {
    const k = this.prefix + key;
    const results = await this.redis.multi().incr(k).expire(k, windowSeconds, 'NX').ttl(k).exec();
    const count = Number(results?.[0]?.[1] ?? 0);
    const ttl = Number(results?.[2]?.[1] ?? windowSeconds);
    return { allowed: count <= limit, remaining: Math.max(0, limit - count), retryAfterSeconds: ttl > 0 ? ttl : windowSeconds };
  }

  async peek(key: string, limit: number): Promise<RateLimitResult> {
    const k = this.prefix + key;
    const [count, ttl] = await Promise.all([this.redis.get(k), this.redis.ttl(k)]);
    const used = Number(count ?? 0);
    return { allowed: used < limit, remaining: Math.max(0, limit - used), retryAfterSeconds: ttl > 0 ? ttl : 0 };
  }

  async reset(key: string): Promise<void> {
    await this.redis.del(this.prefix + key);
  }
}
