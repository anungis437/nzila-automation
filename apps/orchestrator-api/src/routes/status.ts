/**
 * Status routes — platform-level status endpoint.
 *
 * GET /status — Returns orchestrator operational status including
 *               uptime, registered workflows, recent run stats.
 */
import type { FastifyInstance } from 'fastify'
import { listCommands } from '../store.js'

const START_TIME = Date.now()

export async function statusRoutes(app: FastifyInstance) {
  app.get('/', async () => {
    const commands = await listCommands()
    const total = commands.length
    const succeeded = commands.filter((c) => c.status === 'succeeded').length
    const failed = commands.filter((c) => c.status === 'failed').length
    const pending = commands.filter((c) => c.status === 'pending' || c.status === 'dispatched').length

    return {
      status: 'operational',
      uptimeMs: Date.now() - START_TIME,
      version: process.env.npm_package_version ?? 'dev',
      runs: { total, succeeded, failed, pending },
    }
  })
}
