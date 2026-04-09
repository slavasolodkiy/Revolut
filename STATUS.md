# NovaPay Reference Platform — Status

Last updated: 2026-04-09

## Done

- [x] Research phase: competitor scope, source index, onboarding matrix, external API integrations
- [x] Research CSVs: `countries_languages_docs_matrix.csv` (30 countries), `onboarding_matrix.csv` (24 question rows with branching, validation, docs columns)
- [x] Architecture docs: system context, microservices catalog, risks and assumptions
- [x] OpenAPI spec: full contract for all 9 service domains (auth, onboarding, KYC, accounts, cards, payments, FX, notifications, dashboard)
- [x] API codegen: React Query hooks + Zod validators generated from spec
- [x] Database schema: PostgreSQL via Drizzle ORM (9 tables across 8 domains)
- [x] Backend routes: all endpoints implemented (auth, onboarding, KYC, accounts, cards, payments, FX, notifications, dashboard)
- [x] Onboarding: secured with `requireAuth`, ownership isolation (403), explicit `defaultNextStepId` branching engine
- [x] Branching rules: US→`us_ssn`, self_employed→`business_income`, sole_trader skips `company_docs`
- [x] Frontend: full React + Vite SPA with 13 pages (landing, auth, onboarding wizard, dashboard, accounts, cards, payments, FX, KYC, notifications, settings)
- [x] Auth token getter initialized synchronously (no race condition on first load)
- [x] TypeScript: clean typecheck across all packages (`pnpm run typecheck`)
- [x] Build: clean across all packages; mockup-sandbox correctly skipped as dev-only (`pnpm run build`)
- [x] Seed data: demo user with accounts, transactions, cards, payments, notifications
- [x] Ops: `docker-compose.yml`, `Dockerfile.api`, `Dockerfile.web`, `Caddyfile`, `seed/01_seed.sql`, `env.example`
- [x] Tests: 23 Vitest tests covering 401 auth-required, 403 ownership isolation, and all branching paths
- [x] CI: GitHub Actions workflow (`.github/workflows/ci.yml`) — typecheck → build → test

## In Progress

- Nothing currently in progress

## Next Actions

1. Add real KYC vendor webhook handler (Onfido/Sumsub) for status updates
2. Replace simulated FX rates with live ExchangeRate-API integration
3. Add Stripe Issuing integration for card issuance
4. Add MFA (TOTP + SMS) for production auth
5. Implement double-entry ledger for financial accuracy
6. Add AML/sanctions screening
7. Add Redis for session caching and rate limiting
8. Increase test coverage: payments, FX conversion, card freeze/unfreeze, KYC submission
