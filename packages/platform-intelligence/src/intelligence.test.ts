import { describe, it, expect, beforeEach } from 'vitest'
import { aggregateEvent, getAggregatedEvents, clearEventStore } from '../src/aggregator'
import { generateCrossAppInsights, crossAppInsights } from '../src/insights'
import { detectOperationalSignals } from '../src/signals'

describe('platform-intelligence', () => {
  beforeEach(() => {
    clearEventStore()
  })

  describe('aggregator', () => {
    it('aggregates events with unique IDs', () => {
      const event = aggregateEvent({
        source: 'shop-quoter',
        eventType: 'quote_created',
        app: 'shop-quoter',
        orgId: 'org-1',
        payload: { quoteId: 'q1' },
      })
      expect(event.id).toBeTruthy()
      expect(event.app).toBe('shop-quoter')
    })

    it('filters events by app', () => {
      aggregateEvent({ source: 'a', eventType: 'e', app: 'cfo', orgId: 'o', payload: {} })
      aggregateEvent({ source: 'b', eventType: 'e', app: 'web', orgId: 'o', payload: {} })

      const results = getAggregatedEvents({ app: 'cfo' })
      expect(results).toHaveLength(1)
    })
  })

  describe('insights', () => {
    it('detects cross-app error correlation', () => {
      const events = [
        { id: '1', source: 'a', eventType: 'error', timestamp: new Date().toISOString(), app: 'cfo', orgId: 'o', payload: {} },
        { id: '2', source: 'b', eventType: 'error', timestamp: new Date().toISOString(), app: 'web', orgId: 'o', payload: {} },
      ]
      const insights = generateCrossAppInsights(events)
      expect(insights.some((i) => i.category === 'anomaly')).toBe(true)
    })

    it('detects staffing imbalance signal from UE grievances + CFO overtime', () => {
      const events = [
        { id: '1', source: 'ue', eventType: 'grievance_spike', timestamp: new Date().toISOString(), app: 'union-eyes', orgId: 'o', payload: {} },
        { id: '2', source: 'cfo', eventType: 'overtime_increase', timestamp: new Date().toISOString(), app: 'cfo', orgId: 'o', payload: {} },
      ]
      const insights = generateCrossAppInsights(events)
      const staffing = insights.find((i) => i.title.includes('Staffing imbalance'))
      expect(staffing).toBeDefined()
      expect(staffing!.severity).toBe('critical')
      expect(staffing!.apps).toContain('union-eyes')
      expect(staffing!.apps).toContain('cfo')
    })

    it('detects demand weakness signal from quote drop + lead decline', () => {
      const events = [
        { id: '1', source: 'sq', eventType: 'quote_volume_drop', timestamp: new Date().toISOString(), app: 'shop-quoter', orgId: 'o', payload: {} },
        { id: '2', source: 'web', eventType: 'lead_decline', timestamp: new Date().toISOString(), app: 'web', orgId: 'o', payload: {} },
      ]
      const insights = generateCrossAppInsights(events)
      const demand = insights.find((i) => i.title.includes('Demand weakness'))
      expect(demand).toBeDefined()
      expect(demand!.apps).toContain('shop-quoter')
      expect(demand!.apps).toContain('web')
    })

    it('detects partner revenue risk from partner drop + CFO variance', () => {
      const events = [
        { id: '1', source: 'p', eventType: 'performance_drop', timestamp: new Date().toISOString(), app: 'partners', orgId: 'o', payload: {} },
        { id: '2', source: 'cfo', eventType: 'revenue_variance', timestamp: new Date().toISOString(), app: 'cfo', orgId: 'o', payload: {} },
      ]
      const insights = generateCrossAppInsights(events)
      const risk = insights.find((i) => i.title.includes('Partner revenue risk'))
      expect(risk).toBeDefined()
      expect(risk!.category).toBe('cost')
    })

    it('crossAppInsights alias works', () => {
      const events = [
        { id: '1', source: 'a', eventType: 'error', timestamp: new Date().toISOString(), app: 'cfo', orgId: 'o', payload: {} },
        { id: '2', source: 'b', eventType: 'error', timestamp: new Date().toISOString(), app: 'web', orgId: 'o', payload: {} },
      ]
      const insights = crossAppInsights(events)
      expect(insights.length).toBeGreaterThan(0)
    })
  })

  describe('signals', () => {
    it('detects spike when value exceeds baseline by >50%', () => {
      const signals = detectOperationalSignals([
        { app: 'shop-quoter', metric: 'error_rate', currentValue: 200, baselineValue: 100 },
      ])
      expect(signals).toHaveLength(1)
      expect(signals[0].signalType).toBe('spike')
      expect(signals[0].deviationPercent).toBe(100)
    })

    it('detects drop when value falls below baseline by >50%', () => {
      const signals = detectOperationalSignals([
        { app: 'web', metric: 'requests', currentValue: 20, baselineValue: 100 },
      ])
      expect(signals).toHaveLength(1)
      expect(signals[0].signalType).toBe('drop')
    })

    it('ignores deviations below threshold', () => {
      const signals = detectOperationalSignals([
        { app: 'cfo', metric: 'latency', currentValue: 105, baselineValue: 100 },
      ])
      expect(signals).toHaveLength(0)
    })
  })
})
