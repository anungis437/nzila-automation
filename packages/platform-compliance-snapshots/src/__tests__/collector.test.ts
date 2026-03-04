/**
 * Tests for ComplianceCollector and computeSummary.
 */
import { describe, it, expect } from 'vitest'
import type { CollectorPorts, ComplianceControl } from '../types'
import { ComplianceCollector, computeSummary } from '../collector'

// ── Fixtures ────────────────────────────────────────────────────────────────

const ORG_ID = '00000000-0000-0000-0000-000000000001'

function makeControl(overrides: Partial<ComplianceControl> = {}): ComplianceControl {
  return {
    controlId: 'AC-01',
    controlFamily: 'access',
    title: 'Access Control Policy',
    status: 'compliant',
    evidence: ['evidence-pack-001'],
    lastAssessedAt: '2025-01-15T00:00:00.000Z',
    assessedBy: 'auditor@nzila.io',
    ...overrides,
  }
}

function makePorts(controls: readonly ComplianceControl[]): CollectorPorts {
  return {
    fetchControls: async () => controls,
  }
}

// ── computeSummary ──────────────────────────────────────────────────────────

describe('computeSummary', () => {
  it('should compute summary for all-compliant controls', () => {
    const controls = [
      makeControl({ controlId: 'AC-01' }),
      makeControl({ controlId: 'AC-02' }),
      makeControl({ controlId: 'AC-03' }),
    ]

    const summary = computeSummary(controls)

    expect(summary.totalControls).toBe(3)
    expect(summary.compliant).toBe(3)
    expect(summary.nonCompliant).toBe(0)
    expect(summary.partial).toBe(0)
    expect(summary.notAssessed).toBe(0)
    expect(summary.complianceScore).toBe(100)
  })

  it('should compute score with mixed statuses', () => {
    const controls = [
      makeControl({ controlId: 'AC-01', status: 'compliant' }),
      makeControl({ controlId: 'AC-02', status: 'non-compliant' }),
      makeControl({ controlId: 'AC-03', status: 'partial' }),
      makeControl({ controlId: 'AC-04', status: 'not-assessed' }),
    ]

    const summary = computeSummary(controls)

    expect(summary.totalControls).toBe(4)
    expect(summary.compliant).toBe(1)
    expect(summary.nonCompliant).toBe(1)
    expect(summary.partial).toBe(1)
    expect(summary.notAssessed).toBe(1)
    // Assessed = 3 (excluding not-assessed)
    // Score = ((1 + 0.5*1) / 3) * 100 = 50
    expect(summary.complianceScore).toBe(50)
  })

  it('should return 0 score when all controls are not-assessed', () => {
    const controls = [
      makeControl({ controlId: 'AC-01', status: 'not-assessed' }),
      makeControl({ controlId: 'AC-02', status: 'not-assessed' }),
    ]

    const summary = computeSummary(controls)
    expect(summary.complianceScore).toBe(0)
    expect(summary.notAssessed).toBe(2)
  })
})

// ── ComplianceCollector ─────────────────────────────────────────────────────

describe('ComplianceCollector', () => {
  it('should collect controls and build a snapshot', async () => {
    const controls = [
      makeControl({ controlId: 'AC-01' }),
      makeControl({ controlId: 'AC-02', status: 'non-compliant' }),
    ]
    const collector = new ComplianceCollector(makePorts(controls))

    const snapshot = await collector.collect({
      orgId: ORG_ID,
      collectedBy: 'system',
      version: 1,
    })

    expect(snapshot.orgId).toBe(ORG_ID)
    expect(snapshot.version).toBe(1)
    expect(snapshot.status).toBe('collected')
    expect(snapshot.controls).toHaveLength(2)
    expect(snapshot.summary.totalControls).toBe(2)
    expect(snapshot.summary.compliant).toBe(1)
    expect(snapshot.summary.nonCompliant).toBe(1)
    expect(snapshot.snapshotId).toBeTruthy()
    expect(snapshot.collectedAt).toBeTruthy()
  })

  it('should throw when no controls found', async () => {
    const collector = new ComplianceCollector(makePorts([]))

    await expect(
      collector.collect({ orgId: ORG_ID, collectedBy: 'system', version: 1 })
    ).rejects.toThrow('No compliance controls found')
  })

  it('should include metadata when provided', async () => {
    const controls = [makeControl()]
    const collector = new ComplianceCollector(makePorts(controls))

    const snapshot = await collector.collect({
      orgId: ORG_ID,
      collectedBy: 'system',
      version: 1,
      metadata: { framework: 'SOC2', period: 'Q1-2025' },
    })

    expect(snapshot.metadata).toEqual({ framework: 'SOC2', period: 'Q1-2025' })
  })
})
