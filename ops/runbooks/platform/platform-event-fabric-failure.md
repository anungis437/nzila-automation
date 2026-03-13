# Runbook: Platform Event Fabric Failure

**Scope:** Event streaming failures in `platform-event-fabric` and `platform-events`  
**Severity:** P2 (isolated consumer) / P1 (fabric-wide event loss)  
**On-call:** Platform Engineering

## Detection

Event fabric failures surface through:

1. **Consumer lag alerts** — consumers fall behind producers
2. **DLQ depth** — dead-lettered events exceed threshold
3. **Publish failures** — producers receive errors when emitting events
4. **Missing downstream effects** — expected side-effects (audit entries, notifications) don't occur

## Triage

### Step 1: Identify affected event stream

Check event fabric health in platform-admin → Platform Health dashboard.

Key data points:

- Event type and source domain
- Consumer group lag
- Error rate on publish/consume

### Step 2: Classify failure

| Category | Retry? | Common causes |
|----------|--------|---------------|
| `transient` | Yes | Redis/BullMQ connection timeout, consumer crash-loop |
| `permanent` | No | Schema mismatch, missing required fields, auth failure |
| `backpressure` | Throttle | Consumer too slow, queue depth growing |

### Step 3: Check event schema compatibility

If consumers are rejecting events, check for schema drift between producer and consumer expectations in `platform-ontology` types.

## Response

### Transient failures

1. Verify Redis connectivity: `redis-cli ping`
2. Check BullMQ worker health in platform-admin
3. Restart affected consumer workers if stuck

### Schema mismatch

1. Identify the breaking change in `platform-ontology` or event payload
2. Deploy consumer update to handle both old and new schema
3. Reprocess DLQ events after fix

### Backpressure

1. Scale consumer workers horizontally
2. If sustained, evaluate event batching or rate-limiting producers

## Verification

- Consumer lag returns to zero
- DLQ depth stabilises or decreases
- Downstream effects (audit entries, notifications) resume

## References

- Event Fabric package: `packages/platform-event-fabric/`
- Platform Events: `packages/platform-events/`
- Platform Ontology types: `packages/platform-ontology/src/types.ts`
