import { Injectable } from '@nestjs/common';
import { forbidden } from '@lib/common';
import { InjectDatabase } from '@lib/database';
import { and, eq, isNotNull } from 'drizzle-orm';
import { IamDatabase, schema } from '../../../database';
import { emailDomain } from '../utils/email-domain';

export interface SsoRoute {
  orgId: string;
  orgSlug: string;
  orgName: string;
  protocol: 'oidc' | 'saml';
  connectionId: string;
  enforced: boolean;
}

const { orgDomains, ssoConnections, organizations } = schema;

/**
 * Which organisation's single sign-on an email address belongs to: the organisation that holds the
 * address's domain verified and has sign-on switched on.
 */
@Injectable()
export class SsoPolicy {
  constructor(@InjectDatabase() private readonly db: IamDatabase) {}

  async forEmail(email: string): Promise<SsoRoute | null> {
    const domain = emailDomain(email);
    if (!domain) return null;
    const [row] = await this.db.sys
      .select({
        orgId: organizations.id,
        orgSlug: organizations.slug,
        orgName: organizations.name,
        protocol: ssoConnections.protocol,
        connectionId: ssoConnections.id,
        enforced: ssoConnections.enforced,
      })
      .from(orgDomains)
      .innerJoin(organizations, eq(organizations.id, orgDomains.orgId))
      .innerJoin(ssoConnections, eq(ssoConnections.orgId, orgDomains.orgId))
      .where(and(eq(orgDomains.domain, domain), isNotNull(orgDomains.verifiedAt), eq(ssoConnections.enabled, true), eq(organizations.status, 'active')));
    return row ?? null;
  }

  async forOrg(orgId: string): Promise<SsoRoute | null> {
    const [row] = await this.db.sys
      .select({
        orgId: organizations.id,
        orgSlug: organizations.slug,
        orgName: organizations.name,
        protocol: ssoConnections.protocol,
        connectionId: ssoConnections.id,
        enforced: ssoConnections.enforced,
      })
      .from(ssoConnections)
      .innerJoin(organizations, eq(organizations.id, ssoConnections.orgId))
      .where(and(eq(ssoConnections.orgId, orgId), eq(ssoConnections.enabled, true), eq(organizations.status, 'active')));
    return row ?? null;
  }

  /**
   * Refuse passwords, codes and Google for addresses whose organisation enforces sign-on. Platform
   * admins are exempt, so an identity-provider outage cannot lock the platform out. Once the account
   * is known, callers pass its email (not the phone typed), so a phone number is no way round it.
   */
  async assertNotEnforced(identifier: string, isPlatformAdmin = false): Promise<void> {
    if (isPlatformAdmin || !identifier.includes('@')) return;
    const route = await this.forEmail(identifier);
    if (route?.enforced) {
      throw forbidden('sso_required', `${route.orgName} signs you in with its own sign-on. Choose “Sign in with your organisation”.`);
    }
  }
}
