/**
 * @nzila/commerce-services — Invoice Service Tests
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { InvoiceStatus, OrgRole } from '@nzila/commerce-core/enums'
import type { OrgContext } from '@nzila/commerce-core/types'
import {
  createInvoiceService,
  type InvoiceRepository,
  type CreateInvoiceInput,
  type InvoiceEntity,
  type RecordPaymentInput,
} from './invoice-service'
import { AuditAction, CommerceEntityType } from '@nzila/commerce-audit'

// ── Fixtures ────────────────────────────────────────────────────────────────

const TEST_ORG = 'org-test-001'
const TEST_ACTOR = 'actor-test-001'

function makeCtx(overrides?: Partial<OrgContext>): OrgContext {
  return {
    entityId: TEST_ORG,
    actorId: TEST_ACTOR,
    role: OrgRole.FINANCE,
    permissions: [],
    requestId: 'req-001',
    ...overrides,
  }
}

function makeInvoiceEntity(overrides?: Partial<InvoiceEntity>): InvoiceEntity {
  return {
    id: 'inv-001',
    entityId: TEST_ORG,
    ref: 'INV-NZI-000001',
    orderId: 'order-001',
    customerId: 'cust-001',
    status: InvoiceStatus.DRAFT,
    subtotal: '1000.00',
    taxTotal: '149.75',
    grandTotal: '1149.75',
    amountPaid: '0',
    amountDue: '1149.75',
    dueDate: '2025-02-01T00:00:00Z',
    issuedAt: null,
    paidAt: null,
    createdBy: TEST_ACTOR,
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
    ...overrides,
  }
}

const sampleInput: CreateInvoiceInput = {
  orderId: 'order-001',
  customerId: 'cust-001',
  lines: [
    { description: 'Widget A x 100', quantity: 100, unitPrice: 5.0, lineTotal: 500, sortOrder: 0 },
    { description: 'Widget B x 50', quantity: 50, unitPrice: 10.0, lineTotal: 500, sortOrder: 1 },
  ],
  subtotal: 1000,
  taxTotal: 149.75,
  grandTotal: 1149.75,
  dueDays: 30,
}

const samplePayment: RecordPaymentInput = {
  amount: 500,
  method: 'wire_transfer',
  reference: 'TXN-12345',
}

function createMockRepo(): InvoiceRepository {
  let refCounter = 0
  return {
    nextRef: vi.fn(async () => {
      refCounter++
      return `INV-NZI-${String(refCounter).padStart(6, '0')}`
    }),
    createInvoice: vi.fn(async (_ctx, data) => ({
      id: `inv-${crypto.randomUUID().slice(0, 8)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...data,
    })) as InvoiceRepository['createInvoice'],
    createInvoiceLines: vi.fn(async (_ctx, _id, lines) =>
      lines.map((line: Record<string, unknown>, idx: number) => ({ id: `line-${idx}`, ...line })),
    ) as InvoiceRepository['createInvoiceLines'],
    getInvoiceById: vi.fn(async () => null),
    updateInvoice: vi.fn(async (_ctx, _id, values) =>
      makeInvoiceEntity(values),
    ) as InvoiceRepository['updateInvoice'],
    recordPayment: vi.fn(async () => undefined),
  }
}

// ── Tests ───────────────────────────────────────────────────────────────────

describe('InvoiceService', () => {
  let repo: ReturnType<typeof createMockRepo>
  let service: ReturnType<typeof createInvoiceService>
  const ctx = makeCtx()

  beforeEach(() => {
    repo = createMockRepo()
    service = createInvoiceService(repo)
  })

  describe('API surface', () => {
    it('returns object with 12 lifecycle methods', () => {
      expect(Object.keys(service)).toHaveLength(12)
      expect(service).toHaveProperty('createInvoice')
      expect(service).toHaveProperty('issueInvoice')
      expect(service).toHaveProperty('sendInvoice')
      expect(service).toHaveProperty('recordPartialPayment')
      expect(service).toHaveProperty('recordFullPayment')
      expect(service).toHaveProperty('markOverdue')
      expect(service).toHaveProperty('raiseDispute')
      expect(service).toHaveProperty('resolveDispute')
      expect(service).toHaveProperty('issueCreditNote')
      expect(service).toHaveProperty('processRefund')
      expect(service).toHaveProperty('cancelInvoice')
      expect(service).toHaveProperty('getAvailableActions')
    })
  })

  describe('createInvoice', () => {
    it('creates invoice in DRAFT status', async () => {
      const result = await service.createInvoice(ctx, sampleInput)
      expect(result.ok).toBe(true)
      if (!result.ok) return
      expect(result.data.status).toBe(InvoiceStatus.DRAFT)
      expect(result.data.entityId).toBe(TEST_ORG)
    })

    it('calls repo with correct data', async () => {
      await service.createInvoice(ctx, sampleInput)
      expect(repo.nextRef).toHaveBeenCalledWith(ctx)
      expect(repo.createInvoice).toHaveBeenCalledTimes(1)
      expect(repo.createInvoiceLines).toHaveBeenCalledTimes(1)
    })

    it('computes dueDate from dueDays', async () => {
      const result = await service.createInvoice(ctx, sampleInput)
      expect(result.ok).toBe(true)
      if (!result.ok) return
      expect(result.data.dueDate).not.toBeNull()
    })

    it('sets dueDate null when no dueDays', async () => {
      const { dueDays: _, ...inputNoDue } = sampleInput
      const result = await service.createInvoice(ctx, inputNoDue)
      expect(result.ok).toBe(true)
      if (!result.ok) return
      expect(result.data.dueDate).toBeNull()
    })

    it('produces CREATE audit entry', async () => {
      const result = await service.createInvoice(ctx, sampleInput)
      expect(result.ok).toBe(true)
      if (!result.ok) return
      expect(result.auditEntries).toHaveLength(1)
      expect(result.auditEntries[0]!.action).toBe(AuditAction.CREATE)
      expect(result.auditEntries[0]!.entityType).toBe(CommerceEntityType.INVOICE)
    })
  })

  describe('issueInvoice', () => {
    it('transitions DRAFT → ISSUED (FINANCE)', () => {
      const invoice = makeInvoiceEntity({ status: InvoiceStatus.DRAFT })
      const result = service.issueInvoice(ctx, invoice)
      expect(result.ok).toBe(true)
      if (!result.ok) return
      expect(result.data.to).toBe(InvoiceStatus.ISSUED)
    })

    it('rejects non-FINANCE, non-MANAGER roles', () => {
      const salesCtx = makeCtx({ role: OrgRole.SALES })
      const invoice = makeInvoiceEntity({ status: InvoiceStatus.DRAFT })
      expect(service.issueInvoice(salesCtx, invoice).ok).toBe(false)
    })
  })

  describe('sendInvoice', () => {
    it('transitions ISSUED → SENT', () => {
      const invoice = makeInvoiceEntity({ status: InvoiceStatus.ISSUED })
      const result = service.sendInvoice(ctx, invoice)
      expect(result.ok).toBe(true)
      if (!result.ok) return
      expect(result.data.to).toBe(InvoiceStatus.SENT)
    })
  })

  describe('recordPartialPayment', () => {
    it('transitions SENT → PARTIAL_PAID', () => {
      const invoice = makeInvoiceEntity({ status: InvoiceStatus.SENT })
      const result = service.recordPartialPayment(ctx, invoice, samplePayment)
      expect(result.ok).toBe(true)
      if (!result.ok) return
      expect(result.data.to).toBe(InvoiceStatus.PARTIAL_PAID)
      expect(result.auditEntries[0]!.metadata).toHaveProperty('amount', 500)
    })

    it('transitions OVERDUE → PARTIAL_PAID', () => {
      const invoice = makeInvoiceEntity({ status: InvoiceStatus.OVERDUE })
      const result = service.recordPartialPayment(ctx, invoice, samplePayment)
      expect(result.ok).toBe(true)
    })
  })

  describe('recordFullPayment', () => {
    it('transitions SENT → PAID', () => {
      const invoice = makeInvoiceEntity({ status: InvoiceStatus.SENT })
      const result = service.recordFullPayment(ctx, invoice, samplePayment)
      expect(result.ok).toBe(true)
      if (!result.ok) return
      expect(result.data.to).toBe(InvoiceStatus.PAID)
    })

    it('transitions PARTIAL_PAID → PAID', () => {
      const invoice = makeInvoiceEntity({ status: InvoiceStatus.PARTIAL_PAID })
      const result = service.recordFullPayment(ctx, invoice, samplePayment)
      expect(result.ok).toBe(true)
    })

    it('transitions OVERDUE → PAID', () => {
      const invoice = makeInvoiceEntity({ status: InvoiceStatus.OVERDUE })
      const result = service.recordFullPayment(ctx, invoice, samplePayment)
      expect(result.ok).toBe(true)
    })
  })

  describe('markOverdue', () => {
    it('transitions SENT → OVERDUE (any role / system)', () => {
      const salesCtx = makeCtx({ role: OrgRole.SALES })
      const invoice = makeInvoiceEntity({ status: InvoiceStatus.SENT })
      const result = service.markOverdue(salesCtx, invoice)
      expect(result.ok).toBe(true)
      if (!result.ok) return
      expect(result.data.to).toBe(InvoiceStatus.OVERDUE)
    })
  })

  describe('raiseDispute', () => {
    it('transitions SENT → DISPUTED', () => {
      const invoice = makeInvoiceEntity({ status: InvoiceStatus.SENT })
      const result = service.raiseDispute(ctx, invoice, 'Wrong amount charged')
      expect(result.ok).toBe(true)
      if (!result.ok) return
      expect(result.data.to).toBe(InvoiceStatus.DISPUTED)
      expect(result.auditEntries[0]!.metadata).toHaveProperty('reason', 'Wrong amount charged')
    })

    it('transitions OVERDUE → DISPUTED', () => {
      const invoice = makeInvoiceEntity({ status: InvoiceStatus.OVERDUE })
      const result = service.raiseDispute(ctx, invoice, 'Invoice dispute')
      expect(result.ok).toBe(true)
    })
  })

  describe('resolveDispute', () => {
    it('transitions DISPUTED → RESOLVED (FINANCE)', () => {
      const invoice = makeInvoiceEntity({ status: InvoiceStatus.DISPUTED })
      const result = service.resolveDispute(ctx, invoice, 'Corrected amount')
      expect(result.ok).toBe(true)
      if (!result.ok) return
      expect(result.data.to).toBe(InvoiceStatus.RESOLVED)
    })
  })

  describe('issueCreditNote', () => {
    it('transitions RESOLVED → CREDIT_NOTE', () => {
      const invoice = makeInvoiceEntity({ status: InvoiceStatus.RESOLVED })
      const result = service.issueCreditNote(ctx, invoice, 200, 'Partial credit')
      expect(result.ok).toBe(true)
      if (!result.ok) return
      expect(result.data.to).toBe(InvoiceStatus.CREDIT_NOTE)
      expect(result.auditEntries[0]!.metadata).toHaveProperty('amount', 200)
    })
  })

  describe('processRefund', () => {
    it('transitions RESOLVED → REFUNDED', () => {
      const invoice = makeInvoiceEntity({ status: InvoiceStatus.RESOLVED })
      const result = service.processRefund(ctx, invoice, 1149.75, 'Full refund')
      expect(result.ok).toBe(true)
      if (!result.ok) return
      expect(result.data.to).toBe(InvoiceStatus.REFUNDED)
    })

    it('transitions CREDIT_NOTE → REFUNDED', () => {
      const invoice = makeInvoiceEntity({ status: InvoiceStatus.CREDIT_NOTE })
      const result = service.processRefund(ctx, invoice, 200, 'Credit note refund')
      expect(result.ok).toBe(true)
    })
  })

  describe('cancelInvoice', () => {
    it('cancels DRAFT invoice', () => {
      const invoice = makeInvoiceEntity({ status: InvoiceStatus.DRAFT })
      const result = service.cancelInvoice(ctx, invoice, 'No longer needed')
      expect(result.ok).toBe(true)
      if (!result.ok) return
      expect(result.data.to).toBe(InvoiceStatus.CANCELLED)
      expect(result.auditEntries[0]!.metadata).toHaveProperty('reason', 'No longer needed')
    })

    it('cancels ISSUED invoice', () => {
      const invoice = makeInvoiceEntity({ status: InvoiceStatus.ISSUED })
      const result = service.cancelInvoice(ctx, invoice)
      expect(result.ok).toBe(true)
    })

    it('rejects cancel from SENT state', () => {
      const invoice = makeInvoiceEntity({ status: InvoiceStatus.SENT })
      expect(service.cancelInvoice(ctx, invoice).ok).toBe(false)
    })

    it('rejects cancel from terminal PAID', () => {
      const invoice = makeInvoiceEntity({ status: InvoiceStatus.PAID })
      expect(service.cancelInvoice(ctx, invoice).ok).toBe(false)
    })
  })

  describe('getAvailableActions', () => {
    it('returns ISSUED and CANCELLED for DRAFT', () => {
      const invoice = makeInvoiceEntity({ status: InvoiceStatus.DRAFT })
      const actions = service.getAvailableActions(ctx, invoice)
      expect(actions).toContain(InvoiceStatus.ISSUED)
      expect(actions).toContain(InvoiceStatus.CANCELLED)
    })

    it('returns multiple actions for SENT', () => {
      const invoice = makeInvoiceEntity({ status: InvoiceStatus.SENT })
      const actions = service.getAvailableActions(ctx, invoice)
      expect(actions.length).toBeGreaterThanOrEqual(2)
    })

    it('returns empty for terminal PAID', () => {
      const invoice = makeInvoiceEntity({ status: InvoiceStatus.PAID })
      expect(service.getAvailableActions(ctx, invoice)).toHaveLength(0)
    })

    it('returns empty for terminal CANCELLED', () => {
      const invoice = makeInvoiceEntity({ status: InvoiceStatus.CANCELLED })
      expect(service.getAvailableActions(ctx, invoice)).toHaveLength(0)
    })
  })

  describe('full lifecycle — happy path', () => {
    it('DRAFT → ISSUED → SENT → PAID', () => {
      expect(service.issueInvoice(ctx, makeInvoiceEntity({ status: InvoiceStatus.DRAFT })).ok).toBe(true)
      expect(service.sendInvoice(ctx, makeInvoiceEntity({ status: InvoiceStatus.ISSUED })).ok).toBe(true)
      expect(service.recordFullPayment(ctx, makeInvoiceEntity({ status: InvoiceStatus.SENT }), samplePayment).ok).toBe(true)
    })

    it('DRAFT → ISSUED → SENT → PARTIAL_PAID → PAID', () => {
      expect(service.issueInvoice(ctx, makeInvoiceEntity({ status: InvoiceStatus.DRAFT })).ok).toBe(true)
      expect(service.sendInvoice(ctx, makeInvoiceEntity({ status: InvoiceStatus.ISSUED })).ok).toBe(true)
      expect(service.recordPartialPayment(ctx, makeInvoiceEntity({ status: InvoiceStatus.SENT }), samplePayment).ok).toBe(true)
      expect(service.recordFullPayment(ctx, makeInvoiceEntity({ status: InvoiceStatus.PARTIAL_PAID }), samplePayment).ok).toBe(true)
    })
  })

  describe('full lifecycle — dispute path', () => {
    it('SENT → DISPUTED → RESOLVED → CREDIT_NOTE → REFUNDED', () => {
      expect(service.raiseDispute(ctx, makeInvoiceEntity({ status: InvoiceStatus.SENT }), 'Bad charge').ok).toBe(true)
      expect(service.resolveDispute(ctx, makeInvoiceEntity({ status: InvoiceStatus.DISPUTED }), 'Investigation complete').ok).toBe(true)
      expect(service.issueCreditNote(ctx, makeInvoiceEntity({ status: InvoiceStatus.RESOLVED }), 500, 'Credit').ok).toBe(true)
      expect(service.processRefund(ctx, makeInvoiceEntity({ status: InvoiceStatus.CREDIT_NOTE }), 500, 'Refund').ok).toBe(true)
    })

    it('SENT → OVERDUE → DISPUTED → RESOLVED → REFUNDED', () => {
      const salesCtx = makeCtx({ role: OrgRole.SALES })
      expect(service.markOverdue(salesCtx, makeInvoiceEntity({ status: InvoiceStatus.SENT })).ok).toBe(true)
      expect(service.raiseDispute(ctx, makeInvoiceEntity({ status: InvoiceStatus.OVERDUE }), 'Overdue dispute').ok).toBe(true)
      expect(service.resolveDispute(ctx, makeInvoiceEntity({ status: InvoiceStatus.DISPUTED }), 'Done').ok).toBe(true)
      expect(service.processRefund(ctx, makeInvoiceEntity({ status: InvoiceStatus.RESOLVED }), 1149.75, 'Full refund').ok).toBe(true)
    })
  })

  describe('terminal state enforcement', () => {
    it('cannot transition from PAID', () => {
      const invoice = makeInvoiceEntity({ status: InvoiceStatus.PAID })
      expect(service.issueInvoice(ctx, invoice).ok).toBe(false)
      expect(service.cancelInvoice(ctx, invoice).ok).toBe(false)
    })

    it('cannot transition from CANCELLED', () => {
      const invoice = makeInvoiceEntity({ status: InvoiceStatus.CANCELLED })
      expect(service.issueInvoice(ctx, invoice).ok).toBe(false)
    })

    it('cannot transition from REFUNDED', () => {
      const invoice = makeInvoiceEntity({ status: InvoiceStatus.REFUNDED })
      expect(service.issueInvoice(ctx, invoice).ok).toBe(false)
    })
  })

  describe('role enforcement', () => {
    it('SALES cannot issue invoice', () => {
      const salesCtx = makeCtx({ role: OrgRole.SALES })
      const invoice = makeInvoiceEntity({ status: InvoiceStatus.DRAFT })
      expect(service.issueInvoice(salesCtx, invoice).ok).toBe(false)
    })

    it('SALES cannot record payment', () => {
      const salesCtx = makeCtx({ role: OrgRole.SALES })
      const invoice = makeInvoiceEntity({ status: InvoiceStatus.SENT })
      expect(service.recordFullPayment(salesCtx, invoice, samplePayment).ok).toBe(false)
    })

    it('MANAGER can issue invoice', () => {
      const mgrCtx = makeCtx({ role: OrgRole.MANAGER })
      const invoice = makeInvoiceEntity({ status: InvoiceStatus.DRAFT })
      expect(service.issueInvoice(mgrCtx, invoice).ok).toBe(true)
    })

    it('ADMIN can record payment', () => {
      const adminCtx = makeCtx({ role: OrgRole.ADMIN })
      const invoice = makeInvoiceEntity({ status: InvoiceStatus.SENT })
      expect(service.recordFullPayment(adminCtx, invoice, samplePayment).ok).toBe(true)
    })
  })

  describe('audit trail', () => {
    it('every successful operation returns audit entries', async () => {
      const createResult = await service.createInvoice(ctx, sampleInput)
      expect(createResult.ok && createResult.auditEntries.length).toBeGreaterThanOrEqual(1)

      const issueResult = service.issueInvoice(ctx, makeInvoiceEntity({ status: InvoiceStatus.DRAFT }))
      expect(issueResult.ok && issueResult.auditEntries.length).toBeGreaterThanOrEqual(1)
    })

    it('audit entries carry correct entityId', async () => {
      const result = await service.createInvoice(ctx, sampleInput)
      expect(result.ok).toBe(true)
      if (!result.ok) return
      expect(result.auditEntries[0]!.entityId).toBe(TEST_ORG)
      expect(result.auditEntries[0]!.actorId).toBe(TEST_ACTOR)
    })
  })
})
