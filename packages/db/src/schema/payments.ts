/**
 * Nzila OS — Stripe payments tables
 *
 * Webhook event store, normalized payments, refunds, disputes, payouts,
 * Stripe connections, and report artifacts.
 *
 * All tables are entity-scoped via orgId for multi-entity support.
 */
import {
  pgTable,
  uuid,
  text,
  timestamp,
  jsonb,
  pgEnum,
  boolean,
  bigint,
  varchar,
  date,
  uniqueIndex,
} from 'drizzle-orm/pg-core'
import { orgs } from './orgs'
import { documents } from './operations'

// ── Enums ───────────────────────────────────────────────────────────────────

export const stripeConnectionStatusEnum = pgEnum('stripe_connection_status', [
  'connected',
  'error',
])

export const stripeEventProcessingStatusEnum = pgEnum('stripe_event_processing_status', [
  'received',
  'processed',
  'failed',
])

export const stripePaymentObjectTypeEnum = pgEnum('stripe_payment_object_type', [
  'payment_intent',
  'checkout_session',
  'invoice',
])

export const stripeRefundStatusEnum = pgEnum('stripe_refund_status', [
  'pending_approval',
  'approved',
  'executed',
  'denied',
  'failed',
])

export const stripeDisputeStatusEnum = pgEnum('stripe_dispute_status', [
  'warning_needs_response',
  'warning_under_review',
  'warning_closed',
  'needs_response',
  'under_review',
  'charge_refunded',
  'won',
  'lost',
])

export const stripePayoutStatusEnum = pgEnum('stripe_payout_status', [
  'paid',
  'pending',
  'in_transit',
  'canceled',
  'failed',
])

export const stripeReportTypeEnum = pgEnum('stripe_report_type', [
  'revenue_summary',
  'payout_recon',
  'refunds_summary',
  'disputes_summary',
])

export const stripeSubscriptionStatusEnum = pgEnum('stripe_subscription_status', [
  'incomplete',
  'incomplete_expired',
  'trialing',
  'active',
  'past_due',
  'canceled',
  'unpaid',
  'paused',
])

// ── 1) stripe_connections ───────────────────────────────────────────────────

export const stripeConnections = pgTable('stripe_connections', {
  id: uuid('id').primaryKey().defaultRandom(),
  orgId: uuid('org_id')
    .notNull()
    .references(() => orgs.id),
  accountId: text('account_id').notNull(),
  livemode: boolean('livemode').notNull().default(false),
  status: stripeConnectionStatusEnum('status').notNull().default('connected'),
  connectedBy: text('connected_by').notNull(), // clerk_user_id
  connectedAt: timestamp('connected_at', { withTimezone: true }).notNull().defaultNow(),
  lastEventAt: timestamp('last_event_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

// ── 2) stripe_webhook_events (APPEND-ONLY) ──────────────────────────────────

export const stripeWebhookEvents = pgTable(
  'stripe_webhook_events',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    orgId: uuid('org_id')
      .notNull()
      .references(() => orgs.id),
    stripeEventId: text('stripe_event_id').notNull(),
    type: text('type').notNull(),
    apiVersion: text('api_version'),
    livemode: boolean('livemode').notNull(),
    created: timestamp('created', { withTimezone: true }).notNull(),
    receivedAt: timestamp('received_at', { withTimezone: true }).notNull().defaultNow(),
    payloadJson: jsonb('payload_json').notNull(),
    signatureValid: boolean('signature_valid').notNull(),
    processingStatus: stripeEventProcessingStatusEnum('processing_status')
      .notNull()
      .default('received'),
    error: text('error'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [uniqueIndex('stripe_webhook_events_stripe_event_id_idx').on(table.stripeEventId)],
)

// ── 3) stripe_payments ──────────────────────────────────────────────────────

export const stripePayments = pgTable('stripe_payments', {
  id: uuid('id').primaryKey().defaultRandom(),
  orgId: uuid('org_id')
    .notNull()
    .references(() => orgs.id),
  stripeObjectId: text('stripe_object_id').notNull(),
  objectType: stripePaymentObjectTypeEnum('object_type').notNull(),
  status: text('status').notNull(),
  amountCents: bigint('amount_cents', { mode: 'bigint' }).notNull(),
  currency: varchar('currency', { length: 3 }).notNull().default('CAD'),
  ventureId: text('venture_id'),
  occurredAt: timestamp('occurred_at', { withTimezone: true }).notNull(),
  rawEventId: uuid('raw_event_id')
    .notNull()
    .references(() => stripeWebhookEvents.id),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

// ── 4) stripe_refunds ───────────────────────────────────────────────────────

export const stripeRefunds = pgTable('stripe_refunds', {
  id: uuid('id').primaryKey().defaultRandom(),
  orgId: uuid('org_id')
    .notNull()
    .references(() => orgs.id),
  refundId: text('refund_id'),
  paymentId: uuid('payment_id').references(() => stripePayments.id),
  amountCents: bigint('amount_cents', { mode: 'bigint' }).notNull(),
  status: stripeRefundStatusEnum('status').notNull().default('pending_approval'),
  requestedBy: text('requested_by').notNull(), // clerk_user_id
  approvedBy: text('approved_by'), // clerk_user_id
  approvedAt: timestamp('approved_at', { withTimezone: true }),
  occurredAt: timestamp('occurred_at', { withTimezone: true }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

// ── 5) stripe_disputes ──────────────────────────────────────────────────────

export const stripeDisputes = pgTable('stripe_disputes', {
  id: uuid('id').primaryKey().defaultRandom(),
  orgId: uuid('org_id')
    .notNull()
    .references(() => orgs.id),
  disputeId: text('dispute_id').notNull(),
  paymentId: uuid('payment_id').references(() => stripePayments.id),
  amountCents: bigint('amount_cents', { mode: 'bigint' }).notNull(),
  status: text('status').notNull(),
  reason: text('reason'),
  dueBy: timestamp('due_by', { withTimezone: true }),
  occurredAt: timestamp('occurred_at', { withTimezone: true }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

// ── 6) stripe_payouts ───────────────────────────────────────────────────────

export const stripePayouts = pgTable('stripe_payouts', {
  id: uuid('id').primaryKey().defaultRandom(),
  orgId: uuid('org_id')
    .notNull()
    .references(() => orgs.id),
  payoutId: text('payout_id').notNull(),
  amountCents: bigint('amount_cents', { mode: 'bigint' }).notNull(),
  currency: varchar('currency', { length: 3 }).notNull().default('CAD'),
  status: stripePayoutStatusEnum('status').notNull(),
  arrivalDate: date('arrival_date'),
  occurredAt: timestamp('occurred_at', { withTimezone: true }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

// ── 7) stripe_reports ───────────────────────────────────────────────────────

export const stripeReports = pgTable('stripe_reports', {
  id: uuid('id').primaryKey().defaultRandom(),
  orgId: uuid('org_id')
    .notNull()
    .references(() => orgs.id),
  periodId: text('period_id'),
  reportType: stripeReportTypeEnum('report_type').notNull(),
  startDate: date('start_date').notNull(),
  endDate: date('end_date').notNull(),
  documentId: uuid('document_id').references(() => documents.id),
  sha256: text('sha256').notNull(),
  generatedAt: timestamp('generated_at', { withTimezone: true }).notNull().defaultNow(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

// ── 8) stripe_subscriptions ─────────────────────────────────────────────────

export const stripeSubscriptions = pgTable('stripe_subscriptions', {
  id: uuid('id').primaryKey().defaultRandom(),
  orgId: uuid('org_id')
    .notNull()
    .references(() => orgs.id),
  // Stripe object IDs
  stripeCustomerId: text('stripe_customer_id').notNull(),
  stripeSubscriptionId: text('stripe_subscription_id').notNull(),
  stripePriceId: text('stripe_price_id').notNull(),
  stripeProductId: text('stripe_product_id'),
  // Plan info (denormalised for quick reads)
  planName: text('plan_name'),
  planInterval: text('plan_interval'), // 'month' | 'year'
  amountCents: bigint('amount_cents', { mode: 'bigint' }),
  currency: varchar('currency', { length: 3 }).notNull().default('CAD'),
  // Status tracking
  status: stripeSubscriptionStatusEnum('status').notNull().default('incomplete'),
  currentPeriodStart: timestamp('current_period_start', { withTimezone: true }),
  currentPeriodEnd: timestamp('current_period_end', { withTimezone: true }),
  cancelAtPeriodEnd: boolean('cancel_at_period_end').notNull().default(false),
  canceledAt: timestamp('canceled_at', { withTimezone: true }),
  trialStart: timestamp('trial_start', { withTimezone: true }),
  trialEnd: timestamp('trial_end', { withTimezone: true }),
  // Audit
  createdBy: text('created_by').notNull(), // clerk_user_id
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  uniqueIndex('stripe_subscriptions_stripe_id_idx').on(table.stripeSubscriptionId),
])
