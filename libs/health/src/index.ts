import {
  Controller,
  DynamicModule,
  Get,
  Inject,
  Module,
  Res,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { HealthCheckService, HealthIndicatorService, TerminusModule } from '@nestjs/terminus';
import { Public } from '@lib/auth';
import { HealthSchema } from '@dreamlab/contracts';
import type { FastifyReply } from 'fastify';
import { createZodDto } from 'nestjs-zod';

export interface NamedCheck {
  name: string;
  /** Resolves when healthy, throws when not. */
  check: () => Promise<unknown>;
}

export const HEALTH_CHECKS = Symbol('HEALTH_CHECKS');

class HealthDto extends createZodDto(HealthSchema) {}

@ApiTags('health')
@Controller('health')
class HealthController {
  constructor(
    private readonly health: HealthCheckService,
    private readonly indicators: HealthIndicatorService,
    @Inject(HEALTH_CHECKS) private readonly checks: NamedCheck[],
  ) {}

  @Get()
  @Public()
  @ApiOperation({ summary: 'Liveness and dependency health' })
  async check(@Res({ passthrough: true }) reply: FastifyReply): Promise<HealthDto> {
    try {
      return (await this.health.check(
        this.checks.map((c) => async () => {
          const indicator = this.indicators.check(c.name);
          try {
            await withTimeout(c.check(), 3000);
            return indicator.up();
          } catch (err) {
            return indicator.down({ message: err instanceof Error ? err.message : String(err) });
          }
        }),
      )) as HealthDto;
    } catch (err) {
      if (err instanceof ServiceUnavailableException) {
        void reply.status(503);
        return err.getResponse() as HealthDto;
      }
      throw err;
    }
  }
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error(`timed out after ${ms} ms`)), ms)),
  ]);
}

@Module({})
export class HealthModule {
  /** `checks` is a factory so it can use injected clients (db, redis, rabbit). */
  static forRoot(options: { inject: unknown[]; useFactory: (...deps: never[]) => NamedCheck[] }): DynamicModule {
    return {
      module: HealthModule,
      imports: [TerminusModule.forRoot({ logger: false })],
      controllers: [HealthController],
      providers: [{ provide: HEALTH_CHECKS, inject: options.inject as never[], useFactory: options.useFactory }],
    };
  }
}
