import { AccessTokenClaims, AccessTokenClaimsSchema } from '@dreamlab/contracts';
import { createRemoteJWKSet, errors, jwtVerify, JWTVerifyGetKey } from 'jose';

export interface JwtVerifierOptions {
  issuer: string;
  audience: string;
  /** Remote JWKS (other services) or an in-process key resolver (the issuer itself). */
  keys: { jwksUrl: string } | { resolver: JWTVerifyGetKey };
}

export class TokenInvalidError extends Error {
  constructor(
    message: string,
    readonly reason: 'expired' | 'invalid',
  ) {
    super(message);
  }
}

/** Verifies EdDSA access tokens and validates their claims against the shared contract. */
export class JwtVerifier {
  private readonly getKey: JWTVerifyGetKey;

  constructor(private readonly options: JwtVerifierOptions) {
    this.getKey =
      'jwksUrl' in options.keys
        ? createRemoteJWKSet(new URL(options.keys.jwksUrl), { cooldownDuration: 30_000, cacheMaxAge: 10 * 60_000 })
        : options.keys.resolver;
  }

  async verify(token: string): Promise<AccessTokenClaims> {
    try {
      const { payload } = await jwtVerify(token, this.getKey, {
        issuer: this.options.issuer,
        audience: this.options.audience,
        algorithms: ['EdDSA'],
        typ: 'at+jwt',
        clockTolerance: 5,
      });
      const parsed = AccessTokenClaimsSchema.safeParse(payload);
      if (!parsed.success) throw new TokenInvalidError('Token claims are malformed', 'invalid');
      return parsed.data;
    } catch (err) {
      if (err instanceof TokenInvalidError) throw err;
      if (err instanceof errors.JWTExpired) throw new TokenInvalidError('Access token expired', 'expired');
      throw new TokenInvalidError('Access token is invalid', 'invalid');
    }
  }
}

export function bearerToken(header: string | string[] | undefined): string | null {
  const value = Array.isArray(header) ? header[0] : header;
  if (!value) return null;
  const match = /^Bearer\s+([A-Za-z0-9\-_.]+)$/i.exec(value.trim());
  return match?.[1] ?? null;
}
