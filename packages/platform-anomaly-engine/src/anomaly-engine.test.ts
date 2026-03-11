import { describe, it, expect } from 'vitest'
import {
  detectGrievanceSpike,
  detectFinancialIrregularity,
  detectPricingOutlier,
} from '../src/detectors'
import { getDefaultRules, findRule } from '../src/rules'
import type { MetricDataPoint } from '../src/types'

const now = new Date().toISOString()

describe('platform-anomaly-engine', () => {
  describe('detectors', () => {
    it('detects grievance spike above threshold', () => {
      const data: MetricDataPoint[] = [
        { app: 'union-eyes', metric: 'grievance_count', value: 250, baseline: 100, timestamp: now },
      ]
      const anomalies = detectGrievanceSpike(data)
      expect(anomalies).toHaveLength(1)
      expect(anomalies[0].anomalyType).toBe('grievance_spike')
      expect(anomalies[0].deviationFactor).toBe(2.5)
    })

    it('ignores grievances below threshold', () => {
      const data: MetricDataPoint[] = [
        { app: 'union-eyes', metric: 'grievance_count', value: 150, baseline: 100, timestamp: now },
      ]
      const anomalies = detectGrievanceSpike(data)
      expect(anomalies).toHaveLength(0)
    })

    it('detects financial irregularity', () => {
      const data: MetricDataPoint[] = [
        { app: 'cfo', metric: 'daily_revenue', value: 300000, baseline: 100000, timestamp: now },
      ]
      const anomalies = detectFinancialIrregularity(data)
      expect(anomalies).toHaveLength(1)
      expect(anomalies[0].severity).toBe('high')
    })

    it('detects pricing outlier', () => {
      const data: MetricDataPoint[] = [
        { app: 'shop-quoter', metric: 'quote_value', value: 26000, baseline: 10000, timestamp: now },
      ]
      const anomalies = detectPricingOutlier(data)
      expect(anomalies).toHaveLength(1)
      expect(anomalies[0].anomalyType).toBe('pricing_outlier')
    })

    it('skips zero baseline to avoid division by zero', () => {
      const data: MetricDataPoint[] = [
        { app: 'web', metric: 'requests', value: 100, baseline: 0, timestamp: now },
      ]
      const anomalies = detectGrievanceSpike(data)
      expect(anomalies).toHaveLength(0)
    })
  })

  describe('rules', () => {
    it('returns default rules', () => {
      const rules = getDefaultRules()
      expect(rules.length).toBeGreaterThanOrEqual(3)
    })

    it('finds rule by name', () => {
      const rule = findRule('grievance-volume-spike')
      expect(rule).toBeTruthy()
      expect(rule!.anomalyType).toBe('grievance_spike')
    })

    it('returns undefined for unknown rule', () => {
      expect(findRule('nonexistent')).toBeUndefined()
    })
  })
})
