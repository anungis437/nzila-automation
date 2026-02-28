# Trade Migration Scripts

Scripts for migrating data from the two legacy Django apps into the unified Trade platform.

## Source Systems

| System | Django App | Description |
|--------|-----------|-------------|
| Trade-OS | `nzila-trade-os-main` | Core trade platform (parties, deals, listings, shipments, commissions) |
| eExports | `nzila_eexports-main` | Vehicle-specific export platform |

## Scripts

| Script | Purpose | Idempotent |
|--------|---------|------------|
| `import-tradeos-core.ts` | Imports Trade-OS parties, listings, deals, quotes, financing, shipments, documents, commissions | ✅ |
| `import-eexports-vehicles.ts` | Imports eExports vehicles + docs as TradeListing (type=vehicle) with trade-cars metadata | ✅ |
| `import-eexports-deals.ts` | Imports eExports deals, linking to already-imported vehicle listings and parties | ✅ |
| `reconcile.ts` | Produces a reconciliation report comparing legacy counts vs new platform counts | N/A |

## Running

```bash
# Dry-run (default — no writes)
pnpm tsx scripts/migrations/trade/import-tradeos-core.ts --dry-run

# Live run
pnpm tsx scripts/migrations/trade/import-tradeos-core.ts --live

# Vehicle import (must run trade-os core first)
pnpm tsx scripts/migrations/trade/import-eexports-vehicles.ts --live

# Deals import (must run vehicles first)
pnpm tsx scripts/migrations/trade/import-eexports-deals.ts --live

# Reconciliation report
pnpm tsx scripts/migrations/trade/reconcile.ts
```

## Order of Operations

1. `import-tradeos-core.ts` — establishes parties + listings + deals + supporting records
2. `import-eexports-vehicles.ts` — maps eExports vehicles → TradeListing(type=vehicle)
3. `import-eexports-deals.ts` — maps eExports deals → TradeDeal, linking to vehicle listings
4. `reconcile.ts` — verify counts and report mismatches

## Idempotency

All import scripts use `legacySourceId` + `legacySourceSystem` columns.
On re-run, existing records are skipped (upsert by legacy key).
