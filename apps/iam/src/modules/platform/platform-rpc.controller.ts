import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { IamRpc } from '@lib/rpc';
import { z } from 'zod';
import { PlatformService } from './platform.service';

const NamesPayload = z.object({ userIds: z.array(z.string().uuid()).max(500) });

/** RabbitMQ RPC: display names for the learning service's discussions. */
@Controller()
export class PlatformRpcController {
  constructor(private readonly platform: PlatformService) {}

  @MessagePattern(IamRpc.UserNames)
  names(@Payload() payload: unknown) {
    const p = NamesPayload.safeParse(payload);
    return p.success ? this.platform.names(p.data.userIds) : [];
  }
}
