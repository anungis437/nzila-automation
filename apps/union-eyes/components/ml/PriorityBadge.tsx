/**
 * apps/union-eyes/components/ml/PriorityBadge.tsx
 *
 * Displays a colour-coded ML-predicted priority badge.
 * Accepts a nullable score — renders a fallback pill when no signal exists.
 *
 * CONSTRAINT: No direct DB imports. Receives data from useCasePrioritySignal
 * or the case list signal map.
 */
import type { UEPriorityScoreResponse } from '@nzila/ml-sdk'

const PRIORITY_STYLES: Record<string, string> = {
  critical: 'bg-red-100 text-red-800 ring-1 ring-red-300',
  high: 'bg-orange-100 text-orange-800 ring-1 ring-orange-300',
  medium: 'bg-yellow-100 text-yellow-800 ring-1 ring-yellow-300',
  low: 'bg-green-100 text-green-800 ring-1 ring-green-300',
}

const PRIORITY_LABELS: Record<string, string> = {
  critical: 'Critical',
  high: 'High',
  medium: 'Medium',
  low: 'Low',
}

interface PriorityBadgeProps {
  score: UEPriorityScoreResponse | null | undefined
  isLoading?: boolean
  /** Show confidence percentage alongside the label */
  showConfidence?: boolean
  className?: string
}

export function PriorityBadge({
  score,
  isLoading = false,
  showConfidence = false,
  className = '',
}: PriorityBadgeProps) {
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
        title="No ML signal available for this case"
      >
        — priority
      </span>
    )
  }

  const priority = score.predictedPriority.toLowerCase()
  const styles = PRIORITY_STYLES[priority] ?? 'bg-gray-100 text-gray-700 ring-1 ring-gray-300'
  const label = PRIORITY_LABELS[priority] ?? priority

  const confidence = Math.round(parseFloat(score.score) * 100)

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${styles} ${className}`}
      title={`ML predicted priority: ${label} (${confidence}% confidence, model: ${score.modelKey})`}
    >
      <span className="sr-only">ML priority:</span>
      {label}
      {showConfidence && (
        <span className="opacity-60 font-normal">{confidence}%</span>
      )}
    </span>
  )
}
