# @nzila/platform-ops

Operational metrics, health digest, anomaly detection, and ops scoring for the NzilaOS platform. Monitors outbox/queue depths, worker saturation, SLO compliance, and generates alerts when thresholds are breached.

## Domain context

Platform reliability requires continuous monitoring of operational metrics with daily health digests, trend analysis, and anomaly alerts. This package computes an operational confidence score (0–100) and detects regressions before they impact users.

## Public API surface

### Health digest — `@nzila/platform-ops/health-digest`

| Export | Description |
|---|---|
| `computeDeltas(previous, current)` | Compute metric deltas between snapshots |
| `detectAnomalies(deltas, sloConfig)` | Flag SLO violations as warning/critical anomalies |
| `generateDigestSnapshot(coverageDate)` | Generate daily health digest with anomaly detection |

### Health alerts — `@nzila/platform-ops/health-alerts`

| Export | Description |
|---|---|
| `formatAnomalyAlert(anomaly)` | Format anomaly for notification |
| `formatDigestSummary(snapshot)` | Format digest as human-readable summary |
| `dispatchAlerts(snapshot, adapter)` | Send alerts via adapter (Slack, email, etc.) |

### Trend detection — `@nzila/platform-ops/trend-detection`

| Export | Description |
|---|---|
| `computeLinearRegression(points)` | Linear regression over metric time series |
| `analyseTrend(metric, points)` | Classify trend as improving/stable/degrading |
| `analyseTrends(metrics)` | Batch trend analysis |
| `buildTrendWarningEvent(trend)` | Generate audit event for degrading trends |

### Ops score — `@nzila/platform-ops/ops-score`

| Export | Description |
|---|---|
| `computeOpsScore(input)` | Weighted ops confidence score (0–100) |
| `computeOpsScoreDelta(current, previous)` | Score delta with direction indicator |

Weight distribution: SLO 30%, error delta 20%, integration SLA 20%, DLQ backlog 15%, regression 15%.

### Failure simulation — `@nzila/platform-ops/failure-simulation`

| Export | Description |
|---|---|
| `startSimulation(type)` | Start chaos test simulation |
| `stopSimulation(id)` | Stop active simulation |
| `getSimulationState()` | Current simulation status |

### Pilot export — `@nzila/platform-ops/pilot-export`

| Export | Description |
|---|---|
| `generatePilotSummary(orgId, ports)` | Generate pilot engagement summary |
| `computeBundleHash(bundle)` | SHA-256 hash for bundle integrity |

## Dependencies

- `@nzila/db` — Drizzle ORM for metrics persistence
- `drizzle-orm` — Query builder

## Example usage

```ts
import { computeOpsScore } from '@nzila/platform-ops/ops-score'
import { generateDigestSnapshot } from '@nzila/platform-ops/health-digest'

const score = computeOpsScore({
  sloCompliancePct: 98.5,
  errorDeltaPct: 0.2,
  integrationSlaPct: 99.1,
  dlqBacklogRatio: 0.01,
  regressionSeverity: 0,
})
console.log(`Ops: ${score.grade} (${score.score}/100)`)

const digest = await generateDigestSnapshot('2025-01-15')
```

## Related apps

- `apps/console` — Ops dashboard
- `apps/platform-admin` — Platform health monitoring

## Maturity

Production-grade — Full ops scoring, trend detection, and alerting. Comprehensive test suite.
