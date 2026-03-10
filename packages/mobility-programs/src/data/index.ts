/* ── Program Reference Data ───────────────────────────────
 *
 * Structured seed data for citizenship and residency programs.
 * This serves as the baseline; firms can customise via DB records.
 */

import type { ProgramType, InvestmentType, DocumentType } from '@nzila/mobility-core'

export interface ProgramDefinition {
  /** ISO 3166-1 alpha-2 country code */
  countryCode: string
  /** Alias kept for back-compat — same as countryCode */
  country: string
  /** Display name */
  name: string
  /** Alias kept for back-compat — same as name */
  programName: string
  programType: ProgramType
  /** Primary investment type */
  investmentType: InvestmentType
  /** All accepted investment routes */
  investmentTypes: InvestmentType[]
  minimumInvestment: number
  /** ISO 4217 currency code */
  currency: string
  physicalPresenceRequired: boolean
  /** Estimated processing time in days */
  processingTimeDays: number
  timeToCitizenship: string | null
  /** Whether applicant's path leads to full citizenship */
  citizenshipPath: boolean
  /** Whether dependents can be included */
  dependentsAllowed: boolean
  /** FATF / programme risk tier */
  riskRating: 'low' | 'medium' | 'high'
  /** Documents required for application */
  requiredDocuments: DocumentType[]
  restrictedNationalities: string[]
}

export const PROGRAM_CATALOG: readonly ProgramDefinition[] = [
  {
    countryCode: 'MT',
    country: 'MT',
    name: 'Malta Citizenship by Naturalisation for Exceptional Services',
    programName: 'Malta Citizenship by Naturalisation for Exceptional Services',
    programType: 'citizenship_by_investment',
    investmentType: 'national_fund',
    investmentTypes: ['national_fund', 'real_estate', 'government_bonds'],
    minimumInvestment: 690_000,
    currency: 'EUR',
    physicalPresenceRequired: true,
    processingTimeDays: 420,
    timeToCitizenship: '12-36 months',
    citizenshipPath: true,
    dependentsAllowed: true,
    riskRating: 'low',
    requiredDocuments: ['passport', 'birth_certificate', 'police_clearance', 'medical_report', 'bank_statement', 'source_of_funds', 'proof_of_address'],
    restrictedNationalities: [],
  },
  {
    countryCode: 'PT',
    country: 'PT',
    name: 'Portugal Golden Visa',
    programName: 'Portugal Golden Visa',
    programType: 'golden_visa',
    investmentType: 'real_estate',
    investmentTypes: ['real_estate', 'business_investment', 'national_fund'],
    minimumInvestment: 500_000,
    currency: 'EUR',
    physicalPresenceRequired: false,
    processingTimeDays: 240,
    timeToCitizenship: '5 years',
    citizenshipPath: true,
    dependentsAllowed: true,
    riskRating: 'low',
    requiredDocuments: ['passport', 'police_clearance', 'bank_statement', 'source_of_funds', 'proof_of_address', 'tax_return'],
    restrictedNationalities: [],
  },
  {
    countryCode: 'GD',
    country: 'GD',
    name: 'Grenada Citizenship by Investment',
    programName: 'Grenada Citizenship by Investment',
    programType: 'citizenship_by_investment',
    investmentType: 'national_fund',
    investmentTypes: ['national_fund', 'real_estate'],
    minimumInvestment: 150_000,
    currency: 'USD',
    physicalPresenceRequired: false,
    processingTimeDays: 120,
    timeToCitizenship: '4-6 months',
    citizenshipPath: true,
    dependentsAllowed: true,
    riskRating: 'medium',
    requiredDocuments: ['passport', 'birth_certificate', 'police_clearance', 'medical_report', 'bank_statement', 'source_of_funds'],
    restrictedNationalities: [],
  },
  {
    countryCode: 'KN',
    country: 'KN',
    name: 'St Kitts and Nevis Citizenship by Investment',
    programName: 'St Kitts and Nevis Citizenship by Investment',
    programType: 'citizenship_by_investment',
    investmentType: 'donation',
    investmentTypes: ['donation', 'real_estate'],
    minimumInvestment: 250_000,
    currency: 'USD',
    physicalPresenceRequired: false,
    processingTimeDays: 90,
    timeToCitizenship: '3-6 months',
    citizenshipPath: true,
    dependentsAllowed: true,
    riskRating: 'medium',
    requiredDocuments: ['passport', 'birth_certificate', 'police_clearance', 'medical_report', 'bank_statement', 'source_of_funds'],
    restrictedNationalities: [],
  },
  {
    countryCode: 'AE',
    country: 'AE',
    name: 'UAE Golden Visa',
    programName: 'UAE Golden Visa',
    programType: 'golden_visa',
    investmentType: 'real_estate',
    investmentTypes: ['real_estate', 'business_investment', 'bank_deposit'],
    minimumInvestment: 2_000_000,
    currency: 'AED',
    physicalPresenceRequired: false,
    processingTimeDays: 30,
    timeToCitizenship: null,
    citizenshipPath: false,
    dependentsAllowed: true,
    riskRating: 'low',
    requiredDocuments: ['passport', 'bank_statement', 'proof_of_address', 'investment_agreement'],
    restrictedNationalities: [],
  },
  {
    countryCode: 'GR',
    country: 'GR',
    name: 'Greece Golden Visa',
    programName: 'Greece Golden Visa',
    programType: 'golden_visa',
    investmentType: 'real_estate',
    investmentTypes: ['real_estate'],
    minimumInvestment: 250_000,
    currency: 'EUR',
    physicalPresenceRequired: false,
    processingTimeDays: 60,
    timeToCitizenship: '7 years',
    citizenshipPath: true,
    dependentsAllowed: true,
    riskRating: 'low',
    requiredDocuments: ['passport', 'police_clearance', 'bank_statement', 'proof_of_address', 'medical_report'],
    restrictedNationalities: [],
  },
  {
    countryCode: 'AG',
    country: 'AG',
    name: 'Antigua and Barbuda Citizenship by Investment',
    programName: 'Antigua and Barbuda Citizenship by Investment',
    programType: 'citizenship_by_investment',
    investmentType: 'national_fund',
    investmentTypes: ['national_fund', 'real_estate', 'business_investment'],
    minimumInvestment: 100_000,
    currency: 'USD',
    physicalPresenceRequired: false,
    processingTimeDays: 90,
    timeToCitizenship: '3-6 months',
    citizenshipPath: true,
    dependentsAllowed: true,
    riskRating: 'medium',
    requiredDocuments: ['passport', 'birth_certificate', 'police_clearance', 'medical_report', 'bank_statement', 'source_of_funds'],
    restrictedNationalities: [],
  },
  {
    countryCode: 'VU',
    country: 'VU',
    name: 'Vanuatu Development Support Program',
    programName: 'Vanuatu Development Support Program',
    programType: 'citizenship_by_investment',
    investmentType: 'donation',
    investmentTypes: ['donation'],
    minimumInvestment: 130_000,
    currency: 'USD',
    physicalPresenceRequired: false,
    processingTimeDays: 45,
    timeToCitizenship: '1-3 months',
    citizenshipPath: true,
    dependentsAllowed: true,
    riskRating: 'high',
    requiredDocuments: ['passport', 'birth_certificate', 'police_clearance', 'bank_statement', 'source_of_funds'],
    restrictedNationalities: [],
  },
] as const satisfies readonly ProgramDefinition[]
