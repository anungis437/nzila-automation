/**
 * @nzila/platform-decision-engine — Evidence enrichment
 *
 * Builds typed evidence references from platform signals.
 *
 * @module @nzila/platform-decision-engine/evidence
 */
import type { Anomaly } from '@nzila/platform-anomaly-engine/types'
import type { CrossAppInsight, OperationalSignal } from '@nzila/platform-intelligence/types'
import type { ChangeRecord } from '@nzila/platform-change-management/types'
import type { EvidenceRef } from './types'

/**
 * Build evidence refs from anomalies.
 */
export function evidenceFromAnomalies(anomalies: readonly Anomaly[]): EvidenceRef[] {
  return anomalies.map((a) => ({
    type: 'anomaly' as const,
    ref_id: a.id,
    summary: `${a.anomalyType}: ${a.description}`,
  }))
}

/**
 * Build evidence refs from cross-app insights.
 */
export function evidenceFromInsights(insights: readonly CrossAppInsight[]): EvidenceRef[] {
  return insights.map((i) => ({
    type: 'insight' as const,
    ref_id: i.id,
    summary: `${i.category}: ${i.title}`,
  }))
}

/**
 * Build evidence refs from operational signals.
 */
export function evidenceFromSignals(signals: readonly OperationalSignal[]): EvidenceRef[] {
  return signals.map((s) => ({
    type: 'metric' as const,
    ref_id: s.id,
    summary: `${s.signalType} on ${s.metric} in ${s.app} (${s.deviationPercent.toFixed(0)}% deviation)`,
  }))
}

/**
 * Build evidence refs from change records.
 */
export function evidenceFromChanges(changes: readonly ChangeRecord[]): EvidenceRef[] {
  return changes.map((c) => ({
    type: 'change' as const,
    ref_id: c.change_id,
    summary: `${c.change_type}: ${c.title}`,
  }))
}

/**
 * Aggregate all evidence from a full signal set.
 */
export function buildEvidenceRefs(input: {
  anomalies?: readonly Anomaly[]
  insights?: readonly CrossAppInsight[]
  signals?: readonly OperationalSignal[]
  changes?: readonly ChangeRecord[]
}): EvidenceRef[] {
  return [
    ...evidenceFromAnomalies(input.anomalies ?? []),
    ...evidenceFromInsights(input.insights ?? []),
    ...evidenceFromSignals(input.signals ?? []),
    ...evidenceFromChanges(input.changes ?? []),
  ]
}
