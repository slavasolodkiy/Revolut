# NovaPay — Revolut-Inspired Fintech Reference Platform

## Overview

Full-stack fintech reference platform built as a Revolut clean-room study. Includes research docs, architecture docs, a React+Vite frontend, Express backend, PostgreSQL database with 9 tables, OpenAPI spec, auto-generated hooks/schemas, ops setup, automated tests, and GitHub Actions CI.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5 (port 8080)
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec at `lib/api-spec/openapi.yaml`)
- **Frontend**: React + Vite (port 21975), Tailwind CSS, shadcn/ui, Radix UI, Recharts
- **Auth**: SHA-256 bearer token sessions stored in PostgreSQL
- **Testing**: Vitest + Supertest (API integration + unit tests)
- **CI**: GitHub Actions (`.github/workflows/ci.yml`)
- **Build**: esbuild (CJS bundle for API)

## Project Structure

```
artifacts/
  api-server/          → Express API server (all backend routes + tests)
  fintech-platform/    → React+Vite frontend (13 pages)
  mockup-sandbox/      → Design component sandbox (dev only, excluded from build)
lib/
  api-spec/            → OpenAPI 3.1 spec (9 domains)
  api-client-react/    → Generated React Query hooks + Zod schemas
  api-zod/             → Generated Zod validation schemas
  db/                  → Drizzle schema + db client
research/              → Competitor analysis, feature matrix, API catalog, CSV matrices
architecture/          → System context, microservices catalog, risks
product/integrations-stubs/  → KYC, payments rail, notifications stubs
ops/                   → Docker Compose, Dockerfiles, Caddy config, seed SQL, env.example
.github/workflows/     → GitHub Actions CI pipeline
```

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages (mockup-sandbox skipped)
- `pnpm --filter @workspace/api-server run test` — run API unit + integration tests
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally
- `pnpm --filter @workspace/fintech-platform run dev` — run frontend locally

## Demo Credentials

- **Email**: `demo@novapay.example.com`
- **Passcode**: `demo1234`
- **User ID**: `a1b2c3d4-e5f6-7890-abcd-ef1234567890`

## Database Schema (9 Tables)

1. `users` — user accounts, KYC status, onboarding status
2. `sessions` — bearer token sessions (30-day expiry)
3. `onboarding_sessions` — multi-step onboarding wizard state (branching)
4. `accounts` — multi-currency accounts (GBP, EUR, USD, savings)
5. `transactions` — transaction history per account
6. `cards` — virtual and physical card records
7. `payments` — outbound payments (SEPA, Faster Payments, SWIFT)
8. `notifications` — user notification inbox
9. `kyc_checks` — KYC verification checks

## API Routes (all at /api)

**Auth**
- `POST /api/auth/register` — register new user
- `POST /api/auth/login` — login, returns session token
- `POST /api/auth/logout` — revoke session
- `GET /api/auth/me` — get current user

**Onboarding** (all except /steps require Bearer token)
- `GET /api/onboarding/steps` — step catalogue (personal/business)
- `POST /api/onboarding/start` — create new session
- `GET /api/onboarding/session/:id` — get session (owner only)
- `POST /api/onboarding/session/:id/step` — advance step (owner only, branching engine)
- `GET /api/onboarding/status` — get user's onboarding status

**Accounts / Transactions**
- `GET /api/accounts`, `POST /api/accounts`, `GET /api/accounts/:accountId`
- `GET /api/accounts/:accountId/transactions`

**Cards**
- `GET /api/cards`, `POST /api/cards`
- `GET /api/cards/:cardId`, `PATCH /api/cards/:cardId`

**Payments**
- `GET /api/payments`, `POST /api/payments`

**FX**
- `GET /api/fx/rates`, `POST /api/fx/convert`

**Notifications**
- `GET /api/notifications`, `PATCH /api/notifications/:id/read`

**KYC**
- `GET /api/kyc/status`, `POST /api/kyc/submit`

**Dashboard**
- `GET /api/dashboard/summary`

## Onboarding Branching Engine

The onboarding wizard uses an explicit `defaultNextStepId` per step (not array-position fallback) so branching is unambiguous:

| Current step | Answer | Next step |
|---|---|---|
| `address_country` | `"US"` | `us_ssn` |
| `address_country` | any other | `employment_status` |
| `employment_status` | `"self_employed"` | `business_income` |
| `employment_status` | any other | `income_source` |
| `business_type` | `"sole_trader"` | `director_details` (skips `company_docs`) |
| `business_type` | any other | `business_country` |

## Auth Architecture

- Password hash: SHA-256 (password + "salt_novapay")
- Session token: random hex, stored in `sessions` table
- Client: Bearer token in `Authorization` header (set via `setAuthTokenGetter`)
- Token stored in `localStorage["nova_session"]`
- Token getter initialized synchronously from localStorage on app load

## Frontend Pages

1. `/` — Landing page
2. `/login` — Login
3. `/register` — Registration
4. `/onboarding` — Multi-step KYC onboarding wizard (branching)
5. `/dashboard` — Balance overview, recent transactions, spending chart
6. `/accounts` — Account list with multi-currency pockets
7. `/accounts/:id` — Account detail + transaction history
8. `/cards` — Card management (virtual + physical)
9. `/payments` — Payment history + new payment flow
10. `/fx` — Currency exchange with live rates + chart
11. `/kyc` — KYC status and document upload
12. `/notifications` — Notification inbox
13. `/settings` — Account settings

## Vite Proxy

Frontend proxies `/api/*` to `http://localhost:8080` in development. Both PORT and BASE_PATH default safely so `vite build` works without environment variables set.

## Tests

API-level tests live in `artifacts/api-server/src/__tests__/`:

- **Auth required** — 401 on all protected onboarding endpoints without a token (4 tests)
- **Ownership isolation** — 403 when a second user accesses another user's session (3 tests)
- **Branching engine — US country branch** — 4 cases including GB/DE linear fallback
- **Branching engine — self-employed branch** — 5 cases
- **Branching engine — sole trader** — 4 cases including skipping `company_docs`
- **Terminal steps** — 3 edge cases (`review`, unknown stepId)

Total: **30 tests**, all passing via `vitest`.

Integrity guards enforce exact error codes:
- `INVALID_STEP_ID` (400): stepId not in step catalogue
- `STEP_OUT_OF_ORDER` (409): valid stepId but ≠ `session.currentStepId`; "review jump" asserts exact 409
- `SESSION_COMPLETED` (409): no further steps accepted after session completes
- Re-submit: submitting a stale (already-accepted) step after session advances returns 409

## CI

`.github/workflows/ci.yml` runs on every push/PR to `main` in a matrix across two platforms:

| Matrix leg | Runner |
|---|---|
| build-and-test (ubuntu-latest) | Linux x64 |
| build-and-test (windows-latest) | Windows x64 |

Each leg:
1. `pnpm install --frozen-lockfile`
2. `pnpm run typecheck`
3. `pnpm run build`
4. `pnpm --filter @workspace/api-server run test`

## Platform Support

Verified CI targets:
- **Linux x64** (`ubuntu-latest`) — primary Replit deployment target; all native binaries included in lockfile
- **Windows x64** (`windows-latest`) — CI matrix; `@esbuild/win32-x64`, `@rollup/rollup-win32-x64-gnu`, `lightningcss-win32-x64-msvc`, `@tailwindcss/oxide-win32-x64-msvc` are included in the lockfile and will be downloaded by Windows runners

Not supported / not CI-verified:
- **macOS** (darwin-arm64, darwin-x64) — binaries excluded from lockfile to reduce size; use Docker or devcontainer
- **Windows ARM64 / ia32** — excluded from lockfile
- **Linux non-x64** (arm64, arm, etc.) — excluded from lockfile

The `dev` script in `@workspace/api-server` uses `cross-env` for cross-platform `NODE_ENV` assignment (required on Windows cmd.exe).

## Research & Architecture Docs

- `research/competitor_scope.md` — Revolut competitive feature analysis
- `research/external_api_integrations.md` — KYC, payments, notification API catalog
- `research/onboarding_matrix.md` / `.csv` — Onboarding flow by market (24 question rows)
- `research/countries_languages_docs_matrix.csv` — 30-country ID doc requirements
- `research/web_app_feature_matrix.csv` — Feature matrix by tier/country
- `architecture/system-context.md` — C4 system context diagram
- `architecture/microservices-catalog.md` — Service boundaries and contracts
- `architecture/risks-and-assumptions.md` — Risk register
- `product/integrations-stubs/` — KYC, payments rail, notifications stubs
- `ops/docker-compose.yml` — Docker Compose for local dev
- `ops/Dockerfile.api` — Multi-stage Docker build for API server
- `ops/Dockerfile.web` — Multi-stage Docker build for Vite frontend
- `ops/Caddyfile` — Reverse proxy config for production
- `ops/seed/01_seed.sql` — Demo data seed (user, accounts, transactions, cards)
- `ops/env.example` — Environment variable template
