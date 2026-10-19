import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { SlugSchema } from '@dreamlab/contracts';
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
}
