# Org Isolation Breach Investigation

**Severity:** P1  
**Owner:** Platform Engineering / Security  
**Last Reviewed:** 2025-07-17  
**Alert:** `commerce-org-mismatch-spike`

---

## Trigger

The state machine engine has rejected one or more cross-org transition attempts.
This means an actor from Org A attempted to transition a resource belonging to Org B.

**This is always a security event.** Even though the engine blocks the attempt,
the existence of cross-org attempts indicates either:

1. A bug in the application layer (routing wrong org context)
2. A privilege escalation attempt
3. A misconfigured API client

---

## Pre-requisites

- Access to security incident response tooling
- Access to commerce metrics and audit logs
- Security team notification channel

---

## Diagnosis Steps

### Step 1: Quantify the Scope

```kql
customMetrics
| where name == "commerce_transition_org_mismatch_total"
| summarize total = sum(valueSum) by bin(timestamp, 5m),
            tostring(customDimensions.machine),
            tostring(customDimensions.org_id)
| order by timestamp desc
| take 100
```

### Step 2: Identify the Source

Check structured logs for the org mismatch error entries:

```kql
traces
| where message contains "ORG MISMATCH"
| project timestamp, customDimensions.orgId,
          customDimensions.attemptedOrgId,
          customDimensions.resourceOrgId,
          customDimensions.actorId,
          customDimensions.machine
| order by timestamp desc
| take 50
```

### Step 3: Determine Pattern

Classify the incident:

| Pattern | Likely Cause | Urgency |
|---------|-------------|---------|
| Single actor, multiple orgs | Bug or misconfigured client | High |
| Multiple actors, one target org | Coordinated attack | Critical |
| Random distribution | Application routing bug | High |
| Correlated with deployment | Code regression | Medium |

### Step 4: Check for Successful Cross-Org Access

Verify that no cross-org transitions actually succeeded (they should never):

```sql
-- Verify audit trail integrity
SELECT ae.org_id AS audit_org,
       ae.metadata->>'resourceOrgId' AS resource_org,
       ae.action, ae.created_at
FROM commerce.audit_entries ae
WHERE ae.created_at > NOW() - INTERVAL '24 hours'
  AND ae.org_id != ae.metadata->>'resourceOrgId';
```

**If this query returns rows, escalate immediately to CRITICAL.**

---

## Resolution Steps

### If Bug (Most Common)

1. Identify the code path that constructed the wrong org context
2. Fix the routing/context propagation
3. Deploy the fix
4. Verify org mismatch rate returns to zero

### If Attack

1. **Immediately** revoke the attacker's sessions
2. Disable the attacker's account
3. Notify the security team
4. Follow the [Security Incident Response](../security/) runbook
5. Preserve all logs for forensic analysis

### If Deployment Regression

1. Roll back the deployment
2. Verify org mismatch rate returns to zero
3. Fix the regression in code
4. Add a contract test to prevent recurrence

---

## Verification

- [ ] Org mismatch rate has returned to zero
- [ ] No successful cross-org access occurred
- [ ] Root cause identified and documented
- [ ] Fix deployed (if applicable)
- [ ] Security team notified (if attack pattern)
- [ ] Contract test added to prevent recurrence

---

## Evidence to Capture

| Artifact | Description |
|----------|-------------|
| Mismatch metric spike | Screenshot of the metric dashboard |
| Source identification | Log queries showing the actor/IP |
| Audit trail verification | Proof that no cross-org access succeeded |
| Root cause analysis | Written description of the cause |
| Remediation evidence | Deployment record of the fix |
