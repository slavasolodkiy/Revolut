# External API Integrations Reference

This document covers publicly available external APIs relevant to a Revolut-like fintech platform.
All APIs are documented from public sources only.

---

## 1. Identity Verification (KYC)

### Onfido
- **Docs:** https://documentation.onfido.com
- **Auth model:** API key (Bearer token)
- **Key endpoints:** `/applicants`, `/documents`, `/live_photos`, `/checks`
- **Flow:** Create applicant → upload documents/selfie → trigger check → webhook result
- **Onboarding relevance:** Identity verification step, liveness check
- **Pricing:** Per-check basis, tiered
- **Status:** Public API, documented
- **Confidence:** High

### Sumsub (Sum and Substance)
- **Docs:** https://developers.sumsub.com
- **Auth model:** HMAC-signed requests (API key + secret)
- **Key endpoints:** `/resources/applicants`, `/resources/checks`, `/resources/sdkIntegrations`
- **Onboarding relevance:** Identity + address verification, sanctions screening
- **Status:** Public API
- **Confidence:** High

### Jumio
- **Docs:** https://jumio.com/developer
- **Auth model:** OAuth 2.0 client credentials
- **Onboarding relevance:** Document verification, biometric face match
- **Status:** Partially public (requires account for full docs)
- **Confidence:** Med

---

## 2. Payments Rails

### Stripe (Card issuing + payments)
- **Docs:** https://stripe.com/docs
- **Auth model:** API key (Bearer), Restricted keys for specific endpoints
- **Key capabilities:** Card issuing (virtual/physical), transfers, payouts
- **Relevant products:** Stripe Issuing, Stripe Connect, Stripe Treasury
- **Scopes:** Not OAuth-based; permission-based restricted keys
- **Status:** Public API
- **Confidence:** High

### Modulr (UK/EU payments)
- **Docs:** https://modulr.readme.io/
- **Auth model:** API key + HMAC signature
- **Key capabilities:** UK Faster Payments, SEPA Instant, BACS, CHAPS
- **Onboarding relevance:** Account provisioning, sort code/IBAN assignment
- **Status:** Public API (partner access required for production)
- **Confidence:** Med

### Banking Circle (Cross-border payments)
- **Docs:** https://developer.bankingcircle.com
- **Auth model:** OAuth 2.0 (client credentials)
- **Key capabilities:** SWIFT, SEPA, local payments, FX
- **Confidence:** Med

---

## 3. Open Banking

### UK Open Banking (OBIE)
- **Docs:** https://openbankinguk.github.io/opendata-api-docs-pub/
- **Auth model:** OAuth 2.0 + FAPI (Financial-grade API) + mTLS
- **Scopes:** `accounts`, `payments`, `funds-confirmation`
- **Onboarding relevance:** AIS (account info), PIS (payment initiation)
- **Status:** Standard (public)
- **Confidence:** High

### Plaid (US/EU account linking)
- **Docs:** https://plaid.com/docs
- **Auth model:** OAuth 2.0 + client_id/secret
- **Scopes:** `transactions`, `auth`, `identity`, `balance`
- **Onboarding relevance:** Bank account verification, income verification
- **Status:** Public API
- **Confidence:** High

### TrueLayer (EU Open Banking aggregator)
- **Docs:** https://docs.truelayer.com
- **Auth model:** OAuth 2.0 PKCE
- **Onboarding relevance:** Account verification, bank statement retrieval
- **Status:** Public API
- **Confidence:** High

---

## 4. Foreign Exchange

### ExchangeRate-API (Free/commercial)
- **Docs:** https://www.exchangerate-api.com/docs
- **Auth model:** API key (query param)
- **Key endpoints:** `/v6/{key}/latest/{base}`, `/v6/{key}/pair/{from}/{to}`, `/v6/{key}/history/{base}/{year}/{month}/{day}`
- **Limits:** Free: 1,500 req/month; Paid: higher limits
- **Status:** Public API
- **Confidence:** High

### Open Exchange Rates
- **Docs:** https://docs.openexchangerates.org
- **Auth model:** API key (`app_id`)
- **Status:** Public API
- **Confidence:** High

### Wise Rates API
- **Docs:** https://docs.wise.com/api-docs/api-reference/rate
- **Auth model:** API key
- **Onboarding relevance:** Live interbank rates with fee modeling
- **Status:** Public (rate endpoint is public)
- **Confidence:** High

---

## 5. Communications (Email/SMS/Push)

### Twilio (SMS)
- **Docs:** https://www.twilio.com/docs/sms
- **Auth model:** Basic auth (AccountSID:AuthToken) or API keys
- **Onboarding relevance:** Phone verification OTP
- **Status:** Public API
- **Confidence:** High

### SendGrid (Email)
- **Docs:** https://docs.sendgrid.com/api-reference
- **Auth model:** API key (Bearer)
- **Onboarding relevance:** Welcome emails, verification emails, KYC updates
- **Status:** Public API
- **Confidence:** High

### Firebase Cloud Messaging (Push)
- **Docs:** https://firebase.google.com/docs/cloud-messaging
- **Auth model:** OAuth 2.0 service account
- **Onboarding relevance:** Transaction alerts, KYC status push notifications
- **Status:** Public API
- **Confidence:** High

---

## 6. Sanctions & AML Screening

### ComplyAdvantage
- **Docs:** https://docs.complyadvantage.com
- **Auth model:** API key
- **Capabilities:** PEP/sanctions screening, adverse media
- **Status:** Public API (requires account)
- **Confidence:** Med

### Refinitiv World-Check
- **Status:** Not publicly documented — enterprise contract required
- **Confidence:** Low (inferred from industry standard)

---

## 7. Analytics & Fraud

### Mixpanel (Analytics)
- **Docs:** https://developer.mixpanel.com
- **Auth model:** Project token + secret
- **Status:** Public API
- **Confidence:** High

### Sift (Fraud detection)
- **Docs:** https://sift.com/developers/docs
- **Auth model:** API key
- **Status:** Public API
- **Confidence:** Med

---

## 8. SSO / Authentication

### Apple Sign-In
- **Docs:** https://developer.apple.com/sign-in-with-apple/
- **Auth model:** OAuth 2.0 / OpenID Connect
- **Scopes:** `name`, `email`
- **Onboarding relevance:** Mobile SSO option
- **Status:** Public
- **Confidence:** High

### Google Sign-In
- **Docs:** https://developers.google.com/identity/protocols/oauth2
- **Auth model:** OAuth 2.0 / OpenID Connect
- **Scopes:** `openid`, `email`, `profile`
- **Status:** Public
- **Confidence:** High

---

## APIs NOT Public or Unclear

| API | Notes | Confidence |
|-----|-------|------------|
| Revolut Internal Ledger API | Not public — proprietary | High (confirmed not public) |
| Revolut Card Issuing Backend | Proprietary — uses third-party processor | Med |
| Revolut Compliance Engine | Proprietary rule engine | High (confirmed not public) |
| Mastercard/Visa Direct APIs | Available to licensed FIs only — not public | High |
| SWIFT GPI | Available to member banks only | High |
| Target2 / RTGS | Available to ECB member banks only | High |
