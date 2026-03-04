/**
 * Tests for SnapshotGenerator — end-to-end snapshot lifecycle.
 */
import { describe, it, expect } from 'vitest'
import type {
  ChainPorts,
  CollectorPorts,
  ComplianceControl,
  ComplianceSnapshot,
  GeneratorPorts,
  SnapshotChainEntry,
  SnapshotStatus,
} from '../types'
import { SnapshotGenerator } from '../generator'

// ── Fixtures ────────────────────────────────────────────────────────────────

const ORG_ID = '00000000-0000-0000-0000-000000000001'

function makeControls(): readonly ComplianceControl[] {
  return [
    {
      controlId: 'AC-01',
      controlFamily: 'access',
      title: 'Access Control Policy',
      status: 'compliant',
      evidence: ['ep-001'],
      lastAssessedAt: '2025-01-15T00:00:00.000Z',
      assessedBy: 'auditor@nzila.io',
    },
    {
      controlId: 'CM-01',
      controlFamily: 'change-mgmt',
      title: 'Change Management',
      status: 'non-compliant',
      evidence: [],
      lastAssessedAt: '2025-01-15T00:00:00.000Z',
      assessedBy: 'auditor@nzila.io',
    },
  ]
}

interface InMemoryPorts {
  collectorPorts: CollectorPorts
  chainPorts: ChainPorts & { chain: SnapshotChainEntry[] }
  generatorPorts: GeneratorPorts & { snapshots: Map<string, ComplianceSnapshot> }
}

function makeInMemoryPorts(): InMemoryPorts {
  const chain: SnapshotChainEntry[] = []
  const snapshots = new Map<string, ComplianceSnapshot>()

  return {
    collectorPorts: {
      fetchControls: async () => makeControls(),
    },
    chainPorts: {
      chain,
      loadChain: async (orgId: string) => chain.filter((e) => e.orgId === orgId),
      appendEntry: async (entry: SnapshotChainEntry) => {
        chain.push(entry)
      },
    },
    generatorPorts: {
      snapshots,
      saveSnapshot: async (snapshot: ComplianceSnapshot) => {
        snapshots.set(snapshot.snapshotId, snapshot)
      },
      loadSnapshot: async (snapshotId: string) => snapshots.get(snapshotId) ?? null,
      listSnapshots: async (orgId: string) => {
        const results: ComplianceSnapshot[] = []
        for (const s of snapshots.values()) {
          if (s.orgId === orgId) results.push(s)
        }
        return results
      },
      updateStatus: async (snapshotId: string, status: SnapshotStatus) => {
        const s = snapshots.get(snapshotId)
        if (s) {
          snapshots.set(snapshotId, { ...s, status })
        }
      },
    },
  }
}

// ── Tests ───────────────────────────────────────────────────────────────────

describe('SnapshotGenerator', () => {
  it('should generate a snapshot with chaining', async () => {
    const ports = makeInMemoryPorts()
    const generator = new SnapshotGenerator(ports)

    const result = await generator.generate({
      orgId: ORG_ID,
      collectedBy: 'system',
    })

    expect(result.snapshot.orgId).toBe(ORG_ID)
    expect(result.snapshot.version).toBe(1)
    expect(result.snapshot.status).toBe('chained')
    expect(result.snapshot.summary.totalControls).toBe(2)

    expect(result.chainEntry.snapshotId).toBe(result.snapshot.snapshotId)
    expect(result.chainEntry.previousHash).toBeNull() // genesis
    expect(result.chainEntry.snapshotHash).toMatch(/^[a-f0-9]{64}$/)
  })

  it('should auto-increment version', async () => {
    const ports = makeInMemoryPorts()
    const generator = new SnapshotGenerator(ports)

    const r1 = await generator.generate({ orgId: ORG_ID, collectedBy: 'system' })
    const r2 = await generator.generate({ orgId: ORG_ID, collectedBy: 'system' })

    expect(r1.snapshot.version).toBe(1)
    expect(r2.snapshot.version).toBe(2)
  })

  it('should chain multiple snapshots correctly', async () => {
    const ports = makeInMemoryPorts()
    const generator = new SnapshotGenerator(ports)

    const r1 = await generator.generate({ orgId: ORG_ID, collectedBy: 'system' })
    const r2 = await generator.generate({ orgId: ORG_ID, collectedBy: 'system' })
    const r3 = await generator.generate({ orgId: ORG_ID, collectedBy: 'system' })

    expect(r1.chainEntry.previousHash).toBeNull()
    expect(r2.chainEntry.previousHash).toBe(r1.chainEntry.snapshotHash)
    expect(r3.chainEntry.previousHash).toBe(r2.chainEntry.snapshotHash)
  })

  it('should persist snapshots and allow retrieval', async () => {
    const ports = makeInMemoryPorts()
    const generator = new SnapshotGenerator(ports)

    const r = await generator.generate({ orgId: ORG_ID, collectedBy: 'system' })
    const loaded = await generator.getSnapshot(r.snapshot.snapshotId)

    expect(loaded).not.toBeNull()
    expect(loaded!.snapshotId).toBe(r.snapshot.snapshotId)
  })

  it('should list snapshots for an org', async () => {
    const ports = makeInMemoryPorts()
    const generator = new SnapshotGenerator(ports)

    await generator.generate({ orgId: ORG_ID, collectedBy: 'system' })
    await generator.generate({ orgId: ORG_ID, collectedBy: 'system' })

    const list = await generator.listSnapshots(ORG_ID)
    expect(list).toHaveLength(2)
  })

  it('should include metadata in generated snapshot', async () => {
    const ports = makeInMemoryPorts()
    const generator = new SnapshotGenerator(ports)

    const r = await generator.generate({
      orgId: ORG_ID,
      collectedBy: 'system',
      metadata: { framework: 'SOC2' },
    })

    expect(r.snapshot.metadata).toEqual({ framework: 'SOC2' })
  })
})
