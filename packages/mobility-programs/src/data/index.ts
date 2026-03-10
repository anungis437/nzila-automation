/* ── Program Reference Data ───────────────────────────────
 *
 * Structured seed data for citizenship and residency programs.
 * This serves as the baseline; firms can customise via DB records.
 */

import type { ProgramType, InvestmentType } from '@nzila/mobility-core'

export interface ProgramDefinition {
  country: string
  programName: string
  programType: ProgramType
  investmentType: InvestmentType
  minimumInvestment: number
  physicalPresenceRequired: boolean
  timeToCitizenship: string | null
  restrictedNationalities: string[]
}

export const PROGRAM_CATALOG: readonly ProgramDefinition[] = [
  {
    country: 'MT',
    programName: 'Malta Citizenship by Naturalisation for Exceptional Services',
    programType: 'citizenship_by_investment',
    investmentType: 'national_fund',
    minimumInvestment: 690_000,
    physicalPresenceRequired: true,
    timeToCitizenship: '12-36 months',
    restrictedNationalities: [],
  },
  {
    country: 'PT',
    programName: 'Portugal Golden Visa',
    programType: 'golden_visa',
    investmentType: 'real_estate',
    minimumInvestment: 500_000,
    physicalPresenceRequired: false,
    timeToCitizenship: '5 years',
    restrictedNationalities: [],
  },
  {
    country: 'GD',
    programName: 'Grenada Citizenship by Investment',
    programType: 'citizenship_by_investment',
    investmentType: 'national_fund',
    minimumInvestment: 150_000,
    physicalPresenceRequired: false,
    timeToCitizenship: '4-6 months',
    restrictedNationalities: [],
  },
  {
    country: 'KN',
    programName: 'St Kitts and Nevis Citizenship by Investment',
    programType: 'citizenship_by_investment',
    investmentType: 'donation',
    minimumInvestment: 250_000,
    physicalPresenceRequired: false,
    timeToCitizenship: '3-6 months',
    restrictedNationalities: [],
  },
  {
    country: 'AE',
    programName: 'UAE Golden Visa',
    programType: 'golden_visa',
    investmentType: 'real_estate',
    minimumInvestment: 2_000_000,
    physicalPresenceRequired: false,
    timeToCitizenship: null,
    restrictedNationalities: [],
  },
  {
    country: 'GR',
    programName: 'Greece Golden Visa',
    programType: 'golden_visa',
    investmentType: 'real_estate',
    minimumInvestment: 250_000,
    physicalPresenceRequired: false,
    timeToCitizenship: '7 years',
    restrictedNationalities: [],
  },
  {
    country: 'AG',
    programName: 'Antigua and Barbuda Citizenship by Investment',
    programType: 'citizenship_by_investment',
    investmentType: 'national_fund',
    minimumInvestment: 100_000,
    physicalPresenceRequired: false,
    timeToCitizenship: '3-6 months',
    restrictedNationalities: [],
  },
  {
    country: 'VU',
    programName: 'Vanuatu Development Support Program',
    programType: 'citizenship_by_investment',
    investmentType: 'donation',
    minimumInvestment: 130_000,
    physicalPresenceRequired: false,
    timeToCitizenship: '1-3 months',
    restrictedNationalities: [],
  },
] as const satisfies readonly ProgramDefinition[]
