# NovaPay Reference Platform — Status

Last updated: 2026-04-09 (Sprint 4)

## Done

### Research & Architecture
- [x] Research phase: competitor scope, source index, onboarding matrix, external API integrations
- [x] Research CSVs: `countries_languages_docs_matrix.csv` (30 countries), `onboarding_matrix.csv` (24 question rows)
- [x] Architecture docs: system context, microservices catalog, risks and assumptions

### API & Code Generation
- [x] OpenAPI spec: full contract for all 9 service domains; `BearerAuth` on all protected endpoints; `/onboarding/status` added; 400/401/403/409 error responses documented
- [x] API codegen: React Query hooks + Zod validators; `answer` field is `zod.unknown()` (accepts any type)
- [x] TypeScript export collision resolved: `lib/api-zod/src/index.ts` exports only `./generated/api`

### Backend
- [x] Database schema: PostgreSQL via Drizzle ORM (9 tables)
- [x] All routes implemented (auth, onboarding, KYC, accounts, cards, payments, FX, notifications, dashboard)
- [x] Onboarding integrity guards enforced in this order: auth → params → session lookup → ownership (403) → SESSION_COMPLETED (409) → body parse → INVALID_STEP_ID (400) → STEP_OUT_OF_ORDER (409) → execute
- [x] Branching: US→`us_ssn`, self_employed→`business_income`, sole_trader skips `company_docs`

### Frontend
- [x] React + Vite SPA, 13 pages (landing, auth, onboarding wizard, dashboard, accounts, cards, payments, FX, KYC, notifications, settings)
- [x] Auth token getter initialized synchronously on app load

### Scripts & Reproducibility
- [x] Root `preinstall` is cross-platform Node.js (`scripts/preinstall.mjs`) — no `sh`/`export` dependency
- [x] API server `dev` script uses `cross-env NODE_ENV=development` — works on Windows and Linux
- [x] API server `build`/`test`/`typecheck` scripts: pure Node/pnpm, no shell-specific syntax

### Build & Ops
- [x] `pnpm run typecheck` passes clean (all 4 packages)
- [x] `pnpm run build` passes clean (api-server, fintech-platform; mockup-sandbox skipped in CI)
- [x] Ops: `docker-compose.yml`, `Dockerfile.api`, `Dockerfile.web`, `Caddyfile`, seed SQL, env.example

### Platform Support (Sprint 4)
- [x] **Linux x64** (Replit + ubuntu-latest CI): all native binaries present in lockfile; verified locally
- [x] **Windows x64** (windows-latest CI): win32-x64 exclusions removed from `pnpm-workspace.yaml`; `@esbuild/win32-x64`, `@rollup/rollup-win32-x64-gnu`, `lightningcss-win32-x64-msvc`, `@tailwindcss/oxide-win32-x64-msvc` now in lockfile; will be downloaded on Windows runners
- [ ] macOS (darwin) — excluded from lockfile; use Docker or devcontainer
- [ ] Windows ARM64 / ia32 — excluded from lockfile

### CI (Sprint 4)
- [x] `.github/workflows/ci.yml` exists at repo root
- [x] Triggers on push + pull_request to main
- [x] Matrix: `ubuntu-latest` AND `windows-latest` (`fail-fast: false`)
- [x] Steps: checkout → pnpm@10 setup → Node 24 → `pnpm install --frozen-lockfile` → typecheck → build → test
- [x] Lockfile updated to include win32-x64 native binaries so `--frozen-lockfile` works on Windows

### Tests (30 passing — Sprint 4)
- [x] Auth required: 401 on every protected endpoint without token (4 tests)
- [x] Ownership isolation: 403 cross-user, 200 correct owner (3 tests)
- [x] Integrity — INVALID_STEP_ID: non-existent stepId → 400 (2 tests)
- [x] Integrity — STEP_OUT_OF_ORDER: wrong-but-valid stepId → exact 409 + STEP_OUT_OF_ORDER (2 tests)
  - "review jump" now asserts exact 409, not `[400, 409]` (Sprint 4 fix)
- [x] Integrity — STEP_OUT_OF_ORDER: re-submit after transition → 409 (1 new test, Sprint 4)
- [x] Integrity — SESSION_COMPLETED: completed session → 409 (2 tests)
- [x] Branching engine — US country branch (4 tests)
- [x] Branching engine — self-employed branch (5 tests)
- [x] Branching engine — sole trader (4 tests)
- [x] Branching engine — terminal steps (3 tests)

### Docs
- [x] `replit.md` test count correct (30), CI section accurate, Platform Support section added
- [x] `STATUS.md` factual and complete (this file)

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
9. Add macOS support to CI (darwin native binaries to lockfile + add to matrix)
