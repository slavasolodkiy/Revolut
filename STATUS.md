# NovaPay Reference Platform — Status

Last updated: 2026-04-09 (Sprint 4.1)

## Done

### Research & Architecture
- [x] Competitor scope, source index, onboarding matrix, external API integrations
- [x] `countries_languages_docs_matrix.csv` (30 countries), `onboarding_matrix.csv` (24 question rows)
- [x] Architecture docs: system context, microservices catalog, risks and assumptions

### API & Code Generation
- [x] OpenAPI spec: 9 service domains; `BearerAuth` on all protected endpoints; `/onboarding/status` added; error responses documented
- [x] API codegen (Orval): React Query hooks + Zod validators; `answer` field is `zod.unknown()`
- [x] TypeScript export collision resolved: `lib/api-zod/src/index.ts` exports only `./generated/api`

### Backend
- [x] PostgreSQL + Drizzle ORM schema (9 tables)
- [x] All routes implemented (auth, onboarding, KYC, accounts, cards, payments, FX, notifications, dashboard)
- [x] Onboarding integrity guards (order enforced): auth → params → session lookup → ownership (403) → SESSION_COMPLETED (409) → body parse → INVALID_STEP_ID (400) → STEP_OUT_OF_ORDER (409) → execute
- [x] Branching: US→`us_ssn`, self_employed→`business_income`, sole_trader skips `company_docs`

### Frontend
- [x] React + Vite SPA, 13 pages
- [x] Auth token getter initialized synchronously on app load

### Scripts & Reproducibility
- [x] Root `preinstall`: cross-platform Node.js (`scripts/preinstall.mjs`) — no `sh`/`export` dependency
- [x] API server `dev` script uses `cross-env NODE_ENV=development` — works on Windows and Linux
- [x] `scripts/verify-ci-presence.mjs`: anti-regression guard — fails if `.github/workflows/ci.yml` is missing or the CI YAML lacks ubuntu+windows in its matrix

### CI (Sprint 4.1 — file verified on disk)

File: `.github/workflows/ci.yml` — confirmed present at repo root.

| Property | Value |
|---|---|
| Trigger | push + pull_request to `main` |
| Matrix | `ubuntu-latest`, `windows-latest` (fail-fast: false) |
| Steps | checkout → pnpm@10 → Node 24 → `pnpm install --frozen-lockfile` → verify-ci-presence → typecheck → build → test |

### Platform Support
- **Linux x64** (`ubuntu-latest`): primary Replit deployment target; all native binaries in lockfile
- **Windows x64** (`windows-latest`): `@esbuild/win32-x64`, `@rollup/rollup-win32-x64-gnu`, `lightningcss-win32-x64-msvc`, `@tailwindcss/oxide-win32-x64-msvc` in lockfile
- **macOS** (darwin): not CI-verified; binaries excluded from lockfile — use Docker or devcontainer
- **Windows ARM64 / ia32**: excluded from lockfile

### Build Quality (all locally verified)
- [x] `node scripts/verify-ci-presence.mjs` — passes
- [x] `pnpm run typecheck` — 0 errors (4 packages)
- [x] `pnpm run build` — all packages pass
- [x] `pnpm --filter @workspace/api-server run test` — 30/30 tests pass

### Tests (30 passing)
- Auth required: 401 without token (4 tests)
- Ownership isolation: 403 cross-user, 200 correct owner (3 tests)
- Integrity — INVALID_STEP_ID: non-existent stepId → 400 (2 tests)
- Integrity — STEP_OUT_OF_ORDER: wrong-but-valid stepId → exact 409 + STEP_OUT_OF_ORDER (2 tests)
- Integrity — STEP_OUT_OF_ORDER: re-submit after transition → 409 (1 test)
- Integrity — SESSION_COMPLETED: completed session → 409 (2 tests)
- Branching — US country branch (4 tests)
- Branching — self-employed branch (5 tests)
- Branching — sole trader / company_docs skip (4 tests)
- Branching — terminal steps (3 tests)

### Ops / Docs
- [x] `docker-compose.yml`, `Dockerfile.api`, `Dockerfile.web`, `Caddyfile`, seed SQL, `env.example`
- [x] `replit.md` and `STATUS.md` contain no false CI claims

## In Progress

- Nothing

## Next Actions

1. Real KYC vendor webhook handler (Onfido/Sumsub)
2. Live FX rates (ExchangeRate-API)
3. Stripe Issuing integration for card issuance
4. MFA (TOTP + SMS)
5. Double-entry ledger
6. AML/sanctions screening
7. Redis for session caching + rate limiting
8. Expand test coverage: payments, FX, cards, KYC, accounts
9. macOS CI support (add darwin binaries to lockfile + matrix)
