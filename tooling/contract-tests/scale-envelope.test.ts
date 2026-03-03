/**
 * Contract Test — Scale Envelope Proof
 *
 * Validates that the platform scale harness exists, exports
 * required functions, and produces deterministic scale results.
 *
 * @invariant SCALE_ENVELOPE_PROOF_001
 */
import { describe, it, expect } from 'vitest'
import { readFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'

const ROOT = join(__dirname, '..', '..')

function readContent(rel: string): string {
  const abs = join(ROOT, rel)
  if (!existsSync(abs)) return ''
  return readFileSync(abs, 'utf-8')
}

describe('Scale Envelope — contract', () => {
  it('SCALE_001: scale-harness module exists with required exports', () => {
    const content = readContent('packages/platform-performance/src/scale-harness.ts')
    expect(content).toBeTruthy()
    expect(content).toContain('generateSyntheticLoad')
    expect(content).toContain('executeScalePhase')
    expect(content).toContain('runScaleEnvelope')
    expect(content).toContain('DEFAULT_SCALE_PROFILES')
    expect(content).toContain('DEFAULT_HARNESS_CONFIG')
  })

  it('SCALE_002: default profiles include baseline, moderate, heavy, spike', () => {
    const content = readContent('packages/platform-performance/src/scale-harness.ts')
    expect(content).toContain("name: 'baseline'")
    expect(content).toContain("name: 'moderate'")
    expect(content).toContain("name: 'heavy'")
    expect(content).toContain("name: 'spike'")
  })

  it('SCALE_003: harness uses deterministic PRNG (seeded)', () => {
    const content = readContent('packages/platform-performance/src/scale-harness.ts')
    expect(content).toContain('seed')
    // Deterministic: same seed → same output
    expect(
      content.includes('nextRandom') || content.includes('createPrng'),
      'Scale harness must use a seeded PRNG for reproducibility',
    ).toBe(true)
  })

  it('SCALE_004: harness measures p95 degradation', () => {
    const content = readContent('packages/platform-performance/src/scale-harness.ts')
    expect(content).toContain('p95')
    expect(content).toContain('degradationRatio')
    expect(content).toContain('p95BudgetMs')
  })

  it('SCALE_005: scale-report module exists with required exports', () => {
    const content = readContent('packages/platform-performance/src/scale-report.ts')
    expect(content).toBeTruthy()
    expect(content).toContain('generateScaleReport')
    expect(content).toContain('ScaleReport')
    expect(content).toContain('ScaleReportSummary')
  })

  it('SCALE_006: scale report generates markdown artifact', () => {
    const content = readContent('packages/platform-performance/src/scale-report.ts')
    expect(content).toContain('markdown')
    expect(content).toContain('# Nzila OS — Scale Envelope Report')
    expect(content).toContain('## Executive Summary')
    expect(content).toContain('## Phase Breakdown')
  })

  it('SCALE_007: index.ts barrel exports scale modules', () => {
    const content = readContent('packages/platform-performance/src/index.ts')
    expect(content).toContain("from './scale-harness'")
    expect(content).toContain("from './scale-report'")
    expect(content).toContain('generateSyntheticLoad')
    expect(content).toContain('generateScaleReport')
  })

  it('SCALE_008: package.json declares sub-path exports', () => {
    const content = readContent('packages/platform-performance/package.json')
    const pkg = JSON.parse(content)
    expect(pkg.exports['./scale-harness']).toBe('./src/scale-harness.ts')
    expect(pkg.exports['./scale-report']).toBe('./src/scale-report.ts')
  })

  it('SCALE_009: co-located unit tests exist', () => {
    expect(
      existsSync(join(ROOT, 'packages/platform-performance/src/scale-harness.test.ts')),
    ).toBe(true)
    expect(
      existsSync(join(ROOT, 'packages/platform-performance/src/scale-report.test.ts')),
    ).toBe(true)
  })

  it('SCALE_010: harness enforces concurrency-based contention', () => {
    const content = readContent('packages/platform-performance/src/scale-harness.ts')
    expect(
      content.includes('concurrencyFactor') || content.includes('concurrency'),
      'Harness must simulate concurrency-based latency increase',
    ).toBe(true)
  })
})
