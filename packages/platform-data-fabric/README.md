# @nzila/platform-data-fabric

Canonical data plane for NzilaOS — ingestion, mapping, sync, and reconciliation from external source systems.

## Purpose

Provides a unified layer to ingest data from heterogeneous source systems (CRMs, ERPs, payment processors, messaging platforms), map it to the platform's canonical ontology, and maintain full lineage with conflict detection.

## Key Concepts

| Concept | Description |
|---------|-------------|
| **Source Adapter** | Connector for an external system (e.g., HubSpot, Stripe) |
| **Source Record** | Raw ingested data from a source system |
| **Canonical Record** | Normalized record mapped to an ontology entity type |
| **Mapping Rule** | Declarative field-level mapping between source and canonical |
| **Lineage Record** | Provenance trail linking canonical records to source records |
| **Conflict Record** | Detected divergence between source systems for the same entity |
| **Sync Job** | Execution record for a batch ingestion run |

## Usage

```typescript
import {
  registerSourceAdapter,
  mapSourceRecordToCanonical,
  reconcileCanonicalEntity,
  createInMemoryDataFabricStore,
} from '@nzila/platform-data-fabric'

// Register a source adapter
registerSourceAdapter({
  sourceSystem: 'hubspot',
  category: 'crm',
  fetchRecords: async (tenantId) => { /* ... */ },
})

// Map a source record to canonical
const canonical = mapSourceRecordToCanonical({
  sourceRecord,
  targetEntityType: 'client',
  entityId: 'uuid',
  mappingVersion: 1,
  transformFn: (raw) => ({ displayName: raw.name }),
})

// Reconcile (persist + detect conflicts)
const store = createInMemoryDataFabricStore()
const { persisted, conflicts } = await reconcileCanonicalEntity(store, canonical)
```

## Drizzle Schema

Exports tables: `canonicalRecords`, `recordLineage`, `syncJobs`, `syncConflicts`.
