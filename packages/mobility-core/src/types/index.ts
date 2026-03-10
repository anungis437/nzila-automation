/* ── Mobility OS – Domain Types ──────────────────────────── */

import type {
  CaseStatus,
  CaseStage,
  ProgramType,
  InvestmentType,
  WealthTier,
  RiskProfile,
  AdvisorRole,
  TaskType,
  TaskStatus,
  DocumentType,
  VerificationStatus,
  ComplianceEventType,
  SeverityLevel,
  FamilyRelation,
  LicenseType,
} from '../enums'

/* ── Context ──────────────────────────────────────────────── */

export interface MobilityContext {
  readonly orgId: string
  readonly actorId: string
  readonly role: AdvisorRole | 'client' | 'system'
  readonly requestId: string
}

/* ── Firm ──────────────────────────────────────────────────── */

export interface Firm {
  id: string
  orgId: string
  name: string
  jurisdiction: string
  licenseType: LicenseType
  createdAt: Date
}

/* ── Advisor ──────────────────────────────────────────────── */

export interface Advisor {
  id: string
  orgId: string
  firmId: string
  userId: string
  role: AdvisorRole
  createdAt: Date
}

/* ── Client ───────────────────────────────────────────────── */

export interface Client {
  id: string
  orgId: string
  firmId: string
  hubspotContactId: string | null
  primaryNationality: string
  residenceCountry: string
  wealthTier: WealthTier
  riskProfile: RiskProfile
  createdAt: Date
}

/* ── Family Member ────────────────────────────────────────── */

export interface FamilyMember {
  id: string
  orgId: string
  clientId: string
  relation: FamilyRelation
  nationality: string
  dob: Date | null
  passportExpiry: Date | null
}

/* ── Program ──────────────────────────────────────────────── */

export interface Program {
  id: string
  country: string
  programName: string
  programType: ProgramType
  investmentType: InvestmentType
  minimumInvestment: string
  physicalPresenceRequired: boolean
  timeToCitizenship: string | null
}

/* ── Case ─────────────────────────────────────────────────── */

export interface Case {
  id: string
  orgId: string
  clientId: string
  advisorId: string
  programId: string
  hubspotDealId: string | null
  status: CaseStatus
  stage: CaseStage
  createdAt: Date
}

/* ── Case Task ────────────────────────────────────────────── */

export interface CaseTask {
  id: string
  orgId: string
  caseId: string
  taskType: TaskType
  assignedTo: string
  dueDate: Date | null
  status: TaskStatus
}

/* ── Document ─────────────────────────────────────────────── */

export interface Document {
  id: string
  orgId: string
  caseId: string
  fileUrl: string
  sharepointUrl: string | null
  documentType: DocumentType
  verificationStatus: VerificationStatus
}

/* ── Compliance Event ─────────────────────────────────────── */

export interface ComplianceEvent {
  id: string
  orgId: string
  caseId: string
  eventType: ComplianceEventType
  severity: SeverityLevel
  metadata: Record<string, unknown>
  createdAt: Date
}

/* ── Communication ────────────────────────────────────────── */

export interface Communication {
  id: string
  orgId: string
  caseId: string | null
  clientId: string
  channel: string
  direction: 'inbound' | 'outbound'
  messageType: string
  subject: string | null
  body: string
  externalId: string | null
  createdAt: Date
}

/* ── AI Output ────────────────────────────────────────────── */

export interface AiOutput {
  id: string
  orgId: string
  caseId: string | null
  clientId: string | null
  outputType: string
  content: string
  confidenceScore: number
  reasoningTrace: string
  jurisdictionRefs: string[]
  approved: boolean
  approvedBy: string | null
  createdAt: Date
}

/* ── Eligibility Result ───────────────────────────────────── */

export interface EligibilityResult {
  programId: string
  eligible: boolean
  score: number
  reasons: string[]
  blockers: string[]
}
