# NovaPay — Revolut-Inspired Fintech Reference Platform

## Overview

Full-stack fintech reference platform built as a Revolut clean-room study. Includes research docs, architecture docs, a React+Vite frontend, Express backend, PostgreSQL database with 9 tables, OpenAPI spec, auto-generated hooks/schemas, and ops setup.

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
- **Build**: esbuild (CJS bundle for API)

## Project Structure

```
artifacts/
  api-server/          → Express API server (all backend routes)
  fintech-platform/    → React+Vite frontend (12 pages)
  mockup-sandbox/      → Design component sandbox
lib/
  api-spec/            → OpenAPI 3.1 spec (9 domains)
  api-client-react/    → Generated React Query hooks + Zod schemas
  api-zod/             → Generated Zod validation schemas
  db/                  → Drizzle schema + db client
research/              → Competitor analysis, feature matrix, API catalog
architecture/          → System context, microservices catalog, risks
product/integrations-stubs/  → KYC, payments rail, notifications stubs
ops/                   → Docker Compose, env.example
```

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
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
3. `onboarding_sessions` — multi-step onboarding wizard state
4. `accounts` — multi-currency accounts (GBP, EUR, USD, savings)
5. `transactions` — transaction history per account
6. `cards` — virtual and physical card records
7. `payments` — outbound payments (SEPA, Faster Payments, SWIFT)
8. `notifications` — user notification inbox
9. `kyc_checks` — KYC verification checks

## API Routes (all at /api)

- `POST /api/auth/register` — register new user
- `POST /api/auth/login` — login, returns session token
- `POST /api/auth/logout` — revoke session
- `GET /api/auth/me` — get current user
- `GET /api/accounts` — list accounts
- `POST /api/accounts` — create account
- `GET /api/accounts/:accountId` — get account
- `GET /api/transactions/:accountId` — list transactions
- `GET /api/cards` — list cards
- `POST /api/cards` — issue card
- `PATCH /api/cards/:cardId/freeze` — freeze/unfreeze card
- `GET /api/payments` — list payments
- `POST /api/payments` — initiate payment
- `GET /api/fx/rates` — get FX rates
- `POST /api/fx/convert` — convert currency
- `GET /api/notifications` — list notifications
- `PATCH /api/notifications/:id/read` — mark as read
- `GET /api/kyc/status` — get KYC status
- `POST /api/kyc/submit` — submit KYC documents
- `GET /api/dashboard/summary` — dashboard aggregated stats
- `GET /api/onboarding/status` — onboarding step status
- `POST /api/onboarding/step` — advance onboarding step

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
4. `/onboarding` — Multi-step KYC onboarding wizard
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

Frontend proxies `/api/*` to `http://localhost:8080` in development.

## Research & Architecture Docs

- `research/competitor_scope.md` — Revolut competitive feature analysis
- `research/external_api_integrations.md` — KYC, payments, notification API catalog
- `research/onboarding_matrix.md` — Onboarding flow by market
- `research/web_app_feature_matrix.csv` — Feature matrix by tier/country
- `architecture/system-context.md` — C4 system context diagram
- `architecture/microservices-catalog.md` — Service boundaries and contracts
- `architecture/risks-and-assumptions.md` — Risk register
- `product/integrations-stubs/` — KYC, payments rail, notifications stubs
- `ops/docker-compose.yml` — Docker Compose for local dev
- `ops/env.example` — Environment variable template
