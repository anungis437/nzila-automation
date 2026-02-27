/**
 * @nzila/tax — Advanced salary-vs-dividend analysis
 *
 * Extends the core compareSalaryVsDividend() with:
 * - CPP2 (second ceiling) on earnings between YMPE and YAMPE
 * - EI employee + employer premiums
 * - RRSP room created by salary (18% earned income, annual max)
 * - Multi-year projection (3–10 year horizon)
 * - Provincial optimization (rank by after-tax outcome)
 *
 * Sources:
 * - ITA s.147.1: RRSP contribution limits
 * - CPP2: Canada Pension Plan Enhancement (Bill C-26)
 * - CRA T4001: Payroll EI/CPP guide
 *
 * @module @nzila/tax/salary-vs-dividend-advanced
 */
import type { Province } from './types'
import { CPP_2026, EI_2026 } from './payroll-thresholds'
import { compareSalaryVsDividend } from './dividend-tax'
import { getCombinedCorporateRates } from './rates'
import { getCombinedMarginalRate } from './personal-rates'
import { PROVINCIAL_PERSONAL_BRACKETS } from './personal-rates'

// ── RRSP constants (2026) ───────────────────────────────────────────────────

/** Maximum RRSP contribution for 2026 (CRA) */
export const RRSP_MAX_2026 = 32_490

/** RRSP deduction rate — 18% of prior-year earned income */
export const RRSP_RATE = 0.18

// ── TFSA constants (2026) ───────────────────────────────────────────────────

/** TFSA annual contribution limit for 2026 (CRA) */
export const TFSA_LIMIT_2026 = 7_000

/** Cumulative TFSA room for someone 18+ since 2009 */
export const TFSA_CUMULATIVE_2026 = 102_000

/** Historical TFSA annual limits by year */
export const TFSA_ANNUAL_LIMITS: Record<number, number> = {
  2009: 5000, 2010: 5000, 2011: 5000, 2012: 5000, 2013: 5500,
  2014: 5500, 2015: 10000, 2016: 5500, 2017: 5500, 2018: 5500,
  2019: 6000, 2020: 6000, 2021: 6000, 2022: 6000, 2023: 6500,
  2024: 7000, 2025: 7000, 2026: 7000,
}

// ── TFSA impact analysis ────────────────────────────────────────────────────

export interface TfsaImpact {
  /** Annual TFSA room (same for all strategies) */
  annualRoom: number
  /** Tax-free growth value at assumed rate over horizon */
  taxFreeGrowthValue: number
  /** Comparison: after-tax value if same amount invested in non-registered account */
  taxableAlternativeValue: number
  /** Net TFSA advantage */
  tfsaAdvantage: number
  note: string
}

/**
 * Calculate the TFSA impact for a compensation strategy.
 *
 * TFSA room is NOT affected by compensation type (unlike RRSP).
 * However, the after-tax cash available for TFSA contributions differs.
 * This function shows the value of maximizing TFSA with each strategy.
 *
 * @param afterTaxCash  After-tax cash from compensation
 * @param marginalRate  Personal marginal tax rate (for taxable alternative)
 * @param horizonYears  Investment horizon (default 10)
 * @param growthRate    Assumed annual growth rate (default 6%)
 */
export function calculateTfsaImpact(
  afterTaxCash: number,
  marginalRate: number,
  horizonYears: number = 10,
  growthRate: number = 0.06,
): TfsaImpact {
  const contribution = Math.min(afterTaxCash, TFSA_LIMIT_2026)

  // Tax-free compound growth inside TFSA
  const tfsaFv = Math.round(contribution * ((1 + growthRate) ** horizonYears) * 100) / 100

  // Same contribution in non-registered: annual growth taxed at marginalRate
  const afterTaxGrowth = growthRate * (1 - marginalRate * 0.5) // 50% inclusion capital gains
  const taxableFv = Math.round(contribution * ((1 + afterTaxGrowth) ** horizonYears) * 100) / 100

  return {
    annualRoom: TFSA_LIMIT_2026,
    taxFreeGrowthValue: tfsaFv,
    taxableAlternativeValue: taxableFv,
    tfsaAdvantage: Math.round((tfsaFv - taxableFv) * 100) / 100,
    note: 'TFSA room is identical for salary and dividends — the difference is after-tax cash available to contribute.',
  }
}

// ── CPP / EI helpers ────────────────────────────────────────────────────────

export interface PayrollDeductions {
  /** CPP1 employee contribution */
  cpp1Employee: number
  /** CPP1 employer contribution */
  cpp1Employer: number
  /** CPP2 employee contribution (YMPE → YAMPE) */
  cpp2Employee: number
  /** CPP2 employer contribution (YMPE → YAMPE) */
  cpp2Employer: number
  /** EI employee premium */
  eiEmployee: number
  /** EI employer premium (1.4× employee) */
  eiEmployer: number
  /** Total employee deductions (CPP1 + CPP2 + EI) */
  totalEmployee: number
  /** Total employer cost (CPP1 + CPP2 + EI) */
  totalEmployer: number
}

/**
 * Calculate CPP1, CPP2, and EI deductions for a gross salary.
 * Uses 2026 thresholds from payroll-thresholds.ts.
 */
export function calculatePayrollDeductions(grossSalary: number): PayrollDeductions {
  // CPP1: on earnings from basic exemption to YMPE
  const cpp1Pensionable = Math.max(0, Math.min(grossSalary, CPP_2026.ympe) - CPP_2026.basicExemption)
  const cpp1Employee = Math.min(
    Math.round(cpp1Pensionable * CPP_2026.rate * 100) / 100,
    CPP_2026.maxContribution,
  )
  const cpp1Employer = cpp1Employee // employer matches

  // CPP2: on earnings between YMPE and YAMPE
  const cpp2Pensionable = Math.max(0, Math.min(grossSalary, CPP_2026.yampe) - CPP_2026.ympe)
  const cpp2Employee = Math.min(
    Math.round(cpp2Pensionable * CPP_2026.cpp2Rate * 100) / 100,
    CPP_2026.maxCpp2Contribution,
  )
  const cpp2Employer = cpp2Employee // employer matches

  // EI
  const eiInsurable = Math.min(grossSalary, EI_2026.maxInsurableEarnings)
  const eiEmployee = Math.min(
    Math.round(eiInsurable * EI_2026.employeeRate * 100) / 100,
    EI_2026.maxEmployeePremium,
  )
  const eiEmployer = Math.min(
    Math.round(eiInsurable * EI_2026.employerRate * 100) / 100,
    EI_2026.maxEmployerPremium,
  )

  return {
    cpp1Employee,
    cpp1Employer,
    cpp2Employee,
    cpp2Employer,
    eiEmployee,
    eiEmployer,
    totalEmployee: Math.round((cpp1Employee + cpp2Employee + eiEmployee) * 100) / 100,
    totalEmployer: Math.round((cpp1Employer + cpp2Employer + eiEmployer) * 100) / 100,
  }
}

// ── RRSP ────────────────────────────────────────────────────────────────────

export interface RrspImpact {
  /** RRSP room created (18% of earned income, capped) */
  roomCreated: number
  /** Tax deferral value at the marginal rate */
  taxDeferralValue: number
  /** Note: dividends create $0 RRSP room */
  note: string
}

/**
 * Calculate RRSP room created by salary income.
 * Dividends do NOT create RRSP contribution room.
 */
export function calculateRrspRoom(
  earnedIncome: number,
  marginalRate: number,
): RrspImpact {
  const room = Math.min(Math.round(earnedIncome * RRSP_RATE * 100) / 100, RRSP_MAX_2026)
  const deferral = Math.round(room * marginalRate * 100) / 100

  return {
    roomCreated: room,
    taxDeferralValue: deferral,
    note: 'Salary creates RRSP room; dividends do not (ITA s.146(1) "earned income")',
  }
}

// ── Enhanced comparison ─────────────────────────────────────────────────────

export interface EnhancedSalaryVsDividendResult {
  salary: {
    gross: number
    payroll: PayrollDeductions
    netSalaryCostToCorp: number
    personalTax: number
    afterTax: number
    rrsp: RrspImpact
  }
  eligibleDividend: {
    corpTax: number
    cashDividend: number
    personalTax: number
    afterTax: number
    rdtohRefund: number
    rrsp: RrspImpact
  }
  nonEligibleDividend: {
    corpTax: number
    cashDividend: number
    personalTax: number
    afterTax: number
    rdtohRefund: number
    rrsp: RrspImpact
  }
  bestStrategy: 'salary' | 'eligible-dividend' | 'non-eligible-dividend'
  /** After-tax cash advantage of best strategy over worst */
  advantageAmount: number
}

/**
 * Enhanced salary-vs-dividend comparison with CPP2, EI, RRSP.
 * Accounts for the full employer cost of salary (CPP+CPP2+EI)
 * which reduces the available salary the corp can pay.
 */
export function compareSalaryVsDividendAdvanced(
  corporatePreTaxIncome: number,
  province: Province,
  personalMarginalRate: number,
  corporateTaxRate: number,
): EnhancedSalaryVsDividendResult {
  // Use base comparison for dividend paths
  const base = compareSalaryVsDividend(
    corporatePreTaxIncome,
    province,
    personalMarginalRate,
    corporateTaxRate,
  )

  // ── Salary path (with CPP2 + EI) ──
  // Corp must pay: gross salary + employer CPP1 + CPP2 + EI = corporatePreTaxIncome
  // So: gross + employer payroll = corporatePreTaxIncome
  // Iterative solve: start with gross ≈ income, deduct employer costs
  let gross = corporatePreTaxIncome
  for (let i = 0; i < 10; i++) {
    const payroll = calculatePayrollDeductions(gross)
    gross = Math.round((corporatePreTaxIncome - payroll.totalEmployer) * 100) / 100
  }

  const payroll = calculatePayrollDeductions(gross)
  const netSalaryCostToCorp = Math.round((gross + payroll.totalEmployer) * 100) / 100
  const personalTax = Math.round(gross * personalMarginalRate * 100) / 100
  const employeeDeductions = payroll.totalEmployee
  const afterTax = Math.round((gross - personalTax - employeeDeductions) * 100) / 100

  const salaryRrsp = calculateRrspRoom(gross, personalMarginalRate)
  const dividendRrsp: RrspImpact = { roomCreated: 0, taxDeferralValue: 0, note: 'Dividends create $0 RRSP room' }

  // Factor RRSP deferral into effective after-tax (long-term value)
  const salaryEffective = afterTax + salaryRrsp.taxDeferralValue
  const eligibleEffective = base.eligibleDividend.afterTax
  const nonEligibleEffective = base.nonEligibleDividend.afterTax

  const strategies = [
    { name: 'salary' as const, value: salaryEffective },
    { name: 'eligible-dividend' as const, value: eligibleEffective },
    { name: 'non-eligible-dividend' as const, value: nonEligibleEffective },
  ]
  strategies.sort((a, b) => b.value - a.value)

  return {
    salary: {
      gross,
      payroll,
      netSalaryCostToCorp,
      personalTax,
      afterTax,
      rrsp: salaryRrsp,
    },
    eligibleDividend: {
      ...base.eligibleDividend,
      rrsp: dividendRrsp,
    },
    nonEligibleDividend: {
      ...base.nonEligibleDividend,
      rrsp: dividendRrsp,
    },
    bestStrategy: strategies[0].name,
    advantageAmount: Math.round((strategies[0].value - strategies[strategies.length - 1].value) * 100) / 100,
  }
}

// ── Multi-year projection ───────────────────────────────────────────────────

export interface YearProjection {
  year: number
  afterTaxCash: number
  cumulativeAfterTax: number
  rrspRoomAccumulated: number
  rrspTaxDeferralValue: number
}

export interface MultiYearProjection {
  strategy: 'salary' | 'eligible-dividend' | 'non-eligible-dividend'
  projections: YearProjection[]
  totalAfterTax: number
  totalRrspRoom: number
}

/**
 * Project salary vs. dividend outcomes over multiple years.
 * Assumes constant income, constant rates (conservative estimate).
 */
export function projectMultiYear(
  annualPreTaxIncome: number,
  province: Province,
  personalMarginalRate: number,
  corporateTaxRate: number,
  years: number = 5,
): { salary: MultiYearProjection; eligibleDividend: MultiYearProjection; nonEligibleDividend: MultiYearProjection } {
  const result = compareSalaryVsDividendAdvanced(
    annualPreTaxIncome, province, personalMarginalRate, corporateTaxRate,
  )

  function buildProjection(
    strategy: MultiYearProjection['strategy'],
    annualAfterTax: number,
    annualRrspRoom: number,
    annualRrspDeferral: number,
  ): MultiYearProjection {
    const projections: YearProjection[] = []
    let cumAfterTax = 0
    let cumRrsp = 0

    for (let y = 1; y <= years; y++) {
      cumAfterTax += annualAfterTax
      cumRrsp += annualRrspRoom
      projections.push({
        year: y,
        afterTaxCash: Math.round(annualAfterTax * 100) / 100,
        cumulativeAfterTax: Math.round(cumAfterTax * 100) / 100,
        rrspRoomAccumulated: Math.round(cumRrsp * 100) / 100,
        rrspTaxDeferralValue: Math.round(annualRrspDeferral * y * 100) / 100,
      })
    }

    return {
      strategy,
      projections,
      totalAfterTax: Math.round(cumAfterTax * 100) / 100,
      totalRrspRoom: Math.round(cumRrsp * 100) / 100,
    }
  }

  return {
    salary: buildProjection('salary', result.salary.afterTax, result.salary.rrsp.roomCreated, result.salary.rrsp.taxDeferralValue),
    eligibleDividend: buildProjection('eligible-dividend', result.eligibleDividend.afterTax, 0, 0),
    nonEligibleDividend: buildProjection('non-eligible-dividend', result.nonEligibleDividend.afterTax, 0, 0),
  }
}

// ── Provincial optimization ─────────────────────────────────────────────────

export interface ProvincialRanking {
  province: Province
  bestStrategy: 'salary' | 'eligible-dividend' | 'non-eligible-dividend'
  afterTaxCash: number
  combinedMarginalRate: number
}

/**
 * Rank all 13 provinces by best after-tax outcome for a given income.
 * Useful for inter-provincial tax planning advisory.
 */
export function rankProvincesByAfterTax(
  corporatePreTaxIncome: number,
): ProvincialRanking[] {
  const provinces: Province[] = ['AB', 'BC', 'MB', 'NB', 'NL', 'NS', 'NT', 'NU', 'ON', 'PE', 'QC', 'SK', 'YT']
  const rankings: ProvincialRanking[] = []

  for (const province of provinces) {
    const rates = getCombinedCorporateRates(province)
    const marginalRate = getCombinedMarginalRate(province, corporatePreTaxIncome)
    const result = compareSalaryVsDividendAdvanced(
      corporatePreTaxIncome, province, marginalRate, rates.combinedSmallBusinessRate,
    )

    const best = [
      { strategy: 'salary' as const, cash: result.salary.afterTax + result.salary.rrsp.taxDeferralValue },
      { strategy: 'eligible-dividend' as const, cash: result.eligibleDividend.afterTax },
      { strategy: 'non-eligible-dividend' as const, cash: result.nonEligibleDividend.afterTax },
    ].sort((a, b) => b.cash - a.cash)[0]

    rankings.push({
      province,
      bestStrategy: best.strategy,
      afterTaxCash: Math.round(best.cash * 100) / 100,
      combinedMarginalRate: marginalRate,
    })
  }

  return rankings.sort((a, b) => b.afterTaxCash - a.afterTaxCash)
}
