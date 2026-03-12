import type { AgriReadContext, AgriDbContext, PaginationOpts, PaginatedResult } from '../types'
import type { PaymentDistributionPlan, Payment, GeneratePaymentPlanInput, ExecutePaymentInput } from '@nzila/agri-core'
import { db } from '@nzila/db'
import { agriPaymentPlans, agriPayments } from '@nzila/db/schema'
import { eq, and, count, type SQL } from 'drizzle-orm'

function toPlan(row: typeof agriPaymentPlans.$inferSelect): PaymentDistributionPlan {
  return {
    id: row.id,
    orgId: row.orgId,
    lotId: row.lotId,
    totalAmount: Number(row.totalAmount),
    currency: row.currency,
    status: row.status,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  }
}

function toPayment(row: typeof agriPayments.$inferSelect): Payment {
  return {
    id: row.id,
    orgId: row.orgId,
    planId: row.planId,
    producerId: row.producerId,
    amount: Number(row.amount),
    method: row.method,
    reference: row.reference ?? null,
    status: row.status,
    executedAt: row.executedAt?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString(),
  }
}

export async function listPaymentPlans(
  ctx: AgriReadContext,
  opts: PaginationOpts & { lotId?: string; status?: string } = {},
): Promise<PaginatedResult<PaymentDistributionPlan>> {
  const limit = Math.min(opts.limit ?? 50, 200)
  const offset = opts.offset ?? 0
  const conditions: SQL[] = [eq(agriPaymentPlans.orgId, ctx.orgId)]
  if (opts.lotId) conditions.push(eq(agriPaymentPlans.lotId, opts.lotId))
  if (opts.status) conditions.push(eq(agriPaymentPlans.status, opts.status as typeof agriPaymentPlans.$inferSelect.status))
  const where = and(...conditions)!

  const [rows, [{ value: total }]] = await Promise.all([
    db.select().from(agriPaymentPlans).where(where).limit(limit).offset(offset),
    db.select({ value: count() }).from(agriPaymentPlans).where(where),
  ])

  return { rows: rows.map(toPlan), total, limit, offset }
}

export async function getPaymentPlanById(ctx: AgriReadContext, planId: string): Promise<PaymentDistributionPlan | null> {
  const [row] = await db
    .select()
    .from(agriPaymentPlans)
    .where(and(eq(agriPaymentPlans.orgId, ctx.orgId), eq(agriPaymentPlans.id, planId)))
    .limit(1)
  return row ? toPlan(row) : null
}

export async function listPayments(ctx: AgriReadContext, planId: string): Promise<Payment[]> {
  const rows = await db
    .select()
    .from(agriPayments)
    .where(and(eq(agriPayments.orgId, ctx.orgId), eq(agriPayments.planId, planId)))
  return rows.map(toPayment)
}

export async function createPaymentPlan(ctx: AgriDbContext, values: GeneratePaymentPlanInput): Promise<PaymentDistributionPlan> {
  const [row] = await db
    .insert(agriPaymentPlans)
    .values({
      orgId: ctx.orgId,
      lotId: values.lotId,
      totalAmount: values.totalAmount.toString(),
      currency: values.currency,
    })
    .returning()
  return toPlan(row)
}

export async function executePayment(ctx: AgriDbContext, values: ExecutePaymentInput): Promise<Payment> {
  const [row] = await db
    .insert(agriPayments)
    .values({
      orgId: ctx.orgId,
      planId: values.planId,
      producerId: values.producerId,
      amount: values.amount.toString(),
      method: values.method,
      reference: values.reference,
      status: 'executed',
      executedAt: new Date(),
    })
    .returning()
  return toPayment(row)
}
