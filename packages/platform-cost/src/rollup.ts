/**
 * Nzila OS — Cost Daily Rollup Job
 *
 * Computes daily cost rollups for all orgs with cost activity.
 * Designed to be called by a scheduled job (cron/worker).
 *
 * @module @nzila/platform-cost/rollup
 */
import { type CostRollup, type CostStorePorts, computeDailyRollups } from './cost-events'

export interface RollupJobPorts extends CostStorePorts {
  /** List all org IDs that have cost events for a given day */
  listOrgsWithCostActivity(day: string): Promise<string[]>
  /** Emit audit event for rollup completion */
  emitAudit(event: {
    action: string
    metadata: Record<string, unknown>
    timestamp: Date
  }): Promise<void>
}

export interface RollupJobResult {
  day: string
  orgsProcessed: number
  totalRollups: number
  errors: { orgId: string; error: string }[]
  durationMs: number
}

/**
 * Run the daily cost rollup job.
 * Processes all orgs and produces aggregated rollups.
 */
export async function runDailyRollupJob(
  day: string,
  ports: RollupJobPorts,
): Promise<RollupJobResult> {
  const start = Date.now()
  const orgs = await ports.listOrgsWithCostActivity(day)

  const errors: { orgId: string; error: string }[] = []
  const allRollups: CostRollup[] = []

  for (const orgId of orgs) {
    try {
      const rollups = await computeDailyRollups({ orgId, day }, ports)
      allRollups.push(...rollups)
    } catch (err) {
      errors.push({
        orgId,
        error: err instanceof Error ? err.message : String(err),
      })
    }
  }

  const result: RollupJobResult = {
    day,
    orgsProcessed: orgs.length,
    totalRollups: allRollups.length,
    errors,
    durationMs: Date.now() - start,
  }

  await ports.emitAudit({
    action: 'cost.rollup.completed',
    metadata: {
      day,
      orgsProcessed: result.orgsProcessed,
      totalRollups: result.totalRollups,
      errorCount: errors.length,
      durationMs: result.durationMs,
    },
    timestamp: new Date(),
  })

  return result
}
