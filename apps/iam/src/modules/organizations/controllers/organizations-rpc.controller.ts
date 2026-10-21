import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { SlugSchema } from '@dreamlab/contracts';
import { IamRpc } from '@lib/rpc';
import { z } from 'zod';
import { OrganizationsService } from '../organizations.service';

export const ORG_RESOLVE_PATTERN = 'iam.orgs.resolve';

/** RabbitMQ RPC: the gateway resolves tenant subdomains through this. */
@Controller()
export class OrganizationsRpcController {
  constructor(private readonly orgs: OrganizationsService) {}

  @MessagePattern(ORG_RESOLVE_PATTERN)
  async resolve(@Payload() payload: { slug?: unknown }) {
    const slug = SlugSchema.safeParse(payload?.slug);
    return slug.success ? this.orgs.resolve(slug.data) : null;
  }

  /** Display names of organisations (cohort hosts shown to learners). */
  @MessagePattern(IamRpc.OrgNames)
  async names(@Payload() payload: unknown) {
    const p = z.object({ ids: z.array(z.string().uuid()).max(200) }).safeParse(payload);
    return p.success ? this.orgs.names(p.data.ids) : [];
  }
}
