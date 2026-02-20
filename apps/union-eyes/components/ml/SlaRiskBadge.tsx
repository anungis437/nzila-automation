/**
 * apps/union-eyes/components/ml/SlaRiskBadge.tsx
 *
 * Displays a colour-coded ML SLA breach risk badge.
 * Maps probability to a human-readable risk tier:
 *   < 0.30 → Low risk
 *   0.30 – 0.60 → Medium risk
 *   > 0.60 → High risk
 *
 * CONSTRAINT: No direct DB imports.
 */
import type { UESlaRiskScoreResponse } from '@nzila/ml-sdk'

type RiskTier = 'high' | 'medium' | 'low'

function getRiskTier(probability: number): RiskTier {
  if (probability > 0.6) return 'high'
  if (probability >= 0.3) return 'medium'
  return 'low'
}

const TIER_STYLES: Record<RiskTier, string> = {
  high: 'bg-red-50 text-red-700 ring-1 ring-red-200',
  medium: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200',
  low: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200',
}

const TIER_LABELS: Record<RiskTier, string> = {
  high: 'High SLA risk',
  medium: 'Med SLA risk',
  low: 'Low SLA risk',
}

interface SlaRiskBadgeProps {
  score: UESlaRiskScoreResponse | null | undefined
  isLoading?: boolean
  /** Show the numeric probability alongside the tier label */
  showProbability?: boolean
  className?: string
}

export function SlaRiskBadge({
  score,
  isLoading = false,
  showProbability = false,
  className = '',
}: SlaRiskBadgeProps) {
  if (isLoading) {
    return (
      <span
        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-400 animate-pulse ${className}`}
      >
        ML…
      </span>
    )
  }

  if (!score) {
    return (
      <span
        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-50 text-gray-400 ring-1 ring-gray-200 ${className}`}
        title="No SLA risk signal available for this case"
      >
        — SLA risk
      </span>
    )
  }

  const prob = parseFloat(score.probability)
  const tier = getRiskTier(prob)
  const probPct = Math.round(prob * 100)
  const label = TIER_LABELS[tier]
  const styles = TIER_STYLES[tier]

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${styles} ${className}`}
      title={`SLA breach probability: ${probPct}% (model: ${score.modelKey})`}
    >
      <span className="sr-only">ML SLA risk:</span>
      {label}
      {showProbability && (
        <span className="opacity-60 font-normal">{probPct}%</span>
      )}
    </span>
  )
}
