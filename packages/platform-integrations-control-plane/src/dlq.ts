/**
 * @nzila/platform-integrations-control-plane — DLQ Management
 *
 * Dead-letter queue management: inspect, replay, purge.
 * Wraps the integrations-db DLQ table with control-plane operations.
 *
 * @module @nzila/platform-integrations-control-plane/dlq
 */
import { createLogger } from '@nzila/os-core/telemetry'
import type { DlqEntry, DlqReplayResult } from './types'

const logger = createLogger('integrations-dlq')

// ── Ports ───────────────────────────────────────────────────────────────────

export interface DlqPorts {
  /** List DLQ entries for an org */
  listEntries(orgId: string, limit: number): Promise<DlqEntry[]>
  /** Get a single DLQ entry by ID */
  getEntry(entryId: string): Promise<DlqEntry | null>
  /** Remove an entry from the DLQ (after replay or purge) */
  removeEntry(entryId: string): Promise<void>
  /** Count entries for an org */
  countEntries(orgId: string): Promise<number>
  /** Attempt to re-dispatch a DLQ entry */
  redispatch(entry: DlqEntry): Promise<{ success: boolean; error?: string }>
}

// ── DLQ Manager ─────────────────────────────────────────────────────────────

export class DlqManager {
  private readonly ports: DlqPorts

  constructor(ports: DlqPorts) {
    this.ports = ports
  }

  /**
   * List DLQ entries for an org with pagination.
   */
  async list(orgId: string, limit = 50): Promise<DlqEntry[]> {
    return this.ports.listEntries(orgId, limit)
  }

  /**
   * Get the current DLQ depth for an org.
   */
  async depth(orgId: string): Promise<number> {
    return this.ports.countEntries(orgId)
  }

  /**
   * Replay specific DLQ entries by ID.
   * Each entry is re-dispatched independently; failures don't block others.
   */
  async replay(entryIds: readonly string[]): Promise<DlqReplayResult[]> {
    const results: DlqReplayResult[] = []

    for (const entryId of entryIds) {
      try {
        const entry = await this.ports.getEntry(entryId)
        if (!entry) {
          results.push({
            entryId,
            status: 'failed',
            error: 'DLQ entry not found',
          })
          continue
        }

        const dispatchResult = await this.ports.redispatch(entry)

        if (dispatchResult.success) {
          await this.ports.removeEntry(entryId)
          results.push({ entryId, status: 'replayed' })
          logger.info('DLQ entry replayed successfully', {
            entryId,
            orgId: entry.orgId,
            provider: entry.provider,
          })
        } else {
          results.push({
            entryId,
            status: 'failed',
            error: dispatchResult.error ?? 'Re-dispatch failed',
          })
          logger.warn('DLQ replay failed', {
            entryId,
            error: dispatchResult.error,
          })
        }
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : String(err)
        results.push({ entryId, status: 'failed', error: errorMessage })
        logger.error('DLQ replay error', { entryId, error: errorMessage })
      }
    }

    return results
  }

  /**
   * Purge all DLQ entries for an org (destructive operation).
   * Returns the number of entries purged.
   */
  async purge(orgId: string): Promise<number> {
    const entries = await this.ports.listEntries(orgId, 10_000)
    let purged = 0

    for (const entry of entries) {
      try {
        await this.ports.removeEntry(entry.id)
        purged++
      } catch (err: unknown) {
        logger.error('Failed to purge DLQ entry', {
          entryId: entry.id,
          error: err instanceof Error ? err.message : String(err),
        })
      }
    }

    logger.info('DLQ purge completed', { orgId, purged, total: entries.length })
    return purged
  }
}
