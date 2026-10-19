# dreamlab-api

Dream Lab OS backend: NestJS microservices in one Nest CLI monorepo. Services talk over HTTP (through the gateway), RabbitMQ RPC, and domain events published from a transactional outbox.

Everything runs on **theafricandreamlab.com**: organisations at `<slug>.theafricandreamlab.com`, the API at `api.theafricandreamlab.com`.

## Layout

```
apps/
  gateway/   public edge: tenant from host/origin, token check, rate limits, routing, aggregated Swagger
  iam/       identity and access: accounts, Google sign-in, OTP, sessions, tokens (EdDSA + JWKS),
             organisations, memberships, roles, org units, groups, invitations
libs/
  auth/       token verification, global guards, @Public / @RequirePermission / @CurrentPrincipal, RPC authz client
  common/     error shape, Redis, rate limiter, ids, HTTP + Swagger bootstrap
  config/     Zod-validated environment, .env loading
  database/   Drizzle per service, two pools (RLS app role + system role), migrations, ltree/citext
  health/     /health with dependency checks
  logger/     pino with request ids and redaction
  messaging/  RabbitMQ topology, outbox writer + relay, inbox (exactly-once effect), event envelope
  testing/    Testcontainers global setup and request helpers
```

Inside an app, code is grouped per feature under `src/modules/<feature>/`:

```
<feature>.module.ts       Nest module: what the feature declares, imports and exports
<feature>.controller.ts   main controller        controllers/   any further controllers (incl. RabbitMQ RPC)
<feature>.service.ts      main service           services/      any further services
dto/                      one file per request/response topic, each a createZodDto(...) of a @dreamlab/contracts schema
entities/                 Drizzle tables, one table per *.entity.ts (IAM's database/schema.ts gathers them)
interfaces/  utils/  providers/   types, pure helpers and pluggable implementations used only by that feature
```

IAM's features are `auth`, `users`, `keys`, `otp`, `notifications`, `authz`, `organizations`, `members`, `invitations`, `org-structure`, `me` and `seed`; cross-feature helpers live in `src/common/` (request-meta decorator, row→response mappers, shared DTOs) and `src/database/` (schema barrel, column helpers, migrations). The gateway's are `proxy`, `tenancy` and `docs`.

Rules enforced by lint: an app imports only from `libs/`, never another app; libraries never import apps. Each service owns its own database (`dreamlab_<service>`), with three roles: `<svc>_owner` (migrations), `<svc>_app` (row-level security enforced) and `<svc>_system` (BYPASSRLS, for deliberate cross-tenant work).

Request and response shapes come from [`@dreamlab/contracts`](https://github.com/TheAfricanDreamLab/dreamlab-contracts), pinned to an exact tag.

## Run it locally

Requirements: Node 24+, pnpm 10, Docker.

```sh
pnpm install
cp .env.example .env      # then fill in IAM_KEY_ENCRYPTION_SECRET, INTERNAL_GATEWAY_TOKEN, BOOTSTRAP_ADMIN_PASSWORD
pnpm dev                  # docker compose up + iam (3001) + gateway (3000), watch mode
```

- API docs (all services): http://localhost:3000/docs
- Health: http://localhost:3000/health
- RabbitMQ console: http://localhost:15672 (dreamlab / dreamlab)
- Postgres: `localhost:5433` (host port 5433, so it does not clash with a local Postgres)

On first boot IAM applies migrations, seeds the system roles, the platform organisation, the demo organisations `dreamlab` and `acme` (when `SEED_DEMO_ORGS=true`), and the bootstrap platform admin from `.env`.

Without an email provider configured, one-time codes and invitation links are printed in the IAM log. Set `RESEND_API_KEY` or `ZEPTOMAIL_TOKEN` to send real email. Set `GOOGLE_CLIENT_IDS` to enable Google sign-in.

### Sign-up flows

| Who | How |
| --- | --- |
| Individual learner | `POST /v1/auth/register` (email or phone) → code → `POST /v1/auth/verify`, or `POST /v1/auth/google`. No organisation needed. |
| Enterprise | A verified user calls `POST /v1/orgs/signup` with `kind: enterprise`; live at once, the caller is org admin. |
| Institution, content partner, sponsor | Same call; the organisation is `pending` (set-up only) until a platform admin approves it with `PATCH /v1/orgs/{orgId}` `{"status":"active"}`. |
| Members | Org admins invite by email or phone; the invitee accepts with `POST /v1/invitations/accept`. |

### Tenants locally

Browsers and curl resolve `*.localhost` to your machine, so `http://dreamlab.localhost:3000/v1/...` addresses the `dreamlab` organisation. In development you can also send `X-Tenant: dreamlab` (Swagger, curl).

### Try it

```sh
# individual sign-up (no organisation needed)
curl -s localhost:3000/v1/auth/register -H 'content-type: application/json' \
  -d '{"email":"ada@example.com","password":"correct horse battery","fullName":"Ada Obi","consent":{"termsVersion":"1","privacyVersion":"1"}}'
# the six-digit code is in the IAM log
curl -s localhost:3000/v1/auth/verify -H 'content-type: application/json' -d '{"identifier":"ada@example.com","code":"123456"}'
```

## Commands

| Command | What it does |
| --- | --- |
| `pnpm dev` | Dependencies in Docker, services in watch mode |
| `pnpm build` | Build every service to `dist/apps/<service>` |
| `pnpm lint` / `pnpm typecheck` | ESLint (with service-boundary rules) / TypeScript |
| `pnpm test` | Unit tests |
| `pnpm test:e2e` | End-to-end tests against real Postgres, Redis and RabbitMQ (Testcontainers; Docker required) |
| `pnpm iam:migrate` / `pnpm iam:seed` / `pnpm iam:rotate-keys` | IAM operations |
| `pnpm iam:generate` | Generate a migration from schema changes |
| `pnpm run license-check` | Fail on any dependency outside the licence allowlist |
| `docker build --build-arg APP=iam .` | Production image for one service |

## Licence

Apache-2.0. Dream Score™, DBPI™ and DSI™ are marks of the African Dream Network and are not licensed by this repository.
