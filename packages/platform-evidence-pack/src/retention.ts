/**
 * @nzila/platform-evidence-pack — Retention Manager
 *
 * Enforces retention policies on evidence packs.
 * Supports standard, extended, regulatory, and permanent retention classes.
 *
 * @module @nzila/platform-evidence-pack/retention
 */
import { createLogger } from '@nzila/os-core/telemetry'
import type {
  RetentionPolicy,
  RetentionResult,
  RetentionPorts,
  RetentionClass,
} from './types'

const logger = createLogger('evidence-retention')

// ── Default Policies ────────────────────────────────────────────────────────

const DEFAULT_POLICIES: Record<RetentionClass, RetentionPolicy> = {
  standard: {
    retentionClass: 'standard',
    retentionDays: 365,
    autoArchive: true,
    autoDelete: true,
  },
  extended: {
    retentionClass: 'extended',
    retentionDays: 365 * 3,
    autoArchive: true,
    autoDelete: false,
  },
  regulatory: {
    retentionClass: 'regulatory',
    retentionDays: 365 * 7,
    autoArchive: true,
    autoDelete: false,
  },
  permanent: {
    retentionClass: 'permanent',
    retentionDays: Infinity,
    autoArchive: false,
    autoDelete: false,
  },
}

/**
 * Retention manager for evidence packs.
 * Evaluates packs against retention policies and applies appropriate actions.
 */
export class RetentionManager {
  private readonly ports: RetentionPorts
  private readonly policies: Record<RetentionClass, RetentionPolicy>

  constructor(ports: RetentionPorts, policies?: Partial<Record<RetentionClass, RetentionPolicy>>) {
    this.ports = ports
    this.policies = { ...DEFAULT_POLICIES, ...policies }
  }

  /**
   * Get the retention policy for a given class.
   */
  getPolicy(retentionClass: RetentionClass): RetentionPolicy {
    return this.policies[retentionClass]
  }

  /**
   * Evaluate a single pack against its retention policy.
   */
  evaluatePack(
    packId: string,
    createdAt: string,
    retentionClass: RetentionClass,
  ): RetentionResult {
    const policy = this.policies[retentionClass]

    if (policy.retentionDays === Infinity) {
      return {
        packId,
        action: 'retained',
        reason: `Permanent retention — pack is never archived or deleted`,
        processedAt: new Date().toISOString(),
      }
    }

    const createdDate = new Date(createdAt)
    const expiryDate = new Date(createdDate.getTime() + policy.retentionDays * 24 * 60 * 60 * 1000)
    const now = new Date()

    if (now < expiryDate) {
      const daysRemaining = Math.ceil((expiryDate.getTime() - now.getTime()) / (24 * 60 * 60 * 1000))
      return {
        packId,
        action: 'retained',
        reason: `Within retention period — ${daysRemaining} days remaining`,
        processedAt: new Date().toISOString(),
      }
    }

    if (policy.autoDelete) {
      return {
        packId,
        action: 'deleted',
        reason: `Retention expired (${policy.retentionDays} days) — auto-delete enabled`,
        processedAt: new Date().toISOString(),
      }
    }

    if (policy.autoArchive) {
      return {
        packId,
        action: 'archived',
        reason: `Retention expired (${policy.retentionDays} days) — auto-archive enabled`,
        processedAt: new Date().toISOString(),
      }
    }

    return {
      packId,
      action: 'skipped',
      reason: `Retention expired but no automatic action configured`,
      processedAt: new Date().toISOString(),
    }
  }

  /**
   * Process retention for all packs older than the retention cutoff.
   */
  async processExpired(retentionClass: RetentionClass): Promise<readonly RetentionResult[]> {
    const policy = this.policies[retentionClass]
    if (policy.retentionDays === Infinity) {
      return []
    }

    const cutoffDate = new Date(
      Date.now() - policy.retentionDays * 24 * 60 * 60 * 1000,
    )
    const packs = await this.ports.listPacksOlderThan(cutoffDate.toISOString())

    const results: RetentionResult[] = []

    for (const pack of packs) {
      const result = this.evaluatePack(pack.packId, pack.createdAt, retentionClass)

      if (result.action === 'deleted') {
        await this.ports.deletePack(pack.packId)
        logger.info('Evidence pack deleted by retention policy', { packId: pack.packId, retentionClass })
      } else if (result.action === 'archived') {
        await this.ports.archivePack(pack.packId)
        logger.info('Evidence pack archived by retention policy', { packId: pack.packId, retentionClass })
      }

      results.push(result)
    }

    return results
  }
}
