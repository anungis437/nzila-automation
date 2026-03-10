/* ── Mobility OS – Domain Enums ──────────────────────────── */

export const CASE_STATUSES = [
  'draft',
  'intake',
  'kyc_pending',
  'aml_screening',
  'document_verification',
  'compliance_review',
  'approved',
  'submitted',
  'processing',
  'granted',
  'rejected',
  'withdrawn',
  'archived',
] as const
export type CaseStatus = (typeof CASE_STATUSES)[number]

export const CASE_STAGES = [
  'pre_engagement',
  'onboarding',
  'due_diligence',
  'application_prep',
  'government_submission',
  'adjudication',
  'post_approval',
  'maintenance',
] as const
export type CaseStage = (typeof CASE_STAGES)[number]

export const PROGRAM_TYPES = [
  'citizenship_by_investment',
  'residency_by_investment',
  'golden_visa',
  'startup_visa',
  'retirement_visa',
  'digital_nomad',
] as const
export type ProgramType = (typeof PROGRAM_TYPES)[number]

export const INVESTMENT_TYPES = [
  'real_estate',
  'government_bonds',
  'national_fund',
  'business_investment',
  'bank_deposit',
  'donation',
] as const
export type InvestmentType = (typeof INVESTMENT_TYPES)[number]

export const WEALTH_TIERS = ['standard', 'hnw', 'uhnw'] as const
export type WealthTier = (typeof WEALTH_TIERS)[number]

export const RISK_PROFILES = ['low', 'medium', 'high', 'critical'] as const
export type RiskProfile = (typeof RISK_PROFILES)[number]

export const ADVISOR_ROLES = ['lead_advisor', 'associate', 'compliance_officer', 'admin'] as const
export type AdvisorRole = (typeof ADVISOR_ROLES)[number]

export const TASK_TYPES = [
  'document_collection',
  'kyc_review',
  'aml_check',
  'client_meeting',
  'government_filing',
  'payment_verification',
  'follow_up',
] as const
export type TaskType = (typeof TASK_TYPES)[number]

export const TASK_STATUSES = ['pending', 'in_progress', 'completed', 'blocked', 'cancelled'] as const
export type TaskStatus = (typeof TASK_STATUSES)[number]

export const DOCUMENT_TYPES = [
  'passport',
  'birth_certificate',
  'marriage_certificate',
  'bank_statement',
  'tax_return',
  'police_clearance',
  'medical_report',
  'proof_of_address',
  'source_of_funds',
  'investment_agreement',
  'power_of_attorney',
  'other',
] as const
export type DocumentType = (typeof DOCUMENT_TYPES)[number]

export const VERIFICATION_STATUSES = [
  'pending',
  'verified',
  'rejected',
  'expired',
] as const
export type VerificationStatus = (typeof VERIFICATION_STATUSES)[number]

export const COMPLIANCE_EVENT_TYPES = [
  'kyc_initiated',
  'kyc_completed',
  'aml_clear',
  'aml_flag',
  'pep_flag',
  'source_of_funds_verified',
  'document_verified',
  'compliance_approved',
  'compliance_rejected',
  'risk_escalation',
] as const
export type ComplianceEventType = (typeof COMPLIANCE_EVENT_TYPES)[number]

export const SEVERITY_LEVELS = ['info', 'warning', 'critical'] as const
export type SeverityLevel = (typeof SEVERITY_LEVELS)[number]

export const FAMILY_RELATIONS = [
  'spouse',
  'child',
  'parent',
  'sibling',
  'dependent',
] as const
export type FamilyRelation = (typeof FAMILY_RELATIONS)[number]

export const LICENSE_TYPES = [
  'regulated_agent',
  'authorized_representative',
  'law_firm',
  'consultancy',
] as const
export type LicenseType = (typeof LICENSE_TYPES)[number]

export const COMMUNICATION_CHANNELS = [
  'email',
  'whatsapp',
  'teams',
  'sms',
  'in_app',
] as const
export type CommunicationChannel = (typeof COMMUNICATION_CHANNELS)[number]

export const MESSAGE_TYPES = [
  'case_status',
  'document_request',
  'appointment_scheduling',
  'renewal_reminder',
  'general',
] as const
export type MessageType = (typeof MESSAGE_TYPES)[number]
