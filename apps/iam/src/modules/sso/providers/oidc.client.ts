import { createHash } from 'node:crypto';
import { createLocalJWKSet, JSONWebKeySet, jwtVerify } from 'jose';
import { safeFetch, UnsafeUrlError } from '../utils/safe-url';

export interface OidcDiscovery {
  issuer: string;
  authorization_endpoint: string;
  token_endpoint: string;
  jwks_uri: string;
  token_endpoint_auth_methods_supported?: string[];
}

export interface OidcIdentity {
  subject: string;
  email: string | null;
  name: string | null;
}

export class OidcError extends Error {}

const DISCOVERY_TTL_MS = 3600_000;
const JWKS_TTL_MS = 600_000;
const trimSlash = (s: string) => s.replace(/\/+$/, '');

export const pkceChallenge = (verifier: string): string => createHash('sha256').update(verifier).digest('base64url');

/**
 * A small OpenID Connect relying party: authorization code flow with PKCE, state and nonce.
 * Every fetch goes through safeFetch (https, public addresses, no redirects).
 */
export class OidcClient {
  private readonly discoveries = new Map<string, { at: number; value: OidcDiscovery }>();
  private readonly jwks = new Map<string, { at: number; value: JSONWebKeySet }>();

  constructor(private readonly allowPrivate: boolean) {}

  async discover(issuer: string): Promise<OidcDiscovery> {
    const key = trimSlash(issuer);
    const cached = this.discoveries.get(key);
    if (cached && Date.now() - cached.at < DISCOVERY_TTL_MS) return cached.value;
    let doc: OidcDiscovery;
    try {
      const res = await safeFetch(`${key}/.well-known/openid-configuration`, { headers: { accept: 'application/json' } }, this.allowPrivate);
      if (res.status !== 200) throw new OidcError(`Discovery answered HTTP ${res.status}`);
      doc = JSON.parse(res.text) as OidcDiscovery;
    } catch (err) {
      if (err instanceof OidcError || err instanceof UnsafeUrlError) throw err;
      throw new OidcError('Could not read the identity provider’s OpenID configuration');
    }
    if (trimSlash(String(doc.issuer ?? '')) !== key) throw new OidcError('The OpenID configuration names a different issuer');
    for (const field of ['authorization_endpoint', 'token_endpoint', 'jwks_uri'] as const) {
      if (typeof doc[field] !== 'string') throw new OidcError(`The OpenID configuration has no ${field}`);
      // Browsers are sent to the authorization endpoint, so it must be a real https URL (never javascript: or data:).
      if (!/^https:\/\//i.test(doc[field]) && !this.allowPrivate) throw new OidcError(`The OpenID configuration's ${field} is not an https URL`);
    }
    this.discoveries.set(key, { at: Date.now(), value: doc });
    return doc;
  }

  authorizationUrl(d: OidcDiscovery, p: { clientId: string; redirectUri: string; state: string; nonce: string; codeVerifier: string }): string {
    const url = new URL(d.authorization_endpoint);
    url.searchParams.set('response_type', 'code');
    url.searchParams.set('client_id', p.clientId);
    url.searchParams.set('redirect_uri', p.redirectUri);
    url.searchParams.set('scope', 'openid email profile');
    url.searchParams.set('state', p.state);
    url.searchParams.set('nonce', p.nonce);
    url.searchParams.set('code_challenge', pkceChallenge(p.codeVerifier));
    url.searchParams.set('code_challenge_method', 'S256');
    return url.toString();
  }

  /** Exchange the code, then verify the ID token: signature, issuer, audience, expiry and nonce. */
  async exchange(
    d: OidcDiscovery,
    p: { clientId: string; clientSecret: string; code: string; redirectUri: string; codeVerifier: string; nonce: string },
  ): Promise<OidcIdentity> {
    const body = new URLSearchParams({ grant_type: 'authorization_code', code: p.code, redirect_uri: p.redirectUri, code_verifier: p.codeVerifier });
    const headers: Record<string, string> = { 'content-type': 'application/x-www-form-urlencoded', accept: 'application/json' };
    const methods = d.token_endpoint_auth_methods_supported ?? ['client_secret_basic'];
    if (methods.includes('client_secret_basic')) {
      headers.authorization = `Basic ${Buffer.from(`${encodeURIComponent(p.clientId)}:${encodeURIComponent(p.clientSecret)}`).toString('base64')}`;
    } else {
      body.set('client_id', p.clientId);
      body.set('client_secret', p.clientSecret);
    }
    const res = await safeFetch(d.token_endpoint, { method: 'POST', headers, body: body.toString() }, this.allowPrivate);
    let token: { id_token?: string };
    try {
      token = JSON.parse(res.text) as { id_token?: string };
    } catch {
      throw new OidcError('The identity provider’s token answer was not JSON');
    }
    if (res.status !== 200 || !token.id_token) throw new OidcError(`The identity provider refused the code (HTTP ${res.status})`);

    const keys = createLocalJWKSet(await this.keySet(d.jwks_uri));
    let payload: Record<string, unknown>;
    try {
      ({ payload } = await jwtVerify(token.id_token, keys, { issuer: d.issuer, audience: p.clientId, clockTolerance: 60 }));
    } catch {
      throw new OidcError('The identity provider’s ID token did not verify');
    }
    if (payload.nonce !== p.nonce) throw new OidcError('The ID token was issued for a different sign-in');
    const str = (v: unknown) => (typeof v === 'string' && v.trim() ? v.trim() : null);
    // Microsoft Entra may leave out `email`; its preferred_username / upn is the work address.
    const email = [str(payload.email), str(payload.preferred_username), str(payload.upn)].find((v) => v?.includes('@')) ?? null;
    const name = str(payload.name) ?? ([str(payload.given_name), str(payload.family_name)].filter(Boolean).join(' ') || null);
    return { subject: String(payload.sub), email: email?.toLowerCase() ?? null, name: name?.slice(0, 120) ?? null };
  }

  private async keySet(uri: string): Promise<JSONWebKeySet> {
    const cached = this.jwks.get(uri);
    if (cached && Date.now() - cached.at < JWKS_TTL_MS) return cached.value;
    const res = await safeFetch(uri, { headers: { accept: 'application/json' } }, this.allowPrivate);
    if (res.status !== 200) throw new OidcError(`The identity provider’s keys answered HTTP ${res.status}`);
    const value = JSON.parse(res.text) as JSONWebKeySet;
    this.jwks.set(uri, { at: Date.now(), value });
    return value;
  }
}
