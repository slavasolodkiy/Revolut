# Microservices Catalog

In this reference implementation, all services are co-located in a single Express server.
In production, each domain would be split into its own microservice.

## Services

### 1. Auth Service (`/api/auth/*`)

| Attribute | Value |
|-----------|-------|
| Responsibility | User registration, login, session management |
| Data owned | users, sessions tables |
| API endpoints | POST /register, POST /login, POST /logout, GET /me |
| Auth required | No (register/login), Yes (logout/me) |
| External deps | bcrypt (hashing), session store |
| Production scaling | Stateless; session tokens allow horizontal scaling |
| KV store | sessions table (or Redis in production) |

### 2. Onboarding Service (`/api/onboarding/*`)

| Attribute | Value |
|-----------|-------|
| Responsibility | Step-by-step onboarding wizard, branching logic |
| Data owned | onboarding_sessions table |
| API endpoints | POST /start, GET /session/:id, POST /session/:id/step, GET /steps |
| External deps | None (KYC submission via KYC Service) |
| Production scaling | Stateless; sessions in DB |

### 3. KYC Orchestrator (`/api/kyc/*`)

| Attribute | Value |
|-----------|-------|
| Responsibility | Document collection, third-party KYC vendor integration, status tracking |
| Data owned | kyc_checks table |
| API endpoints | GET /status, POST /submit, GET /checks |
| External deps | Onfido / Sumsub (webhook listener for status updates) |
| Production notes | Webhook endpoint needed for vendor callbacks |

### 4. Accounts Service (`/api/accounts/*`)

| Attribute | Value |
|-----------|-------|
| Responsibility | Multi-currency account management, balance tracking |
| Data owned | accounts, transactions tables |
| API endpoints | GET/POST /accounts, GET /accounts/:id, GET /accounts/:id/transactions |
| External deps | FX Service (for cross-currency balance conversion) |
| Production notes | Double-entry ledger recommended; IBAN/account number provisioning via banking partner |

### 5. Cards Service (`/api/cards/*`)

| Attribute | Value |
|-----------|-------|
| Responsibility | Virtual and physical card issuance, freeze/unfreeze, limits |
| Data owned | cards table |
| API endpoints | GET/POST /cards, GET/PATCH /cards/:id |
| External deps | Card issuing processor (Stripe Issuing / Marqeta) |
| Production notes | Card PANs stored encrypted; PCI DSS compliance required |

### 6. Payments Service (`/api/payments/*`)

| Attribute | Value |
|-----------|-------|
| Responsibility | Payment initiation, routing, status tracking |
| Data owned | payments, transactions tables |
| API endpoints | GET/POST /payments, GET /payments/:id |
| External deps | Modulr (UK/SEPA), SWIFT gateway, internal ledger |
| Production notes | Idempotency keys required; audit log essential |

### 7. FX Service (`/api/fx/*`)

| Attribute | Value |
|-----------|-------|
| Responsibility | Exchange rate quotes, currency conversion, history |
| Data owned | No persistent data (rate data cached) |
| API endpoints | GET /fx/rates, POST /fx/convert, GET /fx/history |
| External deps | ExchangeRate-API, Wise Rates, or internal rate engine |
| Production notes | Rates cached (TTL: 60s); spread applied on conversion |

### 8. Notifications Service (`/api/notifications/*`)

| Attribute | Value |
|-----------|-------|
| Responsibility | In-app notifications, email/SMS/push dispatch |
| Data owned | notifications table |
| API endpoints | GET /notifications, PATCH /:id/read, POST /read-all |
| External deps | SendGrid (email), Twilio (SMS), Firebase FCM (push) |
| Production notes | Event-driven (pub/sub); async dispatch |

### 9. Dashboard Service (`/api/dashboard/*`)

| Attribute | Value |
|-----------|-------|
| Responsibility | Aggregated dashboard data (summary, activity, spending breakdown) |
| Data owned | Read-only aggregation across accounts/transactions |
| API endpoints | GET /summary, GET /recent-activity, GET /spending-breakdown |
| External deps | Accounts Service, Payments Service |
| Production notes | Heavy read; consider materialized views or caching layer |
