/**
 * @nzila/platform-event-fabric — Drizzle Schema
 *
 * Persistence tables for platform events and subscriptions.
 */
import {
  pgTable,
  uuid,
  varchar,
  timestamp,
  jsonb,
  integer,
  boolean,
  index,
} from 'drizzle-orm/pg-core'

// ── Platform Events ─────────────────────────────────────────────────────────

export const platformEvents = pgTable(
  'platform_events',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    type: varchar('type', { length: 128 }).notNull(),
    payload: jsonb('payload').notNull().default({}),
    tenantId: uuid('tenant_id').notNull(),
    orgId: uuid('org_id'),
    actorId: varchar('actor_id', { length: 256 }).notNull(),
    correlationId: uuid('correlation_id').notNull(),
    causationId: uuid('causation_id'),
    source: varchar('source', { length: 256 }).notNull(),
    version: integer('version').notNull().default(1),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('platform_events_tenant_idx').on(table.tenantId),
    index('platform_events_type_idx').on(table.type),
    index('platform_events_correlation_idx').on(table.correlationId),
    index('platform_events_created_idx').on(table.createdAt),
    index('platform_events_type_tenant_idx').on(table.type, table.tenantId),
  ],
)

// ── Event Subscriptions (for persistent subscribers) ────────────────────────

export const eventSubscriptions = pgTable(
  'event_subscriptions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    eventType: varchar('event_type', { length: 128 }).notNull(),
    subscriberId: varchar('subscriber_id', { length: 256 }).notNull(),
    endpoint: varchar('endpoint', { length: 1024 }).notNull(),
    active: boolean('active').notNull().default(true),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('event_subs_type_idx').on(table.eventType),
    index('event_subs_subscriber_idx').on(table.subscriberId),
  ],
)
