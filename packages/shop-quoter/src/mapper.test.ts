/**
 * @nzila/shop-quoter — Mapper Tests
 *
 * Verifies pure mapping functions that transform legacy ShopMoiÇa
 * data structures into NzilaOS commerce-core types.
 */
import { describe, it, expect } from 'vitest'
import { PricingTier, QuoteStatus } from '@nzila/commerce-core/enums'
import {
  mapLegacyTier,
  mapLegacyStatus,
  mapLegacyClient,
  mapZohoLead,
  mapProposalItems,
  mapRequestToQuoteInput,
  buildMigrationContext,
} from './mapper'
import { DEFAULT_ADAPTER_CONFIG, type LegacyClient, type LegacyRequest, type LegacyProposal, type LegacyProposalItem } from './types'

// ── Fixtures ────────────────────────────────────────────────────────────────

const TEST_ENTITY_ID = 'ent-001'

const sampleClient: LegacyClient = {
  id: 'cli-legacy-001',
  company_name: 'Acme Corp',
  contact_name: 'Jane Doe',
  email: 'jane@acme.com',
  phone: '514-555-0100',
  address: '123 Rue Principale, Montréal, QC, H2X 1A1',
  notes: 'VIP client',
  created_by: 'user-001',
  created_at: '2025-01-15T10:00:00.000Z',
}

const sampleItem: LegacyProposalItem = {
  id: 'item-001',
  proposal_id: 'prop-001',
  product_id: 'prod-001',
  product_name: 'Artisanal Chocolate Box',
  sku: 'CHOC-ART-001',
  quantity: 10,
  unit_cost: 12.50,
  unit_price: 18.75,
  total_cost: 125.00,
  display_order: 0,
  is_featured: true,
  choice_group_id: null,
}

const sampleProposal: LegacyProposal = {
  id: 'prop-001',
  request_id: 'req-001',
  tier: 'Premium',
  version: 1,
  items: [sampleItem],
  subtotal: 250.00,
  gst_amount: 12.50,
  qst_amount: 24.94,
  total: 287.44,
  margin_percent: 42.5,
  ai_assisted: false,
  created_at: '2025-01-15T11:00:00.000Z',
}

const sampleRequest: LegacyRequest = {
  id: 'req-001',
  client_id: 'cli-legacy-001',
  title: 'Holiday Gift Boxes 2025',
  box_count: 50,
  budget_range: 'premium',
  theme: 'holiday',
  notes: 'Rush order for December delivery',
  status: 'quoted',
  created_by: 'user-001',
  created_at: '2025-01-14T09:00:00.000Z',
  updated_at: '2025-01-15T11:00:00.000Z',
}

// ── Tests ───────────────────────────────────────────────────────────────────

describe('mapLegacyTier', () => {
  it.each([
    ['Budget', PricingTier.BUDGET],
    ['budget', PricingTier.BUDGET],
    ['BUDGET', PricingTier.BUDGET],
    ['Standard', PricingTier.STANDARD],
    ['standard', PricingTier.STANDARD],
    ['Premium', PricingTier.PREMIUM],
    ['premium', PricingTier.PREMIUM],
  ])('maps "%s" → %s', (input, expected) => {
    expect(mapLegacyTier(input)).toBe(expected)
  })

  it('falls back to STANDARD for unknown tiers', () => {
    expect(mapLegacyTier('luxury')).toBe(PricingTier.STANDARD)
    expect(mapLegacyTier('')).toBe(PricingTier.STANDARD)
  })
})

describe('mapLegacyStatus', () => {
  it.each([
    ['new', QuoteStatus.DRAFT],
    ['draft', QuoteStatus.DRAFT],
    ['pending', QuoteStatus.DRAFT],
    ['in_progress', QuoteStatus.PRICING],
    ['quoted', QuoteStatus.READY],
    ['sent', QuoteStatus.SENT],
    ['accepted', QuoteStatus.ACCEPTED],
    ['won', QuoteStatus.ACCEPTED],
    ['declined', QuoteStatus.DECLINED],
    ['lost', QuoteStatus.DECLINED],
    ['expired', QuoteStatus.EXPIRED],
    ['cancelled', QuoteStatus.CANCELLED],
    ['canceled', QuoteStatus.CANCELLED],
  ])('maps "%s" → %s', (input, expected) => {
    expect(mapLegacyStatus(input)).toBe(expected)
  })

  it('falls back to DRAFT for unknown statuses', () => {
    expect(mapLegacyStatus('unknown')).toBe(QuoteStatus.DRAFT)
  })
})

describe('mapLegacyClient', () => {
  it('maps a complete legacy client to Customer shape', () => {
    const result = mapLegacyClient(sampleClient, TEST_ENTITY_ID)
    expect(result.ok).toBe(true)
    if (!result.ok) return

    expect(result.data.name).toBe('Acme Corp')
    expect(result.data.email).toBe('jane@acme.com')
    expect(result.data.orgId).toBe(TEST_ENTITY_ID)
    expect(result.data.externalIds.legacyClientId).toBe('cli-legacy-001')
    expect(result.data.address).not.toBeNull()
    expect(result.data.address?.city).toBe('Montréal')
    expect(result.data.address?.province).toBe('QC')
    expect(result.data.address?.country).toBe('CA')
  })

  it('uses contact_name when company_name is empty', () => {
    const client: LegacyClient = { ...sampleClient, company_name: '' }
    const result = mapLegacyClient(client, TEST_ENTITY_ID)
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.data.name).toBe('Jane Doe')
  })

  it('emits warning for unparsable address', () => {
    const client: LegacyClient = { ...sampleClient, address: 'somewhere' }
    const result = mapLegacyClient(client, TEST_ENTITY_ID)
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.warnings.length).toBeGreaterThan(0)
    expect(result.data.address?.line1).toBe('somewhere')
  })

  it('handles null address', () => {
    const client: LegacyClient = { ...sampleClient, address: null }
    const result = mapLegacyClient(client, TEST_ENTITY_ID)
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.data.address).toBeNull()
  })
})

describe('mapZohoLead', () => {
  it('maps a Zoho lead to Customer shape', () => {
    const result = mapZohoLead(
      {
        zoho_id: 'zoho-123',
        company: 'Zoho Corp',
        contact_name: 'John',
        email: 'john@zoho.com',
        phone: null,
        source: 'web',
        status: 'open',
        estimated_value: 5000,
      },
      TEST_ENTITY_ID,
    )
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.data.name).toBe('Zoho Corp')
    expect(result.data.externalIds.zohoLeadId).toBe('zoho-123')
  })
})

describe('mapProposalItems', () => {
  it('maps and sorts items by display_order', () => {
    const items: LegacyProposalItem[] = [
      { ...sampleItem, display_order: 2, product_name: 'Second' },
      { ...sampleItem, display_order: 0, product_name: 'First' },
      { ...sampleItem, display_order: 1, product_name: 'Middle' },
    ]
    const mapped = mapProposalItems(items)
    expect(mapped.map((l) => l.description)).toEqual(['First', 'Middle', 'Second'])
  })

  it('preserves unitCost from legacy snapshot', () => {
    const mapped = mapProposalItems([sampleItem])
    expect(mapped[0]!.unitCost).toBe(12.50)
  })
})

describe('mapRequestToQuoteInput', () => {
  it('maps a request + proposal into CreateQuoteInput', () => {
    const result = mapRequestToQuoteInput(sampleRequest, sampleProposal, DEFAULT_ADAPTER_CONFIG)
    expect(result.ok).toBe(true)
    if (!result.ok) return

    expect(result.data.customerId).toBe('cli-legacy-001')
    expect(result.data.pricingTier).toBe(PricingTier.PREMIUM)
    expect(result.data.lines.length).toBe(1)
    expect(result.data.lines[0]!.description).toBe('Artisanal Chocolate Box')
    expect(result.data.metadata?.legacyRequestId).toBe('req-001')
  })

  it('creates placeholder line when no proposal exists', () => {
    const result = mapRequestToQuoteInput(sampleRequest, null, DEFAULT_ADAPTER_CONFIG)
    expect(result.ok).toBe(true)
    if (!result.ok) return

    expect(result.data.lines.length).toBe(1)
    expect(result.data.lines[0]!.description).toBe('Holiday Gift Boxes 2025')
    expect(result.data.lines[0]!.quantity).toBe(50)
    expect(result.warnings.length).toBeGreaterThan(0)
  })

  it('infers tier from budget_range when no proposal', () => {
    const request: LegacyRequest = {
      ...sampleRequest,
      budget_range: 'low budget option',
    }
    const result = mapRequestToQuoteInput(request, null, DEFAULT_ADAPTER_CONFIG)
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.data.pricingTier).toBe(PricingTier.BUDGET)
  })

  it('flags AI-assisted proposals when config enabled', () => {
    const aiProposal: LegacyProposal = { ...sampleProposal, ai_assisted: true }
    const config = { ...DEFAULT_ADAPTER_CONFIG, flagAiAssistedForReview: true }
    const result = mapRequestToQuoteInput(sampleRequest, aiProposal, config)
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.warnings.some((w) => w.includes('AI-assisted'))).toBe(true)
  })
})

describe('buildMigrationContext', () => {
  it('builds OrgContext for migration operations', () => {
    const config = { ...DEFAULT_ADAPTER_CONFIG, defaultEntityId: 'ent-test' }
    const ctx = buildMigrationContext(config, 'req-123')
    expect(ctx.orgId).toBe('ent-test')
    expect(ctx.actorId).toBe('system:migration')
    expect(ctx.requestId).toBe('req-123')
    expect(ctx.permissions).toContain('commerce:quote:create')
  })
})
