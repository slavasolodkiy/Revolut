# System Context Diagram

## NovaPay Reference Platform — System Context

```
                           ┌─────────────────────────────────┐
                           │         External Users           │
                           │  (Consumers, Business Owners)    │
                           └──────────────┬──────────────────┘
                                          │
                              Web Browser / Mobile App
                                          │
                           ┌─────────────▼──────────────────┐
                           │        NovaPay Frontend          │
                           │     (React + Vite SPA)           │
                           │   Routes: /, /dashboard,         │
                           │   /accounts, /cards, /fx, etc.   │
                           └─────────────┬──────────────────┘
                                         │ HTTPS REST/JSON
                                         │
                           ┌─────────────▼──────────────────┐
                           │        API Gateway               │
                           │  (Express 5, /api prefix)        │
                           │  Auth middleware, CORS,           │
                           │  Rate limiting, Logging           │
                           └───┬─────┬────┬────┬────┬───────┘
                               │     │    │    │    │
          ┌────────────────────┘     │    │    │    └──────────────────┐
          │                          │    │    │                       │
   ┌──────▼──────┐        ┌──────────▼─┐  │  ┌▼────────────┐  ┌──────▼──────┐
   │  Auth &     │        │ Onboarding │  │  │  Accounts   │  │  Payments   │
   │  Sessions   │        │  & KYC     │  │  │  & Cards    │  │  & FX       │
   └──────┬──────┘        └──────┬─────┘  │  └─────┬───────┘  └──────┬──────┘
          │                      │        │         │                  │
          └──────────────────────┴────────┴─────────┴──────────────────┘
                                          │
                           ┌──────────────▼─────────────────┐
                           │         PostgreSQL DB            │
                           │  (users, sessions, accounts,     │
                           │   transactions, cards, kyc,      │
                           │   payments, notifications)       │
                           └────────────────────────────────┘

External Services (Stubs in this reference build):
  ┌─────────────────────────────────────────────────────────┐
  │  KYC: Onfido / Sumsub (stub)                           │
  │  FX Rates: ExchangeRate-API (simulated in-process)     │
  │  SMS OTP: Twilio (stub)                                │
  │  Email: SendGrid (stub)                                │
  │  Push: Firebase FCM (stub)                             │
  │  Card Issuing: Stripe Issuing (stub)                   │
  │  Payments Rail: Modulr / Stripe (stub)                 │
  └─────────────────────────────────────────────────────────┘
```

## Key Flows

### Authentication Flow
1. User registers (POST /api/auth/register) → session token created
2. Token stored in localStorage (client), sent as `Authorization: Bearer <token>` on every request
3. Backend validates token against sessions table on each protected request
4. Session expires after 30 days

### Onboarding Flow
1. Client calls POST /api/onboarding/start → creates session
2. For each step: POST /api/onboarding/session/:id/step → returns next step
3. Branching logic handled server-side based on answers
4. On completion: session marked completed, user ready for KYC

### KYC Flow
1. User submits documents via POST /api/kyc/submit
2. Server creates identity + address + liveness check records
3. In production: webhook from KYC vendor updates check status
4. User status updated: not_started → in_review → approved/rejected

### Payment Flow
1. Client initiates POST /api/payments → validates balance, deducts account, creates payment + transaction
2. In production: payment forwarded to rail (Stripe/Modulr/SWIFT)
3. Webhook updates payment status to completed/failed
