# @nzila/mobility-core

Foundational type library for the NzilaOS mobility vertical. Defines canonical domain enums, Zod schemas, and TypeScript types used across all mobility packages and applications.

## Domain context

The mobility vertical serves immigration advisory firms managing citizenship-by-investment, residency-by-investment, golden visa, and related programmes. This package is the single source of truth for shared domain vocabulary.

## Public API surface

### Enums — `@nzila/mobility-core/enums`

| Enum | Values |
|---|---|
| `CaseStatus` | `draft`, `intake`, `kyc_pending`, `aml_screening`, `document_verification`, `compliance_review`, `approved`, `submitted`, `processing`, `granted`, `rejected`, `withdrawn`, `archived` |
| `CaseStage` | `pre_engagement`, `onboarding`, `due_diligence`, `application_prep`, `government_submission`, `adjudication`, `post_approval`, `maintenance` |
| `ProgramType` | `citizenship_by_investment`, `residency_by_investment`, `golden_visa`, `startup_visa`, `retirement_visa`, `digital_nomad` |
| `InvestmentType` | `real_estate`, `government_bonds`, `national_fund`, `business_investment`, `bank_deposit`, `donation` |
| `WealthTier` | `standard`, `hnw`, `uhnw` |
| `RiskProfile` | `low`, `medium`, `high`, `critical` |
| `FamilyRelation` | `spouse`, `child`, `parent`, `sibling`, `dependent` |
| `DocumentType` | `passport`, `birth_certificate`, `bank_statement`, `police_clearance`, etc. |
| `MessageType` | `case_status`, `document_request`, `appointment_scheduling`, `renewal_reminder`, `general` |

### Schemas — `@nzila/mobility-core/schemas`

Zod schemas for API boundary validation corresponding to each domain entity (cases, clients, tasks, documents, compliance events).

### Types — `@nzila/mobility-core/types`

TypeScript interfaces inferred from Zod schemas: `Case`, `Client`, `FamilyMember`, `Task`, `Document`, `ComplianceEvent`, etc.

## Dependencies

- `zod` — Runtime schema validation

## Example usage

```ts
import { CaseStatus, CASE_STATUSES } from '@nzila/mobility-core'
import { caseSchema } from '@nzila/mobility-core/schemas'

const status: CaseStatus = 'kyc_pending'
const parsed = caseSchema.parse(rawInput)
```

## Downstream consumers

- `@nzila/mobility-case-engine` — Case lifecycle state machine
- `@nzila/mobility-family` — Family graph and timeline
- `@nzila/mobility-programs` — Programme eligibility
- `@nzila/integrations-hubspot` — Stage mapping
- `@nzila/integrations-whatsapp` — Message types
- `apps/mobility`, `apps/mobility-client-portal`

## Maturity

Production-grade — Stable domain vocabulary. Zero runtime dependencies beyond Zod. No tests (pure types and schemas).
