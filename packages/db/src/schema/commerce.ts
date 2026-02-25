/**
 * Nzila OS — Commerce tables
 *
 * Customers, opportunities, quotes, orders, invoices, fulfillment,
 * payments, credit notes, refunds, disputes.
 *
 * Every table is scoped by entity_id (org identity).
 * Follows existing patterns from operations.ts and equity.ts.
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
  boolean,
} from 'drizzle-orm/pg-core'
import { entities } from './entities'

// ── Commerce Enums ──────────────────────────────────────────────────────────

export const commerceQuoteStatusEnum = pgEnum('commerce_quote_status', [
  'draft',
  'pricing',
  'ready',
  'sent',
  'reviewing',
  'accepted',
  'declined',
  'revised',
  'expired',
  'cancelled',
])

export const commerceOrderStatusEnum = pgEnum('commerce_order_status', [
  'created',
  'confirmed',
  'fulfillment',
  'shipped',
  'delivered',
  'completed',
  'cancelled',
  'return_requested',
  'needs_attention',
])

export const commerceInvoiceStatusEnum = pgEnum('commerce_invoice_status', [
  'draft',
  'issued',
  'sent',
  'partial_paid',
  'paid',
  'overdue',
  'disputed',
  'resolved',
  'refunded',
  'credit_note',
  'cancelled',
])

export const commerceFulfillmentStatusEnum = pgEnum('commerce_fulfillment_status', [
  'pending',
  'allocated',
  'production',
  'quality_check',
  'packaging',
  'shipped',
  'delivered',
  'on_hold',
  'blocked',
  'cancelled',
])

export const commerceOpportunityStatusEnum = pgEnum('commerce_opportunity_status', [
  'lead',
  'qualified',
  'proposal',
  'negotiation',
  'closed_won',
])

export const commercePricingTierEnum = pgEnum('commerce_pricing_tier', [
  'budget',
  'standard',
  'premium',
])

export const commerceApprovalDecisionEnum = pgEnum('commerce_approval_decision', [
  'approved',
  'rejected',
  'deferred',
])

export const commerceEvidenceTypeEnum = pgEnum('commerce_evidence_type', [
  'quote_pdf',
  'approval_record',
  'sync_receipt',
  'delivery_proof',
  'credit_note_pdf',
  'refund_receipt',
  'order_lock_snapshot',
])

export const commerceRefundStatusEnum = pgEnum('commerce_refund_status', [
  'pending',
  'processed',
  'failed',
])

export const commerceDisputeStatusEnum = pgEnum('commerce_dispute_status', [
  'open',
  'investigating',
  'resolved',
  'escalated',
])

export const commerceSyncStatusEnum = pgEnum('commerce_sync_status', [
  'pending',
  'running',
  'completed',
  'failed',
])

// ── 1) commerce_customers ───────────────────────────────────────────────────

export const commerceCustomers = pgTable('commerce_customers', {
  id: uuid('id').primaryKey().defaultRandom(),
  entityId: uuid('entity_id')
    .notNull()
    .references(() => entities.id),
  name: text('name').notNull(),
  email: text('email'),
  phone: text('phone'),
  company: text('company'),
  address: jsonb('address'),
  notes: text('notes'),
  metadata: jsonb('metadata').default({}),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

// ── 2) commerce_opportunities ───────────────────────────────────────────────

export const commerceOpportunities = pgTable('commerce_opportunities', {
  id: uuid('id').primaryKey().defaultRandom(),
  entityId: uuid('entity_id')
    .notNull()
    .references(() => entities.id),
  customerId: uuid('customer_id')
    .notNull()
    .references(() => commerceCustomers.id),
  title: text('title').notNull(),
  description: text('description'),
  estimatedValue: numeric('estimated_value', { precision: 18, scale: 2 }),
  status: commerceOpportunityStatusEnum('status').notNull().default('lead'),
  closedAt: timestamp('closed_at', { withTimezone: true }),
  metadata: jsonb('metadata').default({}),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

// ── 3) commerce_quotes ──────────────────────────────────────────────────────

export const commerceQuotes = pgTable('commerce_quotes', {
  id: uuid('id').primaryKey().defaultRandom(),
  entityId: uuid('entity_id')
    .notNull()
    .references(() => entities.id),
  customerId: uuid('customer_id')
    .notNull()
    .references(() => commerceCustomers.id),
  opportunityId: uuid('opportunity_id').references(() => commerceOpportunities.id),
  ref: varchar('ref', { length: 30 }).notNull(), // e.g. QUO-NZI-000001
  currentVersion: integer('current_version').notNull().default(1),
  status: commerceQuoteStatusEnum('status').notNull().default('draft'),
  pricingTier: commercePricingTierEnum('pricing_tier').notNull().default('standard'),
  currency: varchar('currency', { length: 3 }).notNull().default('CAD'),
  subtotal: numeric('subtotal', { precision: 18, scale: 2 }).notNull().default('0'),
  taxTotal: numeric('tax_total', { precision: 18, scale: 2 }).notNull().default('0'),
  total: numeric('total', { precision: 18, scale: 2 }).notNull().default('0'),
  validUntil: timestamp('valid_until', { withTimezone: true }),
  notes: text('notes'),
  metadata: jsonb('metadata').default({}),
  createdBy: text('created_by').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

// ── 4) commerce_quote_versions ──────────────────────────────────────────────

export const commerceQuoteVersions = pgTable('commerce_quote_versions', {
  id: uuid('id').primaryKey().defaultRandom(),
  entityId: uuid('entity_id')
    .notNull()
    .references(() => entities.id),
  quoteId: uuid('quote_id')
    .notNull()
    .references(() => commerceQuotes.id),
  version: integer('version').notNull(),
  snapshot: jsonb('snapshot').notNull(), // full quote state at this version
  authorId: text('author_id').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

// ── 5) commerce_quote_lines ─────────────────────────────────────────────────

export const commerceQuoteLines = pgTable('commerce_quote_lines', {
  id: uuid('id').primaryKey().defaultRandom(),
  entityId: uuid('entity_id')
    .notNull()
    .references(() => entities.id),
  quoteId: uuid('quote_id')
    .notNull()
    .references(() => commerceQuotes.id),
  description: text('description').notNull(),
  sku: varchar('sku', { length: 50 }),
  quantity: integer('quantity').notNull().default(1),
  unitPrice: numeric('unit_price', { precision: 18, scale: 2 }).notNull(),
  discount: numeric('discount', { precision: 5, scale: 2 }).default('0'),
  lineTotal: numeric('line_total', { precision: 18, scale: 2 }).notNull(),
  sortOrder: integer('sort_order').notNull().default(0),
  metadata: jsonb('metadata').default({}),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

// ── 6) commerce_orders ──────────────────────────────────────────────────────

export const commerceOrders = pgTable('commerce_orders', {
  id: uuid('id').primaryKey().defaultRandom(),
  entityId: uuid('entity_id')
    .notNull()
    .references(() => entities.id),
  customerId: uuid('customer_id')
    .notNull()
    .references(() => commerceCustomers.id),
  quoteId: uuid('quote_id').references(() => commerceQuotes.id),
  ref: varchar('ref', { length: 30 }).notNull(), // e.g. ORD-NZI-000001
  status: commerceOrderStatusEnum('status').notNull().default('created'),
  currency: varchar('currency', { length: 3 }).notNull().default('CAD'),
  subtotal: numeric('subtotal', { precision: 18, scale: 2 }).notNull(),
  taxTotal: numeric('tax_total', { precision: 18, scale: 2 }).notNull(),
  total: numeric('total', { precision: 18, scale: 2 }).notNull(),
  shippingAddress: jsonb('shipping_address'),
  billingAddress: jsonb('billing_address'),
  notes: text('notes'),
  orderLockedAt: timestamp('order_locked_at', { withTimezone: true }),
  metadata: jsonb('metadata').default({}),
  createdBy: text('created_by').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

// ── 7) commerce_order_lines ─────────────────────────────────────────────────

export const commerceOrderLines = pgTable('commerce_order_lines', {
  id: uuid('id').primaryKey().defaultRandom(),
  entityId: uuid('entity_id')
    .notNull()
    .references(() => entities.id),
  orderId: uuid('order_id')
    .notNull()
    .references(() => commerceOrders.id),
  quoteLineId: uuid('quote_line_id').references(() => commerceQuoteLines.id),
  description: text('description').notNull(),
  sku: varchar('sku', { length: 50 }),
  quantity: integer('quantity').notNull(),
  unitPrice: numeric('unit_price', { precision: 18, scale: 2 }).notNull(),
  discount: numeric('discount', { precision: 5, scale: 2 }).default('0'),
  lineTotal: numeric('line_total', { precision: 18, scale: 2 }).notNull(),
  sortOrder: integer('sort_order').notNull().default(0),
  metadata: jsonb('metadata').default({}),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

// ── 8) commerce_invoices ────────────────────────────────────────────────────

export const commerceInvoices = pgTable('commerce_invoices', {
  id: uuid('id').primaryKey().defaultRandom(),
  entityId: uuid('entity_id')
    .notNull()
    .references(() => entities.id),
  orderId: uuid('order_id')
    .notNull()
    .references(() => commerceOrders.id),
  customerId: uuid('customer_id')
    .notNull()
    .references(() => commerceCustomers.id),
  ref: varchar('ref', { length: 30 }).notNull(), // e.g. INV-NZI-000001
  status: commerceInvoiceStatusEnum('status').notNull().default('draft'),
  currency: varchar('currency', { length: 3 }).notNull().default('CAD'),
  subtotal: numeric('subtotal', { precision: 18, scale: 2 }).notNull(),
  taxTotal: numeric('tax_total', { precision: 18, scale: 2 }).notNull(),
  total: numeric('total', { precision: 18, scale: 2 }).notNull(),
  amountPaid: numeric('amount_paid', { precision: 18, scale: 2 }).notNull().default('0'),
  amountDue: numeric('amount_due', { precision: 18, scale: 2 }).notNull(),
  dueDate: timestamp('due_date', { withTimezone: true }),
  issuedAt: timestamp('issued_at', { withTimezone: true }),
  paidAt: timestamp('paid_at', { withTimezone: true }),
  notes: text('notes'),
  metadata: jsonb('metadata').default({}),
  createdBy: text('created_by').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

// ── 9) commerce_invoice_lines ───────────────────────────────────────────────

export const commerceInvoiceLines = pgTable('commerce_invoice_lines', {
  id: uuid('id').primaryKey().defaultRandom(),
  entityId: uuid('entity_id')
    .notNull()
    .references(() => entities.id),
  invoiceId: uuid('invoice_id')
    .notNull()
    .references(() => commerceInvoices.id),
  orderLineId: uuid('order_line_id').references(() => commerceOrderLines.id),
  description: text('description').notNull(),
  quantity: integer('quantity').notNull(),
  unitPrice: numeric('unit_price', { precision: 18, scale: 2 }).notNull(),
  lineTotal: numeric('line_total', { precision: 18, scale: 2 }).notNull(),
  sortOrder: integer('sort_order').notNull().default(0),
  metadata: jsonb('metadata').default({}),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

// ── 10) commerce_fulfillment_tasks ──────────────────────────────────────────

export const commerceFulfillmentTasks = pgTable('commerce_fulfillment_tasks', {
  id: uuid('id').primaryKey().defaultRandom(),
  entityId: uuid('entity_id')
    .notNull()
    .references(() => entities.id),
  orderId: uuid('order_id')
    .notNull()
    .references(() => commerceOrders.id),
  ref: varchar('ref', { length: 30 }).notNull(), // e.g. FUL-NZI-000001
  status: commerceFulfillmentStatusEnum('status').notNull().default('pending'),
  assignedTo: text('assigned_to'),
  notes: text('notes'),
  shippedAt: timestamp('shipped_at', { withTimezone: true }),
  deliveredAt: timestamp('delivered_at', { withTimezone: true }),
  trackingNumber: text('tracking_number'),
  carrier: text('carrier'),
  metadata: jsonb('metadata').default({}),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

// ── 11) commerce_payments ───────────────────────────────────────────────────

export const commercePayments = pgTable('commerce_payments', {
  id: uuid('id').primaryKey().defaultRandom(),
  entityId: uuid('entity_id')
    .notNull()
    .references(() => entities.id),
  invoiceId: uuid('invoice_id')
    .notNull()
    .references(() => commerceInvoices.id),
  amount: numeric('amount', { precision: 18, scale: 2 }).notNull(),
  method: varchar('method', { length: 30 }).notNull(), // stripe, manual, cheque, etc.
  reference: text('reference'), // stripe payment_intent ID, cheque #, etc.
  paidAt: timestamp('paid_at', { withTimezone: true }).notNull(),
  metadata: jsonb('metadata').default({}),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

// ── 12) commerce_credit_notes ───────────────────────────────────────────────

export const commerceCreditNotes = pgTable('commerce_credit_notes', {
  id: uuid('id').primaryKey().defaultRandom(),
  entityId: uuid('entity_id')
    .notNull()
    .references(() => entities.id),
  invoiceId: uuid('invoice_id')
    .notNull()
    .references(() => commerceInvoices.id),
  ref: varchar('ref', { length: 30 }).notNull(), // e.g. CRN-NZI-000001
  amount: numeric('amount', { precision: 18, scale: 2 }).notNull(),
  reason: text('reason').notNull(),
  issuedAt: timestamp('issued_at', { withTimezone: true }).notNull().defaultNow(),
  metadata: jsonb('metadata').default({}),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

// ── 13) commerce_refunds ────────────────────────────────────────────────────

export const commerceRefunds = pgTable('commerce_refunds', {
  id: uuid('id').primaryKey().defaultRandom(),
  entityId: uuid('entity_id')
    .notNull()
    .references(() => entities.id),
  paymentId: uuid('payment_id')
    .notNull()
    .references(() => commercePayments.id),
  invoiceId: uuid('invoice_id')
    .notNull()
    .references(() => commerceInvoices.id),
  amount: numeric('amount', { precision: 18, scale: 2 }).notNull(),
  reason: text('reason').notNull(),
  status: commerceRefundStatusEnum('status').notNull().default('pending'),
  processedAt: timestamp('processed_at', { withTimezone: true }),
  metadata: jsonb('metadata').default({}),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

// ── 14) commerce_disputes ───────────────────────────────────────────────────

export const commerceDisputes = pgTable('commerce_disputes', {
  id: uuid('id').primaryKey().defaultRandom(),
  entityId: uuid('entity_id')
    .notNull()
    .references(() => entities.id),
  invoiceId: uuid('invoice_id')
    .notNull()
    .references(() => commerceInvoices.id),
  reason: text('reason').notNull(),
  description: text('description').notNull(),
  status: commerceDisputeStatusEnum('status').notNull().default('open'),
  resolution: text('resolution'),
  resolvedAt: timestamp('resolved_at', { withTimezone: true }),
  metadata: jsonb('metadata').default({}),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

// ── 15) commerce_evidence_artifacts ─────────────────────────────────────────

export const commerceEvidenceArtifacts = pgTable('commerce_evidence_artifacts', {
  id: uuid('id').primaryKey().defaultRandom(),
  entityId: uuid('entity_id')
    .notNull()
    .references(() => entities.id),
  type: commerceEvidenceTypeEnum('type').notNull(),
  targetEntityType: text('target_entity_type').notNull(), // quote, order, invoice, etc.
  targetEntityId: uuid('target_entity_id').notNull(),
  storageKey: text('storage_key').notNull(), // blob path
  hash: text('hash').notNull(), // SHA-256
  metadata: jsonb('metadata').default({}),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

// ── 16) commerce_sync_jobs ──────────────────────────────────────────────────

export const commerceSyncJobs = pgTable('commerce_sync_jobs', {
  id: uuid('id').primaryKey().defaultRandom(),
  entityId: uuid('entity_id')
    .notNull()
    .references(() => entities.id),
  provider: varchar('provider', { length: 30 }).notNull(), // qbo, stripe, etc.
  type: varchar('type', { length: 30 }).notNull(), // invoice_sync, payment_sync, etc.
  status: commerceSyncStatusEnum('status').notNull().default('pending'),
  payload: jsonb('payload').notNull().default({}),
  attempts: integer('attempts').notNull().default(0),
  lastError: text('last_error'),
  metadata: jsonb('metadata').default({}),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

// ── 17) commerce_sync_receipts ──────────────────────────────────────────────

export const commerceSyncReceipts = pgTable('commerce_sync_receipts', {
  id: uuid('id').primaryKey().defaultRandom(),
  entityId: uuid('entity_id')
    .notNull()
    .references(() => entities.id),
  syncJobId: uuid('sync_job_id')
    .notNull()
    .references(() => commerceSyncJobs.id),
  provider: varchar('provider', { length: 30 }).notNull(),
  recordsSynced: integer('records_synced').notNull().default(0),
  recordsFailed: integer('records_failed').notNull().default(0),
  snapshot: jsonb('snapshot').default({}),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})
