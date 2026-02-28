/**
 * @nzila/commerce-db — Invoices repository
 *
 * Org-scoped CRUD for commerce_invoices and commerce_invoice_lines.
 *
 * @module @nzila/commerce-db/invoices
 */
import {
  createScopedDb,
  createAuditedScopedDb,
  commerceInvoices,
  commerceInvoiceLines,
} from '@nzila/db'
import { eq } from 'drizzle-orm'
import type { CommerceDbContext, CommerceReadContext, PaginationOpts } from '../types'

// ── Reads ─────────────────────────────────────────────────────────────────

export async function listInvoices(
  ctx: CommerceReadContext,
  opts: PaginationOpts = {},
) {
  const db = createScopedDb({ orgId: ctx.orgId })
  const limit = Math.min(opts.limit ?? 50, 200)
  const offset = opts.offset ?? 0

  const rows = await db.select(commerceInvoices)
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

export async function getInvoiceById(
  ctx: CommerceReadContext,
  invoiceId: string,
) {
  const db = createScopedDb({ orgId: ctx.orgId })
  const rows = await db.select(
    commerceInvoices,
    eq(commerceInvoices.id, invoiceId),
  )
  return rows[0] ?? null
}

export async function getInvoiceByRef(
  ctx: CommerceReadContext,
  ref: string,
) {
  const db = createScopedDb({ orgId: ctx.orgId })
  const rows = await db.select(
    commerceInvoices,
    eq(commerceInvoices.ref, ref),
  )
  return rows[0] ?? null
}

export async function listInvoiceLines(
  ctx: CommerceReadContext,
  invoiceId: string,
) {
  const db = createScopedDb({ orgId: ctx.orgId })
  const rows = await db.select(
    commerceInvoiceLines,
    eq(commerceInvoiceLines.invoiceId, invoiceId),
  )
  return rows.sort((a, b) => a.sortOrder - b.sortOrder)
}

// ── Writes ────────────────────────────────────────────────────────────────

export async function createInvoice(
  ctx: CommerceDbContext,
  values: {
    orderId: string
    customerId: string
    ref: string
    currency?: string
    subtotal: string
    taxTotal: string
    total: string
    amountDue: string
    dueDate?: Date | null
    notes?: string | null
    metadata?: Record<string, unknown>
    createdBy: string
  },
) {
  const db = createAuditedScopedDb({
    orgId: ctx.orgId,
    actorId: ctx.actorId,
    correlationId: ctx.correlationId,
    actorRole: ctx.actorRole,
  })
  return db.insert(commerceInvoices, values)
}

export async function updateInvoice(
  ctx: CommerceDbContext,
  invoiceId: string,
  values: {
    status?: string
    amountPaid?: string
    amountDue?: string
    issuedAt?: Date | null
    paidAt?: Date | null
    dueDate?: Date | null
    notes?: string | null
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
    commerceInvoices,
    { ...values, updatedAt: new Date() },
    eq(commerceInvoices.id, invoiceId),
  )
}

export async function createInvoiceLine(
  ctx: CommerceDbContext,
  values: {
    invoiceId: string
    orderLineId?: string | null
    description: string
    quantity: number
    unitPrice: string
    lineTotal: string
    sortOrder?: number
    metadata?: Record<string, unknown>
  },
) {
  const db = createAuditedScopedDb({
    orgId: ctx.orgId,
    actorId: ctx.actorId,
    correlationId: ctx.correlationId,
    actorRole: ctx.actorRole,
  })
  return db.insert(commerceInvoiceLines, values)
}

export async function updateInvoiceLine(
  ctx: CommerceDbContext,
  lineId: string,
  values: {
    description?: string
    quantity?: number
    unitPrice?: string
    lineTotal?: string
    sortOrder?: number
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
    commerceInvoiceLines,
    { ...values, updatedAt: new Date() },
    eq(commerceInvoiceLines.id, lineId),
  )
}

export async function deleteInvoiceLine(
  ctx: CommerceDbContext,
  lineId: string,
) {
  const db = createAuditedScopedDb({
    orgId: ctx.orgId,
    actorId: ctx.actorId,
    correlationId: ctx.correlationId,
    actorRole: ctx.actorRole,
  })
  return db.delete(commerceInvoiceLines, eq(commerceInvoiceLines.id, lineId))
}
