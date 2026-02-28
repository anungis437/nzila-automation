/**
 * @nzila/commerce-db — Commerce Data Access Layer
 *
 * Org-isolated, audited repository functions for every commerce table.
 *
 * Usage:
 *   import { createCustomer, listQuotes, getOrderById } from '@nzila/commerce-db'
 *
 * Every exported function requires a context parameter (ctx) that
 * carries orgId (org scope) and actorId (audit attribution).
 *
 * Reads  → use ReadOnlyScopedDb (auto-filtered by org_id)
 * Writes → use AuditedScopedDb  (auto-filtered + hash-chained audit)
 *
 * @module @nzila/commerce-db
 */
export type {
  CommerceDbContext,
  CommerceReadContext,
  PaginationOpts,
  PaginatedResult,
  InsertShape,
  UpdateShape,
} from './types'

export * from './repositories'
