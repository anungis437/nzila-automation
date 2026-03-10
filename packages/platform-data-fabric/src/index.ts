/**
 * @nzila/platform-data-fabric
 *
 * Canonical data plane for ingestion, mapping, sync, and reconciliation.
 */

// Types & schemas
export {
  SourceSystemCategories,
  SyncStatuses,
  ResolutionStrategies,
  SourceRecordSchema,
  CanonicalRecordSchema,
} from './types'
export type {
  SourceSystemCategory,
  SyncStatus,
  ResolutionStrategy,
  SourceRecord,
  CanonicalRecord,
  MappingRule,
  SyncJob,
  LineageRecord,
  ConflictRecord,
  SourceAdapter,
  DataFabricStore,
} from './types'

// Adapter registry & operations
export {
  registerSourceAdapter,
  getSourceAdapter,
  listSourceAdapters,
  resetAdapterRegistry,
  mapSourceRecordToCanonical,
  reconcileCanonicalEntity,
  getLineageForEntity,
  resolveConflict,
} from './adapters'
export type { MapSourceRecordOptions } from './adapters'

// In-memory store
export { createInMemoryDataFabricStore } from './memory-store'

// Drizzle schema
export {
  canonicalRecords,
  recordLineage,
  syncJobs,
  syncConflicts,
} from './schema'
