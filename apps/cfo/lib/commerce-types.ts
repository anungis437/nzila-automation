/**
 * Commerce domain types — CFO app.
 *
 * Re-exports @nzila/commerce-core types used by the CFO financial dashboards:
 * invoices, payments, credit notes, disputes, and reconciliation entities.
 */
export type {
  Invoice,
  InvoiceLine,
  Payment,
  CreditNote,
  Refund,
  Dispute,
  Order,
  OrderLine,
  Quote,
  QuoteLine,
  Customer,
  TaxBreakdown,
  TaxLine,
  AuditEvent,
  EvidenceArtifact,
  SyncJob,
  SyncReceipt,
  OrgContext,
} from '@nzila/commerce-core'

export {
  QuoteStatus,
  OrderStatus,
  InvoiceStatus,
  FulfillmentStatus,
  ApprovalDecision,
  PricingTier,
  EvidenceType,
} from '@nzila/commerce-core'
