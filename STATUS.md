# NovaPay Reference Platform — Status

Last updated: 2026-04-09

## Done

- [x] Research phase: competitor scope, source index, onboarding matrix, external API integrations
- [x] Architecture docs: system context, microservices catalog, risks and assumptions
- [x] OpenAPI spec: full contract for all 9 service domains (auth, onboarding, KYC, accounts, cards, payments, FX, notifications, dashboard)
- [x] API codegen: React Query hooks + Zod validators generated from spec
- [x] Database schema: PostgreSQL via Drizzle ORM (9 tables across 8 domains)
- [x] Backend routes: all endpoints implemented (auth, onboarding, KYC, accounts, cards, payments, FX, notifications, dashboard)
- [x] Frontend: full React + Vite SPA with 12 pages (landing, auth, onboarding wizard, dashboard, accounts, cards, payments, FX, KYC, notifications, settings)
- [x] Seed data: demo user with accounts, transactions, cards, payments, notifications
- [x] Ops: docker-compose, env.example

## In Progress

- [ ] Integration stubs: KYC vendor, payments rail, email/SMS webhook handlers
- [ ] CI pipeline: GitHub Actions workflow

## Blocked

- Nothing currently blocked

## Next Actions

1. Add real KYC vendor webhook handler (Onfido/Sumsub) for status updates
2. Replace simulated FX rates with live ExchangeRate-API integration
3. Add Stripe Issuing integration for card issuance
4. Add MFA (TOTP + SMS) for production auth
5. Implement double-entry ledger for financial accuracy
6. Add AML/sanctions screening
7. Set up CI/CD pipeline (GitHub Actions)
8. Add Redis for session caching and rate limiting
