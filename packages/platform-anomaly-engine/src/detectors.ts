import { randomUUID } from 'node:crypto'
import type { Anomaly, AnomalySeverity, AnomalyType, MetricDataPoint } from './types'

export function detectGrievanceSpike(
  dataPoints: MetricDataPoint[],
  thresholdFactor = 2,
): Anomaly[] {
  return detectAnomaly(dataPoints, 'grievance_spike', thresholdFactor, {
    description: (dp) =>
      `Grievance volume in ${dp.app} is ${dp.value} vs baseline ${dp.baseline}`,
    suggestedAction: 'Review recent changes and customer feedback',
  })
}

export function detectFinancialIrregularity(
  dataPoints: MetricDataPoint[],
  thresholdFactor = 1.5,
): Anomaly[] {
  return detectAnomaly(dataPoints, 'financial_irregularity', thresholdFactor, {
    description: (dp) =>
      `Financial metric ${dp.metric} in ${dp.app}: ${dp.value} vs expected ${dp.baseline}`,
    suggestedAction: 'Flag for financial review and audit trail check',
  })
}

export function detectPricingOutlier(
  dataPoints: MetricDataPoint[],
  thresholdFactor = 1.3,
): Anomaly[] {
  return detectAnomaly(dataPoints, 'pricing_outlier', thresholdFactor, {
    description: (dp) =>
      `Pricing anomaly in ${dp.app}: ${dp.metric} is ${dp.value} vs baseline ${dp.baseline}`,
    suggestedAction: 'Review pricing rules and policy engine configuration',
  })
}

function detectAnomaly(
  dataPoints: MetricDataPoint[],
  anomalyType: AnomalyType,
  thresholdFactor: number,
  templates: {
    description: (dp: MetricDataPoint) => string
    suggestedAction: string
  },
): Anomaly[] {
  const anomalies: Anomaly[] = []

  for (const dp of dataPoints) {
    if (dp.baseline === 0) continue

    const deviationFactor = dp.value / dp.baseline
    if (deviationFactor < thresholdFactor) continue

    const severity = classifySeverity(deviationFactor, thresholdFactor)

    anomalies.push({
      id: randomUUID(),
      timestamp: dp.timestamp,
      anomalyType,
      severity,
      app: dp.app,
      metric: dp.metric,
      expectedValue: dp.baseline,
      actualValue: dp.value,
      deviationFactor: Math.round(deviationFactor * 100) / 100,
      description: templates.description(dp),
      suggestedAction: templates.suggestedAction,
    })
  }

  return anomalies
}

function classifySeverity(
  deviationFactor: number,
  thresholdFactor: number,
): AnomalySeverity {
  const ratio = deviationFactor / thresholdFactor
  if (ratio >= 3) return 'critical'
  if (ratio >= 2) return 'high'
  if (ratio >= 1.5) return 'medium'
  return 'low'
}
