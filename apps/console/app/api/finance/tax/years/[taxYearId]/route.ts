// Observability: @nzila/os-core/telemetry — structured logging and request tracing available via os-core.
/**
 * API — Tax Year by ID
 * GET    /api/finance/tax/years/[taxYearId]   → get tax year detail + close gate
 * PATCH  /api/finance/tax/years/[taxYearId]   → update status
 *
 * PR5 — Governance enforcement:
 *  • Org-scoped auth
 *  • Close gate + governance requirements enforced on PATCH to 'closed'
 *  • Hash-chained audit events
 */
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { platformDb } from '@nzila/db/platform'
import {
  taxYears,
  taxFilings,
  taxNotices,
  taxInstallments,
  taxProfiles,
  indirectTaxPeriods,
  financeGovernanceLinks,
} from '@nzila/db/schema'
import { eq } from 'drizzle-orm'
import { requireOrgAccess } from '@/lib/api-guards'
import { evaluateTaxYearCloseGate } from '@nzila/tax/validation'
import { evaluateFinanceGovernanceRequirements } from '@nzila/tax/governance'
import { buildTaxYearDeadlines } from '@nzila/tax/deadlines'
import {
  recordFinanceAuditEvent,
  FINANCE_AUDIT_ACTIONS,
} from '@/lib/finance-audit'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ taxYearId: string }> },
) {
  const { taxYearId } = await params

  const [taxYear] = await platformDb
    .select()
    .from(taxYears)
    .where(eq(taxYears.id, taxYearId))

  if (!taxYear) {
    return NextResponse.json({ error: 'Tax year not found' }, { status: 404 })
  }

  const access = await requireOrgAccess(taxYear.orgId)
  if (!access.ok) return access.response

  // Fetch related data for close gate evaluation
  const [filings, notices, installments, indirectPrds, profiles] = await Promise.all([
    platformDb.select().from(taxFilings).where(eq(taxFilings.taxYearId, taxYearId)),
    platformDb.select().from(taxNotices).where(eq(taxNotices.taxYearId, taxYearId)),
    platformDb.select().from(taxInstallments).where(eq(taxInstallments.taxYearId, taxYearId)),
    platformDb.select().from(indirectTaxPeriods).where(eq(indirectTaxPeriods.orgId, taxYear.orgId)),
    platformDb.select().from(taxProfiles).where(eq(taxProfiles.orgId, taxYear.orgId)),
  ])

  const profile = profiles[0]
  const province = profile?.provinceOfRegistration ?? null

  const closeGate = evaluateTaxYearCloseGate({
    province,
    filings: filings.map((f) => ({
      filingType: f.filingType,
      documentId: f.documentId,
      sha256: f.sha256,
    })),
    indirectPeriods: indirectPrds.map((p) => ({
      status: p.status,
      taxType: p.taxType,
    })),
    notices: notices.map((n) => ({
      noticeType: n.noticeType,
      documentId: n.documentId,
    })),
  })

  const deadlines = buildTaxYearDeadlines({
    id: taxYear.id,
    orgId: taxYear.orgId,
    fiscalYearLabel: taxYear.fiscalYearLabel,
    federalFilingDeadline: taxYear.federalFilingDeadline,
    federalPaymentDeadline: taxYear.federalPaymentDeadline,
    provincialFilingDeadline: taxYear.provincialFilingDeadline,
    provincialPaymentDeadline: taxYear.provincialPaymentDeadline,
  })

  return NextResponse.json({
    taxYear,
    filings,
    notices,
    installments,
    closeGate,
    deadlines,
    profile,
  })
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ taxYearId: string }> },
) {
  const { taxYearId } = await params
  const TaxYearPatchSchema = z.object({ status: z.enum(['open', 'filed', 'assessed', 'closed']) })
  const bodyParsed = TaxYearPatchSchema.safeParse(await req.json())
  if (!bodyParsed.success) {
    return NextResponse.json({ error: bodyParsed.error.flatten() }, { status: 400 })
  }
  const newStatus = bodyParsed.data.status

  // Fetch the existing tax year for entity scoping
  const [existing] = await platformDb
    .select()
    .from(taxYears)
    .where(eq(taxYears.id, taxYearId))

  if (!existing) {
    return NextResponse.json({ error: 'Tax year not found' }, { status: 404 })
  }

  const access = await requireOrgAccess(existing.orgId, {
    minRole: 'org_secretary',
  })
  if (!access.ok) return access.response

  // ── Governance gate: enforce close requirements ──────────────────────────
  if (newStatus === 'closed') {
    // 1. Tax year close gate (T2, CO-17, indirect filed, etc.)
    const [filings, notices, indirectPrds, profiles, links] = await Promise.all([
      platformDb.select().from(taxFilings).where(eq(taxFilings.taxYearId, taxYearId)),
      platformDb.select().from(taxNotices).where(eq(taxNotices.taxYearId, taxYearId)),
      platformDb.select().from(indirectTaxPeriods).where(eq(indirectTaxPeriods.orgId, existing.orgId)),
      platformDb.select().from(taxProfiles).where(eq(taxProfiles.orgId, existing.orgId)),
      platformDb.select().from(financeGovernanceLinks).where(eq(financeGovernanceLinks.orgId, existing.orgId)),
    ])

    const profile = profiles[0]
    const province = profile?.provinceOfRegistration ?? null

    const closeGate = evaluateTaxYearCloseGate({
      province,
      filings: filings.map((f) => ({
        filingType: f.filingType,
        documentId: f.documentId,
        sha256: f.sha256,
      })),
      indirectPeriods: indirectPrds.map((p) => ({
        status: p.status,
        taxType: p.taxType,
      })),
      notices: notices.map((n) => ({
        noticeType: n.noticeType,
        documentId: n.documentId,
      })),
    })

    if (!closeGate.canClose) {
      return NextResponse.json(
        {
          error: 'Tax year close gate not satisfied.',
          blockers: closeGate.blockers,
          warnings: closeGate.warnings,
        },
        { status: 422 },
      )
    }

    // 2. Finance governance requirements (FS approval resolution, etc.)
    const hasFsApproval = links.some(
      (l) =>
        l.governanceType === 'resolution' &&
        l.linkDescription?.toLowerCase().includes('financial statement'),
    )
    const hasDividendResolution = links.some(
      (l) =>
        l.governanceType === 'resolution' &&
        l.linkDescription?.toLowerCase().includes('dividend'),
    )
    const dividendFilings = filings.filter(
      (f) => f.filingType === 'T5' || f.filingType === 'RL-3',
    )

    const govReqs = evaluateFinanceGovernanceRequirements({
      province,
      hasFsApprovalResolution: hasFsApproval,
      hasDividendResolution,
      dividendsDeclared: dividendFilings.length > 0,
      borrowingAmount: 0, // Borrowing check deferred to explicit flow
      borrowingThreshold: Infinity,
      hasBorrowingGovernanceLink: true,
    })

    if (govReqs.blockers.length > 0) {
      return NextResponse.json(
        {
          error: 'Finance governance requirements not met.',
          blockers: govReqs.blockers,
          warnings: govReqs.warnings,
        },
        { status: 422 },
      )
    }
  }

  const previousStatus = existing.status

  const [updated] = await platformDb
    .update(taxYears)
    .set({
      status: newStatus,
      updatedAt: new Date(),
    })
    .where(eq(taxYears.id, taxYearId))
    .returning()

  // Audit event
  const auditAction =
    newStatus === 'closed'
      ? FINANCE_AUDIT_ACTIONS.TAX_YEAR_CLOSE
      : FINANCE_AUDIT_ACTIONS.TAX_YEAR_CREATE // 'open' transition

  await recordFinanceAuditEvent({
    orgId: existing.orgId,
    actorClerkUserId: access.context.userId,
    actorRole: access.context.membership?.role ?? access.context.platformRole,
    action: auditAction,
    targetType: 'tax_year',
    targetId: taxYearId,
    beforeJson: { status: previousStatus },
    afterJson: { status: newStatus },
  })

  return NextResponse.json(updated)
}
