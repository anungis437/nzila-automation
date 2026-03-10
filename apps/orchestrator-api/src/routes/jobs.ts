/**
 * Job routes — track execution runs spawned from commands.
 *
 * GET /jobs            — List recent jobs
 * GET /jobs/:id        — Get a specific job by correlation ID
 * GET /jobs/:id/events — Get audit events for a job
 */
import type { FastifyInstance } from 'fastify'
import { listCommands, getCommand } from '../store.js'
import { getAuditEvents } from '../audit-store.js'

export async function jobRoutes(app: FastifyInstance) {
  /**
   * GET /jobs — List recent jobs (alias for commands with run metadata).
   */
  app.get('/', async (req, reply) => {
    const commands = await listCommands()
    const jobs = commands.map((cmd) => ({
      jobId: cmd.id,
      correlationId: cmd.correlation_id,
      playbook: cmd.playbook,
      status: cmd.status,
      dryRun: cmd.dry_run,
      requestedBy: cmd.requested_by,
      runId: cmd.run_id,
      runUrl: cmd.run_url,
      createdAt: cmd.created_at,
      updatedAt: cmd.updated_at,
    }))
    return { jobs, count: jobs.length }
  })

  /**
   * GET /jobs/:id — Get job details by correlation ID.
   */
  app.get<{ Params: { id: string } }>('/:id', async (req, reply) => {
    const record = await getCommand(req.params.id)
    if (!record) {
      return reply.status(404).send({ error: 'Job not found' })
    }
    return {
      jobId: record.id,
      correlationId: record.correlation_id,
      playbook: record.playbook,
      status: record.status,
      dryRun: record.dry_run,
      requestedBy: record.requested_by,
      runId: record.run_id,
      runUrl: record.run_url,
      createdAt: record.created_at,
      updatedAt: record.updated_at,
    }
  })

  /**
   * GET /jobs/:id/events — Get audit trail for a specific job.
   */
  app.get<{ Params: { id: string } }>('/:id/events', async (req, reply) => {
    const record = await getCommand(req.params.id)
    if (!record) {
      return reply.status(404).send({ error: 'Job not found' })
    }
    const events = await getAuditEvents(record.correlation_id)
    return { correlationId: record.correlation_id, events, count: events.length }
  })
}
