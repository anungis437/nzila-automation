# Stuck State Resolution

**Severity:** P2  
**Owner:** Platform Engineering  
**Last Reviewed:** 2025-07-17  
**Alert:** `commerce-state` transition-success-rate SLO breach

---

## Trigger

A quote, order, or invoice entity is stuck in a non-terminal state beyond expected
SLA thresholds:

| Entity | State | Expected Max Duration |
|--------|-------|----------------------|
| Quote | `sent` | 90 days (configurable via `maxQuoteValidityDays`) |
| Order | `confirmed` → `processing` | 24 hours |
| Invoice | `sent` | 30 days |

This runbook is also triggered when the transition success rate drops below the
99.5% SLO target.

---

## Pre-requisites

- Database read access to commerce tables
- Access to the commerce metrics dashboard
- `admin` or `owner` OrgRole for the affected org

---

## Diagnosis Steps

### 1. Identify Stuck Entities

```sql
-- Find quotes stuck in non-terminal states beyond SLA
SELECT id, org_id, status, updated_at,
       NOW() - updated_at AS stuck_duration
FROM commerce.quotes
WHERE status NOT IN ('accepted', 'cancelled', 'expired', 'archived')
  AND updated_at < NOW() - INTERVAL '7 days'
ORDER BY updated_at ASC;
```

### 2. Check Transition History

```sql
-- Check audit trail for the stuck entity
SELECT *
FROM commerce.audit_entries
WHERE entity_id = '<stuck_entity_id>'
ORDER BY created_at DESC
LIMIT 20;
```

### 3. Check Governance Gate Failures

Use the `evaluateGates` diagnostic function to determine which governance
gate is blocking the transition:

```typescript
import { evaluateGates } from '@nzila/commerce-governance'
import { quoteMachine } from '@nzila/commerce-state'

const diagnostics = evaluateGates(quoteMachine, 'sent', 'accepted', ctx, entity)
// diagnostics.results shows per-gate pass/fail with reasons
```

### 4. Check Metrics

```kql
customMetrics
| where name == "commerce_transition_failure_total"
| where customDimensions.machine == "<entity_type>"
| summarize failures = sum(valueSum) by bin(timestamp, 1h), tostring(customDimensions.from)
| order by timestamp desc
```

---

## Resolution Steps

### Option A: Entity Meets Policy — Retry Transition

If the entity meets all governance requirements but the transition failed
due to a transient error:

1. Verify the entity state in the database
2. Verify all governance gates pass via `evaluateGates`
3. Re-attempt the transition through the service layer
4. Verify audit entry was created

### Option B: Entity Does Not Meet Policy — Update Entity

If a governance gate is blocking (e.g., missing approval, low margin):

1. Identify the failing gate
2. Update the entity to meet policy requirements
3. Re-attempt the transition
4. Verify audit entry was created

### Option C: Timeout-Based Transition

If the entity has exceeded its timeout (e.g., quote validity expired):

1. The timeout scheduler should automatically transition to the expired state
2. If the scheduler is not running, manually invoke the timeout handler:
   ```typescript
   // This should normally be handled by the scheduler
   attemptTransition(machine, currentState, 'expired', ctx, resourceEntityId, entity)
   ```

---

## Verification

- [ ] Entity is now in the expected state
- [ ] Audit entry exists for the resolution
- [ ] Metrics show the transition was recorded
- [ ] No other entities from the same org are stuck

---

## Rollback

State machine transitions are forward-only by design. If the transition was
incorrect, use the appropriate reverse transition (e.g., `accepted` → `revision_requested`)
rather than attempting to undo.

---

## Evidence to Capture

| Artifact | Description |
|----------|-------------|
| Stuck entity query results | Screenshot or JSON of diagnosis query |
| Gate evaluation diagnostics | Output of `evaluateGates` |
| Resolution audit entry | The audit entry created by the resolution transition |
