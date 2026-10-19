# Enterprise identity

How organisations connect their own sign-in to Dream Lab (IAM-14..20), and what IAM guarantees.
Org admins do all of this from **Sign-in & security** in the web app; the API routes are in Swagger
under *enterprise* and *auth*.

## The order of things

1. **Verify an email domain** (`/v1/orgs/:orgId/domains`). Publish the TXT record IAM shows at
   `_dreamlab-challenge.<domain>`, then verify. IAM looks it up through public resolvers
   (1.1.1.1, 8.8.8.8). Public mailbox providers (gmail.com, outlook.com…) cannot be claimed. Many
   organisations may *claim* a domain, but only one can hold it *verified*, so a squatter cannot
   block the real owner.
2. **Connect single sign-on** (`PUT /v1/orgs/:orgId/sso`), OIDC or SAML. One connection per
   organisation. Needs a verified domain.
3. **Test it** (`POST /v1/auth/sso/start` with `mode: test`). An admin signs in through the IdP;
   nothing is created, and the connection is marked tested. Changing the IdP details clears the
   test and the enforcement.
4. **Switch it on, and optionally require it** (`PATCH /v1/orgs/:orgId/sso`). Requiring it needs
   a successful test.
5. **Optionally provision with SCIM** (`POST /v1/orgs/:orgId/scim/token`).
6. **Optionally require MFA for admins** (`PATCH /v1/orgs/:orgId/security`).

## Identity-provider settings

| | OIDC | SAML 2.0 |
|---|---|---|
| Our redirect / ACS URL | `${PUBLIC_APP_URL}/sso/oidc/callback` | `${PUBLIC_APP_URL}/sso/saml/acs` (HTTP-POST) |
| Our entity id (audience) | — | `${PUBLIC_APP_URL}/sso/saml/<orgId>` |
| SP metadata | — | `${PUBLIC_API_URL}/v1/auth/sso/saml/<connectionId>/metadata` |
| They give us | Issuer URL, client id, client secret | IdP entity id, sign-on URL, signing certificate |
| Claims we read | `sub`, `email` (or `preferred_username` / `upn` for Microsoft Entra), `name` | NameID or an email attribute; `displayName` or given name + surname |

- **Microsoft Entra:** issuer `https://login.microsoftonline.com/<tenant-id>/v2.0`, scopes `openid email profile`.
- **Google Workspace:** issuer `https://accounts.google.com`.
- **Okta:** issuer `https://<your-org>.okta.com` (or a custom authorization server).

## What IAM guarantees

- **Only verified domains.** Sign-on and SCIM accept only addresses at the organisation's verified
  domains, so a misconfigured or hostile IdP cannot sign in as, or provision, anyone else.
- **State bound to the browser.** The web app keeps the sign-on state in an httpOnly cookie and
  compares it on return. SAML's cross-site POST is validated first and finished by a same-site GET
  (`/sso/finish`), which blocks login CSRF. State is single-use and expires after 10 minutes.
- **OIDC:** authorization code flow with PKCE (S256), `state` and `nonce`. The ID token is verified
  (signature against the IdP's JWKS, issuer, audience, expiry, nonce).
- **SAML:** assertions must be signed with the configured certificate, name our entity id as the
  audience, come from the configured issuer, and answer a request we made (`InResponseTo`, kept in
  Redis). Unsolicited (IdP-initiated) responses are refused.
- **No SSRF.** IdP URLs must be https and resolve only to public addresses, with no redirects, an
  8 s timeout and a 512 KB cap. `SSO_ALLOW_PRIVATE_URLS=true` lifts this for development only;
  production refuses to start with it.
- **Secrets at rest.** OIDC client secrets and authenticator secrets are AES-256-GCM encrypted with
  `IAM_KEY_ENCRYPTION_SECRET` and never returned. SCIM tokens are stored as SHA-256 only and shown once.
- **Enforcement.** With sign-on required, passwords, codes and Google are refused for addresses at
  the organisation's verified domains (`sso_required`). Platform admins are exempt, so an IdP
  outage cannot lock the platform out.
- **Joining.** First sign-on creates the person (if new) and an active membership with the
  connection's default role (never an admin role). Suspended memberships stay suspended.
- **The organisation's sign-on counts as its second factor**, so SSO sessions satisfy
  "require MFA for admins".

## SCIM 2.0

Base URL `${PUBLIC_API_URL}/scim/v2`, bearer token `scim_…`. Supports `Users` and `Groups` (list
with `eq` filters on `userName`, `externalId`, `emails.value`, `displayName`; create, get, replace,
PATCH, delete), plus `ServiceProviderConfig`, `ResourceTypes` and `Schemas`. The SCIM user id is
the membership id. Deactivating suspends the membership; deleting ends it, removes its roles and
groups, and ends sessions in that organisation at once. Microsoft Entra's string booleans
(`"False"`) are understood.

## Custom roles (IAM-18)

`/v1/orgs/:orgId/roles`. Any permission except `platform.*`; built-in role keys are reserved.
Holders get changes at once: IAM bumps their authorization version, so other services re-check
instead of trusting the token. A role cannot be deleted while anyone holds it, or while it is the
sign-on default.

## Two-step sign-in (IAM-19)

- Authenticator apps (TOTP, SHA-1, 6 digits, 30 s). Each code works once, with one step of drift
  allowed.
- 10 recovery codes, each usable once and stored hashed.
- Five wrong codes lock the second step for 15 minutes.
- With an app set up, every first factor (password, code, Google, verification) returns
  `{ mfaRequired, mfaToken }` instead of tokens. `POST /v1/auth/mfa/verify` completes it.
- Tokens carry `amr` (`pwd`, `otp`, `google`, `sso`, plus `mfa`) and `mfr`. When `mfr` is true and
  `amr` lacks `mfa`, the shared guard refuses `MFA_PROTECTED_PERMISSIONS` (`mfa_required`) before
  any other check. `POST /v1/auth/mfa/step-up` adds `mfa` to the current session.
- An admin can only require MFA after passing it themselves.
- `PLATFORM_ADMIN_MFA_REQUIRED=true` applies the same rule to platform admins.

## SMS and WhatsApp (IAM-20)

Phone codes go through Termii when `TERMII_API_KEY` is set (`TERMII_SENDER_ID`,
`TERMII_SMS_CHANNEL=dnd|generic`). `POST /v1/auth/otp` takes `channel: "whatsapp"` for phone
numbers. Without Termii, development logs the code and production refuses phone codes rather
than logging them.

## Local development

`.env` sets `DOMAIN_VERIFY_MODE=trust` (domains verify without DNS) and `SSO_ALLOW_PRIVATE_URLS=true`
(a local fake IdP can run on 127.0.0.1). Both are refused in production. The web app's browser
tests (`dreamlab-web/e2e/enterprise.spec.ts`) run a full OIDC sign-on against such a fake IdP.
