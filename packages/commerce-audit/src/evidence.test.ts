import { describe, it, expect } from 'vitest'
import { OrgRole, QuoteStatus, EvidenceType } from '@nzila/commerce-core/enums'
import { attemptTransition } from '@nzila/commerce-state'
import { quoteMachine } from '@nzila/commerce-state/machines'
import {
  CommerceEntityType,
  buildTransitionAuditEntry,
  type TransitionAuditContext,
} from './audit'
import {
  COMMERCE_CONTROL_MAPPINGS,
  buildCommerceEvidencePack,
  computeAuditTrailHash,
  generateCommercePackId,
  type CommerceEvidenceRequest,
} from './evidence'

// ── Fixtures ────────────────────────────────────────────────────────────────

const ORG_ID = 'org-001'
const ACTOR_ID = 'actor-001'
const TIMESTAMP = '2026-01-15T10:00:00.000Z'

function makeAuditEntry(id: string, from: QuoteStatus, to: QuoteStatus) {
  const result = attemptTransition(
    quoteMachine,
    from,
    to,
    { orgId: ORG_ID, actorId: ACTOR_ID, role: OrgRole.SALES, meta: {} },
    ORG_ID,
    {},
  )
  if (!result.ok) throw new Error(`Transition failed: ${result.reason}`)

  const ctx: TransitionAuditContext = {
    id,
    orgId: ORG_ID,
    actorId: ACTOR_ID,
    role: OrgRole.SALES,
    entityType: CommerceEntityType.QUOTE,
    targetEntityId: 'quote-001',
    timestamp: TIMESTAMP,
  }
  return buildTransitionAuditEntry(result, ctx)
}

// ── COMMERCE_CONTROL_MAPPINGS ───────────────────────────────────────────────

describe('COMMERCE_CONTROL_MAPPINGS', () => {
  it('should have mapping for all key entity types', () => {
    expect(COMMERCE_CONTROL_MAPPINGS).toHaveProperty(CommerceEntityType.QUOTE)
    expect(COMMERCE_CONTROL_MAPPINGS).toHaveProperty(CommerceEntityType.ORDER)
    expect(COMMERCE_CONTROL_MAPPINGS).toHaveProperty(CommerceEntityType.INVOICE)
    expect(COMMERCE_CONTROL_MAPPINGS).toHaveProperty(CommerceEntityType.FULFILLMENT)
    expect(COMMERCE_CONTROL_MAPPINGS).toHaveProperty(CommerceEntityType.PAYMENT)
    expect(COMMERCE_CONTROL_MAPPINGS).toHaveProperty(CommerceEntityType.REFUND)
  })

  it('should all use integrity control family', () => {
    for (const mapping of Object.values(COMMERCE_CONTROL_MAPPINGS)) {
      expect(mapping.controlFamily).toBe('integrity')
    }
  })

  it('should all include INT-10 base control', () => {
    for (const mapping of Object.values(COMMERCE_CONTROL_MAPPINGS)) {
      expect(mapping.controlsCovered).toContain('INT-10')
    }
  })
})

// ── computeAuditTrailHash ───────────────────────────────────────────────────

describe('computeAuditTrailHash', () => {
  it('should produce deterministic 64-char hex hash', () => {
    const entry = makeAuditEntry('a1', QuoteStatus.DRAFT, QuoteStatus.PRICING)
    const hash1 = computeAuditTrailHash([entry])
    const hash2 = computeAuditTrailHash([entry])
    expect(hash1).toBe(hash2)
    expect(hash1).toHaveLength(64)
  })

  it('should differ for different trails', () => {
    const entry1 = makeAuditEntry('a1', QuoteStatus.DRAFT, QuoteStatus.PRICING)
    const entry2 = makeAuditEntry('a2', QuoteStatus.PRICING, QuoteStatus.READY)
    const hash1 = computeAuditTrailHash([entry1])
    const hash2 = computeAuditTrailHash([entry1, entry2])
    expect(hash1).not.toBe(hash2)
  })

  it('should handle empty trail', () => {
    const hash = computeAuditTrailHash([])
    expect(hash).toHaveLength(64)
  })
})

// ── generateCommercePackId ──────────────────────────────────────────────────

describe('generateCommercePackId', () => {
  it('should produce pack ID with COM prefix', () => {
    const id = generateCommercePackId(CommerceEntityType.QUOTE, 'quote-001', 'quote.accepted')
    expect(id).toMatch(/^COM-QUOTE-/)
  })

  it('should include trigger event', () => {
    const id = generateCommercePackId(CommerceEntityType.ORDER, 'order-abc123', 'order.completed')
    expect(id).toContain('ORDER-COMPLETED')
  })

  it('should include year-month suffix', () => {
    const id = generateCommercePackId(CommerceEntityType.INVOICE, 'inv-001', 'invoice.paid')
    expect(id).toMatch(/\d{6}$/)
  })
})

// ── buildCommerceEvidencePack ────────────────────────────────────────────────

describe('buildCommerceEvidencePack', () => {
  it('should build evidence pack for quote acceptance', () => {
    const entry = makeAuditEntry('a1', QuoteStatus.DRAFT, QuoteStatus.PRICING)
    const req: CommerceEvidenceRequest = {
      orgId: ORG_ID,
      entityType: CommerceEntityType.QUOTE,
      targetEntityId: 'quote-001',
      triggerEvent: 'quote.accepted',
      actorId: ACTOR_ID,
      auditTrail: [entry],
    }

    const result = buildCommerceEvidencePack(req)

    expect(result.orgId).toBe(ORG_ID)
    expect(result.controlFamily).toBe('integrity')
    expect(result.controlsCovered).toContain('INT-10')
    expect(result.controlsCovered).toContain('INT-11')
    expect(result.retentionClass).toBe('7_YEARS')
    expect(result.auditTrailHash).toHaveLength(64)
    expect(result.artifactCount).toBe(1) // audit trail only
    expect(result.packId).toContain('COM-QUOTE')
    expect(result.summary).toContain('quote')
  })

  it('should count additional artifacts', () => {
    const entry = makeAuditEntry('a1', QuoteStatus.DRAFT, QuoteStatus.PRICING)
    const req: CommerceEvidenceRequest = {
      orgId: ORG_ID,
      entityType: CommerceEntityType.QUOTE,
      targetEntityId: 'quote-001',
      triggerEvent: 'quote.accepted',
      actorId: ACTOR_ID,
      auditTrail: [entry],
      artifacts: [
        {
          type: EvidenceType.QUOTE_PDF,
          filename: 'quote-001.pdf',
          buffer: Buffer.from('fake-pdf'),
          contentType: 'application/pdf',
        },
      ],
    }

    const result = buildCommerceEvidencePack(req)
    expect(result.artifactCount).toBe(2) // audit trail + PDF
  })

  it('should use fallback for unmapped entity types', () => {
    const entry = makeAuditEntry('a1', QuoteStatus.DRAFT, QuoteStatus.PRICING)
    const req: CommerceEvidenceRequest = {
      orgId: ORG_ID,
      entityType: CommerceEntityType.DISPUTE,
      targetEntityId: 'dispute-001',
      triggerEvent: 'dispute.resolved',
      actorId: ACTOR_ID,
      auditTrail: [entry],
    }

    const result = buildCommerceEvidencePack(req)
    expect(result.controlFamily).toBe('integrity')
    expect(result.controlsCovered).toContain('INT-10')
  })

  it('should use fulfillment mapping with 3-year retention', () => {
    const entry = makeAuditEntry('a1', QuoteStatus.DRAFT, QuoteStatus.PRICING)
    const req: CommerceEvidenceRequest = {
      orgId: ORG_ID,
      entityType: CommerceEntityType.FULFILLMENT,
      targetEntityId: 'ful-001',
      triggerEvent: 'fulfillment.delivered',
      actorId: ACTOR_ID,
      auditTrail: [entry],
    }

    const result = buildCommerceEvidencePack(req)
    expect(result.retentionClass).toBe('3_YEARS')
  })
})
