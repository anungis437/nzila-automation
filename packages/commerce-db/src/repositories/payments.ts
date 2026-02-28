/**
 * @nzila/commerce-db — Payments repository
 *
 * Org-scoped CRUD for commerce_payments, commerce_credit_notes,
 * and commerce_refunds.
 *
 * @module @nzila/commerce-db/payments
 */
import {
  createScopedDb,
  createAuditedScopedDb,
  commercePayments,
  commerceCreditNotes,
  commerceRefunds,
} from '@nzila/db'
import { eq } from 'drizzle-orm'
import type { CommerceDbContext, CommerceReadContext, PaginationOpts } from '../types'

// ── Payments — Reads ──────────────────────────────────────────────────────

export async function listPayments(
  ctx: CommerceReadContext,
  opts: PaginationOpts = {},
) {
  const db = createScopedDb({ orgId: ctx.orgId })
  const limit = Math.min(opts.limit ?? 50, 200)
  const offset = opts.offset ?? 0

  const rows = await db.select(commercePayments)
  const sorted = rows.sort(
    (a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  )
  return {
    rows: sorted.slice(offset, offset + limit),
    total: sorted.length,
    limit,
    offset,
  }
}

export async function getPaymentById(
  ctx: CommerceReadContext,
  paymentId: string,
) {
  const db = createScopedDb({ orgId: ctx.orgId })
  const rows = await db.select(
    commercePayments,
    eq(commercePayments.id, paymentId),
  )
  return rows[0] ?? null
}

export async function listPaymentsByInvoice(
  ctx: CommerceReadContext,
  invoiceId: string,
) {
  const db = createScopedDb({ orgId: ctx.orgId })
  return db.select(
    commercePayments,
    eq(commercePayments.invoiceId, invoiceId),
  )
}

// ── Payments — Writes ─────────────────────────────────────────────────────

export async function createPayment(
  ctx: CommerceDbContext,
  values: {
    invoiceId: string
    amount: string
    method: string
    reference?: string | null
    paidAt: Date
    metadata?: Record<string, unknown>
  },
) {
  const db = createAuditedScopedDb({
    orgId: ctx.orgId,
    actorId: ctx.actorId,
    correlationId: ctx.correlationId,
    actorRole: ctx.actorRole,
  })
  return db.insert(commercePayments, values)
}

// ── Credit Notes — Reads ──────────────────────────────────────────────────

export async function listCreditNotes(
  ctx: CommerceReadContext,
  opts: PaginationOpts = {},
) {
  const db = createScopedDb({ orgId: ctx.orgId })
  const limit = Math.min(opts.limit ?? 50, 200)
  const offset = opts.offset ?? 0

  const rows = await db.select(commerceCreditNotes)
  const sorted = rows.sort(
    (a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  )
  return {
    rows: sorted.slice(offset, offset + limit),
    total: sorted.length,
    limit,
    offset,
  }
}

export async function getCreditNoteById(
  ctx: CommerceReadContext,
  creditNoteId: string,
) {
  const db = createScopedDb({ orgId: ctx.orgId })
  const rows = await db.select(
    commerceCreditNotes,
    eq(commerceCreditNotes.id, creditNoteId),
  )
  return rows[0] ?? null
}

// ── Credit Notes — Writes ─────────────────────────────────────────────────

export async function createCreditNote(
  ctx: CommerceDbContext,
  values: {
    invoiceId: string
    ref: string
    amount: string
    reason: string
    metadata?: Record<string, unknown>
  },
) {
  const db = createAuditedScopedDb({
    orgId: ctx.orgId,
    actorId: ctx.actorId,
    correlationId: ctx.correlationId,
    actorRole: ctx.actorRole,
  })
  return db.insert(commerceCreditNotes, values)
}

// ── Refunds — Reads ───────────────────────────────────────────────────────

export async function listRefunds(
  ctx: CommerceReadContext,
  opts: PaginationOpts = {},
) {
  const db = createScopedDb({ orgId: ctx.orgId })
  const limit = Math.min(opts.limit ?? 50, 200)
  const offset = opts.offset ?? 0

  const rows = await db.select(commerceRefunds)
  const sorted = rows.sort(
    (a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  )
  return {
    rows: sorted.slice(offset, offset + limit),
    total: sorted.length,
    limit,
    offset,
  }
}

export async function getRefundById(
  ctx: CommerceReadContext,
  refundId: string,
) {
  const db = createScopedDb({ orgId: ctx.orgId })
  const rows = await db.select(
    commerceRefunds,
    eq(commerceRefunds.id, refundId),
  )
  return rows[0] ?? null
}

// ── Refunds — Writes ──────────────────────────────────────────────────────

export async function createRefund(
  ctx: CommerceDbContext,
  values: {
    paymentId: string
    invoiceId: string
    amount: string
    reason: string
    metadata?: Record<string, unknown>
  },
) {
  const db = createAuditedScopedDb({
    orgId: ctx.orgId,
    actorId: ctx.actorId,
    correlationId: ctx.correlationId,
    actorRole: ctx.actorRole,
  })
  return db.insert(commerceRefunds, values)
}

export async function updateRefund(
  ctx: CommerceDbContext,
  refundId: string,
  values: {
    status?: string
    processedAt?: Date | null
    metadata?: Record<string, unknown>
  },
) {
  const db = createAuditedScopedDb({
    orgId: ctx.orgId,
    actorId: ctx.actorId,
    correlationId: ctx.correlationId,
    actorRole: ctx.actorRole,
  })
  return db.update(
    commerceRefunds,
    values,
    eq(commerceRefunds.id, refundId),
  )
}
