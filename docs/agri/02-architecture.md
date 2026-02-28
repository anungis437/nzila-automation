# Agri Stack — Architecture

## System Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          CLIENT LAYER                                   │
│                                                                         │
│   ┌──────────────────────┐       ┌──────────────────────┐              │
│   │    apps/pondu        │       │    apps/cora          │              │
│   │    (Pondu Ops)       │       │    (Cora Insights)    │              │
│   │                      │       │                       │              │
│   │  /pondu/dashboard    │       │  /cora/dashboard      │              │
│   │  /pondu/producers    │       │  /cora/yield-forecast │              │
│   │  /pondu/harvests     │       │  /cora/price-signals  │              │
│   │  /pondu/lots         │       │  /cora/risk           │              │
│   │  /pondu/quality      │       │  /cora/impact         │              │
│   │  /pondu/warehouse    │       │  /cora/performance    │              │
│   │  /pondu/shipments    │       │  /cora/data-sources   │              │
│   │  /pondu/payments     │       │                       │              │
│   │  /pondu/certs        │       │                       │              │
│   └──────────┬───────────┘       └───────────┬───────────┘              │
│              │ server actions                 │ read-only queries        │
└──────────────┼────────────────────────────────┼─────────────────────────┘
               │                                │
┌──────────────┼────────────────────────────────┼─────────────────────────┐
│              │      SHARED PACKAGE LAYER       │                        │
│              ▼                                ▼                         │
│   ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐    │
│   │  agri-core       │  │  agri-db         │  │ agri-intelligence│    │
│   │  types, enums,   │  │  schema, repos,  │  │ yield models,    │    │
│   │  schemas, FSMs   │  │  RLS, migrations │  │ loss rates,      │    │
│   └──────────────────┘  └──────────────────┘  │ payout sim       │    │
│                                                └──────────────────┘    │
│   ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐    │
│   │  agri-events     │  │ agri-traceability│  │  agri-adapters   │    │
│   │  domain events,  │  │  evidence packs, │  │  external system │    │
│   │  outbox, bus     │  │  proof chains    │  │  adapters        │    │
│   └──────────────────┘  └──────────────────┘  └──────────────────┘    │
└─────────────────────────────────────────────────────────────────────────┘
               │                    │                     │
┌──────────────┼────────────────────┼─────────────────────┼───────────────┐
│              │   PLATFORM LAYER    │                     │              │
│              ▼                    ▼                     ▼               │
│   ┌──────────────────┐  ┌──────────────────┐  ┌────────────────────┐  │
│   │  @nzila/db       │  │  @nzila/os-core  │  │ integrations-      │  │
│   │  scoped, audited │  │  evidence, RBAC, │  │ runtime dispatcher │  │
│   │  Drizzle ORM     │  │  telemetry       │  │ + retry + DLQ      │  │
│   └──────────────────┘  └──────────────────┘  └────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────┘
```

## Layering Rules

Each app follows strict layering:

```
Route (app/pondu/*)
  └─▶ Server Action (lib/actions/*.ts)
       └─▶ Service (lib/services/*.ts or agri-core)
            └─▶ Domain Logic (agri-core FSMs, validators)
                 └─▶ Repository (agri-db repositories)
                      └─▶ Scoped DB (@nzila/db/scoped)
```

### Layer Rules

1. **Routes** — UI only, call server actions, never access DB
2. **Server Actions** — `'use server'`, resolve org context, validate input, call services
3. **Services** — business orchestration, emit events, generate evidence
4. **Domain** — pure functions, FSM transitions, validators, no I/O
5. **Repositories** — org-scoped queries, return typed results
6. **Adapters** — external system integration via dispatcher

## Data Flow

### Write Path (Pondu)

```
User action
  → Server Action (resolveOrgContext + validate)
    → Service (orchestrate + emit audit)
      → Repository (org-scoped insert/update)
        → agri-events outbox (transactional)
          → integrations-runtime dispatcher
            → Email / SMS / Slack / CRM
```

### Read Path (Cora)

```
Dashboard request
  → Server Action (resolveOrgContext)
    → agri-intelligence compute()
      → agri-db read-only scoped query
        → Return computed metrics
```

## Deployment Profiles

| Profile | Pondu | Cora | DB | Integrations |
|---------|-------|------|-----|-------------|
| **Managed** | Cloud (Vercel/Azure) | Cloud | Shared Neon/Azure PG | Managed |
| **Sovereign** | On-premise | On-premise | Customer DB | Customer-managed |
| **Hybrid** | On-premise | Cloud | Split (ops local, analytics cloud) | Mixed |
