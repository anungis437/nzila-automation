# @nzila/mobility-case-engine

Case lifecycle state machine for the NzilaOS mobility platform. Manages immigration case transitions from lead intake through citizenship granting and renewal monitoring.

## Domain context

Each mobility case follows a deterministic lifecycle with guard conditions at each transition (e.g. compliance must clear before program selection). This engine enforces transition rules, tracks milestones, and generates tasks appropriate to each lifecycle stage.

## Public API surface

| Export | Description |
|---|---|
| `initCase(caseId, advisorId)` | Initialize a new case at the `lead` stage |
| `canTransition(current, target)` | Check if a transition is valid, returns required guard |
| `getNextLifecycleState(current)` | Get the next valid state in the lifecycle |
| `advanceCase(state, actorId, notes?)` | Advance case to next state, record transition history |
| `addTask(state, task)` | Add a pending task to the case |
| `completeTask(state, taskType)` | Mark a task as completed |
| `addDeadline(state, deadline)` | Add a deadline with critical flag |
| `generateTasksForState(lifecycle)` | Auto-generate required tasks for a lifecycle stage |
| `CASE_LIFECYCLE` | Full lifecycle sequence (12 states) |

### Lifecycle states

`lead` → `client_intake` → `kyc_review` → `program_selection` → `document_collection` → `legal_review` → `submission_ready` → `submitted` → `government_processing` → `approved` → `citizenship_granted` → `renewal_monitoring`

### Guard conditions

| Transition | Guard |
|---|---|
| `client_intake` → `kyc_review` | `profile_complete` |
| `kyc_review` → `program_selection` | `compliance_cleared` |
| `program_selection` → `document_collection` | `program_selected` |
| `document_collection` → `legal_review` | `documents_uploaded` |
| `legal_review` → `submission_ready` | `legal_approved` |
| `submission_ready` → `submitted` | `advisor_confirmed` |
| `government_processing` → `approved` | `government_approved` |
| `approved` → `citizenship_granted` | `oath_completed` |

## Dependencies

- `@nzila/mobility-core` — `CaseStatus`, `CaseStage`, `TaskType` enums
- `@nzila/mobility-compliance` — Compliance check integration

## Example usage

```ts
import { initCase, canTransition, advanceCase } from '@nzila/mobility-case-engine'

const caseState = initCase('case-42', 'advisor-1')
const check = canTransition(caseState.lifecycle, 'client_intake')
if (check.allowed) {
  const next = advanceCase(caseState, 'advisor-1', 'Initial intake completed')
}
```

## Related apps

- `apps/mobility` — Primary case management UI
- `apps/console` — Admin case oversight

## Maturity

Pilot-grade — State machine with guard conditions and task generation. No tests yet.
