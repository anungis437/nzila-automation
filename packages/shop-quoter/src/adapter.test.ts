/**
 * @nzila/shop-quoter — Adapter Tests
 *
 * Integration-style tests for the adapter service using injected
 * in-memory repositories (no real DB).
 */
import { describe, it, expect, vi } from 'vitest'
import { QuoteStatus, PricingTier, OrgRole } from '@nzila/commerce-core/enums'
import { createShopQuoterAdapter } from './adapter'
import type { QuoteRepository, QuoteEntity, QuoteLineEntity } from '@nzila/commerce-services/quote'
import type { CustomerRepository } from './adapter'
import type { OrgContext } from '@nzila/commerce-core/types'

// ── In-Memory Repository Stubs ──────────────────────────────────────────────

function createStubQuoteRepo(): QuoteRepository {
  let counter = 0

  return {
    nextRef: vi.fn(async () => `QUO-TST-${String(++counter).padStart(6, '0')}`),
    createQuote: vi.fn(async (_ctx: OrgContext, data) => ({
      ...data,
      id: `quote-${counter}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })) as QuoteRepository['createQuote'],
    createQuoteLines: vi.fn(async (_ctx, _quoteId, lines) =>
      lines.map((l: QuoteLineEntity, i: number) => ({ ...l, id: `line-${i}` })),
    ) as QuoteRepository['createQuoteLines'],
    getQuoteById: vi.fn(async () => null),
    updateQuote: vi.fn(async (_ctx, _id, values) => values as QuoteEntity),
    saveVersion: vi.fn(async () => {}),
  }
}

function createStubCustomerRepo(): CustomerRepository {
  const customers = new Map<string, { id: string }>()
  let counter = 0

  return {
    findByExternalId: vi.fn(async (_ctx, _key, value) => {
      return customers.get(value) ?? null
    }),
    createCustomer: vi.fn(async (_ctx, data) => {
      const id = `cust-${++counter}`
      const legacyId = data.externalIds?.legacyClientId
      if (legacyId) customers.set(legacyId, { id })
      return { id }
    }),
  }
}

// ── Fixture Data ────────────────────────────────────────────────────────────

const validRequest = {
  id: 'req-001',
  client_id: 'cli-001',
  title: 'Holiday Gift Boxes',
  box_count: 25,
  budget_range: null,
  theme: 'holiday',
  notes: 'Rush delivery needed',
  status: 'new',
  created_by: 'user-001',
  created_at: '2025-12-01T10:00:00.000Z',
  updated_at: '2025-12-01T10:00:00.000Z',
}

const validProposal = {
  id: 'prop-001',
  request_id: 'req-001',
  tier: 'Standard',
  version: 1,
  items: [
    {
      id: 'item-001',
      proposal_id: 'prop-001',
      product_id: 'prod-001',
      product_name: 'Artisanal Chocolate Box',
      sku: 'CHOC-001',
      quantity: 25,
      unit_cost: 15.00,
      unit_price: 22.50,
      total_cost: 375.00,
      display_order: 0,
      is_featured: false,
      choice_group_id: null,
    },
  ],
  subtotal: 375.00,
  gst_amount: 18.75,
  qst_amount: 39.28,
  total: 433.03,
  margin_percent: 33.3,
  ai_assisted: false,
  created_at: '2025-12-02T14:00:00.000Z',
}

const validClient = {
  id: 'cli-001',
  company_name: 'TestCo',
  contact_name: 'Alice',
  email: 'alice@testco.com',
  phone: '514-555-0001',
  address: '456 Rue Test, Laval, QC, H7G 2K3',
  notes: null,
  created_by: 'user-001',
  created_at: '2025-11-01T08:00:00.000Z',
}

// ── Tests ───────────────────────────────────────────────────────────────────

describe('createShopQuoterAdapter', () => {
  describe('importRequest', () => {
    it('imports a valid request + proposal + client', async () => {
      const quoteRepo = createStubQuoteRepo()
      const customerRepo = createStubCustomerRepo()
      const adapter = createShopQuoterAdapter(quoteRepo, customerRepo, {
        defaultEntityId: 'ent-test',
      })

      const result = await adapter.importRequest(
        validRequest,
        validProposal,
        validClient,
      )

      expect(result.ok).toBe(true)
      if (!result.ok) return

      expect(result.data.quoteId).toBeDefined()
      expect(result.data.auditEntries.length).toBeGreaterThanOrEqual(2) // create + migration
      expect(quoteRepo.createQuote).toHaveBeenCalledOnce()
      expect(customerRepo.createCustomer).toHaveBeenCalledOnce()
    })

    it('imports without a proposal (creates placeholder line)', async () => {
      const quoteRepo = createStubQuoteRepo()
      const customerRepo = createStubCustomerRepo()
      const adapter = createShopQuoterAdapter(quoteRepo, customerRepo, {
        defaultEntityId: 'ent-test',
      })

      const result = await adapter.importRequest(validRequest, null, validClient)

      expect(result.ok).toBe(true)
      if (!result.ok) return
      expect(result.warnings.length).toBeGreaterThan(0)
    })

    it('imports without a client (uses request.client_id as-is)', async () => {
      const quoteRepo = createStubQuoteRepo()
      const customerRepo = createStubCustomerRepo()
      const adapter = createShopQuoterAdapter(quoteRepo, customerRepo, {
        defaultEntityId: 'ent-test',
      })

      const result = await adapter.importRequest(validRequest, validProposal, null)

      expect(result.ok).toBe(true)
      if (!result.ok) return
      expect(customerRepo.createCustomer).not.toHaveBeenCalled()
    })

    it('rejects invalid legacy request data', async () => {
      const quoteRepo = createStubQuoteRepo()
      const customerRepo = createStubCustomerRepo()
      const adapter = createShopQuoterAdapter(quoteRepo, customerRepo, {
        defaultEntityId: 'ent-test',
      })

      const result = await adapter.importRequest(
        { id: '', title: '' }, // invalid
        null,
        null,
      )

      expect(result.ok).toBe(false)
    })

    it('reuses existing customer when legacy ID matches', async () => {
      const quoteRepo = createStubQuoteRepo()
      const customerRepo = createStubCustomerRepo()
      const adapter = createShopQuoterAdapter(quoteRepo, customerRepo, {
        defaultEntityId: 'ent-test',
      })

      // First import creates the customer
      await adapter.importRequest(validRequest, validProposal, validClient)

      // Second import should reuse
      const result = await adapter.importRequest(validRequest, validProposal, validClient)

      expect(result.ok).toBe(true)
      expect(customerRepo.createCustomer).toHaveBeenCalledTimes(1) // only once
    })
  })

  describe('validateLegacyData', () => {
    it('validates correct records as valid', () => {
      const quoteRepo = createStubQuoteRepo()
      const customerRepo = createStubCustomerRepo()
      const adapter = createShopQuoterAdapter(quoteRepo, customerRepo)

      const result = adapter.validateLegacyData([
        { request: validRequest, proposal: validProposal, client: validClient },
      ])

      expect(result.valid).toBe(1)
      expect(result.invalid).toBe(0)
    })

    it('catches invalid records', () => {
      const quoteRepo = createStubQuoteRepo()
      const customerRepo = createStubCustomerRepo()
      const adapter = createShopQuoterAdapter(quoteRepo, customerRepo)

      const result = adapter.validateLegacyData([
        { request: {}, proposal: null, client: null }, // invalid
        { request: validRequest, proposal: validProposal, client: validClient },
      ])

      expect(result.valid).toBe(1)
      expect(result.invalid).toBe(1)
      expect(result.errors.length).toBe(1)
    })
  })

  describe('importBatch', () => {
    it('imports multiple records and returns summary', async () => {
      const quoteRepo = createStubQuoteRepo()
      const customerRepo = createStubCustomerRepo()
      const adapter = createShopQuoterAdapter(quoteRepo, customerRepo, {
        defaultEntityId: 'ent-test',
      })

      const summary = await adapter.importBatch([
        { request: validRequest, proposal: validProposal, client: validClient },
        { request: { ...validRequest, id: 'req-002' }, proposal: null, client: null },
      ])

      expect(summary.totalRecords).toBe(2)
      expect(summary.successCount).toBe(2)
      expect(summary.failureCount).toBe(0)
      expect(summary.durationMs).toBeGreaterThanOrEqual(0)
    })
  })
})
