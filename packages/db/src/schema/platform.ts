/**
 * Nzila OS — Platform infrastructure schema
 *
 * Tables for platform-level observability that are NOT org-scoped
 * in the traditional sense but reference orgId for filtering.
 */
import {
  pgTable,
  uuid,
  text,
  timestamp,
  integer,
  varchar,
  real,
  jsonb,
  boolean,
  index,
  uniqueIndex,
} from 'drizzle-orm/pg-core'
import { orgs } from './orgs'

// ── Platform Request Metrics ────────────────────────────────────────────────

export const platformRequestMetrics = pgTable('platform_request_metrics', {
  id: uuid('id').primaryKey().defaultRandom(),
  route: varchar('route', { length: 512 }).notNull(),
  orgId: uuid('org_id').notNull().references(() => orgs.id),
  latencyMs: integer('latency_ms').notNull(),
  statusCode: integer('status_code').notNull(),
  recordedAt: timestamp('recorded_at', { withTimezone: true }).notNull().defaultNow(),
})

// ── Isolation Audit Results ─────────────────────────────────────────────────

export const platformIsolationAudits = pgTable('platform_isolation_audits', {
  id: uuid('id').primaryKey().defaultRandom(),
  isolationScore: real('isolation_score').notNull(),
  totalChecks: integer('total_checks').notNull(),
  passedChecks: integer('passed_checks').notNull(),
  violations: jsonb('violations').notNull().default([]),
  auditedAt: timestamp('audited_at', { withTimezone: true }).notNull().defaultNow(),
})

// ── Governance Proof Packs ──────────────────────────────────────────────────

export const platformProofPacks = pgTable('platform_proof_packs', {
  id: uuid('id').primaryKey().defaultRandom(),
  contractTestHash: varchar('contract_test_hash', { length: 128 }).notNull(),
  ciPipelineStatus: varchar('ci_pipeline_status', { length: 64 }).notNull(),
  lastMigrationId: varchar('last_migration_id', { length: 256 }).notNull(),
  auditIntegrityHash: varchar('audit_integrity_hash', { length: 128 }).notNull(),
  secretScanStatus: varchar('secret_scan_status', { length: 64 }).notNull(),
  redTeamSummary: text('red_team_summary').notNull(),
  signatureHash: varchar('signature_hash', { length: 256 }).notNull(),
  immutable: boolean('immutable').notNull().default(true),
  payload: jsonb('payload').notNull().default({}),
  generatedAt: timestamp('generated_at', { withTimezone: true }).notNull().defaultNow(),
})

// ── Idempotency Cache ───────────────────────────────────────────────────────

/**
 * Postgres-backed idempotency cache for multi-instance deployments.
 *
 * Stores cached responses keyed by (orgId + route + idempotencyKey) so that
 * replayed mutation requests return the original response without re-executing
 * the handler. Entries expire after 24 hours via `expires_at`.
 */
export const idempotencyCache = pgTable(
  'idempotency_cache',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    /** Composite cache key: `idempotency:{orgId}:{route}:{idempotencyKey}` */
    cacheKey: varchar('cache_key', { length: 768 }).notNull(),
    /** SHA-256 of the original request body (for payload-mismatch detection) */
    payloadHash: varchar('payload_hash', { length: 128 }).notNull(),
    /** Cached HTTP status code */
    status: integer('status').notNull(),
    /** Cached response body (stringified JSON) */
    body: text('body').notNull(),
    /** Cached response headers */
    headers: jsonb('headers').notNull().default({}),
    /** When this entry was created */
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    /** Auto-expiry timestamp (used by cleanup jobs / queries) */
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  },
  (table) => [
    uniqueIndex('idempotency_cache_key_idx').on(table.cacheKey),
    index('idempotency_cache_expires_idx').on(table.expiresAt),
  ],
)
