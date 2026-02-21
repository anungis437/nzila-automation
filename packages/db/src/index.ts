export { db, type Database } from './client'
export { rawDb } from './raw'
export {
  createScopedDb,
  createFullScopedDb,
  type ScopedDb,
  type ReadOnlyScopedDb,
  type ScopedDbOptions,
  ScopedDbError,
  ReadOnlyViolationError,
} from './scoped'
export {
  withAudit,
  createAuditedScopedDb,
  type AuditContext,
  type AuditedScopedDbOptions,
  type AuditEvent,
  type AuditEmitter,
  type AuditedScopedDb,
} from './audit'
export {
  ORG_SCOPED_TABLES,
  ORG_SCOPED_TABLE_SET,
  NON_ORG_SCOPED_TABLES,
  NON_ORG_SCOPED_TABLE_SET,
  type OrgScopedTableName,
} from './org-registry'
export * from './schema'
