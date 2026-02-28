// Observability: @nzila/os-core/telemetry — structured logging and request tracing available via os-core.
/**
 * API — Tax Years
 * GET  /api/finance/tax/years?orgId=...    → list tax years
 * POST /api/finance/tax/years                 → create tax year
 *
 * PR5 — Org-scoped auth + audit events
 */
import { NextRequest, NextResponse } from 'next/server'
import { platformDb } from '@nzila/db/platform'
import { taxYears } from '@nzila/db/schema'
import { eq } from 'drizzle-orm'
import { requireOrgAccess } from '@/lib/api-guards'
import { CreateTaxYearInput } from '@nzila/tax/types'
import {
  recordFinanceAuditEvent,
  FINANCE_AUDIT_ACTIONS,
} from '@/lib/finance-audit'

export async function GET(req: NextRequest) {
  const orgId = req.nextUrl.searchParams.get('orgId')
  if (!orgId) {
    return NextResponse.json({ error: 'orgId required' }, { status: 400 })
  }

  const access = await requireOrgAccess(orgId)
  if (!access.ok) return access.response

  const rows = await platformDb
    .select()
    .from(taxYears)
    .where(eq(taxYears.orgId, orgId))

  return NextResponse.json(rows)
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const parsed = CreateTaxYearInput.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const access = await requireOrgAccess(parsed.data.orgId, {
    minRole: 'org_secretary',
  })
  if (!access.ok) return access.response

  const [row] = await platformDb
    .insert(taxYears)
    .values(parsed.data)
    .returning()

  await recordFinanceAuditEvent({
    orgId: parsed.data.orgId,
    actorClerkUserId: access.context.userId,
    actorRole: access.context.membership?.role ?? access.context.platformRole,
    action: FINANCE_AUDIT_ACTIONS.TAX_YEAR_CREATE,
    targetType: 'tax_year',
    targetId: row.id,
    afterJson: {
      fiscalYearLabel: parsed.data.fiscalYearLabel,
      startDate: parsed.data.startDate,
      endDate: parsed.data.endDate,
    },
  })

  return NextResponse.json(row, { status: 201 })
}
