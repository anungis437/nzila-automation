/**
 * Run routes — execution tracking for workflow runs.
 *
 * A "run" is a concrete execution of a workflow (command).
 * This provides the /runs view that maps commands → execution metadata.
 *
 * GET /runs          — List recent runs with execution metadata
 * GET /runs/:id      — Get a specific run by correlation ID
 * GET /runs/:id/log  — Get execution log for a run
 */
import type { FastifyInstance } from 'fastify'
import { listCommands, getCommand } from '../store.js'
import { getAuditEvents } from '../audit-store.js'

export interface RunSummary {
  runId: string | null
  correlationId: string
  playbook: string
  status: string
  dryRun: boolean
  requestedBy: string
  startedAt: string
  updatedAt: string
  runUrl: string | null
  durationEstimate: string | null
}

export async function runRoutes(app: FastifyInstance) {
  /**
   * GET /runs — List recent runs with execution metadata.
   */
  app.get('/', async () => {
    const commands = await listCommands()
    const runs: RunSummary[] = commands.map((cmd) => ({
      runId: cmd.run_id,
      correlationId: cmd.correlation_id,
      playbook: cmd.playbook,
      status: cmd.status,
      dryRun: cmd.dry_run,
      requestedBy: cmd.requested_by,
      startedAt: cmd.created_at,
      updatedAt: cmd.updated_at,
      runUrl: cmd.run_url,
      durationEstimate: estimateDuration(cmd.created_at, cmd.updated_at, cmd.status),
    }))
    return { runs, count: runs.length }
  })

  /**
   * GET /runs/:id — Get run details by correlation ID.
   */
  app.get<{ Params: { id: string } }>('/:id', async (req, reply) => {
    const record = await getCommand(req.params.id)
    if (!record) {
      return reply.status(404).send({ error: 'Run not found' })
    }
    const events = await getAuditEvents(record.correlation_id)
    return {
      runId: record.run_id,
      correlationId: record.correlation_id,
      playbook: record.playbook,
      status: record.status,
      dryRun: record.dry_run,
      requestedBy: record.requested_by,
      startedAt: record.created_at,
      updatedAt: record.updated_at,
      runUrl: record.run_url,
      eventCount: events.length,
      lastEvent: events.length > 0 ? events[events.length - 1] : null,
    }
  })

  /**
   * GET /runs/:id/log — Get execution log entries for a run.
   */
  app.get<{ Params: { id: string } }>('/:id/log', async (req, reply) => {
    const record = await getCommand(req.params.id)
    if (!record) {
      return reply.status(404).send({ error: 'Run not found' })
    }
    const events = await getAuditEvents(record.correlation_id)
    const log = events.map((e) => ({
      timestamp: e.createdAt,
      event: e.event,
      actor: e.actor,
      payload: e.payload,
    }))
    return { correlationId: record.correlation_id, log, count: log.length }
  })
}

function estimateDuration(startedAt: string, updatedAt: string, status: string): string | null {
  if (status === 'pending' || status === 'queued') return null
  const start = new Date(startedAt).getTime()
  const end = new Date(updatedAt).getTime()
  const diffMs = end - start
  if (diffMs < 1000) return '<1s'
  if (diffMs < 60_000) return `${Math.round(diffMs / 1000)}s`
  return `${Math.round(diffMs / 60_000)}m`
}
