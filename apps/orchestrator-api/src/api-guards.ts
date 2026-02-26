/**
 * Orchestrator API — Request Guards
 *
 * Fastify-adapted authentication and request context helpers.
 * Mirrors the Next.js `lib/api-guards.ts` pattern used across business apps.
 */
import type { FastifyRequest, FastifyReply } from 'fastify'
import { createLogger } from '@nzila/os-core'

const logger = createLogger('orchestrator-api:guards')

// ── Request context ─────────────────────────────────────────────────────────

export interface RequestContext {
  requestId: string
  actor: string
  timestamp: string
}

export function getRequestContext(req: FastifyRequest): RequestContext {
  return {
    requestId: (req.headers['x-request-id'] as string) ?? crypto.randomUUID(),
    actor: (req.headers['x-actor'] as string) ?? 'system',
    timestamp: new Date().toISOString(),
  }
}

// ── Authentication ──────────────────────────────────────────────────────────

export async function authenticateRequest(
  req: FastifyRequest,
  reply: FastifyReply,
): Promise<{ ok: true; context: RequestContext } | { ok: false }> {
  const apiKey = process.env.ORCHESTRATOR_API_KEY

  if (!apiKey && process.env.NODE_ENV === 'production') {
    logger.error('ORCHESTRATOR_API_KEY not set in production')
    reply.status(500).send({ error: 'Server misconfigured' })
    return { ok: false }
  }

  const provided =
    req.headers.authorization?.replace(/^Bearer\s+/i, '') ??
    (req.headers['x-api-key'] as string)

  if (apiKey && provided !== apiKey) {
    logger.warn('Authentication failed', { url: req.url })
    reply.status(401).send({ error: 'Unauthorized — invalid or missing API key' })
    return { ok: false }
  }

  return { ok: true, context: getRequestContext(req) }
}

// ── Request context wrapper (mirrors withRequestContext for Next.js apps) ──

export async function withRequestContext<T>(
  req: FastifyRequest,
  fn: (ctx: RequestContext) => Promise<T>,
): Promise<T> {
  const ctx = getRequestContext(req)
  logger.debug('Request context', { requestId: ctx.requestId, actor: ctx.actor })
  return fn(ctx)
}
