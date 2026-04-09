# Risks and Assumptions

## Assumptions

| ID | Assumption | Confidence | Impact if Wrong |
|----|-----------|------------|-----------------|
| A001 | Revolut uses React for web frontend (inferred from public asset inspection) | Med | Low — our reference build is independent |
| A002 | FX rates are simulated in-process; real implementation uses external rate API | High | High in production — real rates required |
| A003 | KYC vendor is Onfido or Sumsub (inferred from job postings and partnerships) | Med | Low — stubs are vendor-agnostic |
| A004 | Card issuing uses Stripe Issuing or Marqeta (industry standard for fintechs) | Med | Med — procurement changes implementation |
| A005 | Session tokens are sufficient auth for this reference; production requires MFA | High | High — MFA is industry requirement |
| A006 | All 36 currencies use the same ledger model (multi-currency accounts) | High | Low — standard practice |
| A007 | Business onboarding requires company registration documents for all entity types | Med | Med — sole traders may have lighter requirements |

---

## Risks

### Security Risks

| ID | Risk | Severity | Mitigation |
|----|------|----------|------------|
| R001 | Password hashing uses SHA-256 (reference only) — NOT production-safe | Critical | Use bcrypt/argon2 in production |
| R002 | No rate limiting on auth endpoints | High | Add express-rate-limit middleware |
| R003 | No CSRF protection | High | Add CSRF tokens for form submissions |
| R004 | Session tokens stored in localStorage (XSS vulnerable) | High | Use HttpOnly cookies in production |
| R005 | No input sanitization beyond Zod validation | Med | Add sanitization middleware |
| R006 | KYC documents stored as base64 strings (not secure) | High | Use encrypted object storage (S3/GCS) |

### Compliance Risks

| ID | Risk | Severity | Mitigation |
|----|------|----------|------------|
| R007 | AML/CFT screening not implemented | Critical | Integrate ComplyAdvantage or equivalent |
| R008 | No sanctions screening | Critical | Screen against OFAC, UN, EU sanctions lists |
| R009 | PEP (Politically Exposed Person) checks missing | High | Add to KYC orchestrator |
| R010 | No transaction monitoring rules | Critical | Rule engine + SAR filing capability required |
| R011 | GDPR data retention policies not implemented | High | Add data deletion flows |

### Operational Risks

| ID | Risk | Severity | Mitigation |
|----|------|----------|------------|
| R012 | Single Express process — no horizontal scaling | Med | Split into microservices with load balancer |
| R013 | No message queue for async operations | Med | Add RabbitMQ or Kafka for payment events |
| R014 | In-memory FX rate simulation drifts from reality | Low | Replace with real rate API in production |
| R015 | No database connection pooling tuning | Med | Configure PgBouncer for production |
| R016 | No audit log for financial operations | High | Add immutable audit log table |

### Architecture Risks

| ID | Risk | Severity | Mitigation |
|----|------|----------|------------|
| R017 | Monolithic router structure limits independent deployment | Med | Extract to microservices per service catalog |
| R018 | No event sourcing — balance updates are direct mutations | High | Implement double-entry ledger for financial accuracy |
| R019 | No circuit breaker for external API calls | Med | Add circuit breaker (opossum or similar) |
| R020 | No idempotency keys for payment endpoints | High | Add idempotency middleware for POST /payments |
