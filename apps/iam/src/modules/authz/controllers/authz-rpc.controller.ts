import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { PermissionSchema, ScopeTypeSchema } from '@dreamlab/contracts';
import { AUTHZ_CHECK_PATTERN, AuthzCheckResponse } from '@lib/auth';
import { z } from 'zod';
import { LocalAuthzChecker } from '../services/local-authz-checker.service';

const AuthzCheckPayload = z.object({
  userId: z.string().uuid(),
  orgId: z.string().uuid(),
  permission: PermissionSchema,
  scopeType: ScopeTypeSchema.optional(),
  scopeId: z.string().uuid().optional(),
  anyScope: z.boolean().optional(),
  authzVersion: z.number().int(),
});

/** RabbitMQ RPC endpoint other services call through RpcAuthzChecker. */
@Controller()
export class AuthzRpcController {
  constructor(private readonly checker: LocalAuthzChecker) {}

  @MessagePattern(AUTHZ_CHECK_PATTERN)
  async check(@Payload() payload: unknown): Promise<AuthzCheckResponse> {
    const parsed = AuthzCheckPayload.safeParse(payload);
    if (!parsed.success) return { allowed: false };
    return { allowed: await this.checker.check(parsed.data) };
  }
}
