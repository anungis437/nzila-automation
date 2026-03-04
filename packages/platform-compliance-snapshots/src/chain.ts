/**
 * @nzila/platform-compliance-snapshots — Hash Chain
 *
 * SHA-256 hash chain for immutable snapshot ordering.
 * Each entry includes the hash of the current snapshot AND the hash
 * of the previous entry, forming a tamper-evident append-only chain.
 *
 * Breaking a chain link invalidates all subsequent entries.
 *
 * @module @nzila/platform-compliance-snapshots/chain
 */
import { createHash } from 'node:crypto'
import { createLogger } from '@nzila/os-core/telemetry'
import type {
  ChainPorts,
  ComplianceSnapshot,
  SnapshotChainEntry,
} from './types'
import { snapshotChainEntrySchema } from './types'

const logger = createLogger('compliance-chain')

// ── Hashing ─────────────────────────────────────────────────────────────────

/**
 * Compute a deterministic SHA-256 hash of a compliance snapshot.
 * Keys are sorted for canonical representation.
 */
export function computeSnapshotHash(snapshot: ComplianceSnapshot): string {
  const canonical = canonicalize(snapshot)
  return createHash('sha256').update(canonical).digest('hex')
}

/**
 * Deterministic JSON stringification with sorted keys.
 */
function canonicalize(obj: unknown): string {
  return JSON.stringify(obj, (_key, value: unknown) => {
    if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
      const sorted: Record<string, unknown> = {}
      for (const k of Object.keys(value as Record<string, unknown>).sort()) {
        sorted[k] = (value as Record<string, unknown>)[k]
      }
      return sorted
    }
    return value
  })
}

// ── Chain Manager ───────────────────────────────────────────────────────────

export class SnapshotChain {
  private readonly ports: ChainPorts

  constructor(ports: ChainPorts) {
    this.ports = ports
  }

  /**
   * Append a snapshot to the hash chain.
   * Links to the previous entry's hash (or null for genesis).
   */
  async append(snapshot: ComplianceSnapshot): Promise<SnapshotChainEntry> {
    const chain = await this.ports.loadChain(snapshot.orgId)
    const previousEntry = chain.length > 0 ? chain[chain.length - 1] : null
    const previousHash = previousEntry?.snapshotHash ?? null

    const snapshotHash = computeSnapshotHash(snapshot)

    const entry: SnapshotChainEntry = {
      snapshotId: snapshot.snapshotId,
      orgId: snapshot.orgId,
      version: snapshot.version,
      snapshotHash,
      previousHash,
      chainedAt: new Date().toISOString(),
    }

    // Validate
    snapshotChainEntrySchema.parse(entry)

    await this.ports.appendEntry(entry)

    logger.info('Snapshot appended to chain', {
      snapshotId: snapshot.snapshotId,
      orgId: snapshot.orgId,
      version: snapshot.version,
      chainLength: chain.length + 1,
    })

    return entry
  }

  /**
   * Verify the entire chain for an org.
   * Checks that each entry's previousHash matches the prior entry's snapshotHash.
   */
  async verify(orgId: string): Promise<{
    valid: boolean
    totalEntries: number
    brokenAt: number | null
    errors: readonly string[]
  }> {
    const chain = await this.ports.loadChain(orgId)
    const errors: string[] = []
    let brokenAt: number | null = null

    if (chain.length === 0) {
      return { valid: true, totalEntries: 0, brokenAt: null, errors: [] }
    }

    // Genesis entry must have null previousHash
    const genesis = chain[0]!
    if (genesis.previousHash !== null) {
      errors.push(`Genesis entry (v${String(genesis.version)}) has non-null previousHash`)
      brokenAt = 0
    }

    // Each subsequent entry must link to the prior snapshotHash
    for (let i = 1; i < chain.length; i++) {
      const current = chain[i]!
      const previous = chain[i - 1]!

      if (current.previousHash !== previous.snapshotHash) {
        errors.push(
          `Chain broken at entry ${String(i)} (v${String(current.version)}): ` +
            `expected previousHash '${previous.snapshotHash.slice(0, 8)}...' ` +
            `but got '${current.previousHash?.slice(0, 8) ?? 'null'}...'`
        )
        if (brokenAt === null) {
          brokenAt = i
        }
      }
    }

    const valid = errors.length === 0

    logger.info('Chain verification completed', {
      orgId,
      valid,
      totalEntries: chain.length,
      brokenAt,
    })

    return { valid, totalEntries: chain.length, brokenAt, errors }
  }

  /**
   * Load the full chain for an org.
   */
  async loadChain(orgId: string): Promise<readonly SnapshotChainEntry[]> {
    return this.ports.loadChain(orgId)
  }
}
