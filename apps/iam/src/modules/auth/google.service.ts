import { HttpStatus, Injectable } from '@nestjs/common';
import { AppException, unauthorized } from '@lib/common';
import { InjectConfig } from '@lib/config';
import { createRemoteJWKSet, jwtVerify, JWTVerifyGetKey } from 'jose';
import type { IamConfig } from '../../config';

export interface GoogleIdentity {
  subject: string;
  email: string;
  name: string | null;
  locale: string | null;
}

const GOOGLE_JWKS = 'https://www.googleapis.com/oauth2/v3/certs';
const GOOGLE_ISSUERS = ['https://accounts.google.com', 'accounts.google.com'];

/**
 * Verifies Google ID tokens (signature, issuer, audience = one of our client ids, expiry) and
 * accepts only addresses Google has verified.
 */
@Injectable()
export class GoogleIdentityService {
  private readonly jwks: JWTVerifyGetKey;

  constructor(@InjectConfig() private readonly config: IamConfig) {
    this.jwks = createRemoteJWKSet(new URL(GOOGLE_JWKS), { cacheMaxAge: 6 * 3600_000 });
  }

  get enabled(): boolean {
    return this.config.GOOGLE_CLIENT_IDS.length > 0;
  }

  async verify(idToken: string): Promise<GoogleIdentity> {
    if (!this.enabled) {
      throw new AppException(HttpStatus.SERVICE_UNAVAILABLE, 'google_not_configured', 'Google sign-in is not available');
    }
    let payload: Record<string, unknown>;
    try {
      ({ payload } = await jwtVerify(idToken, this.jwks, {
        issuer: GOOGLE_ISSUERS,
        audience: this.config.GOOGLE_CLIENT_IDS,
        algorithms: ['RS256'],
        clockTolerance: 10,
      }));
    } catch {
      throw unauthorized('google_token_invalid', 'Google sign-in failed. Please try again.');
    }
    const email = typeof payload.email === 'string' ? payload.email.trim().toLowerCase() : null;
    if (!payload.sub || !email || payload.email_verified !== true) {
      throw unauthorized('google_email_unverified', 'Your Google account has no verified email address');
    }
    return {
      subject: String(payload.sub),
      email,
      name: typeof payload.name === 'string' ? payload.name.slice(0, 120) : null,
      locale: typeof payload.locale === 'string' ? payload.locale.slice(0, 16) : null,
    };
  }
}
