// Observability: @nzila/os-core/telemetry — structured logging and request tracing available via os-core.
/**
 * API — Indirect Tax Accounts
 * GET  /api/finance/indirect-tax/accounts?orgId=...   → list accounts
 * POST /api/finance/indirect-tax/accounts                → register account
 *
 * PR5 — Org-scoped auth + audit events
 */
import { NextRequest, NextResponse } from 'next/server'
import { platformDb } from '@nzila/db/platform'
import { indirectTaxAccounts } from '@nzila/db/schema'
import { eq } from 'drizzle-orm'
import { requireOrgAccess } from '@/lib/api-guards'
import { CreateIndirectTaxAccountInput } from '@nzila/tax/types'
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
    .from(indirectTaxAccounts)
    .where(eq(indirectTaxAccounts.orgId, orgId))

  return NextResponse.json(rows)
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const parsed = CreateIndirectTaxAccountInput.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const access = await requireOrgAccess(parsed.data.orgId, {
    minRole: 'org_secretary',
  })
  if (!access.ok) return access.response

  const [row] = await platformDb
    .insert(indirectTaxAccounts)
    .values(parsed.data)
    .returning()

  await recordFinanceAuditEvent({
    orgId: parsed.data.orgId,
    actorClerkUserId: access.context.userId,
    actorRole: access.context.membership?.role ?? access.context.platformRole,
    action: FINANCE_AUDIT_ACTIONS.INDIRECT_TAX_ACCOUNT_CREATE,
    targetType: 'indirect_tax_account',
    targetId: row.id,
    afterJson: {
      taxType: parsed.data.taxType,
      accountNumber: parsed.data.programAccountNumber,
    },
  })

  return NextResponse.json(row, { status: 201 })
}
