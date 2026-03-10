# @nzila/integrations-db

Drizzle ORM schema definitions and repository port interfaces for the integration control plane's persistence layer.

## Domain Context

Middle tier of the integration stack (`integrations-core` → **`integrations-db`** → `integrations-runtime`). Defines PostgreSQL tables for integration configuration, message delivery tracking, dead-letter queues, webhook management, provider health snapshots, rolling metrics, and SLO targets.

This package exports **schemas and interfaces only** — no concrete implementations. Repository ports are implemented by downstream packages or application-level wiring.

## Public API

### Core Schema (`schema.ts`)

PostgreSQL tables via Drizzle ORM:

| Table                      | Purpose                                  |
|----------------------------|------------------------------------------|
| `integrationConfigs`       | Org-scoped provider configurations       |
| `integrationDeliveries`    | Message delivery tracking records        |
| `integrationDlq`           | Dead-letter queue entries                |
| `webhookSubscriptions`     | Webhook endpoint registrations           |
| `webhookDeliveryAttempts`  | Webhook delivery attempt logs            |

PostgreSQL enums: `integrationTypeEnum`, `integrationProviderEnum`, `integrationStatusEnum`, `deliveryStatusEnum`.

### Health Schema (`health-schema.ts`)

| Table                       | Purpose                                           |
|-----------------------------|---------------------------------------------------|
| `integrationProviderHealth` | Provider health snapshots with circuit state       |
| `integrationProviderMetrics`| Rolling-window metrics (5m, 1h) with latency p50/p95/p99 |
| `integrationSloTargets`    | SLO/SLA targets per provider+channel (org or default) |

PostgreSQL enums: `healthStatusEnum`, `circuitStateEnum`.

### Repository Ports (`repos.ts`)

| Interface                  | Operations                                        |
|----------------------------|---------------------------------------------------|
| `IntegrationConfigRepo`    | `create`, `findById`, `findByOrgAndProvider`, `listByOrg`, `updateStatus`, `update` |
| `IntegrationDeliveryRepo`  | `create`, `findById`, `updateStatus`, `listByOrg`, `countByOrg` |
| `IntegrationDlqRepo`       | `enqueue`, `findById`, `listByOrg`, `markReplayed` |

Context types: `IntegrationDbContext` (write), `IntegrationReadContext` (read).

### Health Repository Ports (`health-repos.ts`)

| Interface                  | Operations                                        |
|----------------------------|---------------------------------------------------|
| `IntegrationHealthRepo`    | `upsert`, `findByOrgAndProvider`, `listByOrg`, `listAll`, `updateCircuitState` |
| `IntegrationMetricsRepo`   | `recordMetrics`, `queryByOrgAndProvider`, `latestByOrgAndProvider`, `aggregateByOrg` |
| `IntegrationSloTargetRepo` | `upsert`, `findForOrgAndProvider`, `findDefault`, `listByOrg`, `listDefaults` |

## Dependencies

- `@nzila/integrations-core` — Domain types and enums
- `drizzle-orm` — Schema definitions and query builder types
- `zod` — Schema validation

## Maturity

| Metric       | Value                          |
|--------------|--------------------------------|
| Status       | Stable                         |
| Tests        | Covered via `integrations-runtime` integration tests |
| Consumers    | `integrations-runtime`, application wiring layers |

<!-- maturity:stable -->
