import type { AnomalyRule } from './types'

const DEFAULT_RULES: AnomalyRule[] = [
  {
    name: 'grievance-volume-spike',
    anomalyType: 'grievance_spike',
    metric: 'grievance_count',
    thresholdFactor: 2.0,
    severityMap: { '2x': 'medium', '3x': 'high', '5x': 'critical' },
  },
  {
    name: 'revenue-irregularity',
    anomalyType: 'financial_irregularity',
    metric: 'daily_revenue',
    thresholdFactor: 1.5,
    severityMap: { '1.5x': 'low', '2x': 'medium', '3x': 'high' },
  },
  {
    name: 'quote-pricing-outlier',
    anomalyType: 'pricing_outlier',
    metric: 'quote_value',
    thresholdFactor: 1.3,
    severityMap: { '1.3x': 'low', '2x': 'medium', '3x': 'high' },
  },
  {
    name: 'partner-performance-drop',
    anomalyType: 'partner_performance_drop',
    metric: 'partner_kpi',
    thresholdFactor: 1.5,
    severityMap: { '1.5x': 'low', '2x': 'medium', '3x': 'high' },
  },
]

export function getDefaultRules(): AnomalyRule[] {
  return [...DEFAULT_RULES]
}

export function findRule(name: string): AnomalyRule | undefined {
  return DEFAULT_RULES.find((r) => r.name === name)
}
