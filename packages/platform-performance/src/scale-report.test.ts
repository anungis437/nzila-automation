import { describe, it, expect } from 'vitest'
import { generateScaleReport, type ScaleReport } from './scale-report'
import { runScaleEnvelope, DEFAULT_SCALE_PROFILES } from './scale-harness'

// ── Type contract tests ────────────────────────────────────────────────────

describe('Scale Report — type contracts', () => {
  it('exports generateScaleReport', () => {
    expect(typeof generateScaleReport).toBe('function')
  })
})

// ── Report generation ──────────────────────────────────────────────────────

describe('generateScaleReport — deterministic', () => {
  const envelopeResult = runScaleEnvelope()
  let report: ScaleReport

  it('produces a well-formed report', () => {
    report = generateScaleReport(envelopeResult)
    expect(report).toHaveProperty('version', '1.0.0')
    expect(report).toHaveProperty('title')
    expect(report).toHaveProperty('generatedAt')
    expect(report).toHaveProperty('summary')
    expect(report).toHaveProperty('phases')
    expect(report).toHaveProperty('markdown')
  })

  it('summary contains correct verdict', () => {
    report = generateScaleReport(envelopeResult)
    expect(['PASS', 'FAIL']).toContain(report.summary.verdict)
    expect(report.summary.verdict).toBe(envelopeResult.passed ? 'PASS' : 'FAIL')
  })

  it('summary peakP95Ms matches envelope peakP95', () => {
    report = generateScaleReport(envelopeResult)
    expect(report.summary.peakP95Ms).toBe(envelopeResult.peakP95)
  })

  it('summary degradationRatio matches envelope', () => {
    report = generateScaleReport(envelopeResult)
    expect(report.summary.degradationRatio).toBe(envelopeResult.degradationRatio)
  })

  it('phase count matches source', () => {
    report = generateScaleReport(envelopeResult)
    expect(report.phases).toHaveLength(envelopeResult.phases.length)
  })

  it('phase names match profile names', () => {
    report = generateScaleReport(envelopeResult)
    const names = report.phases.map((p) => p.name)
    expect(names).toEqual(DEFAULT_SCALE_PROFILES.map((p) => p.name))
  })

  it('total requests match across phases', () => {
    report = generateScaleReport(envelopeResult)
    const totalFromPhases = report.phases.reduce((s, p) => s + p.totalRequests, 0)
    expect(report.summary.totalRequestsGenerated).toBe(totalFromPhases)
  })

  it('markdown contains key sections', () => {
    report = generateScaleReport(envelopeResult)
    expect(report.markdown).toContain('# Nzila OS — Scale Envelope Report')
    expect(report.markdown).toContain('## Executive Summary')
    expect(report.markdown).toContain('## Phase Breakdown')
    expect(report.markdown).toContain('## Interpretation')
  })

  it('markdown includes all phase names', () => {
    report = generateScaleReport(envelopeResult)
    for (const profile of DEFAULT_SCALE_PROFILES) {
      expect(report.markdown).toContain(profile.name)
    }
  })

  it('markdown includes verdict indicator', () => {
    report = generateScaleReport(envelopeResult)
    expect(
      report.markdown.includes('✅ PASS') || report.markdown.includes('❌ FAIL'),
    ).toBe(true)
  })

  it('generatedAt is valid ISO timestamp', () => {
    report = generateScaleReport(envelopeResult)
    expect(() => new Date(report.generatedAt)).not.toThrow()
  })
})

// ── Edge cases ─────────────────────────────────────────────────────────────

describe('generateScaleReport — edge cases', () => {
  it('handles single-phase envelope', () => {
    const result = runScaleEnvelope({
      profiles: [DEFAULT_SCALE_PROFILES[0]],
      p95BudgetMs: 10_000,
    })
    const report = generateScaleReport(result)
    expect(report.phases).toHaveLength(1)
    expect(report.summary.phasesTotalCount).toBe(1)
  })

  it('handles envelope with tight budget (all fail)', () => {
    const result = runScaleEnvelope({ p95BudgetMs: 1 })
    const report = generateScaleReport(result)
    expect(report.summary.verdict).toBe('FAIL')
    expect(report.summary.phasesPassedCount).toBe(0)
  })
})
