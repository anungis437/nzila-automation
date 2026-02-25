/**
 * @nzila/commerce-events — Canonical Commerce Event Types
 *
 * String constants for every domain event emitted by the commerce state machines.
 * These MUST match the `events[].type` values defined in the machine transition
 * definitions (quote.ts, order.ts, invoice.ts in @nzila/commerce-state).
 *
 * @module @nzila/commerce-events/event-types
 */

export const CommerceEventTypes = {
  // ── Quote lifecycle ─────────────────────────────────────────────────────
  QUOTE_DRAFT: 'quote.draft',
  QUOTE_PRICING: 'quote.pricing',
  QUOTE_READY: 'quote.ready',
  QUOTE_SENT: 'quote.sent',
  QUOTE_REVIEWING: 'quote.reviewing',
  QUOTE_ACCEPTED: 'quote.accepted',
  QUOTE_DECLINED: 'quote.declined',
  QUOTE_REVISED: 'quote.revised',
  QUOTE_EXPIRED: 'quote.expired',
  QUOTE_CANCELLED: 'quote.cancelled',

  // ── Order lifecycle ─────────────────────────────────────────────────────
  ORDER_CREATED: 'order.created',
  ORDER_CONFIRMED: 'order.confirmed',
  ORDER_FULFILLMENT: 'order.fulfillment',
  ORDER_SHIPPED: 'order.shipped',
  ORDER_DELIVERED: 'order.delivered',
  ORDER_COMPLETED: 'order.completed',
  ORDER_CANCELLED: 'order.cancelled',
  ORDER_RETURN_REQUESTED: 'order.return_requested',
  ORDER_RETURN_RESOLVED: 'order.return_resolved',
  ORDER_NEEDS_ATTENTION: 'order.needs_attention',

  // ── Invoice lifecycle ───────────────────────────────────────────────────
  INVOICE_DRAFT: 'invoice.draft',
  INVOICE_ISSUED: 'invoice.issued',
  INVOICE_SENT: 'invoice.sent',
  INVOICE_PARTIAL_PAID: 'invoice.partial_paid',
  INVOICE_PAID: 'invoice.paid',
  INVOICE_OVERDUE: 'invoice.overdue',
  INVOICE_DISPUTED: 'invoice.disputed',
  INVOICE_RESOLVED: 'invoice.resolved',
  INVOICE_REFUNDED: 'invoice.refunded',
  INVOICE_CREDIT_NOTE: 'invoice.credit_note',
  INVOICE_CANCELLED: 'invoice.cancelled',

  // ── Cross-machine triggers ──────────────────────────────────────────────
  ORDER_CREATE_FROM_QUOTE: 'order.create_from_quote',
} as const

/** Union of all commerce event type strings */
export type CommerceEventType = (typeof CommerceEventTypes)[keyof typeof CommerceEventTypes]
