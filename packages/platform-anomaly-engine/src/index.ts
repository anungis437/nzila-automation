/**
 * @nzila/platform-anomaly-engine — barrel exports
 */

export type {
  AnomalyType,
  AnomalySeverity,
  Anomaly,
  AnomalyRule,
  MetricDataPoint,
} from './types'

export { anomalySchema, anomalyRuleSchema } from './types'

export {
  detectGrievanceSpike,
  detectFinancialIrregularity,
  detectPricingOutlier,
} from './detectors'

export { getDefaultRules, findRule } from './rules'
