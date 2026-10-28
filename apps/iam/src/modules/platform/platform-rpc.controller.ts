import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { IamRpc } from '@lib/rpc';
import { z } from 'zod';
import { PlatformService } from './platform.service';

const NamesPayload = z.object({ userIds: z.array(z.string().uuid()).max(500) });
const HoldersPayload = z.object({ orgId: z.string().uuid(), permission: z.string().min(3).max(80) });

/** RabbitMQ RPC: display names (learning's discussions), and contacts and permission holders (notify). */
@Controller()
export class PlatformRpcController {
  constructor(private readonly platform: PlatformService) {}

  @MessagePattern(IamRpc.UserNames)
  names(@Payload() payload: unknown) {
    const p = NamesPayload.safeParse(payload);
    return p.success ? this.platform.names(p.data.userIds) : [];
  }

  @MessagePattern(IamRpc.UserContacts)
  contacts(@Payload() payload: unknown) {
    const p = NamesPayload.safeParse(payload);
    return p.success ? this.platform.contacts(p.data.userIds) : [];
  }

  @MessagePattern(IamRpc.PermissionHolders)
  holders(@Payload() payload: unknown) {
    const p = HoldersPayload.safeParse(payload);
    return p.success ? this.platform.holders(p.data.orgId, p.data.permission) : [];
  }
}
