import { DynamicModule, Global, Inject, Module } from '@nestjs/common';
import { z } from 'zod';

export const CONFIG = Symbol('CONFIG');

/** Inject the validated config object of the running service. */
export const InjectConfig = (): ParameterDecorator & PropertyDecorator => Inject(CONFIG);

const booleanString = z
  .enum(['true', 'false', '1', '0'])
  .transform((v) => v === 'true' || v === '1');

/** Settings every service shares. */
export const baseConfigSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  SERVICE_NAME: z.string().min(1),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent']).default('info'),
  LOG_PRETTY: booleanString.default('false'),
  REDIS_URL: z.string().url(),
  RABBITMQ_URL: z.string().min(1),
  /** Issuer and audience of access tokens, shared by every service that verifies them. */
  AUTH_ISSUER: z.string().url(),
  AUTH_AUDIENCE: z.string().min(1).default('dreamlab-api'),
  /** Unset = on outside production, off in production. */
  SWAGGER_ENABLED: booleanString.optional(),
  /**
   * Which proxies may set X-Forwarded-For: `false`, `true`, a hop count, or comma-separated
   * addresses / CIDRs / keywords (loopback, linklocal, uniquelocal). Never `true` in production:
   * it lets any client choose its own IP and dodge per-IP rate limits.
   */
  TRUST_PROXY: z.string().default('loopback'),
  /** Shared secret proving a request came through the gateway. 32+ characters. */
  INTERNAL_GATEWAY_TOKEN: z.string().min(32),
});

export function swaggerEnabled(config: Pick<BaseConfig, 'SWAGGER_ENABLED' | 'NODE_ENV'>): boolean {
  return config.SWAGGER_ENABLED ?? config.NODE_ENV !== 'production';
}

export function trustProxySetting(value: string): boolean | number | string[] {
  if (value === 'true') return true;
  if (value === 'false') return false;
  if (/^\d+$/.test(value)) return Number(value);
  return value.split(',').map((v) => v.trim()).filter(Boolean);
}
export type BaseConfig = z.infer<typeof baseConfigSchema>;

export { booleanString };

/**
 * Load `.env` from the working directory into process.env if present. Real environment
 * variables win, so containers and CI are unaffected.
 */
export function loadDotEnv(file = '.env'): void {
  try {
    process.loadEnvFile(file);
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code !== 'ENOENT') throw err;
  }
}

/** Validate the environment against a schema and fail fast with every problem listed. */
export function loadConfig<T extends z.ZodTypeAny>(schema: T, env: NodeJS.ProcessEnv = process.env): z.infer<T> {
  // `KEY=` in a .env file means "not set", not "set to the empty string".
  const present = Object.fromEntries(Object.entries(env).filter(([, v]) => v !== undefined && v !== ''));
  const result = schema.safeParse(present);
  if (!result.success) {
    const problems = result.error.issues.map((i) => `  - ${i.path.join('.') || '(root)'}: ${i.message}`).join('\n');
    throw new Error(`Invalid configuration:\n${problems}`);
  }
  return result.data;
}

@Global()
@Module({})
export class ConfigModule {
  static forRoot<T extends z.ZodTypeAny>(schema: T, env: NodeJS.ProcessEnv = process.env): DynamicModule {
    return {
      module: ConfigModule,
      providers: [{ provide: CONFIG, useValue: loadConfig(schema, env) }],
      exports: [CONFIG],
    };
  }

  /** Provide an already-validated config object (tests, CLIs). */
  static forValue(value: unknown): DynamicModule {
    return { module: ConfigModule, providers: [{ provide: CONFIG, useValue: value }], exports: [CONFIG] };
  }
}
