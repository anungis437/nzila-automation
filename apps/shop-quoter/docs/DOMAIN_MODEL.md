# Domain Model — Shop Quoter

> Canonical reference for Shop Quoter domain entities, state machines,
> events, and audit surfaces. See also: docs/DOMAIN_VS_AUDIT_MODEL.md

## Primary Entities

| Entity | Table(s) | Purpose |
|--------|----------|---------|
| Quote | `quotes` | Customer quotation |
| Purchase Order | `purchase_orders` | PO generated from approved quote |
| Production Order | `production_orders` | Manufacturing / fulfilment order |
| Supplier | `suppliers` | Material / service supplier |
| Customer | `customers` | Customer record |
| Inventory | `inventory` | Stock / material inventory |
| Payment | `payments` | Payment transaction |
| Product | `products` | Catalogue product |

## Primary State Tables (Source of Truth)

- `quotes` — current quote status, line items, pricing, approval state
- `purchase_orders` — current PO status, supplier, delivery
- `production_orders` — current production status, schedule
- `customers` — current customer profile, contact
- `inventory` — current stock levels, locations
- `payments` — current payment status, amount, method

## Workflow State Machines

| State Machine | File | States |
|---------------|------|--------|
| Quote | `lib/workflows/quote-state-machine.ts` | draft → submitted → under_review → approved → converted_to_po / rejected |

## Services

| Service | File | Purpose |
|---------|------|---------|
| Quote-to-PO | `lib/services/quote-to-po-service.ts` | Convert approved quote to PO |
| Quote Approval | `lib/services/quote-approval-service.ts` | Approval workflow |
| Payment Gating | `lib/services/payment-gating-service.ts` | Payment validation gates |
| Production Gating | `lib/services/production-gating-service.ts` | Production readiness gates |
| Share Link | `lib/services/share-link-service.ts` | Shareable quote links |
| Workflow Audit | `lib/services/workflow-audit-service.ts` | Audit trail for workflow actions |

## Emitted Events

| Event | Trigger | Consumer |
|-------|---------|----------|
| `quote.created` | New quote drafted | Analytics, Audit |
| `quote.approved` | Quote approved | PO service, Notifications |
| `quote.rejected` | Quote rejected | Notifications, Audit |
| `po.created` | PO generated from quote | Production, Audit |
| `payment.received` | Payment processed | Finance, Audit |
| `production.started` | Production order began | Notifications |

## Audit Surfaces

| Surface | Purpose | Tables |
|---------|---------|--------|
| Quote audit trail | Track quote lifecycle changes | `audit_entries` |
| Evidence export | Compliance evidence pack | `evidence_packs` |
| Payment audit | Financial transaction proof | `commerce_audit` |

## What is NOT a Source of Truth

| Data | Why Not |
|------|---------|
| `commerce_audit` | Audit trail only — do not query for current quote/PO state |
| `evidence_packs` | Export artefacts — not primary data source |
| Workflow audit entries | Historical record — current state lives in domain tables |
