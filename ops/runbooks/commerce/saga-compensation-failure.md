# Saga Compensation Failure

**Severity:** P2  
**Owner:** Platform Engineering  
**Last Reviewed:** 2025-07-17  
**Alert:** `commerce-saga-compensation-spike` or `commerce-saga-failure-rate`

---

## Trigger

- Saga execution fails AND compensation also fails (status: `failed` not `compensated`)
- Saga compensation rate exceeds 5 occurrences in 24 hours
- Saga failure rate SLO breach (success rate drops below 99%)

---

## Pre-requisites

- Database read access to commerce tables
- Access to saga execution logs
- Access to the commerce metrics dashboard
- `admin` or `owner` OrgRole for the affected org

---

## Diagnosis Steps

### 1. Identify Failed Sagas

```kql
customMetrics
| where name == "commerce_saga_failure_total"
| summarize total = sum(valueSum) by bin(timestamp, 1h),
            tostring(customDimensions.saga_name),
            tostring(customDimensions.org_id)
| order by timestamp desc
```

### 2. Check Saga Execution History

The saga orchestrator maintains an in-memory execution history accessible
via the `executions()` method. In production, saga executions are also
persisted to the audit trail.

```typescript
const executions = orchestrator.executions()
const failed = executions.filter(e => e.status === 'failed')

for (const exec of failed) {
  console.log(`Saga: ${exec.sagaName}`)
  console.log(`  Status: ${exec.status}`)
  console.log(`  Steps completed: ${exec.stepsCompleted.join(', ')}`)
  console.log(`  Steps compensated: ${exec.stepsCompensated.join(', ')}`)
  console.log(`  Error: ${exec.error}`)
  console.log(`  Entity (org): ${exec.orgId}`)
}
```

### 3. Identify Orphaned State

When compensation fails, some steps may have completed but not been rolled back.
Check for inconsistent state:

```sql
-- Example: check if an order was created without a valid quote
SELECT o.id AS order_id, o.status AS order_status,
       q.id AS quote_id, q.status AS quote_status
FROM commerce.orders o
LEFT JOIN commerce.quotes q ON o.quote_id = q.id
WHERE o.org_id = '<affected_org_id>'
  AND o.created_at > NOW() - INTERVAL '24 hours'
  AND (q.id IS NULL OR q.status != 'accepted');
```

---

## Resolution Steps

### Step 1: Assess Impact

1. Determine which saga steps completed
2. Determine which compensation steps succeeded
3. Identify the gap — steps that completed forward but were NOT compensated

### Step 2: Manual Compensation

For each uncompensated step, manually reverse the effect:

| Saga Step | Manual Compensation |
|-----------|-------------------|
| Create Order | Set order status to `cancelled` via admin transition |
| Create Invoice | Set invoice status to `voided` via admin transition |
| Sync to QBO | Reverse the QBO sync entry |
| Emit Domain Event | No action needed (events are idempotent) |

### Step 3: Fix Root Cause

1. Check the failing step's error message
2. Common causes:
   - Database constraint violation → check entity data
   - External service timeout → check QBO/Stripe connectivity
   - org mismatch → investigate security boundary issue (escalate to P1)
3. Fix the underlying issue
4. Re-execute the saga if appropriate

### Step 4: Verify Consistency

```sql
-- Verify no orphaned entities remain
SELECT COUNT(*) AS orphaned_orders
FROM commerce.orders
WHERE org_id = '<affected_org_id>'
  AND status NOT IN ('cancelled', 'completed')
  AND quote_id NOT IN (SELECT id FROM commerce.quotes WHERE status = 'accepted');
```

---

## Verification

- [ ] All uncompensated steps have been manually reversed
- [ ] Entity state is consistent (no orphaned orders/invoices)
- [ ] Audit entries exist for all manual interventions
- [ ] Root cause has been identified and documented
- [ ] Saga success rate is recovering

---

## Rollback

Manual compensations should each produce their own audit entries.
If a manual compensation was incorrect, use the standard transition
pathway to correct the entity state.

---

## Evidence to Capture

| Artifact | Description |
|----------|-------------|
| Failed saga execution record | JSON from `orchestrator.executions()` |
| Orphaned entity query results | Results of consistency check queries |
| Manual compensation audit entries | Audit entries for each manual fix |
| Root cause analysis | Text description of why the saga failed |
