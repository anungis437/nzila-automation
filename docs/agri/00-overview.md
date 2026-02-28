# Agri Stack — Overview

## What Is the Agri Stack?

The NzilaOS Agri Stack is an institution-grade agricultural operations and intelligence platform designed for cooperatives, exporters, commodity traders, and agri-finance institutions across emerging markets.

It consists of **two distinct applications** backed by **shared infrastructure packages**:

| App | Name | Purpose |
|-----|------|---------|
| **Pondu** | Pondu Ops | Operational execution — harvest intake, lot aggregation, quality inspection, certification, warehousing, shipments, and payment distribution |
| **Cora** | Cora Insights | Intelligence and analytics — yield forecasting, price signals, climate risk, cooperative performance, impact reporting, and traceability dashboards |

## Design Principles

### 1. Separate UIs, Shared Intelligence

Pondu and Cora are **independent Next.js apps** with their own routes, layouts, and deployment targets. They share domain primitives, database schemas, and intelligence computation via shared packages — never via direct imports between apps.

### 2. Upstream Emits, Downstream Consumes

```
Pondu (writes) ──emits events──▶ agri-events (outbox) ──▶ Cora (reads + computes)
                                        │
                                        ▼
                             integrations-runtime
                           (email, SMS, Slack, CRM)
```

Pondu is the source of truth for operational data. Cora reads from agri-db via a **read-only scoped query layer** and computes analytics via `agri-intelligence`. Cora never writes to Pondu operational tables.

### 3. Org Isolation Everywhere

Every table is scoped by `org_id`. Every server action resolves org context via `resolveOrgContext()`. RLS policies ensure cross-org data cannot leak. Platform roles may read across orgs with explicit checks.

### 4. Evidence-First

All material actions (lot certification, shipment finalization, payment execution) produce **sealed evidence packs** with hash chains, Merkle roots, timestamps, and actor attribution. These packs are immutable and verifiable.

### 5. No Direct SDK Calls

All external integrations (email, SMS, Slack, Teams, HubSpot) are routed through `@nzila/integrations-runtime` dispatcher. Direct SDK imports are blocked by contract tests.

## Shared Packages

| Package | Scope | Description |
|---------|-------|-------------|
| `@nzila/agri-core` | Domain | Canonical types, enums, Zod schemas, FSMs |
| `@nzila/agri-db` | Data | Drizzle schema, org-scoped repositories, RLS |
| `@nzila/agri-events` | Events | Domain event types, outbox, event bus |
| `@nzila/agri-intelligence` | Analytics | Yield models, loss rates, payout simulation |
| `@nzila/agri-traceability` | Trust | Evidence packs, proof chains, org exports |
| `@nzila/agri-adapters` | Integration | Adapter interfaces for external systems |

## Bundling Strategy

Pondu and Cora are **separately deployable** — each can be deployed as a standalone Next.js app. The shared packages are workspace dependencies resolved at build time. This enables:

- **Managed**: Both apps on shared infra, single DB
- **Sovereign**: Org-deployed, data stays on-premise
- **Hybrid**: Pondu on-premise, Cora in cloud (or vice versa)

## Boundaries

```
apps/pondu ──imports──▶ agri-core, agri-db, agri-events, agri-traceability, agri-adapters
apps/cora  ──imports──▶ agri-core, agri-db (read-only), agri-intelligence, agri-traceability

❌ apps/pondu CANNOT import from apps/cora
❌ apps/cora CANNOT import from apps/pondu
❌ Shared packages CANNOT import from apps/*
❌ agri-intelligence CANNOT write to Pondu operational tables
```
