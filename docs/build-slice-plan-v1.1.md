# BUILD SLICE PLAN v1.1

Supersedes: Build Slice Plan v1.0 where the two disagree. Sections of v1.0 not mentioned here still hold.
Date: 19 October 2026 · Owner: Ukeme (`ukemeikot`) · Org: `TheAfricanDreamLab`
Inputs: Starter ERD v0.1 (`dreamlab-api/docs/erd/`), planning decisions of 19 October 2026.

---

## 1. What changed since v1.0

| # | Decision (19 Oct 2026) | Replaces |
|---|---|---|
| D1 | **Product scope: a Coursera-style platform.** Organisations (institutions, enterprises, content partners, sponsors) are tenants; a shared catalog plus private org content; individuals (B2C) sign up and learn with **no organisation**. The African Dream Lab's 100-credit cohort programme is one program type with optional academy features. | Plan v1.1 §3.3 (fixed pedagogy, no marketplace) and §8 (`institutions` data model) |
| D2 | **Backend: microservices** in one Nest CLI monorepo inside `dreamlab-api` (`apps/*` + `libs/*`), one container per service. | v1.0 §3.2 and Plan §6.1 (modular monolith) |
| D3 | **Async messaging: RabbitMQ** (topic exchange `dreamlab.events`), fed by a transactional outbox; consumers dedupe through an inbox. Sync calls: HTTP via the gateway, RabbitMQ RPC between services. | Plan §6.1 (BullMQ) |
| D4 | **Auth built in-house** in the IAM service: argon2id, OTP, EdDSA JWTs + JWKS, rotating refresh tokens with reuse detection. No Keycloak / Ory. | — |
| D5 | **Database per service** (`dreamlab_<svc>`), each with owner / app (RLS) / system (BYPASSRLS) roles. | Plan §6.2 (one shared schema) |
| D6 | **Google sign-up and sign-in** for individuals. | — |
| D7 | **Email through Resend or ZeptoMail**, chosen by which credentials are configured. SMS waits for notify-hub (Termii). | — |
| D8 | **Domain: theafricandreamlab.com.** Tenants at `<slug>.theafricandreamlab.com`, API at `api.theafricandreamlab.com`; the gateway takes the tenant from the Host or the browser Origin. | Plan §6.2 placeholder domain |
| D9 | **Contracts are consumed as git tags** (`github:TheAfricanDreamLab/dreamlab-contracts#vX.Y.Z`) until an npm token exists. | v1.0 §2.1 (npm publish) |
| D11 | **Self-service organisation sign-up.** Any verified user can create an organisation and becomes its admin. Enterprises go live at once; institutions, partners and sponsors stay `pending` (set-up only) until a platform admin approves them. | Platform-admin-only creation |
| D12 | **Authorship unchanged.** Commits, PRs and merge commits are authored as Ukeme only: no co-author trailers or tool credits (v1.0 "Authorship" holds). | — |
| D10 | **Pinned majors:** Nest 11, Zod 3.25, TypeScript 5.9. Nest 12 is ESM-only and the Zod/OpenAPI bridge (`nestjs-zod`) and `ts-rest` do not yet support Nest 12 / Zod 4; upgrading is a hardening slice. | — |

## 2. Services

| Service | Owns (ERD v0.1 §) | Status |
|---|---|---|
| `gateway` | Nothing persistent. Tenant resolution, edge token check, rate limits, routing, aggregated Swagger | **P0 — built** |
| `iam` | Users, identities, sessions, consent, signing keys, organisations + profiles, domains, SSO, SCIM, MFA, org units, groups, memberships, invitations, roles (incl. custom), role assignments (§4, §13 credits later) | **P0 + enterprise identity — built** |
| `catalog` | Courses → versions → modules → items, programs, collections, listings, instructor profiles and credits (§5, §6, §13) | **P2 — CAT-1/2 built** |
| `learning` | Cohorts, runs, sessions, enrollments, progress, submissions, grades, attendance, assigned learning (§6, §7, §9) | **P2 — LRN-1 built** (self-paced; cohorts next) |
| `commerce` | Offers, orders, payments, subscriptions, contracts, seats, sponsorships, access grants (§8) | After Cohort 04 starts |
| `credentials`, `academy`, `community`, `notifications`, `media`, `meetings`, `reporting` | §10, §11, reviews / Q&A, Plan v1.1 packages | P4+ |
| `credsyncd` | Sync engine (separate Rust binary, `credsync` repo) | M0–M4 done |

## 3. P0 slices (current state)

All in milestone **P0 - Foundations**. Issue numbers are in each repo.

| Slice | Repo | Issue | Status |
|---|---|---|---|
| CT-1 + CT-2 — contracts bootstrap, auth + directory contracts | contracts | #1 | Done — `v0.1.0` |
| — Google sign-in route | contracts | PR #3 | Done — `v0.2.0` |
| — Organisation self sign-up, `pending` status | contracts | PR #4 | Done — `v0.3.0` |
| API-1 — Nest monorepo (gateway + iam) | api | #3 | Done (merged) |
| API-2 — shared libs: config, logging, database, health | api | #4 | Done (merged) |
| API-3 — local stack + Testcontainers harness | api | #5 | Done (merged) |
| API-4 — messaging: envelope, outbox relay, inbox | api | #6 | Done (merged) |
| IAM-1 — identity schema | api | #7 | Done (merged) |
| IAM-2 — directory schema + seed | api | #8 | Done (merged) |
| IAM-3 — tenant isolation (RLS) | api | #9 | Done (merged) |
| IAM-4 — registration + OTP verification | api | #10 | Done (merged) |
| IAM-5 — login, tokens, JWKS, rotating refresh | api | #11 | Done (merged) |
| IAM-6 — password reset, OTP login, lockout, audit events | api | #12 | Done (merged) |
| IAM-7 — permission catalog + effective permissions | api | #13 | Done (merged) |
| IAM-8 — org switching + personal context | api | #14 | Done (merged) |
| IAM-9 — libs/auth guards, decorators, RPC authz client | api | #15 | Done (merged) |
| IAM-10 — directory APIs | api | #16 | Done (merged) |
| **IAM-11 — Google sign-up / sign-in** [NEW] | api | #18 | Done (merged) |
| **IAM-12 — email through Resend / ZeptoMail** [NEW] | api | #19 | Done (merged) |
| **IAM-13 — self-service organisation sign-up with approval** [NEW] | api | #20 | Done (merged) |
| GW-1 — gateway | api | #17 | Done (merged) |
| **SEC-1 — security hardening pass on P0** [NEW] | api | #21 | Done (merged) |
| INF-1 (revised) — deploy gateway + iam stack | infra | #1 | Done — on Azure (staging + prod, auto-deploy), not Dokploy / Hetzner / Cloudflare |
| INF-2 (revised) — backups + restore drill per database | infra | #2 | Deferred until before real learner data (test phase, 19 Oct 2026) |
| API-5 — curriculum seed as program data (ERD §6) | api | — | Done as CAT-2 (staging test data) |
| API-6 — R2 presigned upload / download | api | to open | Moves to the media service |

Removed from v1.0 P0: API-2 as `institutions` / `institution_members` (replaced by IAM-1/2/3).

## 4. Enterprise identity slices (IAM-14..20)

Brought forward from "after Cohort 04 starts" on 19 Oct 2026. Contracts `v0.6.0`. Admin guide: [enterprise-identity.md](enterprise-identity.md).

| Slice | Scope | Status |
|---|---|---|
| IAM-14 | Email domains: claim, DNS TXT verification, join policy (none / request / auto), joinable orgs, join requests | Done — live on staging and prod |
| IAM-15 | OIDC single sign-on per organisation (code flow + PKCE, state, nonce), test, enable, enforce | Done — live on staging and prod |
| IAM-16 | SAML 2.0 single sign-on per organisation (SP-initiated, signed assertions, InResponseTo), SP metadata | Done — live on staging and prod |
| IAM-17 | SCIM 2.0 provisioning: Users and Groups, bearer token per organisation | Done — live on staging and prod |
| IAM-18 | Enterprise custom roles (no platform permissions), live permission changes | Done — live on staging and prod |
| IAM-19 | Authenticator-app MFA (TOTP, recovery codes, step-up); organisations can require it for admin permissions | Done — live on staging and prod |
| IAM-20 | SMS and WhatsApp codes through Termii (notify-hub can replace the sender later) | Done — live on staging and prod |

## 5. P2 slices: catalog, learning, platform admin (20 Oct 2026)

Contracts `v0.7.0`. Guide for authors and platform admins: [catalog-and-learning.md](catalog-and-learning.md).

| Slice | Scope | Status |
|---|---|---|
| CAT-1 | Catalog service: courses → versions → modules → items, assessments + questions, assignment specs + rubrics, listings, programmes (phases, elective groups, capstone stages, graduation requirements, template calendar); RLS per owner organisation; public catalog, course and programme pages; RPC content for learning | Built |
| CAT-2 | Test content on **staging only** (`CATALOG_SEED=dream-lab-test`): The African Dream Lab programme (100 credits, 15 weeks), the full Problem Solving course (5 modules, 26 items), the other 12 courses as outlines. Production starts empty | Built |
| LRN-1 | Learning service: enrolment (free / org-private), pinned versions, item progress, server-checked interactive blocks (answers never reach the browser), quizzes with attempts, versioned assignment submissions, discussions visible after posting, journal; RLS per learner, submissions and grades append-only | Built |
| PLT-1 | Platform admin console: overview, people search / detail / suspend (ends sessions) / reactivate, catalog listing and featuring, course and programme import (how production courses are provisioned), learning statistics | Built |
| WEB-L1 | Web: catalog, course and programme pages, Brilliant-style course player, my learning, journal, admin console | Built |
| INF-3 | Deploy catalog + learning (database per service, Key Vault settings, staging auto-deploy). Free Trial quota: they share the site VM until the subscription is upgraded (`var.service_hosts`) | Built |
| CAT-3 | Course authoring in the browser (drafts, review, publish) for platform admins and organisation authors | Next |
| LRN-2 | Cohorts, course runs, calendar weeks, class sessions, attendance (ERD §6–7) | Next |

Additions to ERD v0.1, recorded for v0.2: item type `lesson` (interactive steps) alongside `quiz`, `assignment`, `discussion`; `program_calendar_weeks` (template copied into each cohort's `calendar_weeks`); `catalog_listings.featured`; `course_enrollments.access_source` until commerce issues access grants.

## 6. Gates (v1.0 §4, updated)

1. **Seam gate.** No consumer slice before its contract is tagged. Contracts version bump rules unchanged (v1.0 §2.1).
2. **Design gate.** Unchanged.
3. **Security gate [NEW].** SEC-1 passes before INF-1 deploys anything reachable from the internet. Each later slice gets the same review before merge.
4. **credSync gates.** Unchanged; credSync scopes change to (org, program_enrollment), (org, course_enrollment) and (course_version) per ERD v0.1 §12.

## 7. Open questions carried forward

ERD v0.1 §14 (ten questions), plus:

- Termii onboarding for SMS OTP (Plan §18 lead time) — still to start.
- Which Google Cloud project owns the OAuth client ids (web, Android, iOS) for theafricandreamlab.com.
- Resend vs ZeptoMail for production, and the verified sending domain (SPF / DKIM on theafricandreamlab.com).
