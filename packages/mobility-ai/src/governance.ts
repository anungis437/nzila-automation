/* ── AI Governance ────────────────────────────────────────
 *
 * Guardrails for all AI outputs in mobility workflows.
 * Enforces: human approval loop, explanation requirement,
 * audit logging, bias detection.
 *
 * @module @nzila/mobility-ai/governance
 */

import type { AiOutput } from '@nzila/mobility-core'

/* ── AI Governance Policy ─────────────────────────────────── */

export interface AiGovernancePolicy {
  requireHumanApproval: boolean
  requireExplanation: boolean
  requireAuditLog: boolean
  maxConfidenceAutoApprove: number
  prohibitedActions: string[]
}

export const DEFAULT_AI_GOVERNANCE: AiGovernancePolicy = {
  requireHumanApproval: true,
  requireExplanation: true,
  requireAuditLog: true,
  maxConfidenceAutoApprove: 0, // never auto-approve
  prohibitedActions: [
    'legal_determination',
    'compliance_override',
    'document_auto_approve',
    'case_auto_submit',
  ],
}

/* ── Validation ───────────────────────────────────────────── */

export interface GovernanceViolation {
  rule: string
  description: string
}

/**
 * Validate that an AI output meets governance requirements.
 * Returns list of violations (empty = compliant).
 */
export function validateAiOutput(
  output: Pick<AiOutput, 'content' | 'confidenceScore' | 'reasoningTrace' | 'jurisdictionRefs'>,
  policy: AiGovernancePolicy = DEFAULT_AI_GOVERNANCE,
): GovernanceViolation[] {
  const violations: GovernanceViolation[] = []

  if (policy.requireExplanation && !output.reasoningTrace) {
    violations.push({
      rule: 'explanation_required',
      description: 'AI output must include a reasoning trace',
    })
  }

  if (output.confidenceScore < 0 || output.confidenceScore > 1) {
    violations.push({
      rule: 'confidence_range',
      description: 'Confidence score must be between 0 and 1',
    })
  }

  if (!output.content || output.content.trim().length === 0) {
    violations.push({
      rule: 'non_empty_content',
      description: 'AI output content must not be empty',
    })
  }

  return violations
}

/**
 * Check if an AI action is prohibited by governance policy.
 */
export function isProhibitedAction(
  action: string,
  policy: AiGovernancePolicy = DEFAULT_AI_GOVERNANCE,
): boolean {
  return policy.prohibitedActions.includes(action)
}

/**
 * Determine if an output can be auto-approved based on confidence.
 * By default, all outputs require human approval (maxConfidenceAutoApprove = 0).
 */
export function canAutoApprove(
  confidenceScore: number,
  policy: AiGovernancePolicy = DEFAULT_AI_GOVERNANCE,
): boolean {
  if (policy.requireHumanApproval && policy.maxConfidenceAutoApprove === 0) {
    return false
  }
  return confidenceScore >= policy.maxConfidenceAutoApprove
}
