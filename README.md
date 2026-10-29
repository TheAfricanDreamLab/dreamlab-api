# dreamlab-api

Dream Lab OS backend: NestJS microservices in one Nest CLI monorepo. Services talk over HTTP (through the gateway), RabbitMQ RPC, and domain events published from a transactional outbox.

Everything runs on **theafricandreamlab.com**: organisations at `<slug>.theafricandreamlab.com`, the API at `api.theafricandreamlab.com`.

## Layout

```
apps/
  gateway/   public edge: tenant from host/origin, token check, rate limits, routing, aggregated Swagger
  iam/       identity and access: accounts, Google sign-in, OTP, sessions, tokens (EdDSA + JWKS),
             organisations, memberships, roles, org units, groups, invitations
  catalog/   courses, versions, programmes, the public catalogue, course authoring (drafts, review),
             course media uploads, instructor profiles and course staff
  learning/  enrolments, the course player, submissions and files, cohorts, attendance, grading,
             Programme Score, class-session reminders, live classes (LiveKit rooms, recordings,
             attendance from join/leave webhooks), mentorship and Dream Circles; enrols people
             admissions admitted
  notify/    notifications: one per person (in the app), email by category preference; fed by
             `notification.requested` events from any service
  admissions/ admission cycles and the ten-stage application pipeline: applicant stages, reviews
             with DBPI/DSI, optional AI-assisted evaluations (Claude, stored immutably), interviews,
             scholarships and human decisions; publishes `applicant.admitted`
libs/
  auth/       token verification, global guards, @Public / @RequirePermission / @CurrentPrincipal, RPC authz client
  common/     error shape, Redis, rate limiter, ids, HTTP + Swagger bootstrap
  config/     Zod-validated environment, .env loading
  database/   Drizzle per service, two pools (RLS app role + system role), migrations, ltree/citext
  email/      email providers (Resend, ZeptoMail, console in development), shared by iam and notify
  health/     /health with dependency checks
  logger/     pino with request ids and redaction
  meet-kit/   live rooms behind one interface (LiveKit adapter: self-hosted or LiveKit Cloud by settings)
  messaging/  RabbitMQ topology, outbox writer + relay, inbox (exactly-once effect), event envelope,
              requestNotification (ask notify to tell people something, in the caller's transaction)
  rpc/        RabbitMQ RPC patterns and clients between services (catalog content, IAM names, contacts,
              permission holders)
  storage/    Azure Blob Storage (Azurite locally): write-only upload links, private read links
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

Rules enforced by lint: an app imports only from `libs/`, never another app; libraries never import apps. Each service owns its own database (`dreamlab_<service>`), with three roles: `<svc>_owner` (migrations), `<svc>_app` (row-level security enforced) and `<svc>_system` (deliberate cross-tenant work). On Azure the system role cannot hold BYPASSRLS, so every
RLS table also gets an explicit `TO <svc>_system` policy in a migration; `libs/database/src/system-policies.spec.ts`
fails when one is missing. The e2e suites run the system roles without BYPASSRLS, as on Azure.

Request and response shapes come from [`@dreamlab/contracts`](https://github.com/TheAfricanDreamLab/dreamlab-contracts), pinned to an exact tag.

## Run it locally

Requirements: Node 24+, pnpm 10, Docker.

```sh
pnpm install
cp .env.example .env      # then fill in IAM_KEY_ENCRYPTION_SECRET, INTERNAL_GATEWAY_TOKEN, BOOTSTRAP_ADMIN_PASSWORD
pnpm dev                  # docker compose up + every service in watch mode
```

| Service | Port | | Dependency (docker compose) | Port |
|---|---|---|---|---|
| gateway | 3000 | | Postgres | 5433 |
| iam | 3001 | | Redis | 6379 |
| catalog | 3002 | | RabbitMQ | 5672 (console 15672) |
| learning | 3003 | | Azurite (Blob Storage) | 10000 |
| notify | 3004 | | LiveKit (live classes) | 7880 (media 7881/tcp, 7882/udp) |
| admissions | 3005 | | | |

A database created before a service existed (for example `dreamlab_notify`) is not added by
`docker/postgres/init.sql` to an existing volume: run that service's block of `init.sql` with
`docker compose exec -T postgres psql -U postgres`, or recreate the volume. In development, catalog
and learning create the Azurite containers and their CORS rule on boot.

Live classes use the LiveKit server in `docker-compose.yml` (development keys in
`docker/livekit/livekit.yaml`; its webhooks reach learning on the host at port 3003). Without the
`LIVEKIT_*` settings, joining a class answers 503 and everything else works. AI-assisted admissions
evaluations need `ANTHROPIC_API_KEY`; without it that one action answers 503 and reviews stay
human-only.

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
| `pnpm test:e2e` | End-to-end tests against real Postgres, Redis, RabbitMQ and Azurite (Testcontainers; Docker required) |
| `pnpm iam:migrate` / `pnpm iam:seed` / `pnpm iam:rotate-keys` | IAM operations |
| `pnpm iam:generate` | Generate a migration from schema changes |
| `pnpm <svc>:migrate` / `pnpm <svc>:generate` | The same for catalog, learning, notify and admissions (`catalog:seed` loads test content) |
| `pnpm run license-check` | Fail on any dependency outside the licence allowlist |
| `docker build --build-arg APP=iam .` | Production image for one service |

## Licence

Apache-2.0. Dream Score™, DBPI™ and DSI™ are marks of the African Dream Network and are not licensed by this repository.
