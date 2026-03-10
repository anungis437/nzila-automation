/* ── Risk Scoring ──────────────────────────────────────────
 *
 * Composite risk score for mobility clients and cases.
 * Integrates KYC, AML, PEP, and source-of-funds signals.
 */

import type { RiskProfile, SeverityLevel } from '@nzila/mobility-core'

export interface RiskSignal {
  source: 'kyc' | 'aml' | 'pep' | 'source_of_funds' | 'manual'
  severity: SeverityLevel
  description: string
  timestamp: Date
}

export interface RiskAssessment {
  overallScore: number
  profile: RiskProfile
  signals: RiskSignal[]
  requiresEscalation: boolean
}

/**
 * Compute a composite risk score from individual signals.
 * Score ranges from 0 (no risk) to 100 (critical).
 */
export function computeRiskScore(signals: RiskSignal[]): RiskAssessment {
  let score = 0

  for (const signal of signals) {
    switch (signal.severity) {
      case 'critical':
        score += 35
        break
      case 'warning':
        score += 15
        break
      case 'info':
        score += 3
        break
    }
  }

  score = Math.min(100, score)

  const profile = scoreToProfile(score)
  const requiresEscalation = profile === 'critical' || profile === 'high'

  return { overallScore: score, profile, signals, requiresEscalation }
}

function scoreToProfile(score: number): RiskProfile {
  if (score >= 70) return 'critical'
  if (score >= 40) return 'high'
  if (score >= 15) return 'medium'
  return 'low'
}

/**
 * Determine whether a two-step approval is required for the given risk level.
 */
export function requiresTwoStepApproval(profile: RiskProfile): boolean {
  return profile === 'high' || profile === 'critical'
}
