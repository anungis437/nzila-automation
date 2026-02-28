// Observability: @nzila/os-core/telemetry — structured logging and request tracing available via os-core.
/**
 * API — Tax Profiles
 * GET  /api/finance/tax/profiles?orgId=...    → get or list tax profiles
 * POST /api/finance/tax/profiles                 → create/update tax profile
 *
 * PR5 — Org-scoped auth + audit events
 */
import { NextRequest, NextResponse } from 'next/server'
import { platformDb } from '@nzila/db/platform'
import { taxProfiles } from '@nzila/db/schema'
import { eq } from 'drizzle-orm'
import { requireOrgAccess } from '@/lib/api-guards'
import { CreateTaxProfileInput } from '@nzila/tax/types'
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
    .from(taxProfiles)
    .where(eq(taxProfiles.orgId, orgId))

  return NextResponse.json(rows)
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const parsed = CreateTaxProfileInput.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const access = await requireOrgAccess(parsed.data.orgId, {
    minRole: 'org_secretary',
  })
  if (!access.ok) return access.response

  const [row] = await platformDb
    .insert(taxProfiles)
    .values(parsed.data)
    .returning()

  await recordFinanceAuditEvent({
    orgId: parsed.data.orgId,
    actorClerkUserId: access.context.userId,
    actorRole: access.context.membership?.role ?? access.context.platformRole,
    action: FINANCE_AUDIT_ACTIONS.TAX_PROFILE_CREATE,
    targetType: 'tax_profile',
    targetId: row.id,
    afterJson: parsed.data as unknown as Record<string, unknown>,
  })

  return NextResponse.json(row, { status: 201 })
}
