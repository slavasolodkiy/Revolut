# Competitor Scope: Revolut Reference Analysis

**Status:** Research-only, clean-room mode. No proprietary code or assets used.
**Sources:** Public-facing web (revolut.com), App Store/Play Store listings, public press, regulatory filings.
**Confidence levels:** High (directly observed), Med (inferred from public data), Low (speculative)

---

## 1. Product Overview

| Attribute | Observed Value | Confidence |
|-----------|---------------|------------|
| Founded | 2015 (UK) | High |
| Headquarters | London, UK + Dublin, IE | High |
| Regulatory status | UK: FCA-authorised EMI; EU: Bank licence (Lithuania); AU: AUSTRAC | High |
| Primary markets | UK, EU, US, AU, NZ, JP, SG, CH, AE, IN | High |
| App platforms | iOS, Android | High |
| Web platform | revolut.com (marketing + webapp) | High |
| Revenue model | Subscription tiers (Standard/Plus/Premium/Metal/Ultra), interchange, FX spread, crypto | High |

---

## 2. Product Tiers (Observed)

| Plan | Price (GBP/month) | Key Features | Confidence |
|------|------------------|--------------|------------|
| Standard | Free | Multi-currency accounts, basic FX, virtual card | High |
| Plus | £3.99 | Priority support, travel insurance (basic) | High |
| Premium | £9.99 | Metal card, global health insurance, lounge access, priority support | High |
| Metal | £16.99 | Metal card, concierge, higher ATM limits | High |
| Ultra | £45 | Extensive insurance, Radisson rewards, ultra concierge | High |

---

## 3. Core Feature Areas (Observed)

### Personal Banking
- Multi-currency accounts (36+ currencies) — High
- Physical + virtual Visa/Mastercard — High
- SEPA instant payments, UK Faster Payments, SWIFT — High
- P2P transfers (Revolut to Revolut via phone/tag) — High
- Savings vaults — High
- Subscription management — Med
- Round-up savings — High
- Budgeting & analytics — High

### Business Banking
- Business accounts (sole trader, SME, enterprise) — High
- Team expense cards — High
- Multi-user access with permissions — High
- Bulk payments — Med
- API access (Merchant API, Open Banking) — High

### Investment/Crypto
- Stock trading (US stocks) — High
- Crypto trading (BTC, ETH, 30+ coins) — High
- Robo-advisor / Smart Savings — Med
- Commodities (Gold, Silver) — High

### Lending/Credit
- Instalment loans (select markets) — High
- Credit line (select markets) — Med
- Buy Now Pay Later — Med

### Insurance
- Travel insurance — High
- Mobile phone insurance (Premium+) — High
- Purchase protection — Med

---

## 4. Geographic Presence

| Region | Countries | Localisation | Confidence |
|--------|-----------|--------------|------------|
| Europe | UK, IE, FR, DE, ES, IT, NL, PL, PT, BE, RO, BG, SE, DK, FI, NO, CH, AT, CZ, HU, HR, SK, SI, LT, LV, EE, LU, CY, MT, GR | 24 languages | High |
| Americas | US, CA, MX, BR | EN, ES, PT | High |
| APAC | AU, NZ, JP, SG | EN, JA | High |
| MENA | AE | EN, AR | High |
| South Asia | IN | EN | High |

---

## 5. Platform Observations (Black-box)

### Web App (revolut.com)
- SPA (React-based, confirmed via source inspection of public assets) — Med
- Dark-mode primary interface — High
- Route structure: /dashboard, /accounts, /cards, /transfers, /crypto, /savings — Med (inferred from navigation)

### Mobile (iOS/Android)
- Native iOS (Swift) + Android (Kotlin) confirmed by developer profiles — Med
- Biometric authentication — High
- Push notifications — High
- QR code payments — High
- Widget support (iOS) — High

---

## 6. Hard Constraints for This Reference Build

1. No copying of Revolut code, brand names, logos, or trademarks.
2. All feature decisions based on publicly observable behavior.
3. Reference platform named "NovaPay" — distinct identity.
4. Any Revolut-specific flows are reverse-engineered from public UX observations only.
5. External APIs: only documented public APIs used; proprietary Revolut internal APIs not used.
