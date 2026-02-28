// Observability: @nzila/os-core/telemetry — structured logging and request tracing available via os-core.
/**
 * API — Tax Installments
 * GET   /api/finance/tax/installments?taxYearId=...  → list installments
 * POST  /api/finance/tax/installments                → create installment record
 * PATCH /api/finance/tax/installments                → update installment (pay, mark late)
 *
 * PR5 — Org-scoped auth + audit events
 */
import { NextRequest, NextResponse } from 'next/server'
import { platformDb } from '@nzila/db/platform'
import { taxInstallments, taxYears } from '@nzila/db/schema'
import { eq } from 'drizzle-orm'
import { requireOrgAccess } from '@/lib/api-guards'
import { CreateTaxInstallmentInput } from '@nzila/tax/types'
import {
  recordFinanceAuditEvent,
  FINANCE_AUDIT_ACTIONS,
} from '@/lib/finance-audit'

export async function GET(req: NextRequest) {
  const taxYearId = req.nextUrl.searchParams.get('taxYearId')
  const orgId = req.nextUrl.searchParams.get('orgId')

  if (!taxYearId && !orgId) {
    return NextResponse.json({ error: 'taxYearId or orgId required' }, { status: 400 })
  }

  let resolvedEntityId = orgId
  if (!resolvedEntityId && taxYearId) {
    const [ty] = await platformDb.select().from(taxYears).where(eq(taxYears.id, taxYearId))
    resolvedEntityId = ty?.orgId ?? null
  }
  if (!resolvedEntityId) {
    return NextResponse.json({ error: 'Could not resolve entity' }, { status: 400 })
  }

  const access = await requireOrgAccess(resolvedEntityId)
  if (!access.ok) return access.response

  const filter = taxYearId
    ? eq(taxInstallments.taxYearId, taxYearId)
    : eq(taxInstallments.orgId, resolvedEntityId)

  const rows = await platformDb.select().from(taxInstallments).where(filter)
  return NextResponse.json(rows)
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const parsed = CreateTaxInstallmentInput.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const access = await requireOrgAccess(parsed.data.orgId, {
    minRole: 'org_secretary',
  })
  if (!access.ok) return access.response

  const [row] = await platformDb.insert(taxInstallments).values(parsed.data).returning()

  await recordFinanceAuditEvent({
    orgId: parsed.data.orgId,
    actorClerkUserId: access.context.userId,
    actorRole: access.context.membership?.role ?? access.context.platformRole,
    action: FINANCE_AUDIT_ACTIONS.TAX_INSTALLMENT_RECORD,
    targetType: 'tax_installment',
    targetId: row.id,
    afterJson: {
      taxYearId: parsed.data.taxYearId,
      amount: parsed.data.requiredAmount,
    },
  })

  return NextResponse.json(row, { status: 201 })
}

export async function PATCH(req: NextRequest) {
  const body = await req.json()
  const { id, ...updates } = body

  if (!id) {
    return NextResponse.json({ error: 'id required' }, { status: 400 })
  }

  // Fetch existing to get orgId
  const [existing] = await platformDb
    .select()
    .from(taxInstallments)
    .where(eq(taxInstallments.id, id))

  if (!existing) {
    return NextResponse.json({ error: 'Installment not found' }, { status: 404 })
  }

  const access = await requireOrgAccess(existing.orgId, {
    minRole: 'org_secretary',
  })
  if (!access.ok) return access.response

  const [row] = await platformDb
    .update(taxInstallments)
    .set({ ...updates, updatedAt: new Date() })
    .where(eq(taxInstallments.id, id))
    .returning()

  await recordFinanceAuditEvent({
    orgId: existing.orgId,
    actorClerkUserId: access.context.userId,
    actorRole: access.context.membership?.role ?? access.context.platformRole,
    action: FINANCE_AUDIT_ACTIONS.TAX_INSTALLMENT_RECORD,
    targetType: 'tax_installment',
    targetId: id,
    beforeJson: { status: existing.status },
    afterJson: updates as Record<string, unknown>,
  })

  return NextResponse.json(row)
}
