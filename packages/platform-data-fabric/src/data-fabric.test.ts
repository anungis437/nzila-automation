import { describe, it, expect, beforeEach } from 'vitest'
import {
  SourceSystemCategories,
  registerSourceAdapter,
  getSourceAdapter,
  listSourceAdapters,
  resetAdapterRegistry,
  mapSourceRecordToCanonical,
  reconcileCanonicalEntity,
  getLineageForEntity,
  createInMemoryDataFabricStore,
} from './index'
import type { SourceAdapter, SourceRecord, DataFabricStore } from './index'
import { OntologyEntityTypes } from '@nzila/platform-ontology'

const TENANT = '00000000-0000-0000-0000-000000000001'

function makeSourceRecord(overrides: Partial<SourceRecord> = {}): SourceRecord {
  return {
    id: '00000000-0000-0000-0000-000000000010',
    sourceSystem: 'hubspot',
    sourceCategory: SourceSystemCategories.CRM,
    sourceRecordId: 'hs-contact-42',
    tenantId: TENANT,
    rawPayload: { firstName: 'Ada', lastName: 'Lovelace', email: 'ada@example.com' },
    ingestedAt: '2025-06-01T00:00:00.000Z',
    ...overrides,
  }
}

describe('platform-data-fabric', () => {
  beforeEach(() => {
    resetAdapterRegistry()
  })

  // ── Adapter Registry ──────────────────────────────────────────────────

  describe('adapter registry', () => {
    it('registers and retrieves a source adapter', () => {
      const adapter: SourceAdapter = {
        sourceSystem: 'hubspot',
        category: SourceSystemCategories.CRM,
        fetchRecords: async () => [],
      }
      registerSourceAdapter(adapter)
      expect(getSourceAdapter('hubspot')).toBe(adapter)
    })

    it('returns undefined for unknown adapter', () => {
      expect(getSourceAdapter('unknown')).toBeUndefined()
    })

    it('lists all registered adapters', () => {
      const a: SourceAdapter = {
        sourceSystem: 'hubspot',
        category: SourceSystemCategories.CRM,
        fetchRecords: async () => [],
      }
      const b: SourceAdapter = {
        sourceSystem: 'stripe',
        category: SourceSystemCategories.PAYMENT_PROCESSOR,
        fetchRecords: async () => [],
      }
      registerSourceAdapter(a)
      registerSourceAdapter(b)
      expect(listSourceAdapters()).toHaveLength(2)
    })
  })

  // ── Mapping ───────────────────────────────────────────────────────────

  describe('mapping', () => {
    it('maps a source record to a canonical record', () => {
      const source = makeSourceRecord()
      const canonical = mapSourceRecordToCanonical({
        sourceRecord: source,
        targetEntityType: OntologyEntityTypes.CLIENT,
        entityId: '00000000-0000-0000-0000-000000000099',
        mappingVersion: 1,
        transformFn: (raw) => ({
          displayName: `${raw.firstName} ${raw.lastName}`,
          email: raw.email,
        }),
      })

      expect(canonical.tenantId).toBe(TENANT)
      expect(canonical.entityType).toBe(OntologyEntityTypes.CLIENT)
      expect(canonical.sourceSystem).toBe('hubspot')
      expect(canonical.payload).toEqual({
        displayName: 'Ada Lovelace',
        email: 'ada@example.com',
      })
      expect(canonical.mappingVersion).toBe(1)
      expect(canonical.transformationLog).toHaveLength(1)
    })
  })

  // ── Reconciliation ────────────────────────────────────────────────────

  describe('reconciliation', () => {
    let store: DataFabricStore

    beforeEach(() => {
      store = createInMemoryDataFabricStore()
    })

    it('persists a canonical record and creates lineage', async () => {
      const source = makeSourceRecord()
      const canonical = mapSourceRecordToCanonical({
        sourceRecord: source,
        targetEntityType: OntologyEntityTypes.CLIENT,
        entityId: '00000000-0000-0000-0000-000000000099',
        mappingVersion: 1,
        transformFn: (raw) => ({ name: raw.firstName }),
      })

      const result = await reconcileCanonicalEntity(store, canonical)
      expect(result.persisted).toBe(true)
      expect(result.conflicts).toHaveLength(0)

      const lineage = await getLineageForEntity(
        store,
        OntologyEntityTypes.CLIENT,
        '00000000-0000-0000-0000-000000000099',
      )
      expect(lineage).toHaveLength(1)
      expect(lineage[0].sourceSystem).toBe('hubspot')
    })

    it('detects conflicts from different source systems', async () => {
      const source1 = makeSourceRecord({
        id: '00000000-0000-0000-0000-000000000011',
        sourceSystem: 'hubspot',
        sourceRecordId: 'hs-1',
      })
      const canonical1 = mapSourceRecordToCanonical({
        sourceRecord: source1,
        targetEntityType: OntologyEntityTypes.CLIENT,
        entityId: '00000000-0000-0000-0000-000000000099',
        mappingVersion: 1,
        transformFn: (raw) => ({ name: raw.firstName }),
      })
      await reconcileCanonicalEntity(store, canonical1)

      const source2 = makeSourceRecord({
        id: '00000000-0000-0000-0000-000000000012',
        sourceSystem: 'salesforce',
        sourceRecordId: 'sf-1',
      })
      const canonical2 = mapSourceRecordToCanonical({
        sourceRecord: source2,
        targetEntityType: OntologyEntityTypes.CLIENT,
        entityId: '00000000-0000-0000-0000-000000000099',
        mappingVersion: 1,
        transformFn: (raw) => ({ name: raw.firstName }),
      })
      const result2 = await reconcileCanonicalEntity(store, canonical2)
      expect(result2.conflicts.length).toBeGreaterThan(0)
      expect(result2.conflicts[0].sourceSystemA).toBe('hubspot')
      expect(result2.conflicts[0].sourceSystemB).toBe('salesforce')
    })
  })
})
