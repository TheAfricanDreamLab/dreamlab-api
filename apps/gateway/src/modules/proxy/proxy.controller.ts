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
 * Each service owns a prefix: /v1/catalog → catalog, /v1/learning → learning, everything else → IAM.
 */
@ApiExcludeController()
@Public()
@Controller()
export class ProxyController {
  constructor(
    private readonly proxy: ProxyService,
    @InjectConfig() private readonly config: GatewayConfig,
  ) {}

  @All(['v1/catalog/*'])
  async catalog(@Req() req: FastifyRequest, @Res() reply: FastifyReply): Promise<void> {
    await this.proxy.forward(req, reply, this.config.CATALOG_URL);
  }

  @All(['v1/learning/*'])
  async learning(@Req() req: FastifyRequest, @Res() reply: FastifyReply): Promise<void> {
    await this.proxy.forward(req, reply, this.config.LEARNING_URL);
  }

  @All(['v1/*', '.well-known/*', 'scim/v2/*'])
  async iam(@Req() req: FastifyRequest, @Res() reply: FastifyReply): Promise<void> {
    await this.proxy.forward(req, reply, this.config.IAM_URL);
  }
}
