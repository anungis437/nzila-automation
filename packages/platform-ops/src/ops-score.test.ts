/**
 * Nzila OS — Ops Confidence Score Unit Tests
 *
 * Tests for score computation, normalisation, grading, and delta tracking.
 * No DB dependency — pure logic tests.
 */
import { describe, it, expect } from 'vitest'
import {
  computeOpsScore,
  computeOpsScoreDelta,
  type OpsScoreInput,
  type OpsScoreHistoryEntry,
} from '../src/ops-score'

describe('computeOpsScore', () => {
  it('returns perfect score for ideal inputs', () => {
    const input: OpsScoreInput = {
      sloCompliancePct: 100,
      errorDeltaPct: 0,
      integrationSlaPct: 100,
      dlqBacklogRatio: 0,
      regressionSeverity: 0,
    }
    const result = computeOpsScore(input)
    expect(result.score).toBe(100)
    expect(result.grade).toBe('A')
    expect(result.components).toHaveLength(5)
  })

  it('returns zero score for worst-case inputs', () => {
    const input: OpsScoreInput = {
      sloCompliancePct: 0,
      errorDeltaPct: 10,
      integrationSlaPct: 90,
      dlqBacklogRatio: 2,
      regressionSeverity: 3,
    }
    const result = computeOpsScore(input)
    expect(result.score).toBe(0)
    expect(result.grade).toBe('F')
  })

  it('returns grade B for moderately good inputs', () => {
    const input: OpsScoreInput = {
      sloCompliancePct: 80,
      errorDeltaPct: 2,
      integrationSlaPct: 98,
      dlqBacklogRatio: 0.5,
      regressionSeverity: 1,
    }
    const result = computeOpsScore(input)
    expect(result.score).toBeGreaterThanOrEqual(60)
    expect(result.score).toBeLessThan(90)
    expect(['B', 'C']).toContain(result.grade)
  })

  it('handles negative error delta (improvement) as maximum score', () => {
    const input: OpsScoreInput = {
      sloCompliancePct: 100,
      errorDeltaPct: -5,
      integrationSlaPct: 100,
      dlqBacklogRatio: 0,
      regressionSeverity: 0,
    }
    const result = computeOpsScore(input)
    expect(result.score).toBe(100)
  })

  it('component weights sum to 1.0', () => {
    const input: OpsScoreInput = {
      sloCompliancePct: 100,
      errorDeltaPct: 0,
      integrationSlaPct: 100,
      dlqBacklogRatio: 0,
      regressionSeverity: 0,
    }
    const result = computeOpsScore(input)
    const totalWeight = result.components.reduce((sum, c) => sum + c.weight, 0)
    expect(totalWeight).toBeCloseTo(1.0, 5)
  })

  it('includes status string', () => {
    const input: OpsScoreInput = {
      sloCompliancePct: 50,
      errorDeltaPct: 5,
      integrationSlaPct: 95,
      dlqBacklogRatio: 1,
      regressionSeverity: 2,
    }
    const result = computeOpsScore(input)
    expect(result.status).toBeTruthy()
    expect(result.computedAt).toBeTruthy()
  })

  it('clamps out-of-range values', () => {
    const input: OpsScoreInput = {
      sloCompliancePct: 150,  // over 100
      errorDeltaPct: -20,     // very negative (good)
      integrationSlaPct: 110,
      dlqBacklogRatio: -1,    // negative (good)
      regressionSeverity: 5,  // over max
    }
    const result = computeOpsScore(input)
    expect(result.score).toBeGreaterThanOrEqual(0)
    expect(result.score).toBeLessThanOrEqual(100)
  })
})

describe('computeOpsScoreDelta', () => {
  it('computes positive delta (improvement)', () => {
    const history: OpsScoreHistoryEntry[] = [
      { date: '2026-02-24', score: 72, grade: 'C' },
    ]
    const delta = computeOpsScoreDelta(85, history)
    expect(delta.current).toBe(85)
    expect(delta.previous).toBe(72)
    expect(delta.delta).toBe(13)
    expect(delta.direction).toBe('up')
  })

  it('computes negative delta (regression)', () => {
    const history: OpsScoreHistoryEntry[] = [
      { date: '2026-02-24', score: 90, grade: 'A' },
    ]
    const delta = computeOpsScoreDelta(75, history)
    expect(delta.delta).toBe(-15)
    expect(delta.direction).toBe('down')
  })

  it('computes flat delta (stable)', () => {
    const history: OpsScoreHistoryEntry[] = [
      { date: '2026-02-24', score: 80, grade: 'B' },
    ]
    const delta = computeOpsScoreDelta(80, history)
    expect(delta.direction).toBe('flat')
  })

  it('handles empty history', () => {
    const delta = computeOpsScoreDelta(85, [])
    expect(delta.previous).toBe(85)
    expect(delta.direction).toBe('flat')
  })

  it('uses oldest entry from sorted history', () => {
    const history: OpsScoreHistoryEntry[] = [
      { date: '2026-02-28', score: 80, grade: 'B' },
      { date: '2026-02-24', score: 70, grade: 'C' },
      { date: '2026-02-26', score: 75, grade: 'B' },
    ]
    const delta = computeOpsScoreDelta(85, history)
    expect(delta.previous).toBe(70)
  })
})
