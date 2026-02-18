/**
 * API — Finance-Governance Links
 * GET  /api/finance/governance-links?entityId=...&sourceId=...  → list links
 * POST /api/finance/governance-links                            → create link
 *
 * PR5 — Entity-scoped auth + audit events
 */
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@nzila/db'
import { financeGovernanceLinks } from '@nzila/db/schema'
import { eq, and } from 'drizzle-orm'
import { requireEntityAccess } from '@/lib/api-guards'
import {
  recordFinanceAuditEvent,
  FINANCE_AUDIT_ACTIONS,
} from '@/lib/finance-audit'

export async function GET(req: NextRequest) {
  const entityId = req.nextUrl.searchParams.get('entityId')
  const sourceId = req.nextUrl.searchParams.get('sourceId')

  if (!entityId) {
    return NextResponse.json({ error: 'entityId required' }, { status: 400 })
  }

  const access = await requireEntityAccess(entityId)
  if (!access.ok) return access.response

  const conditions = sourceId
    ? and(eq(financeGovernanceLinks.entityId, entityId), eq(financeGovernanceLinks.sourceId, sourceId))
    : eq(financeGovernanceLinks.entityId, entityId)

  const rows = await db.select().from(financeGovernanceLinks).where(conditions)
  return NextResponse.json(rows)
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { entityId, sourceType, sourceId, governanceType, governanceId, linkDescription } = body

  if (!entityId || !sourceType || !sourceId || !governanceType || !governanceId) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const access = await requireEntityAccess(entityId, {
    minRole: 'entity_secretary',
  })
  if (!access.ok) return access.response

  const [row] = await db
    .insert(financeGovernanceLinks)
    .values({
      entityId,
      sourceType,
      sourceId,
      governanceType,
      governanceId,
      linkDescription,
      createdBy: access.context.userId,
    })
    .returning()

  await recordFinanceAuditEvent({
    entityId,
    actorClerkUserId: access.context.userId,
    actorRole: access.context.membership?.role ?? access.context.platformRole,
    action: FINANCE_AUDIT_ACTIONS.GOVERNANCE_LINK_CREATE,
    targetType: 'finance_governance_link',
    targetId: row.id,
    afterJson: { sourceType, sourceId, governanceType, governanceId, linkDescription },
  })

  return NextResponse.json(row, { status: 201 })
}
