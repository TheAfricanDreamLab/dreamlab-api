import { Injectable } from '@nestjs/common';
import { AuthzChecker, AuthzCheckRequest } from '@lib/auth';
import { AuthzService } from '../authz.service';

/** In-process checker used by IAM's own PermissionsGuard. */
@Injectable()
export class LocalAuthzChecker implements AuthzChecker {
  constructor(private readonly authz: AuthzService) {}

  check(r: AuthzCheckRequest): Promise<boolean> {
    return this.authz.can(r.userId, r.orgId, r.permission, r.anyScope ? 'any' : r.scopeType ? { type: r.scopeType, id: r.scopeId } : undefined);
  }
}
