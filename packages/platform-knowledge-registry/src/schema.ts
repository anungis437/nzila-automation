/**
 * @nzila/platform-knowledge-registry — Drizzle Schema
 */
import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  jsonb,
  integer,
  index,
} from 'drizzle-orm/pg-core'

// ── Knowledge Assets ────────────────────────────────────────────────────────

export const knowledgeAssets = pgTable(
  'knowledge_assets',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantScope: varchar('tenant_scope', { length: 256 }).notNull(),
    domainScope: varchar('domain_scope', { length: 256 }).notNull(),
    title: varchar('title', { length: 512 }).notNull(),
    knowledgeType: varchar('knowledge_type', { length: 64 }).notNull(),
    source: varchar('source', { length: 256 }).notNull(),
    version: integer('version').notNull().default(1),
    effectiveDate: timestamp('effective_date', { withTimezone: true }).notNull(),
    status: varchar('status', { length: 32 }).notNull().default('active'),
    tags: jsonb('tags').notNull().default([]),
    structuredPayload: jsonb('structured_payload').notNull().default({}),
    textPayload: text('text_payload').notNull().default(''),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('knowledge_assets_tenant_idx').on(table.tenantScope),
    index('knowledge_assets_domain_idx').on(table.domainScope),
    index('knowledge_assets_type_idx').on(table.knowledgeType),
    index('knowledge_assets_status_idx').on(table.status),
    index('knowledge_assets_tenant_domain_idx').on(table.tenantScope, table.domainScope),
  ],
)

// ── Knowledge Versions ──────────────────────────────────────────────────────

export const knowledgeVersions = pgTable(
  'knowledge_versions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    assetId: uuid('asset_id').notNull().references(() => knowledgeAssets.id),
    version: integer('version').notNull(),
    structuredPayload: jsonb('structured_payload').notNull().default({}),
    textPayload: text('text_payload').notNull().default(''),
    changedBy: varchar('changed_by', { length: 256 }).notNull(),
    changeReason: varchar('change_reason', { length: 1024 }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('knowledge_versions_asset_idx').on(table.assetId),
    index('knowledge_versions_asset_version_idx').on(table.assetId, table.version),
  ],
)
