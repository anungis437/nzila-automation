/**
 * @nzila/commerce-services — Invoice Service
 *
 * Orchestrates the invoice lifecycle:
 *   create → issue → send → payment → paid
 *
 * Also handles disputes, credit notes, refunds, and overdue transitions.
 *
 * DESIGN:
 *   - Pure orchestration — no direct DB imports
 *   - State transitions via @nzila/commerce-state (declarative invoiceMachine)
 *   - Audit trail via @nzila/commerce-audit (pure builders)
 *   - All DB operations injected via InvoiceRepository port
 *
 * @module @nzila/commerce-services/invoice
 */
import { InvoiceStatus, OrgRole } from '@nzila/commerce-core/enums'
import type { OrgContext } from '@nzila/commerce-core/types'
import {
  attemptTransition,
  getAvailableTransitions,
  invoiceMachine,
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

export interface CreateInvoiceInput {
  readonly orderId: string
  readonly customerId: string
  readonly lines: readonly InvoiceLineInput[]
  readonly subtotal: number
  readonly taxTotal: number
  readonly grandTotal: number
  readonly dueDays?: number
  readonly metadata?: Record<string, unknown>
}

export interface InvoiceLineInput {
  readonly description: string
  readonly quantity: number
  readonly unitPrice: number
  readonly lineTotal: number
  readonly sortOrder: number
}

export interface InvoiceEntity {
  readonly id: string
  readonly entityId: string
  readonly ref: string
  readonly orderId: string
  readonly customerId: string
  readonly status: InvoiceStatus
  readonly subtotal: string
  readonly taxTotal: string
  readonly grandTotal: string
  readonly amountPaid: string
  readonly amountDue: string
  readonly dueDate: string | null
  readonly issuedAt: string | null
  readonly paidAt: string | null
  readonly createdBy: string
  readonly createdAt: string
  readonly updatedAt: string
}

export interface InvoiceLineEntity {
  readonly id: string
  readonly invoiceId: string
  readonly description: string
  readonly quantity: number
  readonly unitPrice: string
  readonly lineTotal: string
  readonly sortOrder: number
}

export interface RecordPaymentInput {
  readonly amount: number
  readonly method: string
  readonly reference?: string
}

export type InvoiceServiceResult<T> =
  | { readonly ok: true; readonly data: T; readonly auditEntries: readonly AuditEntry[] }
  | { readonly ok: false; readonly error: string; readonly code: string }

// ── Repository Port ──────────────────────────────────────────────────────────

export interface InvoiceRepository {
  nextRef(ctx: OrgContext): Promise<string>
  createInvoice(ctx: OrgContext, invoice: Omit<InvoiceEntity, 'id' | 'createdAt' | 'updatedAt'>): Promise<InvoiceEntity>
  createInvoiceLines(ctx: OrgContext, invoiceId: string, lines: readonly Omit<InvoiceLineEntity, 'id'>[]): Promise<InvoiceLineEntity[]>
  getInvoiceById(ctx: OrgContext, invoiceId: string): Promise<InvoiceEntity | null>
  updateInvoice(ctx: OrgContext, invoiceId: string, values: Partial<InvoiceEntity>): Promise<InvoiceEntity>
  recordPayment(ctx: OrgContext, invoiceId: string, payment: RecordPaymentInput): Promise<void>
}

// ── Service Implementation ──────────────────────────────────────────────────

export function createInvoiceService(repo: InvoiceRepository) {
  function buildTransitionCtx(ctx: OrgContext): TransitionContext {
    return {
      entityId: ctx.entityId,
      actorId: ctx.actorId,
      role: ctx.role as OrgRole,
      meta: {},
    }
  }

  function transitionInvoice(
    invoice: InvoiceEntity,
    targetStatus: InvoiceStatus,
    ctx: OrgContext,
  ): TransitionResult<InvoiceStatus> {
    return attemptTransition(
      invoiceMachine,
      invoice.status,
      targetStatus,
      buildTransitionCtx(ctx),
      invoice.entityId,
      invoice,
    )
  }

  // ── 1. Create Invoice ──────────────────────────────────────────────────

  async function createInvoice(
    ctx: OrgContext,
    input: CreateInvoiceInput,
  ): Promise<InvoiceServiceResult<InvoiceEntity>> {
    const ref = await repo.nextRef(ctx)

    const dueDate = input.dueDays
      ? new Date(Date.now() + input.dueDays * 86_400_000).toISOString()
      : null

    const invoice = await repo.createInvoice(ctx, {
      entityId: ctx.entityId,
      ref,
      orderId: input.orderId,
      customerId: input.customerId,
      status: InvoiceStatus.DRAFT,
      subtotal: String(input.subtotal),
      taxTotal: String(input.taxTotal),
      grandTotal: String(input.grandTotal),
      amountPaid: '0',
      amountDue: String(input.grandTotal),
      dueDate,
      issuedAt: null,
      paidAt: null,
      createdBy: ctx.actorId,
    })

    const lineEntities = input.lines.map((line) => ({
      invoiceId: invoice.id,
      description: line.description,
      quantity: line.quantity,
      unitPrice: String(line.unitPrice),
      lineTotal: String(line.lineTotal),
      sortOrder: line.sortOrder,
    }))
    await repo.createInvoiceLines(ctx, invoice.id, lineEntities)

    const auditEntry = buildActionAuditEntry({
      id: crypto.randomUUID(),
      entityId: ctx.entityId,
      actorId: ctx.actorId,
      role: ctx.role as OrgRole,
      entityType: CommerceEntityType.INVOICE,
      targetEntityId: invoice.id,
      action: AuditAction.CREATE,
      label: 'Created invoice from order',
      metadata: { ref, orderId: input.orderId, grandTotal: input.grandTotal },
    })

    return { ok: true, data: invoice, auditEntries: [auditEntry] }
  }

  // ── 2. Issue Invoice ───────────────────────────────────────────────────

  function issueInvoice(
    ctx: OrgContext,
    invoice: InvoiceEntity,
  ): InvoiceServiceResult<TransitionSuccess<InvoiceStatus>> {
    const result = transitionInvoice(invoice, InvoiceStatus.ISSUED, ctx)
    if (!result.ok) {
      return { ok: false, error: result.reason, code: result.code }
    }

    const auditEntry = buildTransitionAuditEntry(result, {
      id: crypto.randomUUID(),
      entityId: ctx.entityId,
      actorId: ctx.actorId,
      role: ctx.role as OrgRole,
      entityType: CommerceEntityType.INVOICE,
      targetEntityId: invoice.id,
      metadata: {},
    })

    return { ok: true, data: result, auditEntries: [auditEntry] }
  }

  // ── 3. Send Invoice ────────────────────────────────────────────────────

  function sendInvoice(
    ctx: OrgContext,
    invoice: InvoiceEntity,
  ): InvoiceServiceResult<TransitionSuccess<InvoiceStatus>> {
    const result = transitionInvoice(invoice, InvoiceStatus.SENT, ctx)
    if (!result.ok) {
      return { ok: false, error: result.reason, code: result.code }
    }

    const auditEntry = buildTransitionAuditEntry(result, {
      id: crypto.randomUUID(),
      entityId: ctx.entityId,
      actorId: ctx.actorId,
      role: ctx.role as OrgRole,
      entityType: CommerceEntityType.INVOICE,
      targetEntityId: invoice.id,
      metadata: {},
    })

    return { ok: true, data: result, auditEntries: [auditEntry] }
  }

  // ── 4. Record Partial Payment ──────────────────────────────────────────

  function recordPartialPayment(
    ctx: OrgContext,
    invoice: InvoiceEntity,
    payment: RecordPaymentInput,
  ): InvoiceServiceResult<TransitionSuccess<InvoiceStatus>> {
    const result = transitionInvoice(invoice, InvoiceStatus.PARTIAL_PAID, ctx)
    if (!result.ok) {
      return { ok: false, error: result.reason, code: result.code }
    }

    const auditEntry = buildTransitionAuditEntry(result, {
      id: crypto.randomUUID(),
      entityId: ctx.entityId,
      actorId: ctx.actorId,
      role: ctx.role as OrgRole,
      entityType: CommerceEntityType.INVOICE,
      targetEntityId: invoice.id,
      metadata: { amount: payment.amount, method: payment.method },
    })

    return { ok: true, data: result, auditEntries: [auditEntry] }
  }

  // ── 5. Record Full Payment ─────────────────────────────────────────────

  function recordFullPayment(
    ctx: OrgContext,
    invoice: InvoiceEntity,
    payment: RecordPaymentInput,
  ): InvoiceServiceResult<TransitionSuccess<InvoiceStatus>> {
    const result = transitionInvoice(invoice, InvoiceStatus.PAID, ctx)
    if (!result.ok) {
      return { ok: false, error: result.reason, code: result.code }
    }

    const auditEntry = buildTransitionAuditEntry(result, {
      id: crypto.randomUUID(),
      entityId: ctx.entityId,
      actorId: ctx.actorId,
      role: ctx.role as OrgRole,
      entityType: CommerceEntityType.INVOICE,
      targetEntityId: invoice.id,
      metadata: { amount: payment.amount, method: payment.method },
    })

    return { ok: true, data: result, auditEntries: [auditEntry] }
  }

  // ── 6. Mark Overdue ────────────────────────────────────────────────────

  function markOverdue(
    ctx: OrgContext,
    invoice: InvoiceEntity,
  ): InvoiceServiceResult<TransitionSuccess<InvoiceStatus>> {
    const result = transitionInvoice(invoice, InvoiceStatus.OVERDUE, ctx)
    if (!result.ok) {
      return { ok: false, error: result.reason, code: result.code }
    }

    const auditEntry = buildTransitionAuditEntry(result, {
      id: crypto.randomUUID(),
      entityId: ctx.entityId,
      actorId: ctx.actorId,
      role: ctx.role as OrgRole,
      entityType: CommerceEntityType.INVOICE,
      targetEntityId: invoice.id,
      metadata: {},
    })

    return { ok: true, data: result, auditEntries: [auditEntry] }
  }

  // ── 7. Raise Dispute ───────────────────────────────────────────────────

  function raiseDispute(
    ctx: OrgContext,
    invoice: InvoiceEntity,
    reason: string,
  ): InvoiceServiceResult<TransitionSuccess<InvoiceStatus>> {
    const result = transitionInvoice(invoice, InvoiceStatus.DISPUTED, ctx)
    if (!result.ok) {
      return { ok: false, error: result.reason, code: result.code }
    }

    const auditEntry = buildTransitionAuditEntry(result, {
      id: crypto.randomUUID(),
      entityId: ctx.entityId,
      actorId: ctx.actorId,
      role: ctx.role as OrgRole,
      entityType: CommerceEntityType.INVOICE,
      targetEntityId: invoice.id,
      metadata: { reason },
    })

    return { ok: true, data: result, auditEntries: [auditEntry] }
  }

  // ── 8. Resolve Dispute ─────────────────────────────────────────────────

  function resolveDispute(
    ctx: OrgContext,
    invoice: InvoiceEntity,
    resolution: string,
  ): InvoiceServiceResult<TransitionSuccess<InvoiceStatus>> {
    const result = transitionInvoice(invoice, InvoiceStatus.RESOLVED, ctx)
    if (!result.ok) {
      return { ok: false, error: result.reason, code: result.code }
    }

    const auditEntry = buildTransitionAuditEntry(result, {
      id: crypto.randomUUID(),
      entityId: ctx.entityId,
      actorId: ctx.actorId,
      role: ctx.role as OrgRole,
      entityType: CommerceEntityType.INVOICE,
      targetEntityId: invoice.id,
      metadata: { resolution },
    })

    return { ok: true, data: result, auditEntries: [auditEntry] }
  }

  // ── 9. Issue Credit Note ───────────────────────────────────────────────

  function issueCreditNote(
    ctx: OrgContext,
    invoice: InvoiceEntity,
    amount: number,
    reason: string,
  ): InvoiceServiceResult<TransitionSuccess<InvoiceStatus>> {
    const result = transitionInvoice(invoice, InvoiceStatus.CREDIT_NOTE, ctx)
    if (!result.ok) {
      return { ok: false, error: result.reason, code: result.code }
    }

    const auditEntry = buildTransitionAuditEntry(result, {
      id: crypto.randomUUID(),
      entityId: ctx.entityId,
      actorId: ctx.actorId,
      role: ctx.role as OrgRole,
      entityType: CommerceEntityType.INVOICE,
      targetEntityId: invoice.id,
      metadata: { amount, reason },
    })

    return { ok: true, data: result, auditEntries: [auditEntry] }
  }

  // ── 10. Process Refund ─────────────────────────────────────────────────

  function processRefund(
    ctx: OrgContext,
    invoice: InvoiceEntity,
    amount: number,
    reason: string,
  ): InvoiceServiceResult<TransitionSuccess<InvoiceStatus>> {
    const result = transitionInvoice(invoice, InvoiceStatus.REFUNDED, ctx)
    if (!result.ok) {
      return { ok: false, error: result.reason, code: result.code }
    }

    const auditEntry = buildTransitionAuditEntry(result, {
      id: crypto.randomUUID(),
      entityId: ctx.entityId,
      actorId: ctx.actorId,
      role: ctx.role as OrgRole,
      entityType: CommerceEntityType.INVOICE,
      targetEntityId: invoice.id,
      metadata: { amount, reason },
    })

    return { ok: true, data: result, auditEntries: [auditEntry] }
  }

  // ── 11. Cancel Invoice ─────────────────────────────────────────────────

  function cancelInvoice(
    ctx: OrgContext,
    invoice: InvoiceEntity,
    reason?: string,
  ): InvoiceServiceResult<TransitionSuccess<InvoiceStatus>> {
    const result = transitionInvoice(invoice, InvoiceStatus.CANCELLED, ctx)
    if (!result.ok) {
      return { ok: false, error: result.reason, code: result.code }
    }

    const auditEntry = buildTransitionAuditEntry(result, {
      id: crypto.randomUUID(),
      entityId: ctx.entityId,
      actorId: ctx.actorId,
      role: ctx.role as OrgRole,
      entityType: CommerceEntityType.INVOICE,
      targetEntityId: invoice.id,
      metadata: { reason },
    })

    return { ok: true, data: result, auditEntries: [auditEntry] }
  }

  // ── 12. Get Available Actions ──────────────────────────────────────────

  function getAvailableActions(
    ctx: OrgContext,
    invoice: InvoiceEntity,
  ): readonly string[] {
    const tctx = buildTransitionCtx(ctx)
    return getAvailableTransitions(invoiceMachine, invoice.status, tctx, invoice.entityId, invoice)
      .map((t) => t.to)
  }

  return {
    createInvoice,
    issueInvoice,
    sendInvoice,
    recordPartialPayment,
    recordFullPayment,
    markOverdue,
    raiseDispute,
    resolveDispute,
    issueCreditNote,
    processRefund,
    cancelInvoice,
    getAvailableActions,
  }
}
