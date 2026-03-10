/* ── Program Eligibility Engine ───────────────────────────
 *
 * Rules-based evaluation for program eligibility.
 * AI explanation layer is separate (mobility-ai package).
 */

import type { EligibilityResult } from '@nzila/mobility-core'
import type { ProgramDefinition } from './data/index'

export interface ClientProfile {
  primaryNationality: string
  residenceCountry: string
  wealthTier: 'standard' | 'hnw' | 'uhnw'
  riskProfile: 'low' | 'medium' | 'high' | 'critical'
  familySize: number
  investmentBudget?: number
  preferredRegions?: string[]
  physicalPresenceOk?: boolean
}

/**
 * Evaluate whether a client profile is eligible for a specific program.
 * Returns a structured result with reasons and blockers.
 */
export function evaluateProgramEligibility(
  profile: ClientProfile,
  program: ProgramDefinition,
): EligibilityResult {
  const reasons: string[] = []
  const blockers: string[] = []
  let score = 100

  // Nationality restriction check
  if (program.restrictedNationalities.includes(profile.primaryNationality)) {
    blockers.push(`Nationality ${profile.primaryNationality} is restricted for this program`)
    score = 0
  }

  // Investment budget check
  if (profile.investmentBudget !== undefined) {
    if (profile.investmentBudget >= program.minimumInvestment) {
      reasons.push(`Investment budget (${profile.investmentBudget}) meets minimum (${program.minimumInvestment})`)
    } else {
      blockers.push(
        `Investment budget (${profile.investmentBudget}) below minimum (${program.minimumInvestment})`,
      )
      score -= 40
    }
  }

  // Physical presence constraint
  if (program.physicalPresenceRequired && profile.physicalPresenceOk === false) {
    blockers.push('Program requires physical presence but client cannot relocate')
    score -= 30
  }

  // Risk profile check — high-risk clients may face enhanced due diligence
  if (profile.riskProfile === 'critical') {
    blockers.push('Critical risk profile — enhanced due diligence required before application')
    score -= 20
  } else if (profile.riskProfile === 'high') {
    reasons.push('High risk profile — enhanced screening will be applied')
    score -= 10
  }

  // Region preference bonus
  if (profile.preferredRegions?.includes(program.country)) {
    reasons.push(`Program country (${program.country}) matches client preference`)
    score += 5
  }

  const eligible = blockers.length === 0 && score > 0

  return {
    programId: '', // Caller sets this from the DB record
    eligible,
    score: Math.max(0, Math.min(100, score)),
    reasons,
    blockers,
  }
}

/**
 * Rank all programs by eligibility score for a given client profile.
 * Returns programs sorted by descending score, with eligibility details.
 */
export function rankProgramOptions(
  profile: ClientProfile,
  programs: ProgramDefinition[],
): EligibilityResult[] {
  return programs
    .map((program) => evaluateProgramEligibility(profile, program))
    .sort((a, b) => b.score - a.score)
}

/* ── Program Comparison ───────────────────────────────────── */

export interface ProgramComparisonRow {
  field: string
  values: Record<string, string | number | boolean | string[]>
}

export interface ProgramComparison {
  programIds: string[]
  programs: ProgramDefinition[]
  rows: ProgramComparisonRow[]
}

/**
 * Compare multiple programs side-by-side across key dimensions.
 * Accepts country codes to look up from the catalog.
 */
export function comparePrograms(
  countryCodes: string[],
  catalog: readonly ProgramDefinition[],
): ProgramComparison {
  const programs = countryCodes
    .map((code) => catalog.find((p) => p.countryCode === code || p.country === code))
    .filter((p): p is ProgramDefinition => p !== undefined)

  const fields: Array<{ field: string; extract: (p: ProgramDefinition) => string | number | boolean | string[] }> = [
    { field: 'Programme Name', extract: (p) => p.name },
    { field: 'Type', extract: (p) => p.programType.replace(/_/g, ' ') },
    { field: 'Minimum Investment', extract: (p) => p.minimumInvestment },
    { field: 'Currency', extract: (p) => p.currency },
    { field: 'Processing (days)', extract: (p) => p.processingTimeDays },
    { field: 'Time to Citizenship', extract: (p) => p.timeToCitizenship ?? 'N/A' },
    { field: 'Citizenship Path', extract: (p) => p.citizenshipPath },
    { field: 'Physical Presence', extract: (p) => p.physicalPresenceRequired },
    { field: 'Dependents Allowed', extract: (p) => p.dependentsAllowed },
    { field: 'Investment Types', extract: (p) => p.investmentTypes.map((t) => t.replace(/_/g, ' ')) },
    { field: 'Risk Rating', extract: (p) => p.riskRating },
    { field: 'Required Documents', extract: (p) => p.requiredDocuments.map((d) => d.replace(/_/g, ' ')) },
  ]

  const rows: ProgramComparisonRow[] = fields.map(({ field, extract }) => ({
    field,
    values: Object.fromEntries(programs.map((p) => [p.countryCode, extract(p)])),
  }))

  return {
    programIds: programs.map((p) => p.countryCode),
    programs,
    rows,
  }
}
