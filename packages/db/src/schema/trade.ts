/**
 * Nzila OS — Trade tables
 *
 * Core trade entities: parties, listings, deals, quotes, financing,
 * shipments, documents, commissions.
 * Cars vertical: vehicle_listings, vehicle_docs.
 *
 * Every table is scoped by entity_id (org identity).
 * Follows existing patterns from commerce.ts and entities.ts.
 */
import {
  pgTable,
  uuid,
  text,
  timestamp,
  jsonb,
  pgEnum,
  integer,
  numeric,
  varchar,
} from 'drizzle-orm/pg-core'
import { entities } from './entities'

// ══════════════════════════════════════════════════════════════════════════════
// ── Trade Enums ──────────────────────────────────────────────────────────────
// ══════════════════════════════════════════════════════════════════════════════

export const tradePartyRoleEnum = pgEnum('trade_party_role', [
  'seller',
  'buyer',
  'broker',
  'agent',
])

export const tradePartyStatusEnum = pgEnum('trade_party_status', [
  'active',
  'suspended',
  'archived',
])

export const tradeListingTypeEnum = pgEnum('trade_listing_type', [
  'generic',
  'vehicle',
])

export const tradeListingStatusEnum = pgEnum('trade_listing_status', [
  'draft',
  'active',
  'reserved',
  'sold',
  'archived',
])

export const tradeMediaTypeEnum = pgEnum('trade_media_type', [
  'image',
  'video',
  'document',
])

export const tradeDealStageEnum = pgEnum('trade_deal_stage', [
  'lead',
  'qualified',
  'quoted',
  'accepted',
  'funded',
  'shipped',
  'delivered',
  'closed',
  'cancelled',
])

export const tradeQuoteStatusEnum = pgEnum('trade_quote_status', [
  'draft',
  'sent',
  'accepted',
  'declined',
  'expired',
  'revised',
])

export const tradeFinancingStatusEnum = pgEnum('trade_financing_status', [
  'proposed',
  'accepted',
  'active',
  'completed',
  'cancelled',
])

export const tradeShipmentStatusEnum = pgEnum('trade_shipment_status', [
  'pending',
  'booked',
  'in_transit',
  'customs',
  'delivered',
  'cancelled',
])

export const tradeDocTypeEnum = pgEnum('trade_doc_type', [
  'bill_of_sale',
  'invoice',
  'packing_list',
  'certificate_of_origin',
  'customs_declaration',
  'inspection_report',
  'export_certificate',
  'insurance',
  'other',
])

export const tradeCommissionStatusEnum = pgEnum('trade_commission_status', [
  'pending',
  'previewed',
  'finalized',
  'paid',
  'cancelled',
])

export const tradeEvidenceTypeEnum = pgEnum('trade_evidence_type', [
  'quote_acceptance',
  'shipment_docs',
  'commission_settlement',
  'deal_closure',
])

// ── Cars Vertical Enums ─────────────────────────────────────────────────────

export const vehicleConditionEnum = pgEnum('vehicle_condition', [
  'new',
  'used',
  'certified_pre_owned',
  'salvage',
])

export const vehicleTransmissionEnum = pgEnum('vehicle_transmission', [
  'automatic',
  'manual',
  'cvt',
])

export const vehicleDrivetrainEnum = pgEnum('vehicle_drivetrain', [
  'fwd',
  'rwd',
  'awd',
  '4wd',
])

export const vehicleFuelTypeEnum = pgEnum('vehicle_fuel_type', [
  'gasoline',
  'diesel',
  'electric',
  'hybrid',
  'plugin_hybrid',
])

export const vehicleDocTypeEnum = pgEnum('vehicle_doc_type', [
  'bill_of_sale',
  'export_certificate',
  'inspection_report',
  'title',
  'carfax',
  'emissions_test',
  'safety_inspection',
  'customs_form',
])

// ══════════════════════════════════════════════════════════════════════════════
// ── Core Trade Tables ────────────────────────────────────────────────────────
// ══════════════════════════════════════════════════════════════════════════════

// ── 1) trade_parties ────────────────────────────────────────────────────────

export const tradeParties = pgTable('trade_parties', {
  id: uuid('id').primaryKey().defaultRandom(),
  entityId: uuid('entity_id')
    .notNull()
    .references(() => entities.id),
  role: tradePartyRoleEnum('role').notNull(),
  name: text('name').notNull(),
  contactEmail: text('contact_email').notNull(),
  contactPhone: text('contact_phone'),
  companyName: text('company_name').notNull(),
  country: varchar('country', { length: 3 }).notNull(),
  metadata: jsonb('metadata').default({}),
  status: tradePartyStatusEnum('status').notNull().default('active'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

// ── 2) trade_listings ───────────────────────────────────────────────────────

export const tradeListings = pgTable('trade_listings', {
  id: uuid('id').primaryKey().defaultRandom(),
  entityId: uuid('entity_id')
    .notNull()
    .references(() => entities.id),
  partyId: uuid('party_id')
    .notNull()
    .references(() => tradeParties.id),
  listingType: tradeListingTypeEnum('listing_type').notNull().default('generic'),
  title: text('title').notNull(),
  description: text('description').default(''),
  currency: varchar('currency', { length: 3 }).notNull(),
  askingPrice: numeric('asking_price', { precision: 18, scale: 2 }).notNull(),
  quantity: integer('quantity').notNull().default(1),
  status: tradeListingStatusEnum('status').notNull().default('draft'),
  metadata: jsonb('metadata').default({}),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

// ── 3) trade_listing_media ──────────────────────────────────────────────────

export const tradeListingMedia = pgTable('trade_listing_media', {
  id: uuid('id').primaryKey().defaultRandom(),
  entityId: uuid('entity_id')
    .notNull()
    .references(() => entities.id),
  listingId: uuid('listing_id')
    .notNull()
    .references(() => tradeListings.id),
  mediaType: tradeMediaTypeEnum('media_type').notNull(),
  storageKey: text('storage_key').notNull(),
  sortOrder: integer('sort_order').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

// ── 4) trade_deals ──────────────────────────────────────────────────────────

export const tradeDeals = pgTable('trade_deals', {
  id: uuid('id').primaryKey().defaultRandom(),
  entityId: uuid('entity_id')
    .notNull()
    .references(() => entities.id),
  refNumber: varchar('ref_number', { length: 30 }).notNull(),
  sellerPartyId: uuid('seller_party_id')
    .notNull()
    .references(() => tradeParties.id),
  buyerPartyId: uuid('buyer_party_id')
    .notNull()
    .references(() => tradeParties.id),
  listingId: uuid('listing_id').references(() => tradeListings.id),
  stage: tradeDealStageEnum('stage').notNull().default('lead'),
  totalValue: numeric('total_value', { precision: 18, scale: 2 }).notNull(),
  currency: varchar('currency', { length: 3 }).notNull(),
  notes: text('notes'),
  metadata: jsonb('metadata').default({}),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

// ── 5) trade_quotes ─────────────────────────────────────────────────────────

export const tradeQuotes = pgTable('trade_quotes', {
  id: uuid('id').primaryKey().defaultRandom(),
  entityId: uuid('entity_id')
    .notNull()
    .references(() => entities.id),
  dealId: uuid('deal_id')
    .notNull()
    .references(() => tradeDeals.id),
  terms: jsonb('terms').notNull(),
  unitPrice: numeric('unit_price', { precision: 18, scale: 2 }).notNull(),
  quantity: integer('quantity').notNull(),
  total: numeric('total', { precision: 18, scale: 2 }).notNull(),
  currency: varchar('currency', { length: 3 }).notNull(),
  validUntil: timestamp('valid_until', { withTimezone: true }),
  status: tradeQuoteStatusEnum('status').notNull().default('draft'),
  acceptedAt: timestamp('accepted_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

// ── 6) trade_financing_terms ────────────────────────────────────────────────

export const tradeFinancingTerms = pgTable('trade_financing_terms', {
  id: uuid('id').primaryKey().defaultRandom(),
  entityId: uuid('entity_id')
    .notNull()
    .references(() => entities.id),
  dealId: uuid('deal_id')
    .notNull()
    .references(() => tradeDeals.id),
  terms: jsonb('terms').notNull(),
  provider: text('provider'),
  status: tradeFinancingStatusEnum('status').notNull().default('proposed'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

// ── 7) trade_shipments ──────────────────────────────────────────────────────

export const tradeShipments = pgTable('trade_shipments', {
  id: uuid('id').primaryKey().defaultRandom(),
  entityId: uuid('entity_id')
    .notNull()
    .references(() => entities.id),
  dealId: uuid('deal_id')
    .notNull()
    .references(() => tradeDeals.id),
  originCountry: varchar('origin_country', { length: 3 }).notNull(),
  destinationCountry: varchar('destination_country', { length: 3 }).notNull(),
  lane: text('lane'),
  carrier: text('carrier'),
  trackingNumber: text('tracking_number'),
  status: tradeShipmentStatusEnum('status').notNull().default('pending'),
  milestones: jsonb('milestones').default([]),
  estimatedDeparture: timestamp('estimated_departure', { withTimezone: true }),
  estimatedArrival: timestamp('estimated_arrival', { withTimezone: true }),
  actualDeparture: timestamp('actual_departure', { withTimezone: true }),
  actualArrival: timestamp('actual_arrival', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

// ── 8) trade_documents ──────────────────────────────────────────────────────

export const tradeDocuments = pgTable('trade_documents', {
  id: uuid('id').primaryKey().defaultRandom(),
  entityId: uuid('entity_id')
    .notNull()
    .references(() => entities.id),
  dealId: uuid('deal_id')
    .notNull()
    .references(() => tradeDeals.id),
  docType: tradeDocTypeEnum('doc_type').notNull(),
  title: text('title').notNull(),
  storageKey: text('storage_key').notNull(),
  contentHash: text('content_hash').notNull(),
  uploadedBy: uuid('uploaded_by').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

// ── 9) trade_commissions ────────────────────────────────────────────────────

export const tradeCommissions = pgTable('trade_commissions', {
  id: uuid('id').primaryKey().defaultRandom(),
  entityId: uuid('entity_id')
    .notNull()
    .references(() => entities.id),
  dealId: uuid('deal_id')
    .notNull()
    .references(() => tradeDeals.id),
  partyId: uuid('party_id')
    .notNull()
    .references(() => tradeParties.id),
  policy: jsonb('policy').notNull(),
  calculatedAmount: numeric('calculated_amount', { precision: 18, scale: 2 }),
  currency: varchar('currency', { length: 3 }).notNull(),
  status: tradeCommissionStatusEnum('status').notNull().default('pending'),
  finalizedAt: timestamp('finalized_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

// ── 10) trade_evidence_artifacts ────────────────────────────────────────────

export const tradeEvidenceArtifacts = pgTable('trade_evidence_artifacts', {
  id: uuid('id').primaryKey().defaultRandom(),
  entityId: uuid('entity_id')
    .notNull()
    .references(() => entities.id),
  dealId: uuid('deal_id')
    .notNull()
    .references(() => tradeDeals.id),
  evidenceType: tradeEvidenceTypeEnum('evidence_type').notNull(),
  packDigest: text('pack_digest').notNull(),
  artifactsMerkleRoot: text('artifacts_merkle_root').notNull(),
  metadata: jsonb('metadata').default({}),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

// ══════════════════════════════════════════════════════════════════════════════
// ── Cars Vertical Tables ─────────────────────────────────────────────────────
// ══════════════════════════════════════════════════════════════════════════════

// ── 11) trade_vehicle_listings ──────────────────────────────────────────────

export const tradeVehicleListings = pgTable('trade_vehicle_listings', {
  id: uuid('id').primaryKey().defaultRandom(),
  entityId: uuid('entity_id')
    .notNull()
    .references(() => entities.id),
  listingId: uuid('listing_id')
    .notNull()
    .references(() => tradeListings.id),
  vin: varchar('vin', { length: 17 }).notNull(),
  year: integer('year').notNull(),
  make: text('make').notNull(),
  model: text('model').notNull(),
  trim: text('trim'),
  mileage: integer('mileage').notNull(),
  condition: vehicleConditionEnum('condition').notNull(),
  exteriorColor: text('exterior_color'),
  interiorColor: text('interior_color'),
  engineType: text('engine_type'),
  transmission: vehicleTransmissionEnum('transmission'),
  drivetrain: vehicleDrivetrainEnum('drivetrain'),
  fuelType: vehicleFuelTypeEnum('fuel_type'),
  metadata: jsonb('metadata').default({}),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

// ── 12) trade_vehicle_docs ──────────────────────────────────────────────────

export const tradeVehicleDocs = pgTable('trade_vehicle_docs', {
  id: uuid('id').primaryKey().defaultRandom(),
  entityId: uuid('entity_id')
    .notNull()
    .references(() => entities.id),
  listingId: uuid('listing_id')
    .notNull()
    .references(() => tradeListings.id),
  docType: vehicleDocTypeEnum('doc_type').notNull(),
  storageKey: text('storage_key').notNull(),
  contentHash: text('content_hash').notNull(),
  uploadedBy: uuid('uploaded_by').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})
