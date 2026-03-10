/* ── Compliance Workflows ─────────────────────────────────
 *
 * KYC / AML / PEP orchestration for mobility cases.
 *
 * Workflow: case_created → KYC intake → AML screening →
 *           document verification → compliance approval → case activation
 */

import type {
  ComplianceEventType,
  SeverityLevel,
  CaseStatus,
} from '@nzila/mobility-core'

/* ── Workflow Steps ──────────────────────────────────────── */

export const COMPLIANCE_WORKFLOW_STEPS = [
  'kyc_intake',
  'aml_screening',
  'pep_check',
  'source_of_funds_review',
  'document_verification',
  'compliance_approval',
] as const
export type ComplianceStep = (typeof COMPLIANCE_WORKFLOW_STEPS)[number]

export interface ComplianceWorkflowState {
  caseId: string
  currentStep: ComplianceStep
  completedSteps: ComplianceStep[]
  blockers: ComplianceBlocker[]
  riskScore: number
}

export interface ComplianceBlocker {
  step: ComplianceStep
  reason: string
  severity: SeverityLevel
  createdAt: Date
}

export interface ComplianceCheckResult {
  passed: boolean
  eventType: ComplianceEventType
  severity: SeverityLevel
  details: Record<string, unknown>
}

/**
 * Determine the next compliance step for a case.
 */
export function getNextStep(
  completedSteps: readonly ComplianceStep[],
): ComplianceStep | null {
  for (const step of COMPLIANCE_WORKFLOW_STEPS) {
    if (!completedSteps.includes(step)) return step
  }
  return null
}

/**
 * Determine the case status implied by the current compliance state.
 */
export function deriveCaseStatus(state: ComplianceWorkflowState): CaseStatus {
  if (state.blockers.some((b) => b.severity === 'critical')) return 'compliance_review'
  if (state.currentStep === 'kyc_intake') return 'kyc_pending'
  if (state.currentStep === 'aml_screening') return 'aml_screening'
  if (state.currentStep === 'document_verification') return 'document_verification'
  if (state.currentStep === 'compliance_approval') return 'compliance_review'
  if (state.completedSteps.length === COMPLIANCE_WORKFLOW_STEPS.length) return 'approved'
  return 'intake'
}

/**
 * Build the initial compliance workflow state for a new case.
 */
export function initWorkflow(caseId: string): ComplianceWorkflowState {
  return {
    caseId,
    currentStep: 'kyc_intake',
    completedSteps: [],
    blockers: [],
    riskScore: 0,
  }
}

/**
 * Advance the workflow after a step passes compliance checks.
 * Returns updated state or null if workflow is complete.
 */
export function advanceWorkflow(
  state: ComplianceWorkflowState,
  stepResult: ComplianceCheckResult,
): ComplianceWorkflowState {
  const updated = { ...state }

  if (stepResult.passed) {
    updated.completedSteps = [...state.completedSteps, state.currentStep]
    const next = getNextStep(updated.completedSteps)
    if (next) {
      updated.currentStep = next
    }
  } else {
    updated.blockers = [
      ...state.blockers,
      {
        step: state.currentStep,
        reason: String(stepResult.details['reason'] ?? 'Check failed'),
        severity: stepResult.severity,
        createdAt: new Date(),
      },
    ]
    updated.riskScore = Math.min(100, state.riskScore + severityPenalty(stepResult.severity))
  }

  return updated
}

function severityPenalty(severity: SeverityLevel): number {
  switch (severity) {
    case 'critical': return 40
    case 'warning': return 15
    case 'info': return 5
  }
}
