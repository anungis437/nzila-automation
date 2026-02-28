/**
 * @nzila/commerce-services — Order Service
 *
 * Orchestrates the order lifecycle:
 *   create (from accepted quote) → confirm → fulfil → ship → deliver → complete
 *
 * DESIGN:
 *   - Pure orchestration — no direct DB imports
 *   - State transitions via @nzila/commerce-state (declarative orderMachine)
 *   - Audit trail via @nzila/commerce-audit (pure builders)
 *   - All DB operations injected via OrderRepository port
 *
 * @module @nzila/commerce-services/order
 */
import { OrderStatus, OrgRole } from '@nzila/commerce-core/enums'
import type { OrgContext } from '@nzila/commerce-core/types'
import {
  attemptTransition,
  getAvailableTransitions,
  orderMachine,
  type TransitionContext,
  type TransitionResult,
  type TransitionSuccess,
} from '@nzila/commerce-state'
import {
  buildTransitionAuditEntry,
  buildActionAuditEntry,
  CommerceEntityType,
  AuditAction,
  type AuditEntry,
} from '@nzila/commerce-audit'

// ── Types ───────────────────────────────────────────────────────────────────

export interface CreateOrderInput {
  readonly customerId: string
  readonly quoteId: string
  readonly quoteVersionId: string
  readonly lines: readonly OrderLineInput[]
  readonly subtotal: number
  readonly taxTotal: number
  readonly grandTotal: number
  readonly lockedSnapshot: string
  readonly metadata?: Record<string, unknown>
}

export interface OrderLineInput {
  readonly itemName: string
  readonly itemSku: string | null
  readonly quantity: number
  readonly unitPrice: number
  readonly lineTotal: number
  readonly sortOrder: number
}

export interface OrderEntity {
  readonly id: string
  readonly orgId: string
  readonly ref: string
  readonly customerId: string
  readonly quoteId: string
  readonly quoteVersionId: string
  readonly status: OrderStatus
  readonly subtotal: string
  readonly discountTotal: string
  readonly taxTotal: string
  readonly grandTotal: string
  readonly lockedSnapshot: string
  readonly createdBy: string
  readonly createdAt: string
  readonly updatedAt: string
}

export interface OrderLineEntity {
  readonly id: string
  readonly orderId: string
  readonly itemName: string
  readonly itemSku: string | null
  readonly quantity: number
  readonly unitPrice: string
  readonly lineTotal: string
  readonly sortOrder: number
}

export type OrderServiceResult<T> =
  | { readonly ok: true; readonly data: T; readonly auditEntries: readonly AuditEntry[] }
  | { readonly ok: false; readonly error: string; readonly code: string }

// ── Repository Port ──────────────────────────────────────────────────────────

export interface OrderRepository {
  nextRef(ctx: OrgContext): Promise<string>
  createOrder(ctx: OrgContext, order: Omit<OrderEntity, 'id' | 'createdAt' | 'updatedAt'>): Promise<OrderEntity>
  createOrderLines(ctx: OrgContext, orderId: string, lines: readonly Omit<OrderLineEntity, 'id'>[]): Promise<OrderLineEntity[]>
  getOrderById(ctx: OrgContext, orderId: string): Promise<OrderEntity | null>
  updateOrder(ctx: OrgContext, orderId: string, values: Partial<OrderEntity>): Promise<OrderEntity>
}

// ── Service Implementation ──────────────────────────────────────────────────

export function createOrderService(repo: OrderRepository) {
  function buildTransitionCtx(ctx: OrgContext): TransitionContext {
    return {
      orgId: ctx.orgId,
      actorId: ctx.actorId,
      role: ctx.role as OrgRole,
      meta: {},
    }
  }

  function transitionOrder(
    order: OrderEntity,
    targetStatus: OrderStatus,
    ctx: OrgContext,
  ): TransitionResult<OrderStatus> {
    return attemptTransition(
      orderMachine,
      order.status,
      targetStatus,
      buildTransitionCtx(ctx),
      order.orgId,
      order,
    )
  }

  // ── 1. Create Order ────────────────────────────────────────────────────

  async function createOrder(
    ctx: OrgContext,
    input: CreateOrderInput,
  ): Promise<OrderServiceResult<OrderEntity>> {
    const ref = await repo.nextRef(ctx)

    const order = await repo.createOrder(ctx, {
      orgId: ctx.orgId,
      ref,
      customerId: input.customerId,
      quoteId: input.quoteId,
      quoteVersionId: input.quoteVersionId,
      status: OrderStatus.CREATED,
      subtotal: String(input.subtotal),
      discountTotal: '0',
      taxTotal: String(input.taxTotal),
      grandTotal: String(input.grandTotal),
      lockedSnapshot: input.lockedSnapshot,
      createdBy: ctx.actorId,
    })

    const lineEntities = input.lines.map((line) => ({
      orderId: order.id,
      itemName: line.itemName,
      itemSku: line.itemSku,
      quantity: line.quantity,
      unitPrice: String(line.unitPrice),
      lineTotal: String(line.lineTotal),
      sortOrder: line.sortOrder,
    }))
    await repo.createOrderLines(ctx, order.id, lineEntities)

    const auditEntry = buildActionAuditEntry({
      id: crypto.randomUUID(),
      orgId: ctx.orgId,
      actorId: ctx.actorId,
      role: ctx.role as OrgRole,
      entityType: CommerceEntityType.ORDER,
      targetEntityId: order.id,
      action: AuditAction.CREATE,
      label: 'Created order from accepted quote',
      metadata: { ref, quoteId: input.quoteId, grandTotal: input.grandTotal },
    })

    return { ok: true, data: order, auditEntries: [auditEntry] }
  }

  // ── 2. Confirm Order ──────────────────────────────────────────────────

  function confirmOrder(
    ctx: OrgContext,
    order: OrderEntity,
  ): OrderServiceResult<TransitionSuccess<OrderStatus>> {
    const result = transitionOrder(order, OrderStatus.CONFIRMED, ctx)
    if (!result.ok) {
      return { ok: false, error: result.reason, code: result.code }
    }

    const auditEntry = buildTransitionAuditEntry(result, {
      id: crypto.randomUUID(),
      orgId: ctx.orgId,
      actorId: ctx.actorId,
      role: ctx.role as OrgRole,
      entityType: CommerceEntityType.ORDER,
      targetEntityId: order.id,
      metadata: {},
    })

    return { ok: true, data: result, auditEntries: [auditEntry] }
  }

  // ── 3. Begin Fulfilment ────────────────────────────────────────────────

  function beginFulfilment(
    ctx: OrgContext,
    order: OrderEntity,
  ): OrderServiceResult<TransitionSuccess<OrderStatus>> {
    const result = transitionOrder(order, OrderStatus.FULFILLMENT, ctx)
    if (!result.ok) {
      return { ok: false, error: result.reason, code: result.code }
    }

    const auditEntry = buildTransitionAuditEntry(result, {
      id: crypto.randomUUID(),
      orgId: ctx.orgId,
      actorId: ctx.actorId,
      role: ctx.role as OrgRole,
      entityType: CommerceEntityType.ORDER,
      targetEntityId: order.id,
      metadata: {},
    })

    return { ok: true, data: result, auditEntries: [auditEntry] }
  }

  // ── 4. Ship Order ─────────────────────────────────────────────────────

  function shipOrder(
    ctx: OrgContext,
    order: OrderEntity,
    trackingInfo?: { carrier?: string; trackingNumber?: string },
  ): OrderServiceResult<TransitionSuccess<OrderStatus>> {
    const result = transitionOrder(order, OrderStatus.SHIPPED, ctx)
    if (!result.ok) {
      return { ok: false, error: result.reason, code: result.code }
    }

    const auditEntry = buildTransitionAuditEntry(result, {
      id: crypto.randomUUID(),
      orgId: ctx.orgId,
      actorId: ctx.actorId,
      role: ctx.role as OrgRole,
      entityType: CommerceEntityType.ORDER,
      targetEntityId: order.id,
      metadata: { ...trackingInfo },
    })

    return { ok: true, data: result, auditEntries: [auditEntry] }
  }

  // ── 5. Mark Delivered ──────────────────────────────────────────────────

  function markDelivered(
    ctx: OrgContext,
    order: OrderEntity,
  ): OrderServiceResult<TransitionSuccess<OrderStatus>> {
    const result = transitionOrder(order, OrderStatus.DELIVERED, ctx)
    if (!result.ok) {
      return { ok: false, error: result.reason, code: result.code }
    }

    const auditEntry = buildTransitionAuditEntry(result, {
      id: crypto.randomUUID(),
      orgId: ctx.orgId,
      actorId: ctx.actorId,
      role: ctx.role as OrgRole,
      entityType: CommerceEntityType.ORDER,
      targetEntityId: order.id,
      metadata: {},
    })

    return { ok: true, data: result, auditEntries: [auditEntry] }
  }

  // ── 6. Complete Order ──────────────────────────────────────────────────

  function completeOrder(
    ctx: OrgContext,
    order: OrderEntity,
  ): OrderServiceResult<TransitionSuccess<OrderStatus>> {
    const result = transitionOrder(order, OrderStatus.COMPLETED, ctx)
    if (!result.ok) {
      return { ok: false, error: result.reason, code: result.code }
    }

    const auditEntry = buildTransitionAuditEntry(result, {
      id: crypto.randomUUID(),
      orgId: ctx.orgId,
      actorId: ctx.actorId,
      role: ctx.role as OrgRole,
      entityType: CommerceEntityType.ORDER,
      targetEntityId: order.id,
      metadata: {},
    })

    return { ok: true, data: result, auditEntries: [auditEntry] }
  }

  // ── 7. Cancel Order ────────────────────────────────────────────────────

  function cancelOrder(
    ctx: OrgContext,
    order: OrderEntity,
    reason?: string,
  ): OrderServiceResult<TransitionSuccess<OrderStatus>> {
    const result = transitionOrder(order, OrderStatus.CANCELLED, ctx)
    if (!result.ok) {
      return { ok: false, error: result.reason, code: result.code }
    }

    const auditEntry = buildTransitionAuditEntry(result, {
      id: crypto.randomUUID(),
      orgId: ctx.orgId,
      actorId: ctx.actorId,
      role: ctx.role as OrgRole,
      entityType: CommerceEntityType.ORDER,
      targetEntityId: order.id,
      metadata: { reason },
    })

    return { ok: true, data: result, auditEntries: [auditEntry] }
  }

  // ── 8. Flag Needs Attention ────────────────────────────────────────────

  function flagNeedsAttention(
    ctx: OrgContext,
    order: OrderEntity,
    reason: string,
  ): OrderServiceResult<TransitionSuccess<OrderStatus>> {
    const result = transitionOrder(order, OrderStatus.NEEDS_ATTENTION, ctx)
    if (!result.ok) {
      return { ok: false, error: result.reason, code: result.code }
    }

    const auditEntry = buildTransitionAuditEntry(result, {
      id: crypto.randomUUID(),
      orgId: ctx.orgId,
      actorId: ctx.actorId,
      role: ctx.role as OrgRole,
      entityType: CommerceEntityType.ORDER,
      targetEntityId: order.id,
      metadata: { reason },
    })

    return { ok: true, data: result, auditEntries: [auditEntry] }
  }

  // ── 9. Request Return ──────────────────────────────────────────────────

  function requestReturn(
    ctx: OrgContext,
    order: OrderEntity,
    reason: string,
  ): OrderServiceResult<TransitionSuccess<OrderStatus>> {
    const result = transitionOrder(order, OrderStatus.RETURN_REQUESTED, ctx)
    if (!result.ok) {
      return { ok: false, error: result.reason, code: result.code }
    }

    const auditEntry = buildTransitionAuditEntry(result, {
      id: crypto.randomUUID(),
      orgId: ctx.orgId,
      actorId: ctx.actorId,
      role: ctx.role as OrgRole,
      entityType: CommerceEntityType.ORDER,
      targetEntityId: order.id,
      metadata: { reason },
    })

    return { ok: true, data: result, auditEntries: [auditEntry] }
  }

  // ── 10. Get Available Actions ──────────────────────────────────────────

  function getAvailableActions(
    ctx: OrgContext,
    order: OrderEntity,
  ): readonly string[] {
    const tctx = buildTransitionCtx(ctx)
    return getAvailableTransitions(orderMachine, order.status, tctx, order.orgId, order)
      .map((t) => t.to)
  }

  return {
    createOrder,
    confirmOrder,
    beginFulfilment,
    shipOrder,
    markDelivered,
    completeOrder,
    cancelOrder,
    flagNeedsAttention,
    requestReturn,
    getAvailableActions,
  }
}
