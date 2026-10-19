import type { NestFastifyApplication } from '@nestjs/platform-fastify';
import { randomBytes } from 'node:crypto';

export interface InjectResult<T = unknown> {
  status: number;
  body: T;
  headers: Record<string, unknown>;
}

/** Call a Fastify-backed Nest app in-process. */
export async function request<T = any>(
  app: NestFastifyApplication,
  method: 'GET' | 'POST' | 'PATCH' | 'DELETE',
  url: string,
  options: { body?: unknown; token?: string; headers?: Record<string, string> } = {},
): Promise<InjectResult<T>> {
  const res = await app.inject({
    method,
    url,
    payload: options.body as never,
    headers: { ...(options.token ? { authorization: `Bearer ${options.token}` } : {}), ...options.headers },
  });
  return { status: res.statusCode, body: (res.body ? res.json() : null) as T, headers: res.headers };
}

/** Environment every e2e test needs on top of the container URLs from global setup. */
export function testEnv(extra: Record<string, string> = {}): NodeJS.ProcessEnv {
  return {
    ...process.env,
    NODE_ENV: 'test',
    LOG_LEVEL: 'warn',
    AUTH_ISSUER: 'http://iam.test',
    IAM_KEY_ENCRYPTION_SECRET: randomBytes(32).toString('base64'),
    BOOTSTRAP_ADMIN_EMAIL: 'admin@theafricandreamlab.com',
    BOOTSTRAP_ADMIN_PASSWORD: 'e2e-admin-password',
    SEED_DEMO_ORGS: 'true',
    OTP_RESEND_COOLDOWN_SECONDS: '0',
    ARGON2_MEMORY_KIB: '8192',
    ...extra,
  };
}

export async function eventually<T>(fn: () => T | Promise<T>, { timeoutMs = 10_000, intervalMs = 100 } = {}): Promise<T> {
  const deadline = Date.now() + timeoutMs;
  let lastError: unknown;
  while (Date.now() < deadline) {
    try {
      const value = await fn();
      if (value) return value;
    } catch (err) {
      lastError = err;
    }
    await new Promise((r) => setTimeout(r, intervalMs));
  }
  throw lastError instanceof Error ? lastError : new Error('Condition not met in time');
}
