/**
 * @nzila/platform-compliance-snapshots — Generator
 *
 * Orchestrates the full snapshot lifecycle: collect → chain → persist.
 * All mutations go through ports for DI/testing.
 *
 * @module @nzila/platform-compliance-snapshots/generator
 */
import { createLogger } from '@nzila/os-core/telemetry'
import { ComplianceCollector } from './collector'
import { SnapshotChain } from './chain'
import type {
  CollectorPorts,
  ChainPorts,
  GeneratorPorts,
  ComplianceSnapshot,
  SnapshotChainEntry,
} from './types'

const logger = createLogger('compliance-generator')

// ── Generator Result ────────────────────────────────────────────────────────

export interface GenerationResult {
  readonly snapshot: ComplianceSnapshot
  readonly chainEntry: SnapshotChainEntry
}

// ── Generator ───────────────────────────────────────────────────────────────

export class SnapshotGenerator {
  private readonly collector: ComplianceCollector
  private readonly chain: SnapshotChain
  private readonly ports: GeneratorPorts

  constructor(deps: {
    collectorPorts: CollectorPorts
    chainPorts: ChainPorts
    generatorPorts: GeneratorPorts
  }) {
    this.collector = new ComplianceCollector(deps.collectorPorts)
    this.chain = new SnapshotChain(deps.chainPorts)
    this.ports = deps.generatorPorts
  }

  /**
   * Generate a new compliance snapshot: collect controls, chain, persist.
   */
  async generate(input: {
    orgId: string
    collectedBy: string
    metadata?: Record<string, string>
  }): Promise<GenerationResult> {
    // Determine next version
    const existing = await this.ports.listSnapshots(input.orgId)
    const nextVersion = existing.length + 1

    // Step 1: Collect
    const snapshot = await this.collector.collect({
      orgId: input.orgId,
      collectedBy: input.collectedBy,
      version: nextVersion,
      metadata: input.metadata,
    })

    // Step 2: Persist (status = collected)
    await this.ports.saveSnapshot(snapshot)

    // Step 3: Chain
    const chainEntry = await this.chain.append(snapshot)

    // Step 4: Update status to chained
    const chainedSnapshot: ComplianceSnapshot = {
      ...snapshot,
      status: 'chained',
    }
    await this.ports.updateStatus(snapshot.snapshotId, 'chained')

    logger.info('Compliance snapshot generated and chained', {
      snapshotId: snapshot.snapshotId,
      orgId: input.orgId,
      version: nextVersion,
      complianceScore: snapshot.summary.complianceScore,
    })

    return {
      snapshot: chainedSnapshot,
      chainEntry,
    }
  }

  /**
   * Load a previously generated snapshot.
   */
  async getSnapshot(snapshotId: string): Promise<ComplianceSnapshot | null> {
    return this.ports.loadSnapshot(snapshotId)
  }

  /**
   * List all snapshots for an org, ordered by version.
   */
  async listSnapshots(orgId: string): Promise<readonly ComplianceSnapshot[]> {
    return this.ports.listSnapshots(orgId)
  }
}
