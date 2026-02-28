# Audit Gap Investigation

**Severity:** P1  
**Owner:** Platform Engineering / Compliance  
**Last Reviewed:** 2025-07-17  
**Alert:** `commerce-audit-gap-alert`

---

## Trigger

The system detected that state machine transitions are occurring without
corresponding audit entries. The audit completeness SLO (100% target) has
been breached.

**This is a compliance-critical event.** Every state transition must produce
an audit entry. Gaps indicate either:

1. A code path bypasses the audit-aware transition layer
2. Audit entry persistence is failing
3. A race condition between transition and audit write

---

## Pre-requisites

- Database read access to commerce audit tables
- Access to commerce metrics dashboard
- Access to application logs

---

## Diagnosis Steps

### Step 1: Quantify the Gap

```kql
customMetrics
| where name in ("commerce_transition_total", "commerce_audit_entry_total")
| summarize transitions = sumif(valueSum, name == "commerce_transition_total"),
            audits = sumif(valueSum, name == "commerce_audit_entry_total")
  by bin(timestamp, 5m)
| extend gap = transitions - audits
| where gap > 0
| order by timestamp desc
```

### Step 2: Identify Missing Audit Entries

```sql
-- Find recent transitions without audit entries
-- (assumes transitions are logged in a transitions table or can be
-- inferred from entity state changes)
SELECT q.id, q.org_id, q.status, q.updated_at
FROM commerce.quotes q
WHERE q.updated_at > NOW() - INTERVAL '1 hour'
  AND NOT EXISTS (
    SELECT 1 FROM commerce.audit_entries ae
    WHERE ae.org_id = q.id
      AND ae.created_at > q.updated_at - INTERVAL '1 minute'
  );
```

### Step 3: Check Application Logs

Look for errors in the audit entry creation path:

```kql
traces
| where message contains "audit" and severityLevel >= 3
| where timestamp > ago(1h)
| project timestamp, message, customDimensions
| order by timestamp desc
```

### Step 4: Check for Direct DB Mutations

Verify no code is mutating entity state outside the state machine:

```kql
-- Look for UPDATE statements that bypass the service layer
dependencies
| where type == "SQL"
| where data contains "UPDATE commerce."
| where data !contains "audit_entries"
| project timestamp, data, target
```

---

## Resolution Steps

### Step 1: Stop the Gap

If audit entries are failing to persist:

1. Check database connectivity
2. Check for constraint violations in the audit_entries table
3. Fix the persistence issue

### Step 2: Backfill Missing Entries

For each transition without an audit entry:

```typescript
import { buildActionAuditEntry } from '@nzila/commerce-audit'

const backfillEntry = buildActionAuditEntry({
  orgId: entity.id,
  entityType: 'quote', // or order/invoice
  actorId: 'system-backfill',
  orgId: entity.orgId,
  action: 'audit_backfill',
  label: `Backfill: ${entity.status} transition at ${entity.updatedAt}`,
  metadata: {
    backfilledAt: new Date().toISOString(),
    reason: 'audit-gap-investigation',
    originalTransition: entity.status,
  },
})
```

### Step 3: Fix Root Cause

1. If a code path bypasses audit: add audit instrumentation
2. If a persistence issue: fix the database/connection problem
3. If a race condition: add transaction wrapping around transition+audit

---

## Verification

- [ ] Audit gap metric has returned to zero
- [ ] All missing audit entries have been backfilled
- [ ] Root cause identified and fixed
- [ ] Contract test added to prevent recurrence
- [ ] Compliance team notified of the gap period

---

## Evidence to Capture

| Artifact | Description |
|----------|-------------|
| Gap quantification | Metric query showing the gap period and magnitude |
| Missing entries list | List of entities that had transitions without audits |
| Backfill records | Audit entries created during backfill |
| Root cause analysis | Description of why the gap occurred |
| Fix verification | Proof that the gap is closed |
