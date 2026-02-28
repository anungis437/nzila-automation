import type { AgriReadContext, AgriDbContext, PaginationOpts, PaginatedResult } from '../types'
import type { PaymentDistributionPlan, Payment, GeneratePaymentPlanInput, ExecutePaymentInput } from '@nzila/agri-core'

export async function listPaymentPlans(
  ctx: AgriReadContext,
  opts: PaginationOpts & { lotId?: string; status?: string } = {},
): Promise<PaginatedResult<PaymentDistributionPlan>> {
  const limit = Math.min(opts.limit ?? 50, 200)
  const offset = opts.offset ?? 0
  void ctx
  return { rows: [], total: 0, limit, offset }
}

export async function getPaymentPlanById(ctx: AgriReadContext, planId: string): Promise<PaymentDistributionPlan | null> {
  void ctx; void planId
  return null
}

export async function listPayments(ctx: AgriReadContext, planId: string): Promise<Payment[]> {
  void ctx; void planId
  return []
}

export async function createPaymentPlan(ctx: AgriDbContext, values: GeneratePaymentPlanInput): Promise<PaymentDistributionPlan> {
  const id = crypto.randomUUID()
  const now = new Date().toISOString()
  return {
    id,
    orgId: ctx.orgId,
    lotId: values.lotId,
    totalAmount: values.totalAmount,
    currency: values.currency,
    status: 'draft',
    createdAt: now,
    updatedAt: now,
  }
}

export async function executePayment(ctx: AgriDbContext, values: ExecutePaymentInput): Promise<Payment> {
  const id = crypto.randomUUID()
  const now = new Date().toISOString()
  return {
    id,
    orgId: ctx.orgId,
    planId: values.planId,
    producerId: values.producerId,
    amount: values.amount,
    method: values.method,
    reference: values.reference,
    status: 'executed',
    executedAt: now,
    createdAt: now,
  }
}
