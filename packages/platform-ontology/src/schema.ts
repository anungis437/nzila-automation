/**
 * @nzila/platform-ontology — Drizzle schema for ontology tables
 *
 * Defines the persistence layer for ontology entities and relationships.
 * Used by @nzila/db to include in the platform schema.
 */
import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  jsonb,
  index,
  uniqueIndex,
} from 'drizzle-orm/pg-core'

// ── Ontology Entities ───────────────────────────────────────────────────────

export const ontologyEntities = pgTable(
  'ontology_entities',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id').notNull(),
    entityType: varchar('entity_type', { length: 64 }).notNull(),
    canonicalName: varchar('canonical_name', { length: 512 }).notNull(),
    aliases: jsonb('aliases').notNull().default([]),
    status: varchar('status', { length: 32 }).notNull().default('active'),
    tags: jsonb('tags').notNull().default([]),
    sourceSystems: jsonb('source_systems').notNull().default([]),
    metadata: jsonb('metadata').notNull().default({}),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('ontology_entities_tenant_idx').on(table.tenantId),
    index('ontology_entities_type_idx').on(table.entityType),
    index('ontology_entities_tenant_type_idx').on(table.tenantId, table.entityType),
    index('ontology_entities_status_idx').on(table.status),
  ],
)

// ── Ontology Relationships ──────────────────────────────────────────────────

export const ontologyRelationships = pgTable(
  'ontology_relationships',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id').notNull(),
    sourceEntityType: varchar('source_entity_type', { length: 64 }).notNull(),
    sourceEntityId: uuid('source_entity_id').notNull(),
    targetEntityType: varchar('target_entity_type', { length: 64 }).notNull(),
    targetEntityId: uuid('target_entity_id').notNull(),
    relationshipType: varchar('relationship_type', { length: 64 }).notNull(),
    metadata: jsonb('metadata').notNull().default({}),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('ontology_rel_tenant_idx').on(table.tenantId),
    index('ontology_rel_source_idx').on(table.sourceEntityType, table.sourceEntityId),
    index('ontology_rel_target_idx').on(table.targetEntityType, table.targetEntityId),
    uniqueIndex('ontology_rel_unique_idx').on(
      table.tenantId,
      table.sourceEntityId,
      table.targetEntityId,
      table.relationshipType,
    ),
  ],
)
