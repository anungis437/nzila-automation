/**
 * @nzila/tax — CRA deadline auto-calculator
 *
 * Computes statutory deadlines from fiscal year end date — no manual entry.
 *
 * Sources:
 * - T2 filing: ITA s.150(1)(a) — 6 months after fiscal year end
 * - T2 payment: ITA s.157(1)(b) — 2 months after FYE (3 months for certain CCPCs)
 * - CO-17: TAA s.1000 — 6 months after FYE (same as federal)
 * - GST/HST annual: ETA s.238(1) — 3 months after fiscal year end
 * - T5 / RL-3: ITA s.162(7.1) — last day of February following calendar year
 * - T4 / T4A / T5013: ITA — last day of February / March following calendar year
 * - Payroll: varies by remitter type
 */
import type { Province } from './types'

export interface AutoDeadline {
  type: string
  label: string
  dueDate: string  // ISO date
  rule: string     // human-readable CRA rule
}

/**
 * Parse a fiscal year end string (MM-DD) and a year to get a Date.
 */
function parseFiscalYearEnd(fiscalYearEnd: string, year: number): Date {
  const [mm, dd] = fiscalYearEnd.split('-').map(Number)
  return new Date(year, mm - 1, dd)
}

/**
 * Format a Date to ISO date string (YYYY-MM-DD).
 */
function toIso(d: Date): string {
  return d.toISOString().split('T')[0]
}

/**
 * Add months to a date, clamping to the last day of the target month.
 *
 * Native Date.setMonth() overflows: Jan 31 + 1 month → Mar 3 (not Feb 28).
 * This version detects the overflow and clamps to the last valid day.
 */
function addMonths(d: Date, months: number): Date {
  const result = new Date(d)
  const targetMonth = result.getMonth() + months
  const originalDay = result.getDate()
  result.setMonth(targetMonth)
  // If the day changed (overflow), clamp to last day of the target month
  if (result.getDate() !== originalDay) {
    result.setDate(0) // sets to last day of previous month (= target month)
  }
  return result
}

/**
 * Last day of a given month/year.
 */
function lastDayOfMonth(year: number, month: number): Date {
  return new Date(year, month + 1, 0)
}

/**
 * Auto-calculate all statutory deadlines for a corporate fiscal year.
 *
 * @param fiscalYearEnd  MM-DD format (e.g. "12-31")
 * @param taxYear        The calendar year the fiscal year ends in (e.g. 2025)
 * @param province       Province of registration (affects CO-17 / QST)
 * @param options        Optional: isCcpc (affects payment deadline), gstFrequency
 */
export function calculateCorporateDeadlines(
  fiscalYearEnd: string,
  taxYear: number,
  province: Province,
  options?: {
    isCcpc?: boolean
    priorYearTaxableIncome?: number
    gstFilingFrequency?: 'monthly' | 'quarterly' | 'annual'
  },
): AutoDeadline[] {
  const fye = parseFiscalYearEnd(fiscalYearEnd, taxYear)
  const deadlines: AutoDeadline[] = []

  // ── T2 Corporate filing: 6 months after FYE ──
  const t2Filing = addMonths(fye, 6)
  deadlines.push({
    type: 'federal_filing',
    label: `${taxYear} — Federal T2 Filing`,
    dueDate: toIso(t2Filing),
    rule: 'ITA s.150(1)(a): 6 months after fiscal year end',
  })

  // ── T2 Corporate payment: 2 months after FYE (3 months for qualifying CCPCs) ──
  // Qualifying CCPC: taxable income ≤ $500K in prior year + capital ≤ $10M
  const isCcpc = options?.isCcpc ?? true
  const qualifiesFor3Months =
    isCcpc && (options?.priorYearTaxableIncome == null || options.priorYearTaxableIncome <= 500_000)
  const paymentMonths = qualifiesFor3Months ? 3 : 2
  const t2Payment = addMonths(fye, paymentMonths)
  deadlines.push({
    type: 'federal_payment',
    label: `${taxYear} — Federal T2 Balance Due`,
    dueDate: toIso(t2Payment),
    rule: qualifiesFor3Months
      ? 'ITA s.157(1)(b): 3 months after FYE (qualifying CCPC)'
      : 'ITA s.157(1)(b): 2 months after FYE',
  })

  // ── CO-17 (Quebec only): same 6-month rule ──
  if (province === 'QC') {
    deadlines.push({
      type: 'provincial_filing',
      label: `${taxYear} — Quebec CO-17 Filing`,
      dueDate: toIso(t2Filing), // same deadline
      rule: 'TAA s.1000: 6 months after fiscal year end',
    })
    deadlines.push({
      type: 'provincial_payment',
      label: `${taxYear} — Quebec CO-17 Balance Due`,
      dueDate: toIso(t2Payment),
      rule: 'TAA: same payment deadline as federal',
    })
  }

  // ── GST/HST annual return: 3 months after FYE ──
  if (options?.gstFilingFrequency === 'annual' || !options?.gstFilingFrequency) {
    const gstDeadline = addMonths(fye, 3)
    deadlines.push({
      type: 'indirect_filing',
      label: `${taxYear} — GST/HST Annual Return`,
      dueDate: toIso(gstDeadline),
      rule: 'ETA s.238(1): 3 months after fiscal year end',
    })
    // GST/HST payment for annual filers: same as corporate payment deadline
    deadlines.push({
      type: 'indirect_payment',
      label: `${taxYear} — GST/HST Annual Payment`,
      dueDate: toIso(t2Payment),
      rule: 'ETA: balance due same as corporate income tax payment',
    })
  }

  // ── QST annual (Quebec only) ──
  if (province === 'QC') {
    const qstDeadline = addMonths(fye, 3)
    deadlines.push({
      type: 'indirect_filing',
      label: `${taxYear} — QST Annual Return`,
      dueDate: toIso(qstDeadline),
      rule: 'QSTA: 3 months after fiscal year end',
    })
  }

  // ── T5 / RL-3 (investment income slips): Feb 28 following calendar year ──
  const t5Deadline = lastDayOfMonth(taxYear + 1, 1) // Feb 28/29
  deadlines.push({
    type: 'federal_filing',
    label: `${taxYear} — T5 Information Return`,
    dueDate: toIso(t5Deadline),
    rule: 'ITA s.162(7.1): last day of February following calendar year',
  })
  if (province === 'QC') {
    deadlines.push({
      type: 'provincial_filing',
      label: `${taxYear} — RL-3 Relevé`,
      dueDate: toIso(t5Deadline),
      rule: 'TAA: last day of February following calendar year',
    })
  }

  // ── T4 / T4A (employment/pension slips): Feb 28 following calendar year ──
  deadlines.push({
    type: 'federal_filing',
    label: `${taxYear} — T4 / T4A Information Return`,
    dueDate: toIso(t5Deadline),
    rule: 'ITA: last day of February following calendar year',
  })

  // ── T5013 (partnership): March 31 following calendar year ──
  const t5013Deadline = new Date(taxYear + 1, 2, 31) // March 31
  deadlines.push({
    type: 'federal_filing',
    label: `${taxYear} — T5013 Partnership Information`,
    dueDate: toIso(t5013Deadline),
    rule: 'ITA s.229(1): March 31 following calendar year',
  })

  return deadlines
}

/**
 * Calculate quarterly GST/HST filing deadlines for a fiscal year.
 */
export function calculateQuarterlyGstDeadlines(
  fiscalYearEnd: string,
  taxYear: number,
): AutoDeadline[] {
  const fye = parseFiscalYearEnd(fiscalYearEnd, taxYear)
  const deadlines: AutoDeadline[] = []

  for (let q = 1; q <= 4; q++) {
    // Each quarter ends 3 months apart, starting from FYE - 12 months + 3*q
    const quarterEnd = addMonths(new Date(fye.getFullYear(), fye.getMonth() - 12 + 3 * q, fye.getDate()), 0)
    const filingDue = addMonths(quarterEnd, 1) // 1 month after quarter end
    deadlines.push({
      type: 'indirect_filing',
      label: `${taxYear} Q${q} — GST/HST Quarterly Return`,
      dueDate: toIso(filingDue),
      rule: 'ETA: 1 month after reporting period end',
    })
  }

  return deadlines
}

/**
 * Calculate monthly GST/HST filing deadlines for a fiscal year.
 */
export function calculateMonthlyGstDeadlines(
  fiscalYearEnd: string,
  taxYear: number,
): AutoDeadline[] {
  const fye = parseFiscalYearEnd(fiscalYearEnd, taxYear)
  const deadlines: AutoDeadline[] = []

  for (let m = 1; m <= 12; m++) {
    const monthEnd = addMonths(new Date(fye.getFullYear(), fye.getMonth() - 12 + m, fye.getDate()), 0)
    const filingDue = addMonths(monthEnd, 1) // 1 month after period end
    deadlines.push({
      type: 'indirect_filing',
      label: `${taxYear} M${m} — GST/HST Monthly Return`,
      dueDate: toIso(filingDue),
      rule: 'ETA: 1 month after reporting period end',
    })
  }

  return deadlines
}
