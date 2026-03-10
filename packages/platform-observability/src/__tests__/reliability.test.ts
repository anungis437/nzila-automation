import { describe, it, expect } from 'vitest'
import {
  PLATFORM_SLOS,
  computeErrorBudget,
  meetsSlo,
  type SloTarget,
} from '../reliability'

describe('reliability', () => {
  describe('PLATFORM_SLOS', () => {
    it('defines SLOs for all service categories', () => {
      const categories = new Set(PLATFORM_SLOS.map((s) => s.category))
      expect(categories).toContain('api')
      expect(categories).toContain('integration')
      expect(categories).toContain('workflow')
      expect(categories).toContain('ai')
      expect(categories).toContain('data-fabric')
    })

    it('has valid SLO targets', () => {
      for (const slo of PLATFORM_SLOS) {
        expect(slo.target).toBeGreaterThan(0)
        expect(slo.windowHours).toBeGreaterThan(0)
        expect(slo.description).toBeTruthy()
      }
    })
  })

  describe('meetsSlo', () => {
    it('checks gte comparison', () => {
      const slo: SloTarget = {
        service: 'api', category: 'api', sli: 'availability',
        comparison: 'gte', target: 99.5, windowHours: 720,
        alertThresholdPct: 0.5, description: 'test',
      }
      expect(meetsSlo(slo, 99.6)).toBe(true)
      expect(meetsSlo(slo, 99.5)).toBe(true)
      expect(meetsSlo(slo, 99.4)).toBe(false)
    })

    it('checks lte comparison', () => {
      const slo: SloTarget = {
        service: 'api', category: 'api', sli: 'latency_p95',
        comparison: 'lte', target: 400, windowHours: 168,
        alertThresholdPct: 10, description: 'test',
      }
      expect(meetsSlo(slo, 300)).toBe(true)
      expect(meetsSlo(slo, 400)).toBe(true)
      expect(meetsSlo(slo, 401)).toBe(false)
    })

    it('checks lt comparison', () => {
      const slo: SloTarget = {
        service: 'api', category: 'api', sli: 'error_rate',
        comparison: 'lt', target: 1, windowHours: 168,
        alertThresholdPct: 50, description: 'test',
      }
      expect(meetsSlo(slo, 0.5)).toBe(true)
      expect(meetsSlo(slo, 1)).toBe(false)
    })
  })

  describe('computeErrorBudget', () => {
    it('computes budget for availability SLO', () => {
      const slo: SloTarget = {
        service: 'api', category: 'api', sli: 'availability',
        comparison: 'gte', target: 99.5, windowHours: 720,
        alertThresholdPct: 0.5, description: 'test',
      }

      // Exactly at target — 0% consumed
      const atTarget = computeErrorBudget(slo, 99.5)
      expect(atTarget.budgetConsumedPct).toBe(0)
      expect(atTarget.exhausted).toBe(false)

      // Below target — some budget consumed
      const below = computeErrorBudget(slo, 99.0)
      expect(below.budgetConsumedPct).toBeGreaterThan(0)
      expect(below.current).toBe(99.0)
    })

    it('marks budget as exhausted when availability drops significantly', () => {
      const slo: SloTarget = {
        service: 'api', category: 'api', sli: 'availability',
        comparison: 'gte', target: 99.5, windowHours: 720,
        alertThresholdPct: 0.5, description: 'test',
      }

      const result = computeErrorBudget(slo, 98.0)
      expect(result.budgetConsumedPct).toBeGreaterThan(100)
      expect(result.exhausted).toBe(true)
    })

    it('computes budget for latency SLO', () => {
      const slo: SloTarget = {
        service: 'api', category: 'api', sli: 'latency_p95',
        comparison: 'lte', target: 400, windowHours: 168,
        alertThresholdPct: 10, description: 'test',
      }

      const underBudget = computeErrorBudget(slo, 200)
      expect(underBudget.budgetConsumedPct).toBe(50)
      expect(underBudget.exhausted).toBe(false)

      const overBudget = computeErrorBudget(slo, 500)
      expect(overBudget.budgetConsumedPct).toBe(125)
      expect(overBudget.exhausted).toBe(true)
    })
  })
})
