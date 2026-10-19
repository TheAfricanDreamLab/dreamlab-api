import { emailDomain, PUBLIC_EMAIL_DOMAINS } from './modules/auth/utils/email-domain';
import { base32Decode, base32Encode, hotp, matchTotp, newRecoveryCodes, otpauthUrl, totp } from './modules/auth/utils/totp';
import { hasVerificationRecord, verificationRecordName, verificationRecordValue } from './modules/domains/utils/dns-txt';
import { parseEqFilter, patchOperations, scimBoolean } from './modules/scim/utils/scim';
import { SamlClient } from './modules/sso/providers/saml.client';
import { pkceChallenge } from './modules/sso/providers/oidc.client';
import { assertSafeUrl, isPrivateAddress } from './modules/sso/utils/safe-url';

describe('TOTP (RFC 6238)', () => {
  // RFC 6238 appendix B: SHA-1 secret "12345678901234567890"; 8-digit codes truncated to our 6.
  const secret = base32Encode(Buffer.from('12345678901234567890'));

  it.each([
    [59, '287082'],
    [1111111109, '081804'],
    [1234567890, '005924'],
    [2000000000, '279037'],
  ])('at t=%i the code is %s', (t, code) => {
    expect(totp(secret, t * 1000)).toBe(code);
  });

  it('round-trips base32 and matches HOTP', () => {
    expect(base32Decode(secret).toString()).toBe('12345678901234567890');
    expect(hotp(Buffer.from('12345678901234567890'), 0)).toBe('755224');
  });

  it('accepts one step of drift either way, and nothing beyond', () => {
    const now = 1_700_000_000_000;
    expect(matchTotp(secret, totp(secret, now - 30_000), now)).not.toBeNull();
    expect(matchTotp(secret, totp(secret, now + 30_000), now)).not.toBeNull();
    expect(matchTotp(secret, totp(secret, now - 90_000), now)).toBeNull();
    expect(matchTotp(secret, 'abcdef', now)).toBeNull();
  });

  it('builds otpauth URLs and readable recovery codes', () => {
    expect(otpauthUrl('ABC', 'ada@acme.com')).toMatch(/^otpauth:\/\/totp\/The%20African%20Dream%20Lab%3Aada%40acme\.com\?secret=ABC&issuer=/);
    const codes = newRecoveryCodes();
    expect(codes).toHaveLength(10);
    for (const c of codes) expect(c).toMatch(/^[a-z2-9]{5}-[a-z2-9]{5}$/);
    expect(new Set(codes).size).toBe(10);
  });
});

describe('email domains', () => {
  it('extracts the domain and knows public providers', () => {
    expect(emailDomain('Ada@Acme.COM')).toBe('acme.com');
    expect(emailDomain('nope')).toBeNull();
    expect(PUBLIC_EMAIL_DOMAINS.has('gmail.com')).toBe(true);
  });

  it('verifies only the exact TXT value at the challenge name, even when split into chunks', async () => {
    const value = verificationRecordValue('tok123');
    const lookup = async (name: string) => (name === verificationRecordName('acme.com') ? [['other'], [value.slice(0, 10), value.slice(10)]] : []);
    expect(await hasVerificationRecord(lookup, 'acme.com', 'tok123')).toBe(true);
    expect(await hasVerificationRecord(lookup, 'acme.com', 'wrong')).toBe(false);
    expect(await hasVerificationRecord(async () => Promise.reject(new Error('NXDOMAIN')), 'acme.com', 'tok123')).toBe(false);
  });
});

describe('identity-provider URLs (SSRF guard)', () => {
  it.each(['127.0.0.1', '10.1.2.3', '172.20.0.5', '192.168.1.1', '169.254.169.254', '100.64.0.1', '::1', 'fd00::1', 'fe80::1', '::ffff:127.0.0.1', '::ffff:7f00:1', '::ffff:a9fe:a9fe'])(
    '%s is private',
    (ip) => expect(isPrivateAddress(ip)).toBe(true),
  );

  it.each(['8.8.8.8', '1.1.1.1', '2606:4700:4700::1111'])('%s is public', (ip) => expect(isPrivateAddress(ip)).toBe(false));

  it('needs https and a public address unless private URLs are allowed', async () => {
    await expect(assertSafeUrl('http://idp.example.org', false)).rejects.toThrow('https');
    await expect(assertSafeUrl('https://127.0.0.1/x', false)).rejects.toThrow('private');
    await expect(assertSafeUrl('https://user:pw@idp.example.org', false)).rejects.toThrow('credentials');
    await expect(assertSafeUrl('https://[::ffff:127.0.0.1]/x', false)).rejects.toThrow('private');
    await expect(assertSafeUrl('http://localhost:9999', true)).resolves.toBeInstanceOf(URL);
  });

  it('PKCE uses S256', () => {
    // RFC 7636 appendix B.
    expect(pkceChallenge('dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk')).toBe('E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM');
  });
});

describe('SAML attributes', () => {
  it('reads the email and name from common attribute names, and avoids transient NameIDs as subjects', () => {
    const id = SamlClient.identity({
      issuer: 'idp',
      nameID: '_abc123',
      nameIDFormat: 'urn:oasis:names:tc:SAML:2.0:nameid-format:transient',
      'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress': 'Ada@Acme.com',
      givenName: 'Ada',
      sn: 'Obi',
    });
    expect(id).toEqual({ subject: 'email:ada@acme.com', email: 'ada@acme.com', name: 'Ada Obi' });
    expect(SamlClient.identity({ issuer: 'idp', nameID: 'ada@acme.com', nameIDFormat: 'urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress' }).subject).toBe('ada@acme.com');
  });
});

describe('SCIM helpers', () => {
  it('parses eq filters on allowed attributes only', () => {
    expect(parseEqFilter('userName eq "ada@acme.com"', ['userName'])).toEqual({ attribute: 'userName', value: 'ada@acme.com' });
    expect(parseEqFilter('USERNAME EQ "a\\"b"', ['userName'])).toEqual({ attribute: 'userName', value: 'a"b' });
    expect(parseEqFilter(undefined, ['userName'])).toBeNull();
    expect(() => parseEqFilter('userName co "a"', ['userName'])).toThrow();
    expect(() => parseEqFilter('password eq "x"', ['userName'])).toThrow();
  });

  it('reads PATCH operations and IdP-style booleans', () => {
    expect(patchOperations({ Operations: [{ op: 'Replace', path: 'active', value: 'False' }] })).toEqual([{ op: 'replace', path: 'active', value: 'False' }]);
    expect(() => patchOperations({})).toThrow();
    expect(scimBoolean('False')).toBe(false);
    expect(scimBoolean(true)).toBe(true);
  });
});
