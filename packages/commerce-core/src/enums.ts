/**
 * @nzila/commerce-core — Enums & Reason Codes
 *
 * Shared enumerations used across all commerce domain types.
 * No DB, no framework — pure TypeScript enums.
 *
 * @module @nzila/commerce-core/enums
 */

// ── Quote ───────────────────────────────────────────────────────────────────

export const QuoteStatus = {
  DRAFT: 'draft',
  PRICING: 'pricing',
  READY: 'ready',
  SENT: 'sent',
  REVIEWING: 'reviewing',
  ACCEPTED: 'accepted',
  DECLINED: 'declined',
  REVISED: 'revised',
  EXPIRED: 'expired',
  CANCELLED: 'cancelled',
} as const
export type QuoteStatus = (typeof QuoteStatus)[keyof typeof QuoteStatus]

// ── Order ───────────────────────────────────────────────────────────────────

export const OrderStatus = {
  CREATED: 'created',
  CONFIRMED: 'confirmed',
  FULFILLMENT: 'fulfillment',
  SHIPPED: 'shipped',
  DELIVERED: 'delivered',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
  RETURN_REQUESTED: 'return_requested',
  NEEDS_ATTENTION: 'needs_attention',
} as const
export type OrderStatus = (typeof OrderStatus)[keyof typeof OrderStatus]

// ── Invoice ─────────────────────────────────────────────────────────────────

export const InvoiceStatus = {
  DRAFT: 'draft',
  ISSUED: 'issued',
  SENT: 'sent',
  PARTIAL_PAID: 'partial_paid',
  PAID: 'paid',
  OVERDUE: 'overdue',
  DISPUTED: 'disputed',
  RESOLVED: 'resolved',
  REFUNDED: 'refunded',
  CREDIT_NOTE: 'credit_note',
  CANCELLED: 'cancelled',
} as const
export type InvoiceStatus = (typeof InvoiceStatus)[keyof typeof InvoiceStatus]

// ── Fulfilment ──────────────────────────────────────────────────────────────

export const FulfillmentStatus = {
  PENDING: 'pending',
  ALLOCATED: 'allocated',
  PRODUCTION: 'production',
  QUALITY_CHECK: 'quality_check',
  PACKAGING: 'packaging',
  SHIPPED: 'shipped',
  DELIVERED: 'delivered',
  ON_HOLD: 'on_hold',
  BLOCKED: 'blocked',
  CANCELLED: 'cancelled',
} as const
export type FulfillmentStatus = (typeof FulfillmentStatus)[keyof typeof FulfillmentStatus]

// ── Approval ────────────────────────────────────────────────────────────────

export const ApprovalDecision = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
} as const
export type ApprovalDecision = (typeof ApprovalDecision)[keyof typeof ApprovalDecision]

// ── Pricing Tier ────────────────────────────────────────────────────────────

export const PricingTier = {
  BUDGET: 'budget',
  STANDARD: 'standard',
  PREMIUM: 'premium',
} as const
export type PricingTier = (typeof PricingTier)[keyof typeof PricingTier]

// ── Opportunity ─────────────────────────────────────────────────────────────

export const OpportunityStatus = {
  OPEN: 'open',
  QUALIFIED: 'qualified',
  QUOTED: 'quoted',
  WON: 'won',
  LOST: 'lost',
} as const
export type OpportunityStatus = (typeof OpportunityStatus)[keyof typeof OpportunityStatus]

// ── Evidence Types ──────────────────────────────────────────────────────────

export const EvidenceType = {
  QUOTE_PDF: 'quote_pdf',
  APPROVAL_RECORD: 'approval_record',
  SYNC_RECEIPT: 'sync_receipt',
  DELIVERY_PROOF: 'delivery_proof',
  CREDIT_NOTE_PDF: 'credit_note_pdf',
  REFUND_RECEIPT: 'refund_receipt',
  ORDER_LOCK_SNAPSHOT: 'order_lock_snapshot',
} as const
export type EvidenceType = (typeof EvidenceType)[keyof typeof EvidenceType]

// ── Reason Codes ────────────────────────────────────────────────────────────

export const CancellationReason = {
  CUSTOMER_REQUEST: 'customer_request',
  PRICING_ERROR: 'pricing_error',
  OUT_OF_STOCK: 'out_of_stock',
  DUPLICATE: 'duplicate',
  INTERNAL: 'internal',
  OTHER: 'other',
} as const
export type CancellationReason = (typeof CancellationReason)[keyof typeof CancellationReason]

export const DisputeReason = {
  INCORRECT_AMOUNT: 'incorrect_amount',
  GOODS_NOT_RECEIVED: 'goods_not_received',
  DAMAGED_GOODS: 'damaged_goods',
  SERVICE_ISSUE: 'service_issue',
  OTHER: 'other',
} as const
export type DisputeReason = (typeof DisputeReason)[keyof typeof DisputeReason]

// ── Org Roles ───────────────────────────────────────────────────────────────

export const OrgRole = {
  OWNER: 'owner',
  ADMIN: 'admin',
  MANAGER: 'manager',
  SALES: 'sales',
  FINANCE: 'finance',
  WAREHOUSE: 'warehouse',
  VIEWER: 'viewer',
} as const
export type OrgRole = (typeof OrgRole)[keyof typeof OrgRole]
