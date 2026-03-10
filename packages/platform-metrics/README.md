# @nzila/platform-metrics

Cross-application KPI calculation for NzilaOS. Computes org-level performance metrics and platform-wide aggregate metrics for executive dashboards.

## Domain context

Platform administrators and org leaders need quantitative views of operational efficiency, SLA adherence, revenue velocity, and user engagement. This package queries the platform database to compute these KPIs deterministically — no external API dependencies.

## Public API surface

### Org metrics — `@nzila/platform-metrics/org`

| Export | Description |
|---|---|
| `getOrgPerformanceMetrics(orgId, options?)` | Compute org-level KPIs |
| `OrgPerformanceMetrics` | `operationalEfficiency` (0–1), `slaAdherence` (%), `revenueVelocity` ($/day), `userEngagementScore` (0–100) |

Baselines: 14-day processing baseline for efficiency. Default window: 30 days.

### Platform metrics — `@nzila/platform-metrics/platform`

| Export | Description |
|---|---|
| `getPlatformOverviewMetrics(systemVersion)` | Platform-wide aggregate metrics |
| `getOrgOverviewMetrics(orgId)` | Org-scoped variant of platform metrics |
| `PlatformOverviewMetrics` | Total orgs, active apps per org, audit events, background jobs, revenue events, claims processed, quotes generated |

## Dependencies

- `@nzila/db` — Drizzle ORM for database queries
- `drizzle-orm` — Query builder

## Example usage

```ts
import { getOrgPerformanceMetrics } from '@nzila/platform-metrics/org'
import { getPlatformOverviewMetrics } from '@nzila/platform-metrics/platform'

const orgKPIs = await getOrgPerformanceMetrics('org-1', { windowDays: 30 })
const platform = await getPlatformOverviewMetrics('v2.1.0')
```

## Related apps

- `apps/console` — Executive dashboard
- `apps/platform-admin` — Platform-wide metrics view

## Maturity

Production-grade — Deterministic DB-driven KPI calculations. Has tests.
