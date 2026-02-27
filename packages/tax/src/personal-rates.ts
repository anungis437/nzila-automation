/**
 * @nzila/tax — Personal income tax brackets (T1)
 *
 * Federal and provincial marginal tax brackets for individuals.
 * Used for owner-manager tax planning (salary vs. dividend optimization).
 *
 * Sources:
 * - Federal brackets: ITA s.117(2), CRA T1 General Guide
 * - Provincial brackets: Provincial income tax acts, CRA Schedule 428
 * - Basic Personal Amount: ITA s.118(1), indexed annually
 *
 * Updated for 2026 tax year.
 */
import type { Province } from './types'

// ── Types ───────────────────────────────────────────────────────────────────

export interface TaxBracket {
  /** Lower bound of the bracket (inclusive) */
  from: number
  /** Upper bound (exclusive), null for top bracket */
  to: number | null
  /** Marginal rate (decimal, e.g. 0.205 = 20.5%) */
  rate: number
}

export interface PersonalTaxSchedule {
  jurisdiction: 'federal' | Province
  taxYear: number
  brackets: TaxBracket[]
  /** Basic Personal Amount (non-refundable credit base) */
  basicPersonalAmount: number
}

export interface PersonalTaxEstimate {
  province: Province
  taxableIncome: number
  federalTax: number
  provincialTax: number
  combinedTax: number
  effectiveRate: number
  marginalRate: number
}

// ── Federal brackets (2025, indexed) ────────────────────────────────────────

/**
 * Federal T1 brackets for 2026 (ITA s.117(2), indexed for inflation).
 * Source: CRA indexation factor for 2026 = 2.7%.
 */
export const FEDERAL_BRACKETS_2026: TaxBracket[] = [
  { from: 0,       to: 59_412,  rate: 0.15 },
  { from: 59_412,  to: 118_825, rate: 0.205 },
  { from: 118_825, to: 164_048, rate: 0.26 },
  { from: 164_048, to: 229_510, rate: 0.29 },
  { from: 229_510, to: null,    rate: 0.33 },
]

/** Federal Basic Personal Amount for 2026 */
export const FEDERAL_BPA_2026 = 16_692

/** @deprecated Use FEDERAL_BRACKETS_2026 */
export const FEDERAL_BRACKETS_2025 = FEDERAL_BRACKETS_2026
/** @deprecated Use FEDERAL_BPA_2026 */
export const FEDERAL_BPA_2025 = FEDERAL_BPA_2026

// ── Provincial brackets (2025) ──────────────────────────────────────────────

/**
 * Provincial personal income tax brackets for 2026.
 * Source: Provincial finance ministry publications, CRA Schedule 428.
 */
export const PROVINCIAL_PERSONAL_BRACKETS: Record<Province, { brackets: TaxBracket[]; bpa: number }> = {
  ON: {
    brackets: [
      { from: 0,       to: 51_446,  rate: 0.0505 },
      { from: 51_446,  to: 102_894, rate: 0.0915 },
      { from: 102_894, to: 150_000, rate: 0.1116 },
      { from: 150_000, to: 220_000, rate: 0.1216 },
      { from: 220_000, to: null,    rate: 0.1316 },
    ],
    bpa: 11_865,
  },
  QC: {
    brackets: [
      { from: 0,       to: 51_780,  rate: 0.14 },
      { from: 51_780,  to: 103_545, rate: 0.19 },
      { from: 103_545, to: 126_000, rate: 0.24 },
      { from: 126_000, to: null,    rate: 0.2575 },
    ],
    bpa: 18_056,
  },
  BC: {
    brackets: [
      { from: 0,       to: 47_937,  rate: 0.0506 },
      { from: 47_937,  to: 95_875,  rate: 0.077 },
      { from: 95_875,  to: 110_076, rate: 0.105 },
      { from: 110_076, to: 133_664, rate: 0.1229 },
      { from: 133_664, to: 181_232, rate: 0.147 },
      { from: 181_232, to: 252_752, rate: 0.168 },
      { from: 252_752, to: null,    rate: 0.205 },
    ],
    bpa: 12_580,
  },
  AB: {
    brackets: [
      { from: 0,       to: 148_269, rate: 0.10 },
      { from: 148_269, to: 177_922, rate: 0.12 },
      { from: 177_922, to: 237_230, rate: 0.13 },
      { from: 237_230, to: 355_845, rate: 0.14 },
      { from: 355_845, to: null,    rate: 0.15 },
    ],
    bpa: 21_885,
  },
  SK: {
    brackets: [
      { from: 0,       to: 52_057,  rate: 0.105 },
      { from: 52_057,  to: 148_734, rate: 0.125 },
      { from: 148_734, to: null,    rate: 0.145 },
    ],
    bpa: 18_491,
  },
  MB: {
    brackets: [
      { from: 0,       to: 47_000,  rate: 0.108 },
      { from: 47_000,  to: 100_000, rate: 0.1275 },
      { from: 100_000, to: null,    rate: 0.174 },
    ],
    bpa: 15_780,
  },
  NB: {
    brackets: [
      { from: 0,       to: 49_958,  rate: 0.094 },
      { from: 49_958,  to: 99_916,  rate: 0.14 },
      { from: 99_916,  to: 185_064, rate: 0.16 },
      { from: 185_064, to: null,    rate: 0.195 },
    ],
    bpa: 13_044,
  },
  NS: {
    brackets: [
      { from: 0,       to: 29_590,  rate: 0.0879 },
      { from: 29_590,  to: 59_180,  rate: 0.1495 },
      { from: 59_180,  to: 93_000,  rate: 0.1667 },
      { from: 93_000,  to: 150_000, rate: 0.175 },
      { from: 150_000, to: null,    rate: 0.21 },
    ],
    bpa: 8_481,
  },
  PE: {
    brackets: [
      { from: 0,       to: 32_656,  rate: 0.098 },
      { from: 32_656,  to: 64_313,  rate: 0.138 },
      { from: 64_313,  to: null,    rate: 0.167 },
    ],
    bpa: 13_500,
  },
  NL: {
    brackets: [
      { from: 0,       to: 43_198,  rate: 0.087 },
      { from: 43_198,  to: 86_395,  rate: 0.145 },
      { from: 86_395,  to: 154_244, rate: 0.158 },
      { from: 154_244, to: 215_943, rate: 0.178 },
      { from: 215_943, to: 275_870, rate: 0.198 },
      { from: 275_870, to: 551_739, rate: 0.208 },
      { from: 551_739, to: 1_103_478, rate: 0.213 },
      { from: 1_103_478, to: null,  rate: 0.218 },
    ],
    bpa: 10_818,
  },
  YT: {
    brackets: [
      { from: 0,       to: 55_867,  rate: 0.064 },
      { from: 55_867,  to: 111_733, rate: 0.09 },
      { from: 111_733, to: 154_906, rate: 0.109 },
      { from: 154_906, to: 500_000, rate: 0.128 },
      { from: 500_000, to: null,    rate: 0.15 },
    ],
    bpa: 16_129,
  },
  NT: {
    brackets: [
      { from: 0,       to: 50_597,  rate: 0.059 },
      { from: 50_597,  to: 101_198, rate: 0.086 },
      { from: 101_198, to: 164_525, rate: 0.122 },
      { from: 164_525, to: null,    rate: 0.1405 },
    ],
    bpa: 16_593,
  },
  NU: {
    brackets: [
      { from: 0,       to: 53_268,  rate: 0.04 },
      { from: 53_268,  to: 106_537, rate: 0.07 },
      { from: 106_537, to: 173_205, rate: 0.09 },
      { from: 173_205, to: null,    rate: 0.115 },
    ],
    bpa: 18_767,
  },
}

// ── Calculation helpers ─────────────────────────────────────────────────────

/**
 * Calculate tax payable on taxable income using a set of brackets.
 */
export function calculateBracketTax(taxableIncome: number, brackets: TaxBracket[]): number {
  let tax = 0
  for (const bracket of brackets) {
    if (taxableIncome <= bracket.from) break
    const upper = bracket.to ?? Infinity
    const taxableInBracket = Math.min(taxableIncome, upper) - bracket.from
    tax += taxableInBracket * bracket.rate
  }
  return Math.round(tax * 100) / 100
}

/**
 * Get the marginal rate for a given income level.
 */
export function getMarginalRate(taxableIncome: number, brackets: TaxBracket[]): number {
  let rate = brackets[0].rate
  for (const bracket of brackets) {
    if (taxableIncome > bracket.from) {
      rate = bracket.rate
    }
  }
  return rate
}

/**
 * Get the federal personal tax schedule for 2026.
 */
export function getFederalPersonalSchedule(): PersonalTaxSchedule {
  return {
    jurisdiction: 'federal',
    taxYear: 2026,
    brackets: FEDERAL_BRACKETS_2026,
    basicPersonalAmount: FEDERAL_BPA_2026,
  }
}

/**
 * Get the provincial personal tax schedule for 2026.
 */
export function getProvincialPersonalSchedule(province: Province): PersonalTaxSchedule {
  const prov = PROVINCIAL_PERSONAL_BRACKETS[province]
  return {
    jurisdiction: province,
    taxYear: 2026,
    brackets: prov.brackets,
    basicPersonalAmount: prov.bpa,
  }
}

/**
 * Estimate combined federal + provincial personal income tax.
 * Applies basic personal amount as a non-refundable credit (15% federal, lowest provincial rate).
 */
export function estimatePersonalTax(province: Province, taxableIncome: number): PersonalTaxEstimate {
  const fedBrackets = FEDERAL_BRACKETS_2026
  const provData = PROVINCIAL_PERSONAL_BRACKETS[province]

  // Federal tax minus BPA credit
  const rawFedTax = calculateBracketTax(taxableIncome, fedBrackets)
  const fedBpaCredit = FEDERAL_BPA_2026 * fedBrackets[0].rate
  const federalTax = Math.max(0, Math.round((rawFedTax - fedBpaCredit) * 100) / 100)

  // Provincial tax minus BPA credit
  const rawProvTax = calculateBracketTax(taxableIncome, provData.brackets)
  const provBpaCredit = provData.bpa * provData.brackets[0].rate
  const provincialTax = Math.max(0, Math.round((rawProvTax - provBpaCredit) * 100) / 100)

  const combinedTax = Math.round((federalTax + provincialTax) * 100) / 100
  const effectiveRate = taxableIncome > 0 ? Math.round((combinedTax / taxableIncome) * 10000) / 10000 : 0

  const fedMarginal = getMarginalRate(taxableIncome, fedBrackets)
  const provMarginal = getMarginalRate(taxableIncome, provData.brackets)
  const marginalRate = Math.round((fedMarginal + provMarginal) * 10000) / 10000

  return {
    province,
    taxableIncome,
    federalTax,
    provincialTax,
    combinedTax,
    effectiveRate,
    marginalRate,
  }
}

/**
 * Get combined federal + provincial marginal rate for a given income.
 * Useful for salary vs. dividend analysis.
 */
export function getCombinedMarginalRate(province: Province, taxableIncome: number): number {
  const fedMarginal = getMarginalRate(taxableIncome, FEDERAL_BRACKETS_2026)
  const provMarginal = getMarginalRate(taxableIncome, PROVINCIAL_PERSONAL_BRACKETS[province].brackets)
  return Math.round((fedMarginal + provMarginal) * 10000) / 10000
}
