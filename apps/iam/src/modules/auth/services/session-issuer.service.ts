import { Injectable } from '@nestjs/common';
import type { TokenResponse } from '@dreamlab/contracts';
import { InjectConfig } from '@lib/config';
import { forbidden } from '@lib/common';
import { InjectDatabase } from '@lib/database';
import { eq } from 'drizzle-orm';
import type { RequestMeta } from '../../../common/interfaces/request-meta.interface';
import type { IamConfig } from '../../../config';
import { IamDatabase, IamTx, schema } from '../../../database';
import { AuthzService } from '../../authz/authz.service';
import type { UserRow } from '../../users/users.repository';
import { SessionRow, SessionsService } from './sessions.service';
import { TokenService } from './token.service';

export interface TokenContext {
  orgId: string | null;
  membershipId: string | null;
  roles: string[];
}

export const PERSONAL: TokenContext = { orgId: null, membershipId: null, roles: [] };

/** RFC 8176-style method references carried in the `amr` claim. */
const AMR: Record<SessionRow['authMethod'], string> = { password: 'pwd', otp: 'otp', verify: 'otp', sso: 'sso', google: 'google' };

type SessionForTokens = Pick<SessionRow, 'id' | 'userId' | 'authMethod' | 'mfaAt'>;

/**
 * Starts sessions and issues their tokens. Every sign-in path (password, codes, Google, MFA,
 * single sign-on) and every refresh goes through here, so the claims are always computed the same way.
 */
@Injectable()
export class SessionIssuer {
  constructor(
    @InjectDatabase() private readonly db: IamDatabase,
    @InjectConfig() private readonly config: IamConfig,
    private readonly sessions: SessionsService,
    private readonly tokens: TokenService,
    private readonly authz: AuthzService,
  ) {}

  /**
   * Start a session. The context is the organisation asked for, or else the tenant the request came
   * through, when the user belongs to it; otherwise the personal context.
   */
  async start(
    tx: IamTx,
    user: Pick<UserRow, 'id'>,
    method: SessionRow['authMethod'],
    meta: RequestMeta,
    options: { mfa?: boolean; orgId?: string | null } = {},
  ): Promise<TokenResponse> {
    // Every sign-in path (password, codes, Google, SSO, MFA) ends here: suspended people get no session.
    const [account] = await tx.select({ status: schema.users.status }).from(schema.users).where(eq(schema.users.id, user.id));
    if (account?.status !== 'active') throw forbidden('account_disabled', 'This account is disabled');
    const context = await this.resolveContext(user.id, options.orgId !== undefined ? options.orgId : meta.tenantOrgId);
    const session = await this.sessions.create(tx, user.id, method, context, meta, options.mfa ?? false);
    return this.tokenResponse(session, context);
  }

  async resolveContext(userId: string, preferredOrgId: string | null): Promise<TokenContext> {
    if (!preferredOrgId) return PERSONAL;
    const access = await this.authz.orgAccess(userId, preferredOrgId);
    return access ? { orgId: preferredOrgId, membershipId: access.membershipId, roles: AuthzService.orgRoleKeys(access) } : PERSONAL;
  }

  async tokenResponse(session: SessionForTokens, context: TokenContext): Promise<TokenResponse> {
    const [platformAdmin, authzVersion] = await Promise.all([this.authz.isPlatformAdmin(session.userId), this.authz.authzVersion(session.userId)]);
    const mfaRequired = await this.mfaRequired(context.orgId, platformAdmin);
    const amr = [AMR[session.authMethod], ...(session.mfaAt ? ['mfa'] : [])];
    const accessToken = await this.tokens.signAccessToken({
      userId: session.userId,
      sessionId: session.id,
      ...context,
      platformAdmin,
      authzVersion,
      amr,
      mfaRequired,
    });
    const refreshToken = await this.tokens.issueRefreshToken(session.id, session.userId);
    return {
      tokenType: 'Bearer',
      accessToken,
      expiresIn: this.tokens.accessTtl,
      refreshToken,
      refreshExpiresIn: this.tokens.refreshTtl,
      sessionId: session.id,
      context: { orgId: context.orgId, membershipId: context.membershipId },
    };
  }

  /** Admin permissions in this context need a session that passed MFA. */
  private async mfaRequired(orgId: string | null, platformAdmin: boolean): Promise<boolean> {
    if (platformAdmin && this.config.PLATFORM_ADMIN_MFA_REQUIRED) return true;
    if (!orgId) return false;
    const [org] = await this.db.sys.select({ required: schema.organizations.requireAdminMfa }).from(schema.organizations).where(eq(schema.organizations.id, orgId));
    return org?.required ?? false;
  }
}
