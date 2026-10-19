import { All, Controller, Req, Res } from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';
import { Public } from '@lib/auth';
import { InjectConfig } from '@lib/config';
import type { FastifyReply, FastifyRequest } from 'fastify';
import type { GatewayConfig } from '../../config';
import { ProxyService } from './proxy.service';

/**
 * Routes the public API to the owning service. Each service enforces its own authorization;
 * the gateway adds tenant context, rejects bad tokens early and rate-limits.
 * As services are added, they get a prefix here (e.g. /v1/catalog → catalog).
 */
@ApiExcludeController()
@Public()
@Controller()
export class ProxyController {
  constructor(
    private readonly proxy: ProxyService,
    @InjectConfig() private readonly config: GatewayConfig,
  ) {}

  @All(['v1/*', '.well-known/*'])
  async iam(@Req() req: FastifyRequest, @Res() reply: FastifyReply): Promise<void> {
    await this.proxy.forward(req, reply, this.config.IAM_URL);
  }
}
