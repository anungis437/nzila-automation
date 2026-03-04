/**
 * @nzila/os-core — Data Classification & Marking System
 *
 * Implements a formal data classification taxonomy aligned with:
 *   - NIST SP 800-60 (Mapping Information Types to Security Categories)
 *   - CNSSI 1253 (Security Categorisation and Control Selection)
 *   - CUI Registry (32 CFR Part 2002)
 *   - Canadian ATIP (Access to Information and Privacy Act)
 *
 * Classification Levels (highest → lowest):
 *   TOP SECRET     — Grave damage to national security (not used by Nzila)
 *   SECRET         — Serious damage to national security (not used by Nzila)
 *   CONFIDENTIAL   — Damage to national security (not used by Nzila)
 *   CUI            — Controlled Unclassified Information (CMMC/NIST 800-171)
 *   RESTRICTED     — Business-sensitive, contractual obligations
 *   INTERNAL       — Internal use only, not for public release
 *   PUBLIC         — Approved for public release
 *
 * Nzila operates at CUI and below. Government classification levels
 * (CONFIDENTIAL/SECRET/TOP SECRET) are defined for completeness but
 * should not be used until formal security clearance infrastructure exists.
 *
 * @module @nzila/os-core/classification
 */

// ── Classification Levels ─────────────────────────────────────────────────

export const CLASSIFICATION_LEVELS = [
  'PUBLIC',
  'INTERNAL',
  'RESTRICTED',
  'CUI',
  'CONFIDENTIAL',
  'SECRET',
  'TOP_SECRET',
] as const

export type ClassificationLevel = (typeof CLASSIFICATION_LEVELS)[number]

/**
 * Numeric sensitivity ranking (higher = more sensitive).
 * Used for comparisons and minimum-access level checks.
 */
export const CLASSIFICATION_RANK: Record<ClassificationLevel, number> = {
  PUBLIC: 0,
  INTERNAL: 1,
  RESTRICTED: 2,
  CUI: 3,
  CONFIDENTIAL: 4,
  SECRET: 5,
  TOP_SECRET: 6,
}

/**
 * Maximum classification level Nzila is authorized to handle.
 * Operations at or above this level are blocked.
 */
export const MAX_AUTHORIZED_LEVEL: ClassificationLevel = 'CUI'

// ── CUI Categories (32 CFR Part 2002) ─────────────────────────────────────

export const CUI_CATEGORIES = [
  'CUI//SP-CTI',       // Controlled Technical Information
  'CUI//SP-PRVCY',     // Privacy data (PII)
  'CUI//SP-PROPIN',    // Proprietary Business Information
  'CUI//SP-FINANC',    // Financial data  
  'CUI//SP-HEALTH',    // Health data (HIPAA)
  'CUI//SP-LEGAL',     // Legal privilege
  'CUI//SP-LAW',       // Law enforcement sensitive
  'CUI//SP-INTEL',     // Intelligence data
  'CUI//BASIC',        // Basic CUI — no specific category
] as const

export type CuiCategory = (typeof CUI_CATEGORIES)[number]

// ── Data Marking Metadata ─────────────────────────────────────────────────

export interface DataMarking {
  /** Classification level */
  classification: ClassificationLevel
  /** CUI category if classification === 'CUI' */
  cuiCategory?: CuiCategory
  /** Handling caveats (e.g., 'NOFORN', 'REL TO CAN/USA') */
  handlingCaveats: string[]
  /** Dissemination controls */
  disseminationControls: DisseminationControl[]
  /** Data owner organization */
  ownerOrgId: string
  /** When the classification was applied */
  classifiedAt: string
  /** Who applied the classification (userId) */
  classifiedBy: string
  /** Optional declassification date */
  declassifyOn?: string
  /** Portion marking string for document banners */
  portionMark: string
}

export type DisseminationControl =
  | 'NOFORN'        // Not releasable to foreign nationals
  | 'REL_TO'        // Releasable to specific countries
  | 'ORCON'         // Originator controlled
  | 'PROPIN'        // Proprietary information
  | 'FOUO'          // For Official Use Only (legacy, map to CUI)
  | 'NDA_REQUIRED'  // Requires NDA for access
  | 'INTERNAL_ONLY' // Internal org distribution only

// ── Portion Marking Generator ─────────────────────────────────────────────

/**
 * Generate a standard portion marking string for banners/headers.
 *
 * Examples:
 *   - `(U) PUBLIC`
 *   - `(CUI//SP-PRVCY) Controlled — Privacy`
 *   - `(R) RESTRICTED — NDA_REQUIRED`
 */
export function generatePortionMark(marking: Pick<DataMarking, 'classification' | 'cuiCategory' | 'disseminationControls'>): string {
  const prefixMap: Record<ClassificationLevel, string> = {
    PUBLIC: '(U)',
    INTERNAL: '(I)',
    RESTRICTED: '(R)',
    CUI: '(CUI)',
    CONFIDENTIAL: '(C)',
    SECRET: '(S)',
    TOP_SECRET: '(TS)',
  }

  const prefix = prefixMap[marking.classification]
  const parts = [prefix]

  if (marking.cuiCategory) {
    parts[0] = `(${marking.cuiCategory})`
  }

  if (marking.disseminationControls.length > 0) {
    parts.push(marking.disseminationControls.join('/'))
  }

  return parts.join(' ')
}

// ── Classification Validators ─────────────────────────────────────────────

/**
 * Check if a classification level is within Nzila's authorized range.
 */
export function isAuthorizedLevel(level: ClassificationLevel): boolean {
  return CLASSIFICATION_RANK[level] <= CLASSIFICATION_RANK[MAX_AUTHORIZED_LEVEL]
}

/**
 * Assert that a data operation is authorized at the given classification level.
 * Throws if the level exceeds MAX_AUTHORIZED_LEVEL.
 */
export function assertAuthorizedLevel(level: ClassificationLevel): void {
  if (!isAuthorizedLevel(level)) {
    throw new Error(
      `[CLASSIFICATION] Operation blocked: ${level} exceeds maximum authorized level ` +
        `(${MAX_AUTHORIZED_LEVEL}). Nzila is not cleared for ${level} data.`,
    )
  }
}

/**
 * Compare two classification levels.
 * Returns negative if a < b, 0 if equal, positive if a > b.
 */
export function compareClassification(a: ClassificationLevel, b: ClassificationLevel): number {
  return CLASSIFICATION_RANK[a] - CLASSIFICATION_RANK[b]
}

/**
 * Return the higher of two classification levels.
 */
export function maxClassification(a: ClassificationLevel, b: ClassificationLevel): ClassificationLevel {
  return CLASSIFICATION_RANK[a] >= CLASSIFICATION_RANK[b] ? a : b
}

// ── Data Marking Factory ──────────────────────────────────────────────────

export interface MarkingInput {
  classification: ClassificationLevel
  cuiCategory?: CuiCategory
  handlingCaveats?: string[]
  disseminationControls?: DisseminationControl[]
  ownerOrgId: string
  classifiedBy: string
  declassifyOn?: string
}

/**
 * Create a validated DataMarking.
 * Blocks classification levels above MAX_AUTHORIZED_LEVEL.
 */
export function createMarking(input: MarkingInput): DataMarking {
  assertAuthorizedLevel(input.classification)

  if (input.classification === 'CUI' && !input.cuiCategory) {
    // Default to CUI//BASIC if no specific category
    input.cuiCategory = 'CUI//BASIC'
  }

  const marking: DataMarking = {
    classification: input.classification,
    cuiCategory: input.cuiCategory,
    handlingCaveats: input.handlingCaveats ?? [],
    disseminationControls: input.disseminationControls ?? [],
    ownerOrgId: input.ownerOrgId,
    classifiedAt: new Date().toISOString(),
    classifiedBy: input.classifiedBy,
    declassifyOn: input.declassifyOn,
    portionMark: '',
  }

  marking.portionMark = generatePortionMark(marking)
  return marking
}

// ── Field-Level Classification Map ────────────────────────────────────────

/**
 * Map of common data fields to their default classification levels.
 * Used for auto-classification of database columns / API responses.
 */
export const FIELD_CLASSIFICATION_MAP: Record<string, ClassificationLevel> = {
  // PII fields — CUI (PRVCY)
  email: 'CUI',
  phone: 'CUI',
  sin: 'CUI',
  ssn: 'CUI',
  dateOfBirth: 'CUI',
  firstName: 'RESTRICTED',
  lastName: 'RESTRICTED',
  address: 'CUI',
  bankAccount: 'CUI',
  creditCard: 'CUI',

  // Financial fields
  salary: 'RESTRICTED',
  revenue: 'RESTRICTED',
  invoiceAmount: 'INTERNAL',
  paymentMethod: 'RESTRICTED',

  // Health data
  diagnosis: 'CUI',
  prescription: 'CUI',
  healthRecord: 'CUI',

  // Business fields
  orgName: 'INTERNAL',
  caseTitle: 'INTERNAL',
  caseDescription: 'INTERNAL',
  voteChoice: 'RESTRICTED',

  // System fields
  userId: 'INTERNAL',
  orgId: 'INTERNAL',
  createdAt: 'PUBLIC',
  updatedAt: 'PUBLIC',
}

/**
 * Get the default classification for a field name.
 * Returns 'INTERNAL' if the field is not in the map.
 */
export function getFieldClassification(fieldName: string): ClassificationLevel {
  return FIELD_CLASSIFICATION_MAP[fieldName] ?? 'INTERNAL'
}

// ── Declassification ──────────────────────────────────────────────────────

/**
 * Check if a marking can be declassified (past its declassification date).
 */
export function canDeclassify(marking: DataMarking): boolean {
  if (!marking.declassifyOn) return false
  return new Date(marking.declassifyOn) <= new Date()
}

/**
 * Declassify a marking to PUBLIC. Only works if declassification date has passed.
 * Returns a new marking object; does not mutate the original.
 */
export function declassify(marking: DataMarking, declassifiedBy: string): DataMarking {
  if (!canDeclassify(marking)) {
    throw new Error(
      `[CLASSIFICATION] Cannot declassify: declassification date ` +
        `(${marking.declassifyOn ?? 'not set'}) has not been reached.`,
    )
  }

  return {
    ...marking,
    classification: 'PUBLIC',
    cuiCategory: undefined,
    handlingCaveats: [],
    disseminationControls: [],
    classifiedAt: new Date().toISOString(),
    classifiedBy: declassifiedBy,
    portionMark: '(U)',
  }
}
