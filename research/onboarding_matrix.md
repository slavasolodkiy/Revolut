# Onboarding Decision Tree & Matrix

Reference platform (NovaPay) onboarding flow decomposition.
Based on black-box observation of Revolut public flows and comparable fintech onboarding patterns.

---

## Personal Onboarding Flow

### Step Tree

```
START
  │
  ├─ [welcome] Welcome screen
  │     └─ NEXT → [full_name]
  │
  ├─ [full_name] First + Last name input
  │     Validation: required, min 2 chars each
  │     └─ NEXT → [date_of_birth]
  │
  ├─ [date_of_birth] Date picker
  │     Validation: required, age ≥ 18
  │     └─ NEXT → [phone_number]
  │
  ├─ [phone_number] E.164 phone input with country prefix
  │     Validation: required, valid E.164 format
  │     └─ NEXT → [phone_otp]
  │
  ├─ [phone_otp] 6-digit OTP verification
  │     Validation: required, 6 digits, matches sent OTP
  │     Errors: expired, too many attempts
  │     └─ NEXT → [address_country]
  │
  ├─ [address_country] Country of residence picker
  │     Validation: required, must be in supported country list
  │     Branching:
  │       country == US → [us_ssn]
  │       default → [employment_status]
  │
  ├─ [us_ssn] Last 4 digits of SSN (US only)
  │     Country constraint: US only
  │     └─ NEXT → [employment_status]
  │
  ├─ [employment_status] Single select
  │     Options: employed | self_employed | student | retired | unemployed
  │     Branching:
  │       self_employed → [business_income]
  │       default → [income_source]
  │
  ├─ [business_income] Business income details (self-employed only)
  │     └─ NEXT → [income_source]
  │
  ├─ [income_source] Single select
  │     Options: salary | investments | savings | benefits | other
  │     └─ NEXT → [document_type]
  │
  ├─ [document_type] ID document selection
  │     Options: passport | national_id | drivers_license
  │     Country constraints: national_id not available for all countries
  │     └─ NEXT → [document_upload]
  │
  ├─ [document_upload] Camera/file upload
  │     Required docs: front of selected document; back if national_id/drivers_license
  │     Validation: image, clarity check, not expired
  │     └─ NEXT → [selfie]
  │
  ├─ [selfie] Liveness capture
  │     Validation: face match with document, liveness score ≥ threshold
  │     └─ NEXT → [review]
  │
  └─ [review] Summary + submit
        └─ COMPLETE → KYC pending → Dashboard
```

---

## Business Onboarding Flow

### Step Tree

```
START
  │
  ├─ [welcome] Business welcome
  │     └─ NEXT → [business_name]
  │
  ├─ [business_name] Legal business name
  │     Validation: required
  │     └─ NEXT → [business_type]
  │
  ├─ [business_type] Business structure
  │     Options: sole_trader | ltd | llc | partnership | nonprofit
  │     Branching:
  │       sole_trader → skip [company_docs], go to [director_details]
  │       default → [business_country]
  │
  ├─ [business_country] Country of registration (country picker)
  │     └─ NEXT → [registration_number]
  │
  ├─ [registration_number] Companies House / registry number
  │     Validation: required, format varies by country
  │     └─ NEXT → [company_docs]
  │
  ├─ [company_docs] Document upload
  │     Required docs: certificate_of_incorporation | memorandum_of_association | articles_of_association
  │     Country constraints: varies
  │     └─ NEXT → [director_details]
  │
  ├─ [director_details] Director personal details
  │     Sub-flow: name, DOB, nationality, personal address
  │     └─ NEXT → [ubo_details]
  │
  ├─ [ubo_details] Ultimate Beneficial Owner (25%+ ownership)
  │     Branching: if multiple UBOs → repeat for each (max 4)
  │     Validation: required if company is not publicly listed
  │     └─ NEXT → [review]
  │
  └─ [review] Summary + submit
        └─ COMPLETE → KYC pending → Business dashboard
```

---

## Tabular Matrix

| question_id | screen_name | question_text | answer_type | options | validation_rules | branch_if | next_step | required_docs | country_constraints | error_states |
|-------------|-------------|---------------|-------------|---------|-----------------|-----------|-----------|---------------|---------------------|--------------|
| welcome | Welcome | Welcome to NovaPay | info | - | - | - | full_name | - | - | - |
| full_name | Your Name | What's your full name? | text | - | required, min:2 | - | date_of_birth | - | - | empty, too_short |
| date_of_birth | Date of Birth | What's your date of birth? | date | - | required, age≥18 | - | phone_number | - | - | underage, invalid_date |
| phone_number | Phone Number | What's your phone number? | phone | - | required, e164 | - | phone_otp | - | - | invalid_format, already_registered |
| phone_otp | Verify Phone | Enter the 6-digit code | otp | - | required, length:6 | - | address_country | - | - | expired, incorrect, max_attempts |
| address_country | Country of Residence | Where do you live? | country_picker | supported countries | required, supported | country==US→us_ssn | employment_status | - | must be supported | unsupported_country |
| us_ssn | SSN (Last 4) | Last 4 digits of SSN | text | - | required, digits:4 | - | employment_status | - | US only | invalid |
| employment_status | Employment | What's your employment status? | select | employed,self_employed,student,retired,unemployed | required | self_employed→business_income | income_source | - | - | - |
| business_income | Business Income | Describe your business income | text | - | required | - | income_source | - | self_employed only | - |
| income_source | Income Source | Primary source of income? | select | salary,investments,savings,benefits,other | required | - | document_type | - | - | - |
| document_type | Identity Document | Which document will you use? | select | passport,national_id,drivers_license | required | - | document_upload | depends on type | national_id not available in all markets | - |
| document_upload | Upload Document | Upload your ID document | upload | - | required, image, max:10MB | - | selfie | passport or national_id or drivers_license | - | blur, glare, expired, not_matching |
| selfie | Take a Selfie | Take a selfie for liveness | upload | - | required, face_match, liveness | - | review | selfie | - | no_face, spoof_detected, low_quality |
| review | Review | Review your details | info | - | - | - | COMPLETE | - | - | - |

---

## Unknowns (Explicitly Marked)

| Item | Status | Notes |
|------|--------|-------|
| Exact OTP timeout duration | Unknown | Common value: 5 minutes — not confirmed |
| Exact liveness score threshold | Unknown | Vendor-specific (Onfido/Sumsub) |
| Max document re-submission attempts | Unknown | Inferred: 3 attempts per check |
| US SSN handling in backend | Unknown | PII — regulatory requirement only |
| Business onboarding exact UBO threshold | Unknown | EU/UK: 25% standard — national variations exist |
| Exact countries where national_id accepted | Unknown | Inferred from EU/EEA common practice |
