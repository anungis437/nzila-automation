/**
 * @nzila/tax — Dividend tax integration (RDTOH / GRIP / LRIP)
 *
 * Calculates the tax cost of distributing eligible and non-eligible
 * dividends from a CCPC to its shareholder(s).
 *
 * Sources:
 * - ITA s.82(1): Dividend gross-up rates
 * - ITA s.121: Dividend tax credit (federal)
 * - ITA s.129: Refundable Dividend Tax On Hand (RDTOH)
 * - CRA T2 Corporation Income Tax Guide (T4012): RDTOH, GRIP, LRIP
 * - Provincial dividend tax credits: Provincial tax acts
 *
 * Updated for 2025 tax year.
 */
import type { Province } from './types'

// ── Dividend gross-up & DTC rates ───────────────────────────────────────────

/**
 * Eligible dividends: paid from income taxed at the general corporate rate.
 * Tracked via GRIP (General Rate Income Pool).
 */
export const ELIGIBLE_DIVIDEND = {
  /** Gross-up factor (ITA s.82(1)(b)) — 38% */
  grossUpRate: 0.38,
  /** Federal DTC rate (ITA s.121) — 15.0198% of grossed-up amount */
  federalDtcRate: 0.150198,
  /** CRA guide reference */
  rule: 'ITA s.82(1)(b), s.121 — Eligible dividend gross-up & DTC',
} as const

/**
 * Non-eligible (ordinary) dividends: paid from income taxed at small business rate.
 * Tracked via LRIP (Low Rate Income Pool) for CCPC.
 */
export const NON_ELIGIBLE_DIVIDEND = {
  /** Gross-up factor (ITA s.82(1)(b)) — 15% */
  grossUpRate: 0.15,
  /** Federal DTC rate (ITA s.121) — 9.0301% of grossed-up amount */
  federalDtcRate: 0.090301,
  /** CRA guide reference */
  rule: 'ITA s.82(1)(b), s.121 — Non-eligible dividend gross-up & DTC',
} as const

// ── Provincial DTC rates ────────────────────────────────────────────────────

export interface ProvincialDividendCredit {
  eligibleDtcRate: number
  nonEligibleDtcRate: number
}

/**
 * Provincial dividend tax credit rates (% of grossed-up amount).
 * Source: Provincial income tax acts, CRA Schedule 428.
 */
export const PROVINCIAL_DTC: Record<Province, ProvincialDividendCredit> = {
  ON: { eligibleDtcRate: 0.10,    nonEligibleDtcRate: 0.029863 },
  QC: { eligibleDtcRate: 0.1175,  nonEligibleDtcRate: 0.0342 },
  BC: { eligibleDtcRate: 0.12,    nonEligibleDtcRate: 0.0196 },
  AB: { eligibleDtcRate: 0.0812,  nonEligibleDtcRate: 0.0218 },
  SK: { eligibleDtcRate: 0.11,    nonEligibleDtcRate: 0.02105 },
  MB: { eligibleDtcRate: 0.08,    nonEligibleDtcRate: 0.007835 },
  NB: { eligibleDtcRate: 0.14,    nonEligibleDtcRate: 0.0275 },
  NS: { eligibleDtcRate: 0.0885,  nonEligibleDtcRate: 0.0299 },
  PE: { eligibleDtcRate: 0.105,   nonEligibleDtcRate: 0.027 },
  NL: { eligibleDtcRate: 0.063,   nonEligibleDtcRate: 0.032 },
  YT: { eligibleDtcRate: 0.1512,  nonEligibleDtcRate: 0.0267 },
  NT: { eligibleDtcRate: 0.115,   nonEligibleDtcRate: 0.06 },
  NU: { eligibleDtcRate: 0.0551,  nonEligibleDtcRate: 0.0261 },
}

// ── RDTOH ───────────────────────────────────────────────────────────────────

/** RDTOH refund rate: $38.33 per $100 of taxable dividends paid (ITA s.129(1)) */
export const RDTOH_REFUND_RATE = 38.33 / 100

/**
 * Part IV tax rate on portfolio dividends received by a private corp (ITA s.186(1)).
 * 38-1/3% of eligible dividends received.
 */
export const PART_IV_TAX_RATE = 38.33 / 100

// ── Types ───────────────────────────────────────────────────────────────────

export interface DividendTaxResult {
  /** Actual cash dividend paid */
  cashDividend: number
  /** Type of dividend */
  type: 'eligible' | 'non-eligible'
  /** Grossed-up (taxable) amount */
  grossedUpAmount: number
  /** Federal DTC */
  federalCredit: number
  /** Provincial DTC */
  provincialCredit: number
  /** Total DTC */
  totalCredit: number
  /** Net tax on dividend (after credits) at top marginal rate */
  netTaxAtTopRate: number
  /** Effective personal tax rate on the cash dividend */
  effectiveDividendRate: number
  /** RDTOH refund to the corporation */
  rdtohRefund: number
  /** Combined corp + personal integration cost */
  integrationCost: number
}

// ── Calculators ─────────────────────────────────────────────────────────────

/**
 * Calculate the personal tax on a dividend at a given marginal rate.
 * This is the core integration analysis: how much does a dollar of
 * corporate income cost when flowed through as a dividend?
 */
export function calculateDividendTax(
  cashDividend: number,
  type: 'eligible' | 'non-eligible',
  province: Province,
  personalMarginalRate: number,
): DividendTaxResult {
  const div = type === 'eligible' ? ELIGIBLE_DIVIDEND : NON_ELIGIBLE_DIVIDEND
  const provDtc = PROVINCIAL_DTC[province]

  // Step 1: Gross-up
  const grossedUpAmount = Math.round(cashDividend * (1 + div.grossUpRate) * 100) / 100

  // Step 2: Tax at marginal rate on the grossed-up amount
  const taxOnGrossedUp = grossedUpAmount * personalMarginalRate

  // Step 3: Credits
  const federalCredit = Math.round(grossedUpAmount * div.federalDtcRate * 100) / 100
  const provDtcRate = type === 'eligible' ? provDtc.eligibleDtcRate : provDtc.nonEligibleDtcRate
  const provincialCredit = Math.round(grossedUpAmount * provDtcRate * 100) / 100
  const totalCredit = Math.round((federalCredit + provincialCredit) * 100) / 100

  // Step 4: Net tax
  const netTax = Math.max(0, Math.round((taxOnGrossedUp - totalCredit) * 100) / 100)
  const effectiveRate = cashDividend > 0 ? Math.round((netTax / cashDividend) * 10000) / 10000 : 0

  // Step 5: RDTOH refund to corporation
  const rdtohRefund = Math.round(cashDividend * RDTOH_REFUND_RATE * 100) / 100

  // Step 6: Integration cost = personal tax - RDTOH refund (simplified)
  const integrationCost = Math.round((netTax - rdtohRefund) * 100) / 100

  return {
    cashDividend,
    type,
    grossedUpAmount,
    federalCredit,
    provincialCredit,
    totalCredit,
    netTaxAtTopRate: netTax,
    effectiveDividendRate: effectiveRate,
    rdtohRefund,
    integrationCost,
  }
}

/**
 * Compare salary vs. dividend for a given amount of corporate pre-tax income.
 * Simplified model: shows the after-tax cash to the owner-manager under each strategy.
 *
 * This is the key analysis for VCFO advisory.
 */
export function compareSalaryVsDividend(
  corporatePreTaxIncome: number,
  province: Province,
  personalMarginalRate: number,
  corporateTaxRate: number,
): {
  salary: { gross: number; personalTax: number; afterTax: number; employerCpp: number }
  eligibleDividend: { corpTax: number; cashDividend: number; personalTax: number; afterTax: number; rdtohRefund: number }
  nonEligibleDividend: { corpTax: number; cashDividend: number; personalTax: number; afterTax: number; rdtohRefund: number }
} {
  // ── Salary path ──
  // CPP employer max contribution (2026): roughly $4,034 at 5.95% up to $71,300
  const cppMaxEarnings = 71_300
  const cppRate = 0.0595
  const cppExemption = 3_500
  const cppEmployer = Math.min(
    (Math.min(corporatePreTaxIncome, cppMaxEarnings) - cppExemption) * cppRate,
    (cppMaxEarnings - cppExemption) * cppRate,
  )
  const grossSalary = corporatePreTaxIncome // corp deducts full amount
  const personalTaxOnSalary = Math.round(grossSalary * personalMarginalRate * 100) / 100
  const afterTaxSalary = Math.round((grossSalary - personalTaxOnSalary) * 100) / 100

  // ── Eligible dividend path ──
  const corpTax = Math.round(corporatePreTaxIncome * corporateTaxRate * 100) / 100
  const cashDividend = Math.round((corporatePreTaxIncome - corpTax) * 100) / 100
  const eligResult = calculateDividendTax(cashDividend, 'eligible', province, personalMarginalRate)

  // ── Non-eligible dividend path ──
  const nonEligResult = calculateDividendTax(cashDividend, 'non-eligible', province, personalMarginalRate)

  return {
    salary: {
      gross: grossSalary,
      personalTax: personalTaxOnSalary,
      afterTax: afterTaxSalary,
      employerCpp: Math.round(cppEmployer * 100) / 100,
    },
    eligibleDividend: {
      corpTax,
      cashDividend,
      personalTax: eligResult.netTaxAtTopRate,
      afterTax: Math.round((cashDividend - eligResult.netTaxAtTopRate) * 100) / 100,
      rdtohRefund: eligResult.rdtohRefund,
    },
    nonEligibleDividend: {
      corpTax,
      cashDividend,
      personalTax: nonEligResult.netTaxAtTopRate,
      afterTax: Math.round((cashDividend - nonEligResult.netTaxAtTopRate) * 100) / 100,
      rdtohRefund: nonEligResult.rdtohRefund,
    },
  }
}
