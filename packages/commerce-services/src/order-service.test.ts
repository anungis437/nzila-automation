/**
 * @nzila/commerce-services — Order Service Tests
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { OrderStatus, OrgRole } from '@nzila/commerce-core/enums'
import type { OrgContext } from '@nzila/commerce-core/types'
import {
  createOrderService,
  type OrderRepository,
  type CreateOrderInput,
  type OrderEntity,
} from './order-service'
import { AuditAction, CommerceEntityType } from '@nzila/commerce-audit'

// ── Fixtures ────────────────────────────────────────────────────────────────

const TEST_ORG = 'org-test-001'
const TEST_ACTOR = 'actor-test-001'

function makeCtx(overrides?: Partial<OrgContext>): OrgContext {
  return {
    orgId: TEST_ORG,
    actorId: TEST_ACTOR,
    role: OrgRole.SALES,
    permissions: [],
    requestId: 'req-001',
    ...overrides,
  }
}

function makeOrderEntity(overrides?: Partial<OrderEntity>): OrderEntity {
  return {
    id: 'order-001',
    orgId: TEST_ORG,
    ref: 'ORD-NZI-000001',
    customerId: 'cust-001',
    quoteId: 'quote-001',
    quoteVersionId: 'ver-001',
    status: OrderStatus.CREATED,
    subtotal: '1000.00',
    discountTotal: '0',
    taxTotal: '149.75',
    grandTotal: '1149.75',
    lockedSnapshot: '{}',
    createdBy: TEST_ACTOR,
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
    ...overrides,
  }
}

const sampleInput: CreateOrderInput = {
  customerId: 'cust-001',
  quoteId: 'quote-001',
  quoteVersionId: 'ver-001',
  lines: [
    { itemName: 'Widget A', itemSku: 'WID-A', quantity: 100, unitPrice: 5.00, lineTotal: 500, sortOrder: 0 },
    { itemName: 'Widget B', itemSku: null, quantity: 50, unitPrice: 10.00, lineTotal: 500, sortOrder: 1 },
  ],
  subtotal: 1000,
  taxTotal: 149.75,
  grandTotal: 1149.75,
  lockedSnapshot: '{"version":1}',
}

function createMockRepo(): OrderRepository {
  let refCounter = 0
  return {
    nextRef: vi.fn(async () => {
      refCounter++
      return `ORD-NZI-${String(refCounter).padStart(6, '0')}`
    }),
    createOrder: vi.fn(async (_ctx, data) => ({
      id: `order-${crypto.randomUUID().slice(0, 8)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...data,
    })) as OrderRepository['createOrder'],
    createOrderLines: vi.fn(async (_ctx, _id, lines) =>
      lines.map((line: Record<string, unknown>, idx: number) => ({ id: `line-${idx}`, ...line })),
    ) as OrderRepository['createOrderLines'],
    getOrderById: vi.fn(async () => null),
    updateOrder: vi.fn(async (_ctx, _id, values) =>
      makeOrderEntity(values),
    ) as OrderRepository['updateOrder'],
  }
}

// ── Tests ───────────────────────────────────────────────────────────────────

describe('OrderService', () => {
  let repo: ReturnType<typeof createMockRepo>
  let service: ReturnType<typeof createOrderService>
  const ctx = makeCtx()

  beforeEach(() => {
    repo = createMockRepo()
    service = createOrderService(repo)
  })

  describe('API surface', () => {
    it('returns object with 10 lifecycle methods', () => {
      expect(Object.keys(service)).toHaveLength(10)
      expect(service).toHaveProperty('createOrder')
      expect(service).toHaveProperty('confirmOrder')
      expect(service).toHaveProperty('beginFulfilment')
      expect(service).toHaveProperty('shipOrder')
      expect(service).toHaveProperty('markDelivered')
      expect(service).toHaveProperty('completeOrder')
      expect(service).toHaveProperty('cancelOrder')
      expect(service).toHaveProperty('flagNeedsAttention')
      expect(service).toHaveProperty('requestReturn')
      expect(service).toHaveProperty('getAvailableActions')
    })
  })

  describe('createOrder', () => {
    it('creates order in CREATED status', async () => {
      const result = await service.createOrder(ctx, sampleInput)
      expect(result.ok).toBe(true)
      if (!result.ok) return
      expect(result.data.status).toBe(OrderStatus.CREATED)
      expect(result.data.orgId).toBe(TEST_ORG)
    })

    it('calls repo with org orgId', async () => {
      await service.createOrder(ctx, sampleInput)
      expect(repo.nextRef).toHaveBeenCalledWith(ctx)
      expect(repo.createOrder).toHaveBeenCalledTimes(1)
      expect(repo.createOrderLines).toHaveBeenCalledTimes(1)
    })

    it('produces CREATE audit entry', async () => {
      const result = await service.createOrder(ctx, sampleInput)
      expect(result.ok).toBe(true)
      if (!result.ok) return
      expect(result.auditEntries).toHaveLength(1)
      expect(result.auditEntries[0]!.action).toBe(AuditAction.CREATE)
      expect(result.auditEntries[0]!.entityType).toBe(CommerceEntityType.ORDER)
    })
  })

  describe('confirmOrder', () => {
    it('transitions CREATED → CONFIRMED', () => {
      const order = makeOrderEntity({ status: OrderStatus.CREATED })
      const result = service.confirmOrder(ctx, order)
      expect(result.ok).toBe(true)
      if (!result.ok) return
      expect(result.data.to).toBe(OrderStatus.CONFIRMED)
    })

    it('rejects from DELIVERED state', () => {
      const order = makeOrderEntity({ status: OrderStatus.DELIVERED })
      expect(service.confirmOrder(ctx, order).ok).toBe(false)
    })
  })

  describe('beginFulfilment', () => {
    it('transitions CONFIRMED → FULFILLMENT', () => {
      const whCtx = makeCtx({ role: OrgRole.WAREHOUSE })
      const order = makeOrderEntity({ status: OrderStatus.CONFIRMED })
      const result = service.beginFulfilment(whCtx, order)
      expect(result.ok).toBe(true)
      if (!result.ok) return
      expect(result.data.to).toBe(OrderStatus.FULFILLMENT)
    })
  })

  describe('shipOrder', () => {
    it('transitions FULFILLMENT → SHIPPED', () => {
      const whCtx = makeCtx({ role: OrgRole.WAREHOUSE })
      const order = makeOrderEntity({ status: OrderStatus.FULFILLMENT })
      const result = service.shipOrder(whCtx, order, { carrier: 'UPS', trackingNumber: 'TR123' })
      expect(result.ok).toBe(true)
      if (!result.ok) return
      expect(result.data.to).toBe(OrderStatus.SHIPPED)
      expect(result.auditEntries[0]!.metadata).toHaveProperty('carrier', 'UPS')
    })
  })

  describe('markDelivered', () => {
    it('transitions SHIPPED → DELIVERED', () => {
      const order = makeOrderEntity({ status: OrderStatus.SHIPPED })
      const result = service.markDelivered(ctx, order)
      expect(result.ok).toBe(true)
      if (!result.ok) return
      expect(result.data.to).toBe(OrderStatus.DELIVERED)
    })
  })

  describe('completeOrder', () => {
    it('transitions DELIVERED → COMPLETED (MANAGER+)', () => {
      const mgrCtx = makeCtx({ role: OrgRole.MANAGER })
      const order = makeOrderEntity({ status: OrderStatus.DELIVERED })
      const result = service.completeOrder(mgrCtx, order)
      expect(result.ok).toBe(true)
      if (!result.ok) return
      expect(result.data.to).toBe(OrderStatus.COMPLETED)
    })
  })

  describe('cancelOrder', () => {
    it('cancels CREATED order (SALES allowed)', () => {
      const order = makeOrderEntity({ status: OrderStatus.CREATED })
      const result = service.cancelOrder(ctx, order, 'Customer request')
      expect(result.ok).toBe(true)
      if (!result.ok) return
      expect(result.data.to).toBe(OrderStatus.CANCELLED)
      expect(result.auditEntries[0]!.metadata).toHaveProperty('reason', 'Customer request')
    })

    it('cancels CONFIRMED order (MANAGER+)', () => {
      const mgrCtx = makeCtx({ role: OrgRole.MANAGER })
      const order = makeOrderEntity({ status: OrderStatus.CONFIRMED })
      const result = service.cancelOrder(mgrCtx, order)
      expect(result.ok).toBe(true)
    })

    it('rejects cancel from COMPLETED state', () => {
      const order = makeOrderEntity({ status: OrderStatus.COMPLETED })
      expect(service.cancelOrder(ctx, order).ok).toBe(false)
    })
  })

  describe('flagNeedsAttention', () => {
    it('flags FULFILLMENT order', () => {
      const order = makeOrderEntity({ status: OrderStatus.FULFILLMENT })
      const result = service.flagNeedsAttention(ctx, order, 'Missing component')
      expect(result.ok).toBe(true)
      if (!result.ok) return
      expect(result.data.to).toBe(OrderStatus.NEEDS_ATTENTION)
    })
  })

  describe('requestReturn', () => {
    it('requests return from DELIVERED order', () => {
      const order = makeOrderEntity({ status: OrderStatus.DELIVERED })
      const result = service.requestReturn(ctx, order, 'Defective item')
      expect(result.ok).toBe(true)
      if (!result.ok) return
      expect(result.data.to).toBe(OrderStatus.RETURN_REQUESTED)
    })
  })

  describe('getAvailableActions', () => {
    it('returns CONFIRMED and CANCELLED for CREATED', () => {
      const order = makeOrderEntity({ status: OrderStatus.CREATED })
      const actions = service.getAvailableActions(ctx, order)
      expect(actions).toContain(OrderStatus.CONFIRMED)
      expect(actions).toContain(OrderStatus.CANCELLED)
    })

    it('returns empty for terminal COMPLETED', () => {
      const order = makeOrderEntity({ status: OrderStatus.COMPLETED })
      expect(service.getAvailableActions(ctx, order)).toHaveLength(0)
    })
  })

  describe('full lifecycle', () => {
    it('CREATED → CONFIRMED → FULFILLMENT → SHIPPED → DELIVERED → COMPLETED', () => {
      const whCtx = makeCtx({ role: OrgRole.WAREHOUSE })
      const mgrCtx = makeCtx({ role: OrgRole.MANAGER })

      expect(service.confirmOrder(ctx, makeOrderEntity({ status: OrderStatus.CREATED })).ok).toBe(true)
      expect(service.beginFulfilment(whCtx, makeOrderEntity({ status: OrderStatus.CONFIRMED })).ok).toBe(true)
      expect(service.shipOrder(whCtx, makeOrderEntity({ status: OrderStatus.FULFILLMENT })).ok).toBe(true)
      expect(service.markDelivered(ctx, makeOrderEntity({ status: OrderStatus.SHIPPED })).ok).toBe(true)
      expect(service.completeOrder(mgrCtx, makeOrderEntity({ status: OrderStatus.DELIVERED })).ok).toBe(true)
    })

    it('cannot transition from terminal states', () => {
      for (const status of [OrderStatus.COMPLETED, OrderStatus.CANCELLED]) {
        const order = makeOrderEntity({ status })
        expect(service.confirmOrder(ctx, order).ok).toBe(false)
        expect(service.cancelOrder(ctx, order).ok).toBe(false)
      }
    })
  })

  describe('audit trail', () => {
    it('every successful operation returns audit entries', async () => {
      const createResult = await service.createOrder(ctx, sampleInput)
      expect(createResult.ok && createResult.auditEntries.length).toBeGreaterThanOrEqual(1)

      const order = makeOrderEntity({ status: OrderStatus.CREATED })
      const confirmResult = service.confirmOrder(ctx, order)
      expect(confirmResult.ok && confirmResult.auditEntries.length).toBeGreaterThanOrEqual(1)
    })

    it('audit entries carry correct orgId', async () => {
      const result = await service.createOrder(ctx, sampleInput)
      expect(result.ok).toBe(true)
      if (!result.ok) return
      expect(result.auditEntries[0]!.orgId).toBe(TEST_ORG)
      expect(result.auditEntries[0]!.actorId).toBe(TEST_ACTOR)
    })
  })
})
