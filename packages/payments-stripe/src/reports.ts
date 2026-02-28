/**
 * @nzila/payments-stripe — Report generation
 *
 * Generates monthly Stripe reports (revenue, payout recon, refunds, disputes),
 * uploads as JSON/CSV artifacts via @nzila/blob, and creates documents rows.
 */
import { db } from '@nzila/db'
import {
  stripePayments,
  stripePayouts,
  stripeRefunds,
  stripeDisputes,
  stripeReports,
  documents,
} from '@nzila/db/schema'
import { eq, and, gte, lte, sql } from 'drizzle-orm'
import { uploadBuffer } from '@nzila/blob'
import type { ReportGenerateInput, ReportArtifact, StripeReportType } from './types'

const BLOB_CONTAINER = 'exports'

// ── Blob path builder ───────────────────────────────────────────────────────

export function buildReportBlobPath(
  orgId: string,
  reportType: StripeReportType,
  startDate: string,
  artifactId: string,
): string {
  const [year, month] = startDate.split('-')
  return `exports/${orgId}/stripe/${year}/${month}/${reportType}/${artifactId}/report.json`
}

// ── Main report generation ──────────────────────────────────────────────────

/**
 * Generate all four Stripe report types for a given entity and date range.
 * Upload each to blob, create documents rows and stripeReports rows.
 */
export async function generateStripeReports(
  input: ReportGenerateInput,
): Promise<ReportArtifact[]> {
  const { orgId, startDate, endDate, periodId, actorClerkUserId } = input

  const startTs = new Date(`${startDate}T00:00:00Z`)
  const endTs = new Date(`${endDate}T23:59:59.999Z`)

  const artifacts: ReportArtifact[] = []

  // 1. Revenue Summary
  artifacts.push(
    await generateRevenueReport(orgId, startTs, endTs, startDate, endDate, periodId, actorClerkUserId),
  )

  // 2. Payout Reconciliation
  artifacts.push(
    await generatePayoutReconReport(orgId, startTs, endTs, startDate, endDate, periodId, actorClerkUserId),
  )

  // 3. Refunds Summary
  artifacts.push(
    await generateRefundsReport(orgId, startTs, endTs, startDate, endDate, periodId, actorClerkUserId),
  )

  // 4. Disputes Summary
  artifacts.push(
    await generateDisputesReport(orgId, startTs, endTs, startDate, endDate, periodId, actorClerkUserId),
  )

  return artifacts
}

// ── Individual report generators ────────────────────────────────────────────

async function generateRevenueReport(
  orgId: string,
  startTs: Date,
  endTs: Date,
  startDate: string,
  endDate: string,
  periodId: string | undefined,
  actorClerkUserId: string,
): Promise<ReportArtifact> {
  const payments = await db
    .select()
    .from(stripePayments)
    .where(
      and(
        eq(stripePayments.orgId, orgId),
        gte(stripePayments.occurredAt, startTs),
        lte(stripePayments.occurredAt, endTs),
      ),
    )

  const totalCents = payments.reduce((sum, p) => sum + Number(p.amountCents), 0)
  const byCurrency = groupByCurrency(payments.map((p) => ({ amount: Number(p.amountCents), currency: p.currency })))
  const byType = groupBy(payments, (p) => p.objectType)

  const report = {
    reportType: 'revenue_summary' as const,
    orgId,
    period: { startDate, endDate, periodId },
    generatedAt: new Date().toISOString(),
    summary: {
      totalPayments: payments.length,
      totalAmountCents: totalCents,
      byCurrency,
      byObjectType: Object.fromEntries(
        Object.entries(byType).map(([k, v]) => [k, { count: v.length, totalCents: v.reduce((s, p) => s + Number(p.amountCents), 0) }]),
      ),
    },
    details: payments.map((p) => ({
      id: p.id,
      stripeObjectId: p.stripeObjectId,
      objectType: p.objectType,
      status: p.status,
      amountCents: Number(p.amountCents),
      currency: p.currency,
      ventureId: p.ventureId,
      occurredAt: p.occurredAt.toISOString(),
    })),
  }

  return uploadReport(orgId, 'revenue_summary', startDate, endDate, periodId, report, actorClerkUserId)
}

async function generatePayoutReconReport(
  orgId: string,
  startTs: Date,
  endTs: Date,
  startDate: string,
  endDate: string,
  periodId: string | undefined,
  actorClerkUserId: string,
): Promise<ReportArtifact> {
  const payouts = await db
    .select()
    .from(stripePayouts)
    .where(
      and(
        eq(stripePayouts.orgId, orgId),
        gte(stripePayouts.occurredAt, startTs),
        lte(stripePayouts.occurredAt, endTs),
      ),
    )

  const totalCents = payouts.reduce((sum, p) => sum + Number(p.amountCents), 0)

  const report = {
    reportType: 'payout_recon' as const,
    orgId,
    period: { startDate, endDate, periodId },
    generatedAt: new Date().toISOString(),
    summary: {
      totalPayouts: payouts.length,
      totalAmountCents: totalCents,
      byCurrency: groupByCurrency(payouts.map((p) => ({ amount: Number(p.amountCents), currency: p.currency }))),
    },
    details: payouts.map((p) => ({
      id: p.id,
      payoutId: p.payoutId,
      amountCents: Number(p.amountCents),
      currency: p.currency,
      status: p.status,
      arrivalDate: p.arrivalDate,
      occurredAt: p.occurredAt.toISOString(),
    })),
  }

  return uploadReport(orgId, 'payout_recon', startDate, endDate, periodId, report, actorClerkUserId)
}

async function generateRefundsReport(
  orgId: string,
  startTs: Date,
  endTs: Date,
  startDate: string,
  endDate: string,
  periodId: string | undefined,
  actorClerkUserId: string,
): Promise<ReportArtifact> {
  const refunds = await db
    .select()
    .from(stripeRefunds)
    .where(
      and(
        eq(stripeRefunds.orgId, orgId),
        gte(stripeRefunds.occurredAt, startTs),
        lte(stripeRefunds.occurredAt, endTs),
      ),
    )

  const totalCents = refunds.reduce((sum, r) => sum + Number(r.amountCents), 0)

  const report = {
    reportType: 'refunds_summary' as const,
    orgId,
    period: { startDate, endDate, periodId },
    generatedAt: new Date().toISOString(),
    summary: {
      totalRefunds: refunds.length,
      totalAmountCents: totalCents,
      byStatus: groupBy(refunds, (r) => r.status),
    },
    details: refunds.map((r) => ({
      id: r.id,
      refundId: r.refundId,
      amountCents: Number(r.amountCents),
      status: r.status,
      requestedBy: r.requestedBy,
      approvedBy: r.approvedBy,
      occurredAt: r.occurredAt.toISOString(),
    })),
  }

  return uploadReport(orgId, 'refunds_summary', startDate, endDate, periodId, report, actorClerkUserId)
}

async function generateDisputesReport(
  orgId: string,
  startTs: Date,
  endTs: Date,
  startDate: string,
  endDate: string,
  periodId: string | undefined,
  actorClerkUserId: string,
): Promise<ReportArtifact> {
  const disputes = await db
    .select()
    .from(stripeDisputes)
    .where(
      and(
        eq(stripeDisputes.orgId, orgId),
        gte(stripeDisputes.occurredAt, startTs),
        lte(stripeDisputes.occurredAt, endTs),
      ),
    )

  const totalCents = disputes.reduce((sum, d) => sum + Number(d.amountCents), 0)

  const report = {
    reportType: 'disputes_summary' as const,
    orgId,
    period: { startDate, endDate, periodId },
    generatedAt: new Date().toISOString(),
    summary: {
      totalDisputes: disputes.length,
      totalAmountCents: totalCents,
      byStatus: groupBy(disputes, (d) => d.status),
      byReason: groupBy(disputes, (d) => d.reason ?? 'unknown'),
    },
    details: disputes.map((d) => ({
      id: d.id,
      disputeId: d.disputeId,
      amountCents: Number(d.amountCents),
      status: d.status,
      reason: d.reason,
      dueBy: d.dueBy?.toISOString() ?? null,
      occurredAt: d.occurredAt.toISOString(),
    })),
  }

  return uploadReport(orgId, 'disputes_summary', startDate, endDate, periodId, report, actorClerkUserId)
}

// ── Upload + persist helper ─────────────────────────────────────────────────

async function uploadReport(
  orgId: string,
  reportType: StripeReportType,
  startDate: string,
  endDate: string,
  periodId: string | undefined,
  reportData: Record<string, unknown>,
  actorClerkUserId: string,
): Promise<ReportArtifact> {
  const artifactId = crypto.randomUUID()
  const blobPath = buildReportBlobPath(orgId, reportType, startDate, artifactId)

  const buffer = Buffer.from(JSON.stringify(reportData, null, 2), 'utf-8')

  const uploadResult = await uploadBuffer({
    container: BLOB_CONTAINER,
    blobPath,
    buffer,
    contentType: 'application/json',
  })

  // Create documents row
  const [docRow] = await db
    .insert(documents)
    .values({
      orgId,
      category: 'export',
      title: `Stripe ${reportType.replace(/_/g, ' ')} — ${startDate} to ${endDate}`,
      blobContainer: BLOB_CONTAINER,
      blobPath: uploadResult.blobPath,
      contentType: 'application/json',
      sizeBytes: BigInt(uploadResult.sizeBytes),
      sha256: uploadResult.sha256,
      uploadedBy: actorClerkUserId,
      classification: 'internal',
      linkedType: 'stripe_report',
    })
    .returning({ id: documents.id })

  // Create stripeReports row
  const [reportRow] = await db
    .insert(stripeReports)
    .values({
      orgId,
      periodId,
      reportType,
      startDate,
      endDate,
      documentId: docRow!.id,
      sha256: uploadResult.sha256,
    })
    .returning({ id: stripeReports.id })

  return {
    reportType,
    blobPath: uploadResult.blobPath,
    sha256: uploadResult.sha256,
    sizeBytes: uploadResult.sizeBytes,
    documentId: docRow!.id,
    reportId: reportRow!.id,
  }
}

// ── Utility ─────────────────────────────────────────────────────────────────

function groupBy<T>(items: T[], keyFn: (item: T) => string): Record<string, T[]> {
  const result: Record<string, T[]> = {}
  for (const item of items) {
    const key = keyFn(item)
    ;(result[key] ??= []).push(item)
  }
  return result
}

function groupByCurrency(items: Array<{ amount: number; currency: string }>): Record<string, number> {
  const result: Record<string, number> = {}
  for (const item of items) {
    result[item.currency] = (result[item.currency] ?? 0) + item.amount
  }
  return result
}
