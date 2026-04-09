# NovaPay Reference Platform — Status

Last updated: 2026-04-09 (Sprint 3)

## Done

### Research & Architecture
- [x] Research phase: competitor scope, source index, onboarding matrix, external API integrations
- [x] Research CSVs: `countries_languages_docs_matrix.csv` (30 countries), `onboarding_matrix.csv` (24 question rows)
- [x] Architecture docs: system context, microservices catalog, risks and assumptions

### API & Code Generation
- [x] OpenAPI spec: full contract for all 9 service domains; all protected endpoints carry `security: [{BearerAuth: []}]`; `/onboarding/status` added; 400/401/403/409 error responses on onboarding routes
- [x] API codegen: React Query hooks + Zod validators regenerated after spec update; `answer` field is `zod.unknown()` (accepts any type)
- [x] TypeScript export collision resolved: `lib/api-zod/src/index.ts` only exports `./generated/api`; types barrel excluded to prevent TS2308 ambiguity

### Backend
- [x] Database schema: PostgreSQL via Drizzle ORM (9 tables across 8 domains)
- [x] Backend routes: all endpoints implemented (auth, onboarding, KYC, accounts, cards, payments, FX, notifications, dashboard)
- [x] Onboarding: secured with `requireAuth`, ownership isolation (403), explicit `defaultNextStepId` branching engine
- [x] Onboarding integrity guards (Sprint 3):
  - `INVALID_STEP_ID` (400): submitted stepId must exist in the catalogue
  - `STEP_OUT_OF_ORDER` (409): submitted stepId must equal `session.currentStepId`
  - `SESSION_COMPLETED` (409): no further steps accepted after completion
  - Ownership check is performed BEFORE body validation (correct 403 vs 400 ordering)
- [x] Branching rules: US→`us_ssn`, self_employed→`business_income`, sole_trader skips `company_docs`

### Frontend
- [x] Full React + Vite SPA with 13 pages (landing, auth, onboarding wizard, dashboard, accounts, cards, payments, FX, KYC, notifications, settings)
- [x] Auth token getter initialized synchronously (no race condition on first load)

### Scripts & Reproducibility
- [x] Root `preinstall` script replaced with cross-platform Node.js script (`scripts/preinstall.mjs`); no longer requires `sh`
- [x] API server `dev` script no longer uses `export` (not POSIX-portable); uses inline `NODE_ENV=development`
- [x] Platform scope documented in `pnpm-workspace.yaml`: Linux x64 only (Replit); Windows/macOS require WSL2 or devcontainer

### Build & Ops
- [x] `pnpm run typecheck` passes clean
- [x] `pnpm run build` passes clean; mockup-sandbox correctly skipped
- [x] Ops: `docker-compose.yml`, `Dockerfile.api`, `Dockerfile.web`, `Caddyfile`, `seed/01_seed.sql`, `env.example`
- [x] Seed data: demo user with accounts, transactions, cards, payments, notifications

### Tests (29 passing)
- [x] Auth required: 401 on every protected onboarding endpoint without a token (4 tests)
- [x] Ownership isolation: 403 cross-user, 200 correct owner (3 tests)
- [x] Integrity — INVALID_STEP_ID: non-existent stepId rejected with 400 (2 tests)
- [x] Integrity — STEP_OUT_OF_ORDER: wrong-but-valid stepId rejected with 409 (2 tests)
- [x] Integrity — SESSION_COMPLETED: completed session rejects further steps with 409 (2 tests)
- [x] Branching engine — US country branch: 4 cases
- [x] Branching engine — self-employed branch: 5 cases
- [x] Branching engine — sole trader: 4 cases
- [x] Branching engine — terminal steps: 3 cases

### CI
- [x] `.github/workflows/ci.yml`: push + PR to main → install (frozen) → typecheck → build → test

### Docs
- [x] `replit.md` route table corrected: `/api/accounts/:accountId/transactions` and `/api/cards/:cardId`
- [x] `STATUS.md` factual and complete

## In Progress

- Nothing

## Next Actions

1. Add real KYC vendor webhook handler (Onfido/Sumsub) for status updates
2. Replace simulated FX rates with live ExchangeRate-API integration
3. Add Stripe Issuing integration for card issuance
4. Add MFA (TOTP + SMS) for production auth
5. Implement double-entry ledger for financial accuracy
6. Add AML/sanctions screening
7. Add Redis for session caching and rate limiting
8. Increase test coverage: payments, FX, cards, KYC, accounts (POST/GET detail)
