/**
 * Orchestrator API — Telemetry Hooks
 *
 * Fastify lifecycle hooks that emit structured telemetry for every request.
 * Uses the telemetry contracts from @nzila/platform-observability.
 *
 * Wires into Fastify's onRequest / onResponse hooks:
 *   request_received → auth_checked → handler_completed → response_sent
 */
import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import {
  requestTelemetry,
  requestContextMiddleware,
  workflowTelemetry,
  type TelemetryContext,
} from '@nzila/platform-observability'
import { createLogger } from '@nzila/platform-observability'

const logger = createLogger({ org_id: 'platform' })
const contextExtractor = requestContextMiddleware('orchestrator-api')

// ── Fastify plugin ──────────────────────────────────────────────────────────

/**
 * Register telemetry lifecycle hooks on a Fastify instance.
 *
 * Tracks:
 *   - Per-request latency histogram
 *   - Total request counter
 *   - Error counter (5xx)
 *   - Auth failure counter
 *   - Structured lifecycle logs
 */
export async function telemetryHooks(app: FastifyInstance): Promise<void> {
  // Decorate request with telemetry context
  app.decorateRequest('telemetryCtx', null)

  app.addHook('onRequest', async (req: FastifyRequest, _reply: FastifyReply) => {
    const ctx = contextExtractor.extractContext(
      req.headers as Record<string, string | string[] | undefined>,
    )
    ;(req as unknown as { telemetryCtx: TelemetryContext }).telemetryCtx = ctx

    const tel = requestTelemetry({
      service: 'orchestrator-api',
      method: req.method,
      path: req.url,
      correlation: {
        requestId: ctx.requestId,
        traceId: ctx.correlationId,
        spanId: ctx.spanId,
        parentSpanId: undefined,
      },
    })

    tel.received()
    // Stash the telemetry handle on the request for onResponse
    ;(req as unknown as { _tel: ReturnType<typeof requestTelemetry> })._tel = tel
  })

  app.addHook('onResponse', async (req: FastifyRequest, reply: FastifyReply) => {
    const tel = (req as unknown as { _tel: ReturnType<typeof requestTelemetry> | undefined })._tel
    if (tel) {
      tel.handlerCompleted(reply.statusCode)
      tel.responseSent(reply.statusCode)
    }
  })
}
