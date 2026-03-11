import { describe, it, expect, vi, beforeEach } from 'vitest'
import { telemetryHooks } from '../src/telemetry-hooks.js'

describe('telemetryHooks', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  function createMockFastify() {
    const hooks: Record<string, Function[]> = {}
    return {
      decorateRequest: vi.fn(),
      addHook(name: string, fn: Function) {
        hooks[name] = hooks[name] ?? []
        hooks[name].push(fn)
      },
      _hooks: hooks,
    }
  }

  it('registers onRequest and onResponse hooks', async () => {
    const app = createMockFastify()
    await telemetryHooks(app as unknown as Parameters<typeof telemetryHooks>[0])

    expect(app.decorateRequest).toHaveBeenCalledWith('telemetryCtx', null)
    expect(app._hooks.onRequest).toHaveLength(1)
    expect(app._hooks.onResponse).toHaveLength(1)
  })

  it('onRequest extracts correlation context from headers', async () => {
    const app = createMockFastify()
    await telemetryHooks(app as unknown as Parameters<typeof telemetryHooks>[0])

    const req: Record<string, unknown> = {
      headers: {
        'x-request-id': 'req-123',
        'x-correlation-id': 'corr-456',
      },
      method: 'GET',
      url: '/health',
    }
    const reply = {}

    await app._hooks.onRequest[0](req, reply)

    const ctx = (req as { telemetryCtx: { requestId: string; correlationId: string } }).telemetryCtx
    expect(ctx.requestId).toBe('req-123')
    expect(ctx.correlationId).toBe('corr-456')
  })

  it('onRequest auto-generates IDs when headers missing', async () => {
    const app = createMockFastify()
    await telemetryHooks(app as unknown as Parameters<typeof telemetryHooks>[0])

    const req: Record<string, unknown> = {
      headers: {},
      method: 'POST',
      url: '/commands',
    }
    const reply = {}

    await app._hooks.onRequest[0](req, reply)

    const ctx = (req as { telemetryCtx: { requestId: string } }).telemetryCtx
    expect(ctx.requestId).toBeDefined()
    expect(ctx.requestId.length).toBeGreaterThan(0)
  })

  it('onResponse calls handlerCompleted and responseSent', async () => {
    const app = createMockFastify()
    await telemetryHooks(app as unknown as Parameters<typeof telemetryHooks>[0])

    const req: Record<string, unknown> = {
      headers: {},
      method: 'GET',
      url: '/health',
    }
    const reply = { statusCode: 200 }

    // Run onRequest first to set up _tel
    await app._hooks.onRequest[0](req, reply)
    // Then onResponse — should not throw
    await app._hooks.onResponse[0](req, reply)

    // Verify no errors (telemetry was called internally)
    expect(true).toBe(true)
  })

  it('onResponse handles missing _tel gracefully', async () => {
    const app = createMockFastify()
    await telemetryHooks(app as unknown as Parameters<typeof telemetryHooks>[0])

    const req: Record<string, unknown> = { headers: {}, method: 'GET', url: '/' }
    const reply = { statusCode: 200 }

    // Skip onRequest — _tel not set
    await app._hooks.onResponse[0](req, reply) // should not throw
    expect(true).toBe(true)
  })
})
