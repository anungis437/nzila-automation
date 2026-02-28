/**
 * @nzila/tax — Deadline calculator
 *
 * Computes urgency indicators for all upcoming tax deadlines
 * across all orgs. Green/Yellow/Red status per the spec.
 */
import type { DeadlineInfo, DeadlineUrgency } from './types'

const YELLOW_THRESHOLD_DAYS = 30
const RED_THRESHOLD_DAYS = 0 // overdue

/**
 * Compute urgency color for a given deadline.
 *
 * Green = >30 days remaining
 * Yellow = ≤30 days but not overdue
 * Red = overdue (past due)
 */
export function computeUrgency(dueDate: string, asOf?: Date): DeadlineUrgency {
  const now = asOf ?? new Date()
  const due = new Date(dueDate)
  const diffMs = due.getTime() - now.getTime()
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays <= RED_THRESHOLD_DAYS) return 'red'
  if (diffDays <= YELLOW_THRESHOLD_DAYS) return 'yellow'
  return 'green'
}

/**
 * Compute days remaining until a deadline. Negative means overdue.
 */
export function daysUntil(dueDate: string, asOf?: Date): number {
  const now = asOf ?? new Date()
  const due = new Date(dueDate)
  return Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
}

/**
 * Build deadline info objects from tax year data.
 */
export function buildTaxYearDeadlines(
  taxYear: {
    id: string
    orgId: string
    fiscalYearLabel: string
    federalFilingDeadline: string
    federalPaymentDeadline: string
    provincialFilingDeadline?: string | null
    provincialPaymentDeadline?: string | null
  },
  asOf?: Date,
): DeadlineInfo[] {
  const deadlines: DeadlineInfo[] = []

  deadlines.push({
    label: `${taxYear.fiscalYearLabel} — Federal T2 Filing`,
    dueDate: taxYear.federalFilingDeadline,
    daysRemaining: daysUntil(taxYear.federalFilingDeadline, asOf),
    urgency: computeUrgency(taxYear.federalFilingDeadline, asOf),
    orgId: taxYear.orgId,
    taxYearId: taxYear.id,
    type: 'federal_filing',
  })

  deadlines.push({
    label: `${taxYear.fiscalYearLabel} — Federal Tax Payment`,
    dueDate: taxYear.federalPaymentDeadline,
    daysRemaining: daysUntil(taxYear.federalPaymentDeadline, asOf),
    urgency: computeUrgency(taxYear.federalPaymentDeadline, asOf),
    orgId: taxYear.orgId,
    taxYearId: taxYear.id,
    type: 'federal_payment',
  })

  if (taxYear.provincialFilingDeadline) {
    deadlines.push({
      label: `${taxYear.fiscalYearLabel} — Provincial Filing`,
      dueDate: taxYear.provincialFilingDeadline,
      daysRemaining: daysUntil(taxYear.provincialFilingDeadline, asOf),
      urgency: computeUrgency(taxYear.provincialFilingDeadline, asOf),
      orgId: taxYear.orgId,
      taxYearId: taxYear.id,
      type: 'provincial_filing',
    })
  }

  if (taxYear.provincialPaymentDeadline) {
    deadlines.push({
      label: `${taxYear.fiscalYearLabel} — Provincial Payment`,
      dueDate: taxYear.provincialPaymentDeadline,
      daysRemaining: daysUntil(taxYear.provincialPaymentDeadline, asOf),
      urgency: computeUrgency(taxYear.provincialPaymentDeadline, asOf),
      orgId: taxYear.orgId,
      taxYearId: taxYear.id,
      type: 'provincial_payment',
    })
  }

  return deadlines
}

/**
 * Build deadline info for a tax installment.
 */
export function buildInstallmentDeadline(
  installment: {
    orgId: string
    taxYearId: string
    dueDate: string
    status: string
  },
  label: string,
  asOf?: Date,
): DeadlineInfo {
  return {
    label,
    dueDate: installment.dueDate,
    daysRemaining: daysUntil(installment.dueDate, asOf),
    urgency: installment.status === 'paid' ? 'green' : computeUrgency(installment.dueDate, asOf),
    orgId: installment.orgId,
    taxYearId: installment.taxYearId,
    type: 'installment',
  }
}

/**
 * Build deadline info for an indirect tax period.
 */
export function buildIndirectTaxDeadlines(
  period: {
    orgId: string
    taxType: string
    filingDue: string
    paymentDue: string
    status: string
  },
  asOf?: Date,
): DeadlineInfo[] {
  const deadlines: DeadlineInfo[] = []
  const isPaid = period.status === 'paid' || period.status === 'closed'
  const isFiled = period.status === 'filed' || isPaid

  deadlines.push({
    label: `${period.taxType} Filing`,
    dueDate: period.filingDue,
    daysRemaining: daysUntil(period.filingDue, asOf),
    urgency: isFiled ? 'green' : computeUrgency(period.filingDue, asOf),
    orgId: period.orgId,
    type: 'indirect_filing',
  })

  deadlines.push({
    label: `${period.taxType} Payment`,
    dueDate: period.paymentDue,
    daysRemaining: daysUntil(period.paymentDue, asOf),
    urgency: isPaid ? 'green' : computeUrgency(period.paymentDue, asOf),
    orgId: period.orgId,
    type: 'indirect_payment',
  })

  return deadlines
}

/**
 * Sort deadlines by urgency (red first) then by days remaining.
 */
export function sortDeadlines(deadlines: DeadlineInfo[]): DeadlineInfo[] {
  const urgencyOrder: Record<DeadlineUrgency, number> = { red: 0, yellow: 1, green: 2 }
  return [...deadlines].sort((a, b) => {
    const uDiff = urgencyOrder[a.urgency] - urgencyOrder[b.urgency]
    if (uDiff !== 0) return uDiff
    return a.daysRemaining - b.daysRemaining
  })
}
