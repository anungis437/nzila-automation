# Governance Override

**Severity:** P1  
**Owner:** Platform Engineering / Legal  
**Last Reviewed:** 2025-07-17  
**Alert:** `commerce-governance-override-alert`

---

## Trigger

An emergency governance gate override is required. This occurs when:

- A legitimate business operation is blocked by governance policy
- The policy cannot be updated in time to meet business deadlines
- A regulatory requirement necessitates an exception

**Every governance override is a P1 security event** and requires dual authorization.

---

## Pre-requisites

- `owner` OrgRole (overrides cannot be performed by lower roles)
- Written authorization from a second `owner` or `admin` (dual control)
- Documented business justification
- Access to the commerce governance configuration

---

## Override Procedure

### Step 1: Document Justification

Before any override, create a written justification:

```json
{
  "overrideId": "<uuid>",
  "orgId": "<affected_org_id>",
  "requestedBy": "<actor_id>",
  "authorizedBy": "<second_actor_id>",
  "gate": "<governance_gate_name>",
  "machine": "<quote|order|invoice>",
  "transition": "<from_state> → <to_state>",
  "justification": "<business reason for override>",
  "timestamp": "<ISO 8601>",
  "expiresAt": "<ISO 8601 — override is time-bounded>"
}
```

### Step 2: Apply Custom Policy Override

Use the `resolvePolicy` function with a custom policy for the specific org:

```typescript
import { createGovernedQuoteMachine } from '@nzila/commerce-governance'
import { quoteMachine } from '@nzila/commerce-state'

// Example: temporarily raise approval threshold for this org
const overridePolicy = {
  approvalThreshold: 500_000, // raised from 10,000
}

const governed = createGovernedQuoteMachine(quoteMachine, overridePolicy)
```

**Important:** Custom policies are per-invocation. They do NOT persist and must
be explicitly passed each time.

### Step 3: Execute the Transition

1. Use the overridden governed machine to attempt the transition
2. Verify the transition succeeds
3. Record the override in the audit trail

### Step 4: Record Metrics

```typescript
import { commerceMetrics } from '@nzila/commerce-observability'

commerceMetrics.recordGovernanceOverride(
  'quote',  // machine
  orgId,    // org identifier
  'emergency-approval-threshold-raised', // reason
)
```

### Step 5: Capture Evidence

Generate an evidence pack documenting the override:

```typescript
import { buildArtifact, buildCommerceEvidencePack } from '@nzila/commerce-evidence'
import { EvidenceType } from '@nzila/commerce-core/enums'

const artifact = buildArtifact(EvidenceType.APPROVAL_RECORD, {
  artifactId: overrideId,
  filename: `governance-override-${overrideId}.json`,
  contentType: 'application/json',
  sha256: computeSha256(overrideDocument),
  sizeBytes: overrideDocumentBytes,
  description: `Governance override: ${justification}`,
})
```

---

## Post-Override Actions

### Immediate (within 1 hour)

- [ ] Override authorization document signed by both parties
- [ ] Audit entry created with full override details
- [ ] Evidence pack generated and stored
- [ ] Metric recorded via `commerceMetrics.recordGovernanceOverride`

### Short-Term (within 24 hours)

- [ ] Incident report created
- [ ] Root cause analysis: why was the override needed?
- [ ] Policy update proposal if the gate threshold needs permanent adjustment

### Long-Term (within 1 week)

- [ ] Governance committee review of the override
- [ ] Policy updated or exception formally documented
- [ ] Override process improvements identified

---

## Verification

- [ ] Transition completed successfully with audit trail
- [ ] Override evidence pack passes `validateCommerceEvidencePack`
- [ ] Override metric is visible in dashboard
- [ ] No other entities were affected by the custom policy
- [ ] Custom policy was NOT persisted (it was single-use)

---

## Rollback

If the override was applied incorrectly:

1. The transition itself cannot be undone (state machines are forward-only)
2. Use the appropriate reverse transition to correct the entity state
3. Document the correction in the audit trail
4. Update the evidence pack with correction details

---

## CRITICAL WARNINGS

1. **NEVER modify governance policy at the code level** to bypass gates.
   Always use the `resolvePolicy` override mechanism.
2. **NEVER use direct database updates** to change entity state.
   Always go through the state machine engine.
3. **Overrides are audited and reviewed.** Every override triggers a P1 alert
   and is reviewed by the governance committee.
