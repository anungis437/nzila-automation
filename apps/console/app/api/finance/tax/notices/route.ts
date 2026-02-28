// Observability: @nzila/os-core/telemetry — structured logging and request tracing available via os-core.
/**
 * API — Tax Notices (CRA / RQ)
 * GET  /api/finance/tax/notices?taxYearId=...   → list notices for a tax year
 * POST /api/finance/tax/notices                 → record a received notice
 *
 * PR5 — Org-scoped auth + audit events
 */
import { NextRequest, NextResponse } from 'next/server'
import { platformDb } from '@nzila/db/platform'
import { taxNotices, taxYears } from '@nzila/db/schema'
import { eq } from 'drizzle-orm'
import { requireOrgAccess } from '@/lib/api-guards'
import { CreateTaxNoticeInput } from '@nzila/tax/types'
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
    ? eq(taxNotices.taxYearId, taxYearId)
    : eq(taxNotices.orgId, resolvedEntityId)

  const rows = await platformDb.select().from(taxNotices).where(filter)
  return NextResponse.json(rows)
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const parsed = CreateTaxNoticeInput.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const access = await requireOrgAccess(parsed.data.orgId, {
    minRole: 'org_secretary',
  })
  if (!access.ok) return access.response

  const [row] = await platformDb.insert(taxNotices).values(parsed.data).returning()

  await recordFinanceAuditEvent({
    orgId: parsed.data.orgId,
    actorClerkUserId: access.context.userId,
    actorRole: access.context.membership?.role ?? access.context.platformRole,
    action: FINANCE_AUDIT_ACTIONS.TAX_NOTICE_UPLOAD,
    targetType: 'tax_notice',
    targetId: row.id,
    afterJson: {
      noticeType: parsed.data.noticeType,
      authority: parsed.data.authority,
      taxYearId: parsed.data.taxYearId,
    },
  })

  return NextResponse.json(row, { status: 201 })
}
