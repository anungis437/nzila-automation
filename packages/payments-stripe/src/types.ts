/**
 * @nzila/payments-stripe — Strict TypeScript types
 */
import type Stripe from 'stripe'

// ── Stripe metadata convention ──────────────────────────────────────────────

export interface NzilaStripeMetadata {
  entity_id: string
  venture_id?: string
  [key: string]: string | undefined
}

// ── Webhook processing ──────────────────────────────────────────────────────

export type SupportedStripeEventType =
  | 'checkout.session.completed'
  | 'payment_intent.succeeded'
  | 'payment_intent.payment_failed'
  | 'charge.refunded'
  | 'charge.dispute.created'
  | 'payout.paid'
  | 'invoice.paid'

export const SUPPORTED_EVENT_TYPES: readonly SupportedStripeEventType[] = [
  'checkout.session.completed',
  'payment_intent.succeeded',
  'payment_intent.payment_failed',
  'charge.refunded',
  'charge.dispute.created',
  'payout.paid',
  'invoice.paid',
] as const

// ── Payment object types ────────────────────────────────────────────────────

export type PaymentObjectType = 'payment_intent' | 'checkout_session' | 'invoice'

// ── Report types ────────────────────────────────────────────────────────────

export type StripeReportType =
  | 'revenue_summary'
  | 'payout_recon'
  | 'refunds_summary'
  | 'disputes_summary'

// ── Normalized event result ─────────────────────────────────────────────────

export interface NormalizedPayment {
  entityId: string
  stripeObjectId: string
  objectType: PaymentObjectType
  status: string
  amountCents: bigint
  currency: string
  ventureId: string | null
  occurredAt: Date
  rawEventId: string
}

export interface NormalizedRefund {
  entityId: string
  refundId: string
  paymentStripeObjectId: string
  amountCents: bigint
  status: string
  occurredAt: Date
}

export interface NormalizedDispute {
  entityId: string
  disputeId: string
  paymentStripeObjectId: string
  amountCents: bigint
  status: string
  reason: string | null
  dueBy: Date | null
  occurredAt: Date
}

export interface NormalizedPayout {
  entityId: string
  payoutId: string
  amountCents: bigint
  currency: string
  status: string
  arrivalDate: string | null
  occurredAt: Date
}

export type NormalizeResult =
  | { kind: 'payment'; data: NormalizedPayment }
  | { kind: 'refund'; data: NormalizedRefund }
  | { kind: 'dispute'; data: NormalizedDispute }
  | { kind: 'payout'; data: NormalizedPayout }
  | { kind: 'skipped'; reason: string }

// ── Webhook verification result ─────────────────────────────────────────────

export interface WebhookVerifyResult {
  event: Stripe.Event
  signatureValid: boolean
}

// ── Report generation input ─────────────────────────────────────────────────

export interface ReportGenerateInput {
  entityId: string
  startDate: string // YYYY-MM-DD
  endDate: string // YYYY-MM-DD
  periodId?: string
  actorClerkUserId: string
}

export interface ReportArtifact {
  reportType: StripeReportType
  blobPath: string
  sha256: string
  sizeBytes: number
  documentId: string
  reportId: string
}
