/**
 * @nzila/payments-stripe — Event normalizer
 *
 * Maps raw Stripe webhook events into normalized DB rows:
 *   - stripePayments
 *   - stripeRefunds
 *   - stripeDisputes
 *   - stripePayouts
 */
import type Stripe from 'stripe'
import { db } from '@nzila/db'
import {
  stripePayments,
  stripeRefunds,
  stripeDisputes,
  stripePayouts,
  stripeWebhookEvents,
} from '@nzila/db/schema'
import { eq } from 'drizzle-orm'
import type {
  NormalizeResult,
  NormalizedPayment,
  NormalizedRefund,
  NormalizedDispute,
  NormalizedPayout,
  SupportedStripeEventType,
} from './types'
import { SUPPORTED_EVENT_TYPES } from './types'

// ── Main normalizer entry ───────────────────────────────────────────────────

/**
 * Normalize a Stripe event and persist derived rows.
 *
 * @param event The parsed Stripe event
 * @param webhookEventId The DB id of the stripeWebhookEvents row
 * @param entityId The entity this event belongs to
 * @returns The normalization result
 */
export async function normalizeAndPersist(
  event: Stripe.Event,
  webhookEventId: string,
  entityId: string,
): Promise<NormalizeResult> {
  const eventType = event.type as string

  if (!SUPPORTED_EVENT_TYPES.includes(eventType as SupportedStripeEventType)) {
    return { kind: 'skipped', reason: `Unsupported event type: ${eventType}` }
  }

  const result = normalizeEvent(event, webhookEventId, entityId)

  if (result.kind === 'skipped') {
    return result
  }

  // Persist the normalized row
  switch (result.kind) {
    case 'payment':
      await persistPayment(result.data)
      break
    case 'refund':
      await persistRefund(result.data, entityId)
      break
    case 'dispute':
      await persistDispute(result.data)
      break
    case 'payout':
      await persistPayout(result.data)
      break
  }

  // Mark the webhook event as processed
  await db
    .update(stripeWebhookEvents)
    .set({ processingStatus: 'processed' })
    .where(eq(stripeWebhookEvents.id, webhookEventId))

  return result
}

// ── Event → normalized type mapping ─────────────────────────────────────────

function normalizeEvent(
  event: Stripe.Event,
  webhookEventId: string,
  entityId: string,
): NormalizeResult {
  const obj = event.data.object as unknown as Record<string, unknown>

  switch (event.type) {
    case 'checkout.session.completed':
      return normalizeCheckoutSession(obj, webhookEventId, entityId, event)

    case 'payment_intent.succeeded':
    case 'payment_intent.payment_failed':
      return normalizePaymentIntent(obj, webhookEventId, entityId, event)

    case 'charge.refunded':
      return normalizeChargeRefunded(obj, entityId, event)

    case 'charge.dispute.created':
      return normalizeDisputeCreated(obj, entityId, event)

    case 'payout.paid':
      return normalizePayoutPaid(obj, entityId, event)

    case 'invoice.paid':
      return normalizeInvoicePaid(obj, webhookEventId, entityId, event)

    default:
      return { kind: 'skipped', reason: `Unhandled event type: ${event.type}` }
  }
}

// ── Normalizers ─────────────────────────────────────────────────────────────

function normalizeCheckoutSession(
  obj: Record<string, unknown>,
  webhookEventId: string,
  entityId: string,
  event: Stripe.Event,
): NormalizeResult {
  const meta = (obj.metadata as Record<string, string>) ?? {}
  const data: NormalizedPayment = {
    entityId,
    stripeObjectId: obj.id as string,
    objectType: 'checkout_session',
    status: obj.status as string ?? 'complete',
    amountCents: BigInt((obj.amount_total as number) ?? 0),
    currency: ((obj.currency as string) ?? 'cad').toUpperCase(),
    ventureId: meta.venture_id ?? null,
    occurredAt: new Date(event.created * 1000),
    rawEventId: webhookEventId,
  }
  return { kind: 'payment', data }
}

function normalizePaymentIntent(
  obj: Record<string, unknown>,
  webhookEventId: string,
  entityId: string,
  event: Stripe.Event,
): NormalizeResult {
  const meta = (obj.metadata as Record<string, string>) ?? {}
  const data: NormalizedPayment = {
    entityId,
    stripeObjectId: obj.id as string,
    objectType: 'payment_intent',
    status: obj.status as string,
    amountCents: BigInt((obj.amount as number) ?? 0),
    currency: ((obj.currency as string) ?? 'cad').toUpperCase(),
    ventureId: meta.venture_id ?? null,
    occurredAt: new Date(event.created * 1000),
    rawEventId: webhookEventId,
  }
  return { kind: 'payment', data }
}

function normalizeChargeRefunded(
  obj: Record<string, unknown>,
  entityId: string,
  _event: Stripe.Event,
): NormalizeResult {
  const refunds = obj.refunds as { data: Array<Record<string, unknown>> } | undefined
  const latestRefund = refunds?.data?.[0]
  if (!latestRefund) {
    return { kind: 'skipped', reason: 'No refund data in charge.refunded event' }
  }

  const data: NormalizedRefund = {
    entityId,
    refundId: latestRefund.id as string,
    paymentStripeObjectId: (obj.payment_intent as string) ?? (obj.id as string),
    amountCents: BigInt((latestRefund.amount as number) ?? 0),
    status: latestRefund.status as string,
    occurredAt: new Date((latestRefund.created as number) * 1000),
  }
  return { kind: 'refund', data }
}

function normalizeDisputeCreated(
  obj: Record<string, unknown>,
  entityId: string,
  _event: Stripe.Event,
): NormalizeResult {
  const evidenceDetails = obj.evidence_details as Record<string, unknown> | undefined
  const data: NormalizedDispute = {
    entityId,
    disputeId: obj.id as string,
    paymentStripeObjectId: (obj.payment_intent as string) ?? '',
    amountCents: BigInt((obj.amount as number) ?? 0),
    status: obj.status as string,
    reason: (obj.reason as string) ?? null,
    dueBy: evidenceDetails?.due_by
      ? new Date((evidenceDetails.due_by as number) * 1000)
      : null,
    occurredAt: new Date((obj.created as number) * 1000),
  }
  return { kind: 'dispute', data }
}

function normalizePayoutPaid(
  obj: Record<string, unknown>,
  entityId: string,
  _event: Stripe.Event,
): NormalizeResult {
  const data: NormalizedPayout = {
    entityId,
    payoutId: obj.id as string,
    amountCents: BigInt((obj.amount as number) ?? 0),
    currency: ((obj.currency as string) ?? 'cad').toUpperCase(),
    status: 'paid',
    arrivalDate: obj.arrival_date
      ? new Date((obj.arrival_date as number) * 1000).toISOString().split('T')[0]!
      : null,
    occurredAt: new Date((obj.created as number) * 1000),
  }
  return { kind: 'payout', data }
}

function normalizeInvoicePaid(
  obj: Record<string, unknown>,
  webhookEventId: string,
  entityId: string,
  event: Stripe.Event,
): NormalizeResult {
  const meta = (obj.metadata as Record<string, string>) ?? {}
  const data: NormalizedPayment = {
    entityId,
    stripeObjectId: obj.id as string,
    objectType: 'invoice',
    status: 'paid',
    amountCents: BigInt((obj.amount_paid as number) ?? 0),
    currency: ((obj.currency as string) ?? 'cad').toUpperCase(),
    ventureId: meta.venture_id ?? null,
    occurredAt: new Date(event.created * 1000),
    rawEventId: webhookEventId,
  }
  return { kind: 'payment', data }
}

// ── Persistence helpers ─────────────────────────────────────────────────────

async function persistPayment(data: NormalizedPayment): Promise<void> {
  await db
    .insert(stripePayments)
    .values({
      entityId: data.entityId,
      stripeObjectId: data.stripeObjectId,
      objectType: data.objectType,
      status: data.status,
      amountCents: data.amountCents,
      currency: data.currency,
      ventureId: data.ventureId,
      occurredAt: data.occurredAt,
      rawEventId: data.rawEventId,
    })
}

async function persistRefund(data: NormalizedRefund, entityId: string): Promise<void> {
  // Try to find the related payment by stripe object ID
  const [payment] = await db
    .select({ id: stripePayments.id })
    .from(stripePayments)
    .where(eq(stripePayments.stripeObjectId, data.paymentStripeObjectId))
    .limit(1)

  await db
    .insert(stripeRefunds)
    .values({
      entityId,
      refundId: data.refundId,
      paymentId: payment?.id ?? null,
      amountCents: data.amountCents,
      status: 'executed',
      requestedBy: 'system', // webhook-originated refunds
      occurredAt: data.occurredAt,
    })
}

async function persistDispute(data: NormalizedDispute): Promise<void> {
  const [payment] = await db
    .select({ id: stripePayments.id })
    .from(stripePayments)
    .where(eq(stripePayments.stripeObjectId, data.paymentStripeObjectId))
    .limit(1)

  await db
    .insert(stripeDisputes)
    .values({
      entityId: data.entityId,
      disputeId: data.disputeId,
      paymentId: payment?.id ?? null,
      amountCents: data.amountCents,
      status: data.status,
      reason: data.reason,
      dueBy: data.dueBy,
      occurredAt: data.occurredAt,
    })
}

async function persistPayout(data: NormalizedPayout): Promise<void> {
  await db
    .insert(stripePayouts)
    .values({
      entityId: data.entityId,
      payoutId: data.payoutId,
      amountCents: data.amountCents,
      currency: data.currency,
      status: data.status as 'pending' | 'failed' | 'paid' | 'in_transit' | 'canceled',
      arrivalDate: data.arrivalDate,
      occurredAt: data.occurredAt,
    })
}

/**
 * Mark a webhook event as failed with an error message.
 */
export async function markEventFailed(
  webhookEventId: string,
  errorMessage: string,
): Promise<void> {
  await db
    .update(stripeWebhookEvents)
    .set({ processingStatus: 'failed', error: errorMessage })
    .where(eq(stripeWebhookEvents.id, webhookEventId))
}
