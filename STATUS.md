# NovaPay Reference Platform — Status

Last updated: 2026-04-09 (Sprint 4.1 — no-CI alignment)

## CI Policy

**GitHub Actions CI is intentionally absent.** Replit→GitHub sync does not include the
`workflow` permission scope needed to push `.github/workflows/` files. No workflow file
exists in this repository. See `docs/engineering/no-ci-policy.md`.

Local verification replaces CI:

```sh
pnpm run verify      # docs consistency check
pnpm run typecheck   # 0 errors
pnpm run build       # all packages
pnpm --filter @workspace/api-server run test  # 30/30
```

## Done

### Research & Architecture
- [x] Competitor scope, source index, onboarding matrix, external API integrations
- [x] `countries_languages_docs_matrix.csv` (30 countries), `onboarding_matrix.csv` (24 rows)
- [x] Architecture docs: system context, microservices catalog, risks and assumptions

### API & Code Generation
- [x] OpenAPI spec: 9 service domains; `BearerAuth` on all protected endpoints; error responses documented
- [x] Codegen (Orval): React Query hooks + Zod validators; `answer` field is `zod.unknown()`
- [x] TypeScript export collision resolved: `lib/api-zod/src/index.ts` exports only `./generated/api`

### Backend
- [x] PostgreSQL + Drizzle ORM schema (9 tables)
- [x] All routes implemented: auth, onboarding, KYC, accounts, cards, payments, FX, notifications, dashboard
- [x] Onboarding integrity guards (enforced in order): auth → params → session → ownership (403) → SESSION_COMPLETED (409) → body → INVALID_STEP_ID (400) → STEP_OUT_OF_ORDER (409) → execute
- [x] Branching engine: US→`us_ssn`, self_employed→`business_income`, sole_trader skips `company_docs`

### Frontend
- [x] React + Vite SPA, 13 pages
- [x] Auth token getter initialized synchronously on app load

### Scripts & Reproducibility
- [x] Root `preinstall`: cross-platform Node.js — no `sh`/`export` dependency
- [x] API server `dev` uses `cross-env NODE_ENV=development` — works on Windows and Linux
- [x] `scripts/verify-repo-consistency.mjs`: checks docs don't falsely claim CI is present
- [x] `docs/engineering/no-ci-policy.md`: rationale for no `.github/workflows/`, known limitation, local verification steps

### Build Quality (locally verified on Linux x64 / Replit)
- [x] `pnpm run verify` — passes (no doc contradictions)
- [x] `pnpm run typecheck` — 0 errors (4 packages)
- [x] `pnpm run build` — all packages pass
- [x] `pnpm --filter @workspace/api-server run test` — 30/30

### Tests (30 passing)
- Auth required: 401 without token (4)
- Ownership isolation: 403 cross-user, 200 correct owner (3)
- Integrity — INVALID_STEP_ID: non-existent stepId → 400 (2)
- Integrity — STEP_OUT_OF_ORDER: wrong-but-valid stepId → exact 409 (2)
- Integrity — STEP_OUT_OF_ORDER: re-submit after transition → exact 409 (1)
- Integrity — SESSION_COMPLETED: completed session → 409 (2)
- Branching — US country branch (4)
- Branching — self-employed branch (5)
- Branching — sole trader / company_docs skip (4)
- Branching — terminal steps (3)

### Platform Support
| Platform | Status | Notes |
|---|---|---|
| Linux x64 (Replit) | Verified locally | Primary deployment target |
| Windows x64 | Lockfile ready | win32-x64 binaries in lockfile |
| macOS (darwin) | Not supported | Binaries excluded from lockfile |
| Windows ARM64 / ia32 | Not supported | Excluded |
| Linux non-x64 | Not supported | Excluded |

### Ops / Docs
- [x] `docker-compose.yml`, `Dockerfile.api`, `Dockerfile.web`, `Caddyfile`, seed SQL, `env.example`
- [x] `replit.md` and `STATUS.md` contain no false CI claims

## In Progress

- Nothing

## Next Actions

1. Real KYC vendor webhook (Onfido/Sumsub)
2. Live FX rates (ExchangeRate-API)
3. Stripe Issuing for card issuance
4. MFA (TOTP + SMS)
5. Double-entry ledger
6. AML/sanctions screening
7. Redis for session caching + rate limiting
8. Expand test coverage: payments, FX, cards, KYC, accounts
