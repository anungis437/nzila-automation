# @nzila/shop-quoter

> Legacy Shop Quoter (ShopMoiÇa) adapter for the NzilaOS Commerce Engine

## Purpose

This package bridges the legacy **Shop Quoter Tool V1** (`shop_quoter_tool_v1-main`)
into the NzilaOS commerce engine. It provides:

- **Type-safe mapping** from legacy Supabase schemas to `@nzila/commerce-core` types
- **Zod validation** of legacy data at the ingestion boundary
- **Batch import** with per-record error handling and diagnostics
- **Audit trail** generation for every imported record
- **Dry-run validation** mode for pre-flight migration checks

## Architecture

```text
Legacy Supabase tables (requests, proposals, clients)
  ↓  extract (raw JSON)
Zod-validated legacy types (types.ts)
  ↓  transform (mapper.ts — pure functions)
@nzila/commerce-core canonical types
  ↓  orchestrate (adapter.ts → commerce-services)
NzilaOS commerce entities + audit entries
```

## Key Design Decisions

1. **Adapter owns the boundary** — no other package touches legacy shapes
2. **Repository ports** — all DB operations injected; adapter is persistence-agnostic
3. **Legacy IDs preserved** — stored in `externalIds`/`metadata` for traceability
4. **Idempotent** — re-importing same legacy ID updates rather than duplicates
5. **Evidence-first** — every import produces audit entries

## Usage

```typescript
import { createShopQuoterAdapter } from '@nzila/shop-quoter'

const adapter = createShopQuoterAdapter(quoteRepo, customerRepo, {
  defaultEntityId: 'org-uuid',
  preserveLegacyIds: true,
})

// Validate before importing
const validation = adapter.validateLegacyData(records)

// Import batch
const summary = await adapter.importBatch(records)
```

## Dependencies

| Package | Purpose |
|---------|---------|
| `@nzila/commerce-core` | Domain types, enums, schemas |
| `@nzila/commerce-services` | Quote lifecycle orchestration |
| `@nzila/commerce-audit` | Audit entry builders |
| `@nzila/pricing-engine` | Pricing template types |
| `zod` | Legacy data validation |

## Legacy Reference

See [docs/commerce/LEGACY_REVIEW.md](../../docs/commerce/LEGACY_REVIEW.md) for the
full audit of the legacy system.

---

*Part of [NzilaOS Commerce Engine](../../docs/commerce/README.md)*
