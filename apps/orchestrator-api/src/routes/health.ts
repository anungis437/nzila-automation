import type { FastifyInstance } from 'fastify'
import { getDb } from '../db.js'
import { sql } from 'drizzle-orm'

export async function healthRoutes(app: FastifyInstance) {
  app.get('/health', async (_req, reply) => {
    const checks: Record<string, { status: string; ms?: number; error?: string }> = {}

    // ── DB connectivity ─────────────────────────────────────────────
    const dbStart = Date.now()
    try {
      const { db } = getDb()
      await db.execute(sql`SELECT 1`)
      checks.database = { status: 'ok', ms: Date.now() - dbStart }
    } catch (err) {
      checks.database = {
        status: 'degraded',
        ms: Date.now() - dbStart,
        error: err instanceof Error ? err.message : 'Unknown DB error',
      }
    }

    // ── GitHub token validity ───────────────────────────────────────
    const ghToken = process.env.GITHUB_TOKEN
    checks.github = ghToken
      ? { status: 'ok' }
      : { status: 'degraded', error: 'GITHUB_TOKEN not set — dispatches will fail' }

    // ── Overall ─────────────────────────────────────────────────────
    const allOk = Object.values(checks).every((c) => c.status === 'ok')
    const status = allOk ? 'ok' : 'degraded'

    return reply.status(allOk ? 200 : 503).send({
      status,
      app: 'orchestrator-api',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version ?? '0.0.0',
      checks,
    })
  })
}
