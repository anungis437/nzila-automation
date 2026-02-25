import { describe, it, expect } from 'vitest'
import {
  createCustomerSchema,
  createOpportunitySchema,
  createQuoteSchema,
  priceQuoteSchema,
  transitionQuoteSchema,
  approvalDecisionSchema,
  transitionOrderSchema,
  recordPaymentSchema,
  createDisputeSchema,
  createRefundSchema,
  createCreditNoteSchema,
  cancellationSchema,
  paginationSchema,
  idempotencyKeySchema,
  customerAddressSchema,
} from './schemas/index'

const VALID_UUID = '00000000-0000-4000-8000-000000000001'

describe('schemas', () => {
  // ── Customer ──────────────────────────────────────────────────────────
  describe('createCustomerSchema', () => {
    it('accepts valid input', () => {
      const result = createCustomerSchema.safeParse({
        name: 'Acme Inc',
        email: 'team@acme.com',
        phone: '+15145551234',
        address: {
          line1: '123 Main St',
          city: 'Montreal',
          province: 'QC',
          postalCode: 'H2X 1Y4',
          country: 'CA',
        },
      })
      expect(result.success).toBe(true)
    })

    it('accepts minimal input with defaults', () => {
      const result = createCustomerSchema.safeParse({ name: 'Minimal Co' })
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.email).toBeNull()
        expect(result.data.phone).toBeNull()
        expect(result.data.address).toBeNull()
        expect(result.data.externalIds).toEqual({})
      }
    })

    it('rejects empty name', () => {
      const result = createCustomerSchema.safeParse({ name: '' })
      expect(result.success).toBe(false)
    })

    it('rejects invalid email', () => {
      const result = createCustomerSchema.safeParse({ name: 'X', email: 'nope' })
      expect(result.success).toBe(false)
    })
  })

  describe('customerAddressSchema', () => {
    it('rejects invalid country code (not 2 chars)', () => {
      const result = customerAddressSchema.safeParse({
        line1: '1 St',
        city: 'X',
        province: 'QC',
        postalCode: 'H2X',
        country: 'CAN',
      })
      expect(result.success).toBe(false)
    })
  })

  // ── Opportunity ───────────────────────────────────────────────────────
  describe('createOpportunitySchema', () => {
    it('accepts valid input', () => {
      const result = createOpportunitySchema.safeParse({
        customerId: VALID_UUID,
        title: 'New Deal',
      })
      expect(result.success).toBe(true)
    })

    it('rejects missing title', () => {
      const result = createOpportunitySchema.safeParse({
        customerId: VALID_UUID,
      })
      expect(result.success).toBe(false)
    })

    it('rejects non-uuid customerId', () => {
      const result = createOpportunitySchema.safeParse({
        customerId: 'abc',
        title: 'X',
      })
      expect(result.success).toBe(false)
    })
  })

  // ── Quote ─────────────────────────────────────────────────────────────
  describe('createQuoteSchema', () => {
    const validLine = {
      itemName: 'Widget',
      quantity: 10,
      unitCost: 5.99,
    }

    it('accepts valid input', () => {
      const result = createQuoteSchema.safeParse({
        customerId: VALID_UUID,
        lines: [validLine],
      })
      expect(result.success).toBe(true)
    })

    it('rejects empty lines', () => {
      const result = createQuoteSchema.safeParse({
        customerId: VALID_UUID,
        lines: [],
      })
      expect(result.success).toBe(false)
    })

    it('rejects zero quantity', () => {
      const result = createQuoteSchema.safeParse({
        customerId: VALID_UUID,
        lines: [{ ...validLine, quantity: 0 }],
      })
      expect(result.success).toBe(false)
    })

    it('rejects discount > 100', () => {
      const result = createQuoteSchema.safeParse({
        customerId: VALID_UUID,
        lines: [{ ...validLine, discountPercent: 101 }],
      })
      expect(result.success).toBe(false)
    })

    it('applies defaults for optional fields', () => {
      const result = createQuoteSchema.safeParse({
        customerId: VALID_UUID,
        lines: [validLine],
      })
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.opportunityId).toBeNull()
        expect(result.data.lines[0]?.discountPercent).toBe(0)
        expect(result.data.lines[0]?.sortOrder).toBe(0)
        expect(result.data.lines[0]?.itemSku).toBeNull()
      }
    })
  })

  describe('priceQuoteSchema', () => {
    it('accepts valid tier', () => {
      const result = priceQuoteSchema.safeParse({ tier: 'standard' })
      expect(result.success).toBe(true)
    })

    it('rejects invalid tier', () => {
      const result = priceQuoteSchema.safeParse({ tier: 'ULTRA' })
      expect(result.success).toBe(false)
    })
  })

  describe('transitionQuoteSchema', () => {
    it('accepts valid transition', () => {
      const result = transitionQuoteSchema.safeParse({
        targetStatus: 'accepted',
      })
      expect(result.success).toBe(true)
    })

    it('rejects invalid status', () => {
      const result = transitionQuoteSchema.safeParse({
        targetStatus: 'imaginary',
      })
      expect(result.success).toBe(false)
    })
  })

  // ── Approval ──────────────────────────────────────────────────────────
  describe('approvalDecisionSchema', () => {
    it('accepts valid decision with reason', () => {
      const result = approvalDecisionSchema.safeParse({
        decision: 'approved',
        reason: 'Looks good',
      })
      expect(result.success).toBe(true)
    })

    it('rejects missing reason', () => {
      const result = approvalDecisionSchema.safeParse({ decision: 'approved' })
      expect(result.success).toBe(false)
    })

    it('rejects PENDING as a decision', () => {
      const result = approvalDecisionSchema.safeParse({
        decision: 'pending',
        reason: 'X',
      })
      expect(result.success).toBe(false)
    })
  })

  // ── Order ─────────────────────────────────────────────────────────────
  describe('transitionOrderSchema', () => {
    it('accepts valid transition', () => {
      const result = transitionOrderSchema.safeParse({
        targetStatus: 'confirmed',
      })
      expect(result.success).toBe(true)
    })

    it('rejects CREATED as target (cannot go back)', () => {
      const result = transitionOrderSchema.safeParse({
        targetStatus: 'created',
      })
      expect(result.success).toBe(false)
    })
  })

  // ── Invoice / Payment ────────────────────────────────────────────────
  describe('recordPaymentSchema', () => {
    it('accepts valid payment', () => {
      const result = recordPaymentSchema.safeParse({
        amount: 100.5,
        method: 'stripe',
        paidAt: '2025-01-15T10:00:00Z',
      })
      expect(result.success).toBe(true)
    })

    it('rejects zero amount', () => {
      const result = recordPaymentSchema.safeParse({
        amount: 0,
        method: 'cash',
        paidAt: '2025-01-15T10:00:00Z',
      })
      expect(result.success).toBe(false)
    })

    it('rejects invalid datetime', () => {
      const result = recordPaymentSchema.safeParse({
        amount: 50,
        method: 'cash',
        paidAt: 'not-a-date',
      })
      expect(result.success).toBe(false)
    })
  })

  describe('createDisputeSchema', () => {
    it('accepts valid dispute', () => {
      const result = createDisputeSchema.safeParse({
        invoiceId: VALID_UUID,
        reason: 'incorrect_amount',
        description: 'Billed $100, agreement was $80',
      })
      expect(result.success).toBe(true)
    })

    it('rejects invalid reason', () => {
      const result = createDisputeSchema.safeParse({
        invoiceId: VALID_UUID,
        reason: 'because_yes',
        description: 'X',
      })
      expect(result.success).toBe(false)
    })
  })

  describe('createRefundSchema', () => {
    it('rejects zero amount', () => {
      const result = createRefundSchema.safeParse({
        paymentId: VALID_UUID,
        invoiceId: VALID_UUID,
        amount: 0,
        reason: 'Returned goods',
      })
      expect(result.success).toBe(false)
    })
  })

  describe('createCreditNoteSchema', () => {
    it('accepts valid credit note', () => {
      const result = createCreditNoteSchema.safeParse({
        invoiceId: VALID_UUID,
        amount: 25,
        reason: 'Goodwill',
      })
      expect(result.success).toBe(true)
    })
  })

  // ── Cancellation ──────────────────────────────────────────────────────
  describe('cancellationSchema', () => {
    it('accepts valid cancellation', () => {
      const result = cancellationSchema.safeParse({
        reason: 'customer_request',
      })
      expect(result.success).toBe(true)
    })

    it('rejects invalid reason', () => {
      const result = cancellationSchema.safeParse({ reason: 'vibes' })
      expect(result.success).toBe(false)
    })
  })

  // ── Shared ────────────────────────────────────────────────────────────
  describe('paginationSchema', () => {
    it('applies defaults', () => {
      const result = paginationSchema.safeParse({})
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.page).toBe(1)
        expect(result.data.pageSize).toBe(20)
      }
    })

    it('coerces string to number', () => {
      const result = paginationSchema.safeParse({ page: '3', pageSize: '50' })
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.page).toBe(3)
        expect(result.data.pageSize).toBe(50)
      }
    })

    it('rejects pageSize > 100', () => {
      const result = paginationSchema.safeParse({ pageSize: 200 })
      expect(result.success).toBe(false)
    })
  })

  describe('idempotencyKeySchema', () => {
    it('rejects empty string', () => {
      const result = idempotencyKeySchema.safeParse('')
      expect(result.success).toBe(false)
    })

    it('accepts normal key', () => {
      const result = idempotencyKeySchema.safeParse('req-abc-123')
      expect(result.success).toBe(true)
    })
  })
})
