import { describe, it, expect } from 'vitest'
import {
  QuoteStatus,
  OrderStatus,
  InvoiceStatus,
  FulfillmentStatus,
  ApprovalDecision,
  PricingTier,
  OpportunityStatus,
  EvidenceType,
  CancellationReason,
  DisputeReason,
  OrgRole,
} from './enums'

describe('enums', () => {
  it('QuoteStatus has expected values', () => {
    expect(QuoteStatus.DRAFT).toBe('draft')
    expect(QuoteStatus.PRICING).toBe('pricing')
    expect(QuoteStatus.READY).toBe('ready')
    expect(QuoteStatus.SENT).toBe('sent')
    expect(QuoteStatus.REVIEWING).toBe('reviewing')
    expect(QuoteStatus.ACCEPTED).toBe('accepted')
    expect(QuoteStatus.DECLINED).toBe('declined')
    expect(QuoteStatus.EXPIRED).toBe('expired')
    expect(QuoteStatus.CANCELLED).toBe('cancelled')
    expect(QuoteStatus.REVISED).toBe('revised')
    expect(Object.keys(QuoteStatus)).toHaveLength(10)
  })

  it('OrderStatus has expected values', () => {
    expect(OrderStatus.CREATED).toBe('created')
    expect(OrderStatus.CONFIRMED).toBe('confirmed')
    expect(OrderStatus.FULFILLMENT).toBe('fulfillment')
    expect(OrderStatus.SHIPPED).toBe('shipped')
    expect(OrderStatus.DELIVERED).toBe('delivered')
    expect(OrderStatus.COMPLETED).toBe('completed')
    expect(OrderStatus.CANCELLED).toBe('cancelled')
    expect(OrderStatus.RETURN_REQUESTED).toBe('return_requested')
    expect(OrderStatus.NEEDS_ATTENTION).toBe('needs_attention')
    expect(Object.keys(OrderStatus)).toHaveLength(9)
  })

  it('InvoiceStatus has expected values', () => {
    expect(Object.keys(InvoiceStatus)).toHaveLength(11)
    expect(InvoiceStatus.DRAFT).toBe('draft')
    expect(InvoiceStatus.ISSUED).toBe('issued')
    expect(InvoiceStatus.SENT).toBe('sent')
    expect(InvoiceStatus.PARTIAL_PAID).toBe('partial_paid')
    expect(InvoiceStatus.PAID).toBe('paid')
    expect(InvoiceStatus.OVERDUE).toBe('overdue')
    expect(InvoiceStatus.DISPUTED).toBe('disputed')
    expect(InvoiceStatus.RESOLVED).toBe('resolved')
    expect(InvoiceStatus.REFUNDED).toBe('refunded')
    expect(InvoiceStatus.CREDIT_NOTE).toBe('credit_note')
    expect(InvoiceStatus.CANCELLED).toBe('cancelled')
  })

  it('FulfillmentStatus has expected values', () => {
    expect(Object.keys(FulfillmentStatus)).toHaveLength(10)
    expect(FulfillmentStatus.PENDING).toBe('pending')
    expect(FulfillmentStatus.SHIPPED).toBe('shipped')
    expect(FulfillmentStatus.CANCELLED).toBe('cancelled')
  })

  it('ApprovalDecision is exhaustive', () => {
    expect(Object.keys(ApprovalDecision)).toHaveLength(3)
    expect(ApprovalDecision.APPROVED).toBe('approved')
    expect(ApprovalDecision.REJECTED).toBe('rejected')
    expect(ApprovalDecision.PENDING).toBe('pending')
  })

  it('PricingTier is exhaustive', () => {
    expect(Object.keys(PricingTier)).toHaveLength(3)
    expect(PricingTier.BUDGET).toBe('budget')
    expect(PricingTier.STANDARD).toBe('standard')
    expect(PricingTier.PREMIUM).toBe('premium')
  })

  it('OpportunityStatus is exhaustive', () => {
    expect(Object.keys(OpportunityStatus)).toHaveLength(5)
  })

  it('EvidenceType is exhaustive', () => {
    expect(Object.keys(EvidenceType)).toHaveLength(7)
  })

  it('CancellationReason is exhaustive', () => {
    expect(Object.keys(CancellationReason)).toHaveLength(6)
  })

  it('DisputeReason is exhaustive', () => {
    expect(Object.keys(DisputeReason)).toHaveLength(5)
  })

  it('OrgRole is exhaustive', () => {
    expect(Object.keys(OrgRole)).toHaveLength(7)
  })
})
