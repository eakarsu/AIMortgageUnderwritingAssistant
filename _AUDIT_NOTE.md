# Audit Note — AIMortgageUnderwritingAssistant

Source audit: `_AUDIT/reports/batch_05.md` § 27 (verdict: **substantive**, 25 AI endpoints, 23 frontend pages)

## Original audit recommendations

### Missing AI endpoints
- `/asset-verification`
- `/employment-verification`
- `/title-risk-assessment`
- `/closing-readiness`

### Missing non-AI features
- E-signature integration
- Title company integration
- Appraisal order management
- Third-party ordering
- Automatic document request
- Borrower portal
- Pricing engine

### Custom feature suggestions
- Agentic underwriting assistant
- Vision-based document intelligence
- Autonomous loan pipeline orchestration
- Real-time fraud detection
- Borrower engagement agent
- Pricing & product optimization

## Implemented in this pass
**Backlog-only.** Per audit-apply policy ("substantive projects → backlog-only"). The project already has 25 AI endpoints covering credit risk, income verification, property valuation, fraud detection, document analysis, DTI, eligibility, compliance, underwriting decision, risk scoring, market analysis, fees, borrower profile, appraisal review, conditions, audit anomaly, pipeline optimizer, rule suggestion, product advisor, notification intelligence, workload analysis, insurance requirements, comparable sales, rate lock advisory, and portfolio risk.

The audit's "missing" endpoints overlap with several existing ones (e.g. `/asset-verification` overlaps with `/document-analysis`, `/employment-verification` overlaps with `/income-verification`). A duplicate-check is required before adding mechanical endpoints.

## Backlog (priority order)

### Mechanical (after duplicate-check vs existing 25 endpoints)
- `/title-risk-assessment` — least overlap with existing endpoints; safe candidate for next pass
- `/closing-readiness` — orchestration over existing condition + document checks
- `/asset-verification` — likely overlaps with `/document-analysis`; PM call
- `/employment-verification` — likely overlaps with `/income-verification`; PM call

### Needs creds / external SDK
- E-signature (DocuSign, Adobe Sign)
- Title company integrations (multiple regional vendors)
- Appraisal order management (AMC APIs)
- Borrower portal (frontend scope)

### Needs product decision
- Pricing engine (rate sheet ingestion, discount points logic)
- Automatic document request (template + escalation policy)
- Third-party ordering coordination (vendor selection rules)

## Apply pass 3 (frontend)

FE already comprehensive. `client/src/pages/AICenter.jsx` is a 25-tool AI hub covering every existing AI endpoint (credit-risk, income-verification, dti-analysis, fraud-detection, underwriting-decision, etc.) with category grouping, sample presets per tool, and form-based inputs. No frontend changes this pass — backlog items are still backend/credentials work.

## Apply pass 4 (mechanical backlog)

Two least-overlapping mechanical backlog items implemented:

1. `POST /api/ai/title-risk-assessment` — title risk, liens, encumbrances, required endorsements (uses `properties` + `loan_applications`).
2. `POST /api/ai/closing-readiness` — outstanding-conditions analysis with ready-to-close score (uses `loan_applications` + best-effort joins on `conditions` and `documents`).

Reuse existing `callAI` + `parseAIJson` + `pool` + `authenticateToken` + `aiRateLimiter`. New `requireKey()` helper returns **503** when `OPENROUTER_API_KEY` is unset.

`/asset-verification` and `/employment-verification` left in backlog because the audit explicitly notes they overlap with existing `/document-analysis` and `/income-verification` (NEEDS-PRODUCT-DECISION on dedup).

FE: two new tool cards added to `client/src/pages/AICenter.jsx` (now 27 tools) with quick-load presets. Existing borrower / property / application dropdowns automatically supply the payload fields. JWT bearer via existing `client/src/api.js`.

Files touched:
- `server/routes/ai.js`
- `client/src/pages/AICenter.jsx`

Syntax check: `node --check` (BE) PASS; Babel JSX parse (FE) PASS.

Smoke test: server started on 3777, `admin@mortgage.com / password123` -> JWT -> `POST /api/ai/title-risk-assessment {property_id:1,application_id:1}` -> 200 with structured `analysis` (title risks, required endorsements, summary).

## Apply pass 5 (all backlog)

Two additive endpoints (both **NEEDS-PRODUCT-DECISION** — overlap with existing endpoints, decision documented inline):

1. `POST /api/ai/asset-verification` — focused ONLY on liquid-asset verification (down-payment sufficiency, reserves, large-deposit sourcing). `// PRODUCT-DECISION:` comment notes overlap with `/document-analysis` and explicitly scopes the new endpoint.
2. `POST /api/ai/employment-verification` — focused ONLY on employment status / VOE / tenure / 4506-T need (NOT income calculation, which stays with `/income-verification`). `// PRODUCT-DECISION:` comment documents the split.

Both reuse existing `callAI` + `parseAIJson` + `pool` + `requireKey` pattern. `requireKey()` returns **503** when `OPENROUTER_API_KEY` is unset.

Files touched:
- `server/routes/ai.js`

Syntax check: `node --check` PASS.

Smoke test: backend booted on port 3001, `admin@mortgage.com / password123` → JWT issued. `POST /api/ai/asset-verification {borrower_id:1,assets:[...]}` → **200** with structured `analysis` (verified_total_usd, sufficient_for_down_payment, asset_breakdown, etc.). `POST /api/ai/employment-verification {borrower_id:1,voe_text:"..."}` → **200** with structured `analysis` (employment_verified, tenure_years, voe_concerns, etc.).
