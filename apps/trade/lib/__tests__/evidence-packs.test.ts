/**
 * Trade — Evidence Pack Builder Tests
 *
 * Tests the three trade evidence pack builders and the org export function.
 * These are pure functions (deterministic given a fixed timestamp).
 *
 * @see lib/evidence/trade-evidence-packs.ts
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// Mock @nzila/evidence before importing pack builders
vi.mock('@nzila/evidence', () => ({
  computeMerkleRoot: vi.fn((hashes: string[]) => `merkle-root-${hashes.length}`),
  generateSeal: vi.fn((packIndex: Record<string, unknown>, opts?: { hmacKey?: string }) => ({
    sealVersion: '1.0',
    algorithm: 'sha256',
    packDigest: `digest-${packIndex.evidenceType ?? packIndex.packType ?? 'unknown'}`,
    artifactsMerkleRoot: 'merkle-root-test',
    artifactCount: (packIndex.artifacts as unknown[])?.length ?? 0,
    sealedAt: '2026-03-10T00:00:00.000Z',
    hmacSignature: opts?.hmacKey ? 'hmac-sig' : undefined,
  })),
}))

// Mock trade-core enums
vi.mock('@nzila/trade-core', () => ({
  TradeEvidenceType: {
    QUOTE_ACCEPTANCE: 'quote_acceptance_pack',
    SHIPMENT_DOCS: 'shipment_docs_pack',
    COMMISSION_SETTLEMENT: 'commission_settlement_pack',
  },
}))

import {
  buildQuoteAcceptancePack,
  buildShipmentDocsPack,
  buildCommissionSettlementPack,
  buildOrgTradeExport,
} from '../evidence/trade-evidence-packs'

// ── Fixtures ────────────────────────────────────────────────────────────────

const DEAL = {
  id: 'deal-001',
  orgId: 'org-001',
  status: 'accepted',
  counterparty: 'buyer-x',
} as any

const QUOTE = {
  id: 'quote-001',
  total: 50000,
  currency: 'USD',
  acceptedAt: new Date('2026-03-01'),
} as any

const SHIPMENT = {
  id: 'ship-001',
  trackingRef: 'TRK-12345',
  status: 'delivered',
} as any

const DOCUMENTS = [
  { docType: 'bill_of_lading', contentHash: 'abc123', uri: '/docs/bol.pdf' },
  { docType: 'certificate_of_origin', contentHash: 'def456', uri: '/docs/coo.pdf' },
] as any[]

const COMMISSION = {
  id: 'comm-001',
  rateBps: 250,
  amountCents: 12500,
  currency: 'USD',
} as any

const AUDIT_ENTRIES = [
  { action: 'quote_accepted', actorId: 'user-1', timestamp: '2026-03-01T00:00:00Z' },
  { action: 'shipment_created', actorId: 'user-1', timestamp: '2026-03-02T00:00:00Z' },
] as any[]

// ── Tests ───────────────────────────────────────────────────────────────────

describe('Trade Evidence Pack Builders', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-03-10T00:00:00Z'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('buildQuoteAcceptancePack', () => {
    it('returns correct evidence type', () => {
      const pack = buildQuoteAcceptancePack(DEAL, QUOTE, AUDIT_ENTRIES)
      expect(pack.evidenceType).toBe('quote_acceptance_pack')
    })

    it('produces 3 artifacts (deal, quote, audit)', () => {
      const pack = buildQuoteAcceptancePack(DEAL, QUOTE, AUDIT_ENTRIES)
      expect(pack.artifacts).toHaveLength(3)
      expect(pack.artifacts.map((a) => a.name)).toEqual([
        'deal_snapshot',
        'quote_snapshot',
        'audit_trail',
      ])
    })

    it('each artifact has a sha256 hash', () => {
      const pack = buildQuoteAcceptancePack(DEAL, QUOTE, AUDIT_ENTRIES)
      for (const a of pack.artifacts) {
        expect(a.sha256).toMatch(/^[a-f0-9]{64}$/)
      }
    })

    it('includes Merkle root', () => {
      const pack = buildQuoteAcceptancePack(DEAL, QUOTE, AUDIT_ENTRIES)
      expect(pack.artifactsMerkleRoot).toBe('merkle-root-3')
    })

    it('includes seal envelope', () => {
      const pack = buildQuoteAcceptancePack(DEAL, QUOTE, AUDIT_ENTRIES)
      expect(pack.sealEnvelope).toBeDefined()
      expect(pack.sealEnvelope).toHaveProperty('sealVersion', '1.0')
    })

    it('includes metadata with quoteId', () => {
      const pack = buildQuoteAcceptancePack(DEAL, QUOTE, AUDIT_ENTRIES)
      expect(pack.metadata).toHaveProperty('quoteId', 'quote-001')
    })

    it('passes hmacKey to seal generator when provided', () => {
      const pack = buildQuoteAcceptancePack(DEAL, QUOTE, AUDIT_ENTRIES, 'secret-key')
      expect(pack.sealEnvelope).toHaveProperty('hmacSignature', 'hmac-sig')
    })
  })

  describe('buildShipmentDocsPack', () => {
    it('returns correct evidence type', () => {
      const pack = buildShipmentDocsPack(DEAL, SHIPMENT, DOCUMENTS, AUDIT_ENTRIES)
      expect(pack.evidenceType).toBe('shipment_docs_pack')
    })

    it('includes document artifacts', () => {
      const pack = buildShipmentDocsPack(DEAL, SHIPMENT, DOCUMENTS, AUDIT_ENTRIES)
      // deal + shipment + 2 documents + audit = 5
      expect(pack.artifacts).toHaveLength(5)
      const docNames = pack.artifacts.map((a) => a.name)
      expect(docNames).toContain('document_bill_of_lading')
      expect(docNames).toContain('document_certificate_of_origin')
    })

    it('uses document contentHash for document artifacts', () => {
      const pack = buildShipmentDocsPack(DEAL, SHIPMENT, DOCUMENTS, AUDIT_ENTRIES)
      const bol = pack.artifacts.find((a) => a.name === 'document_bill_of_lading')
      expect(bol?.sha256).toBe('abc123')
    })
  })

  describe('buildCommissionSettlementPack', () => {
    it('returns correct evidence type', () => {
      const pack = buildCommissionSettlementPack(DEAL, COMMISSION, AUDIT_ENTRIES)
      expect(pack.evidenceType).toBe('commission_settlement_pack')
    })

    it('produces 3 artifacts (deal, commission, audit)', () => {
      const pack = buildCommissionSettlementPack(DEAL, COMMISSION, AUDIT_ENTRIES)
      expect(pack.artifacts).toHaveLength(3)
    })
  })

  describe('buildOrgTradeExport', () => {
    it('aggregates multiple packs', () => {
      const packs = [
        buildQuoteAcceptancePack(DEAL, QUOTE, AUDIT_ENTRIES),
        buildShipmentDocsPack(DEAL, SHIPMENT, DOCUMENTS, AUDIT_ENTRIES),
        buildCommissionSettlementPack(DEAL, COMMISSION, AUDIT_ENTRIES),
      ]
      const exported = buildOrgTradeExport('org-001', packs)
      expect(exported.orgId).toBe('org-001')
      expect(exported.totalPacks).toBe(3)
      expect(exported.packs).toHaveLength(3)
    })

    it('records export timestamp', () => {
      const exported = buildOrgTradeExport('org-001', [])
      expect(exported.exportedAt).toBe('2026-03-10T00:00:00.000Z')
    })
  })
})
