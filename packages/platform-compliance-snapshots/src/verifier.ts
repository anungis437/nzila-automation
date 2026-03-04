/**
 * @nzila/platform-compliance-snapshots — Verifier
 *
 * Verifies the integrity of compliance snapshots and their hash chain.
 * Recomputes snapshot hashes and validates chain linkage.
 *
 * @module @nzila/platform-compliance-snapshots/verifier
 */
import { createLogger } from '@nzila/os-core/telemetry'
import { computeSnapshotHash } from './chain'
import type {
  ChainVerificationResult,
  ComplianceSnapshot,
  VerifierPorts,
} from './types'

const logger = createLogger('compliance-verifier')

// ── Snapshot Verification ───────────────────────────────────────────────────

export interface SnapshotVerificationResult {
  readonly snapshotId: string
  readonly valid: boolean
  readonly hashMatch: boolean
  readonly expectedHash: string
  readonly actualHash: string
  readonly chainEntryFound: boolean
  readonly errors: readonly string[]
  readonly verifiedAt: string
}

// ── Verifier ────────────────────────────────────────────────────────────────

export class ComplianceVerifier {
  private readonly ports: VerifierPorts

  constructor(ports: VerifierPorts) {
    this.ports = ports
  }

  /**
   * Verify a single snapshot: recompute its hash, check chain entry.
   */
  async verifySnapshot(snapshotId: string): Promise<SnapshotVerificationResult> {
    const snapshot = await this.ports.loadSnapshot(snapshotId)
    if (!snapshot) {
      return {
        snapshotId,
        valid: false,
        hashMatch: false,
        expectedHash: '',
        actualHash: '',
        chainEntryFound: false,
        errors: [`Snapshot '${snapshotId}' not found`],
        verifiedAt: new Date().toISOString(),
      }
    }

    const recomputedHash = computeSnapshotHash(snapshot)

    // Find chain entry
    const chain = await this.ports.loadChain(snapshot.orgId)
    const chainEntry = chain.find((e) => e.snapshotId === snapshotId)

    const errors: string[] = []
    let hashMatch = true

    if (!chainEntry) {
      errors.push(`No chain entry found for snapshot '${snapshotId}'`)
    } else if (chainEntry.snapshotHash !== recomputedHash) {
      hashMatch = false
      errors.push(
        `Hash mismatch: chain has '${chainEntry.snapshotHash.slice(0, 8)}...' ` +
          `but recomputed '${recomputedHash.slice(0, 8)}...'`
      )
    }

    const result: SnapshotVerificationResult = {
      snapshotId,
      valid: hashMatch && chainEntry !== undefined,
      hashMatch,
      expectedHash: chainEntry?.snapshotHash ?? '',
      actualHash: recomputedHash,
      chainEntryFound: chainEntry !== undefined,
      errors,
      verifiedAt: new Date().toISOString(),
    }

    logger.info('Snapshot verification completed', {
      snapshotId,
      valid: result.valid,
      hashMatch,
    })

    return result
  }

  /**
   * Verify the entire hash chain for an org.
   */
  async verifyChain(orgId: string): Promise<ChainVerificationResult> {
    const chain = await this.ports.loadChain(orgId)
    const errors: string[] = []
    let brokenAt: number | null = null
    let verifiedCount = 0

    if (chain.length === 0) {
      return {
        orgId,
        valid: true,
        totalEntries: 0,
        verifiedEntries: 0,
        brokenAt: null,
        errors: [],
        verifiedAt: new Date().toISOString(),
      }
    }

    // Check genesis
    const genesis = chain[0]!
    if (genesis.previousHash !== null) {
      errors.push(`Genesis entry (v${String(genesis.version)}) has non-null previousHash`)
      brokenAt = 0
    } else {
      verifiedCount++
    }

    // Verify chain linkage
    for (let i = 1; i < chain.length; i++) {
      const current = chain[i]!
      const previous = chain[i - 1]!

      if (current.previousHash !== previous.snapshotHash) {
        errors.push(
          `Chain broken at v${String(current.version)}: ` +
            `expected '${previous.snapshotHash.slice(0, 8)}...' ` +
            `but got '${current.previousHash?.slice(0, 8) ?? 'null'}...'`
        )
        if (brokenAt === null) {
          brokenAt = i
        }
      } else {
        verifiedCount++
      }
    }

    // Recompute snapshot hashes where possible
    for (const entry of chain) {
      const snapshot = await this.ports.loadSnapshot(entry.snapshotId)
      if (snapshot) {
        const recomputed = computeSnapshotHash(snapshot)
        if (recomputed !== entry.snapshotHash) {
          errors.push(
            `Snapshot v${String(entry.version)} hash mismatch: ` +
              `chain has '${entry.snapshotHash.slice(0, 8)}...' ` +
              `but recomputed '${recomputed.slice(0, 8)}...'`
          )
        }
      }
    }

    const valid = errors.length === 0

    logger.info('Chain verification completed', {
      orgId,
      valid,
      totalEntries: chain.length,
      verifiedEntries: verifiedCount,
      brokenAt,
    })

    return {
      orgId,
      valid,
      totalEntries: chain.length,
      verifiedEntries: verifiedCount,
      brokenAt,
      errors,
      verifiedAt: new Date().toISOString(),
    }
  }
}
