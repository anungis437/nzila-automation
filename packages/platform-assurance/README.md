# @nzila/platform-assurance

Executive assurance dashboard scoring engine. Computes weighted KPIs across five dimensions — compliance, security, operations, cost, and integration reliability — to produce an org-scoped and platform-wide confidence grade.

## Domain context

Enterprise buyers and internal leadership need a single view of platform health. This package aggregates scores from multiple sources (evidence packs, vulnerability scans, SLO compliance, spend tracking, integration health) into a graded dashboard suitable for board reporting and procurement evidence.

## Public API surface

### Scorer — `@nzila/platform-assurance/scorer`

| Export | Description |
|---|---|
| `computeAssuranceDashboard(orgId, ports)` | Compute org-scoped dashboard with weighted overall score |
| `computePlatformAssurance(ports)` | Aggregate all orgs into a platform-wide score |

### Types — `@nzila/platform-assurance/types`

| Type | Description |
|---|---|
| `AssuranceDashboard` | Org dashboard with 5 sub-scores + overall grade |
| `PlatformAssuranceAggregate` | Platform-wide aggregate across all orgs |
| `ComplianceScore` | Snapshot chain, policy compliance rate, control families |
| `SecurityScore` | Critical/high vulns, dependency posture, attestation |
| `OpsScore` | SLO compliance, p95 latency, error rate, uptime |
| `CostScore` | Budget utilization, daily/monthly spend, over-budget flag |
| `IntegrationReliabilityScore` | SLA compliance, DLQ backlog, circuit breakers |
| `ScoreGrade` | `A` (≥90) / `B` (≥80) / `C` (≥70) / `D` (≥60) / `F` (<60) |
| `AssurancePorts` | Dependency injection interface for all score sources |

### Weight distribution

| Dimension | Weight |
|---|---|
| Compliance | 25% |
| Security | 25% |
| Operations | 20% |
| Cost | 15% |
| Integration reliability | 15% |

## Dependencies

- `@nzila/os-core` — Core platform utilities
- `zod` — Schema validation

## Example usage

```ts
import { computeAssuranceDashboard } from '@nzila/platform-assurance'

const dashboard = await computeAssuranceDashboard('org-1', ports)
console.log(`Overall: ${dashboard.overallGrade} (${dashboard.overallScore}/100)`)
```

## Related apps

- `apps/console` — Executive dashboard view
- `apps/platform-admin` — Platform-wide assurance monitoring

## Maturity

Production-grade — Full scoring engine with tests.
