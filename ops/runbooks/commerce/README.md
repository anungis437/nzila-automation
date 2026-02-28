# Runbooks — Commerce

**Owner:** Platform Engineering / Finance  
**Review Cadence:** Quarterly

## Purpose

Operational runbooks for the commerce engine covering state machine operations,
saga orchestration, governance gates, audit trail integrity, and evidence pack
management.

## Available Runbooks

| Runbook | Severity | Trigger |
|---------|----------|---------|
| [Stuck State Resolution](./stuck-state-resolution.md) | P2 | Quote/order/invoice stuck in non-terminal state |
| [Saga Compensation Failure](./saga-compensation-failure.md) | P2 | Saga fails AND compensation fails |
| [Governance Override](./governance-override.md) | P1 | Emergency bypass of governance gates |
| [Org Isolation Breach](./org-isolation-breach.md) | P1 | Cross-org transition attempt detected |
| [Audit Gap Investigation](./audit-gap-investigation.md) | P1 | Transitions detected without matching audit entries |
| [Evidence Pack Failure](./evidence-pack-failure.md) | P2 | Evidence pack generation or validation failure |

## Alert Integration

Each runbook is linked from the corresponding alert rule defined in:
```
packages/commerce-observability/src/slo.ts → COMMERCE_ALERT_RULES
```

When an alert fires, the `runbook` field in the alert rule points to the
appropriate runbook in this directory.

## Evidence Capture

All runbook executions that modify commerce state must produce evidence:

| Artifact | Format | Storage Path | Retention |
|----------|--------|--------------|-----------|
| Runbook execution log | JSON | `evidence/{org_id}/commerce/runbook-execution/{YYYY}/{run_id}/` | 7_YEARS |
| Override authorization | PDF | `evidence/{org_id}/commerce/overrides/{YYYY}/{override_id}/` | PERMANENT |
| Compensation report | JSON | `evidence/{org_id}/commerce/compensations/{YYYY}/{saga_id}/` | 7_YEARS |
