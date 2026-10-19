import { CacheItem, CacheProvider, Profile, SAML, ValidateInResponseTo } from '@node-saml/node-saml';
import type Redis from 'ioredis';
import { X509Certificate } from 'node:crypto';

export interface SamlServiceProvider {
  /** Our entity id for this organisation, and the audience its assertions must name. */
  entityId: string;
  acsUrl: string;
}

export interface SamlIdentityProvider {
  idpEntityId: string;
  idpSsoUrl: string;
  certificate: string;
}

export interface SamlIdentity {
  subject: string;
  email: string | null;
  name: string | null;
}

const REQUEST_TTL_MS = 10 * 60_000;

/** Request ids for InResponseTo checks, in Redis so any IAM replica can validate the answer. */
class RedisSamlCache implements CacheProvider {
  constructor(
    private readonly redis: Redis,
    private readonly prefix: string,
  ) {}

  async saveAsync(key: string, value: string): Promise<CacheItem | null> {
    const ok = await this.redis.set(this.prefix + key, value, 'PX', REQUEST_TTL_MS, 'NX');
    return ok === 'OK' ? { value, createdAt: Date.now() } : null;
  }

  async getAsync(key: string): Promise<string | null> {
    return this.redis.get(this.prefix + key);
  }

  async removeAsync(key: string | null): Promise<string | null> {
    if (!key) return null;
    // GETDEL: a response can be accepted once.
    return this.redis.getdel(this.prefix + key);
  }
}

/** PEM, or bare base64, to PEM; throws when it is not an X.509 certificate. */
export function normaliseCertificate(input: string): { pem: string; fingerprint: string; expiresAt: Date | null } {
  const body = input.replace(/-----(BEGIN|END) CERTIFICATE-----/g, '').replace(/\s+/g, '');
  const pem = `-----BEGIN CERTIFICATE-----\n${body.match(/.{1,64}/g)!.join('\n')}\n-----END CERTIFICATE-----\n`;
  const cert = new X509Certificate(pem);
  const expiresAt = new Date(cert.validTo);
  return { pem, fingerprint: cert.fingerprint256, expiresAt: Number.isNaN(expiresAt.getTime()) ? null : expiresAt };
}

/**
 * SAML 2.0 web SSO, SP-initiated, HTTP-Redirect out and HTTP-POST back. Assertions must be signed
 * by the configured certificate, name our entity id as audience, come from the configured issuer,
 * and answer a request we made (InResponseTo); unsolicited responses are refused.
 */
export class SamlClient {
  private readonly saml: SAML;

  constructor(sp: SamlServiceProvider, idp: SamlIdentityProvider, redis: Redis, connectionId: string) {
    this.saml = new SAML({
      issuer: sp.entityId,
      audience: sp.entityId,
      callbackUrl: sp.acsUrl,
      entryPoint: idp.idpSsoUrl,
      idpIssuer: idp.idpEntityId,
      idpCert: idp.certificate,
      wantAssertionsSigned: true,
      wantAuthnResponseSigned: false,
      signatureAlgorithm: 'sha256',
      identifierFormat: null,
      disableRequestedAuthnContext: true,
      acceptedClockSkewMs: 60_000,
      maxAssertionAgeMs: 10 * 60_000,
      validateInResponseTo: ValidateInResponseTo.always,
      requestIdExpirationPeriodMs: REQUEST_TTL_MS,
      cacheProvider: new RedisSamlCache(redis, `iam:saml-req:${connectionId}:`),
    });
  }

  authorizeUrl(relayState: string): Promise<string> {
    return this.saml.getAuthorizeUrlAsync(relayState, undefined, {});
  }

  async validate(samlResponse: string): Promise<SamlIdentity> {
    const { profile } = await this.saml.validatePostResponseAsync({ SAMLResponse: samlResponse });
    if (!profile) throw new Error('No assertion in the SAML response');
    return SamlClient.identity(profile);
  }

  metadata(): string {
    return this.saml.generateServiceProviderMetadata(null, null);
  }

  static identity(profile: Profile): SamlIdentity {
    const attr = (...names: string[]) => {
      for (const n of names) {
        const v = profile[n];
        const s = Array.isArray(v) ? v[0] : v;
        if (typeof s === 'string' && s.trim()) return s.trim();
      }
      return null;
    };
    const email =
      attr('email', 'mail', 'urn:oid:0.9.2342.19200300.100.1.3', 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress') ??
      (profile.nameID?.includes('@') ? profile.nameID : null);
    const first = attr('givenName', 'firstName', 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/givenname', 'urn:oid:2.5.4.42');
    const last = attr('sn', 'lastName', 'surname', 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/surname', 'urn:oid:2.5.4.4');
    const name = attr('displayName', 'name', 'http://schemas.microsoft.com/identity/claims/displayname') ?? ([first, last].filter(Boolean).join(' ') || null);
    // A transient NameID changes every sign-in, so the address identifies the person instead.
    const transient = (profile.nameIDFormat ?? '').endsWith(':transient');
    const subject = transient && email ? `email:${email.toLowerCase()}` : profile.nameID;
    return { subject, email: email?.toLowerCase() ?? null, name: name?.slice(0, 120) ?? null };
  }
}
