import { describe, it, expect } from 'vitest'
import { HealthChecker } from '../health'

describe('HealthChecker', () => {
  it('should report healthy when no checks registered', async () => {
    const hc = new HealthChecker('test-svc')
    const report = await hc.run()
    expect(report.status).toBe('healthy')
    expect(report.service).toBe('test-svc')
    expect(report.checks).toHaveLength(0)
    expect(report.timestamp).toBeDefined()
  })

  it('should report healthy when all checks pass', async () => {
    const hc = new HealthChecker('test-svc')
    hc.addCheck('db', async () => {
      /* ok */
    })
    hc.addCheck('cache', async () => {
      /* ok */
    })
    const report = await hc.run()
    expect(report.status).toBe('healthy')
    expect(report.checks).toHaveLength(2)
    expect(report.checks.every((c) => c.status === 'healthy')).toBe(true)
  })

  it('should report degraded for non-critical failure', async () => {
    const hc = new HealthChecker('test-svc')
    hc.addCheck('primary', async () => {
      /* ok */
    })
    hc.addCheck(
      'cache',
      async () => {
        throw new Error('cache down')
      },
      { critical: false },
    )
    const report = await hc.run()
    expect(report.status).toBe('degraded')
    const cacheCheck = report.checks.find((c) => c.name === 'cache')
    expect(cacheCheck?.status).toBe('down')
    expect(cacheCheck?.message).toBe('cache down')
  })

  it('should report down for critical failure', async () => {
    const hc = new HealthChecker('test-svc')
    hc.addCheck(
      'db',
      async () => {
        throw new Error('db unreachable')
      },
      { critical: true },
    )
    hc.addCheck('cache', async () => {
      /* ok */
    })
    const report = await hc.run()
    expect(report.status).toBe('down')
  })

  it('should handle timeout', async () => {
    const hc = new HealthChecker('test-svc')
    hc.addCheck(
      'slow',
      async () => {
        await new Promise((resolve) => setTimeout(resolve, 5000))
      },
      { critical: false, timeoutMs: 50 },
    )
    const report = await hc.run()
    expect(report.status).toBe('degraded')
    const slowCheck = report.checks.find((c) => c.name === 'slow')
    expect(slowCheck?.status).toBe('down')
    expect(slowCheck?.message).toContain('timed out')
  })

  it('should register via config object', async () => {
    const hc = new HealthChecker('test-svc')
    hc.register({
      name: 'custom',
      critical: false,
      check: async () => ({
        name: 'custom',
        status: 'healthy' as const,
        latencyMs: 1,
      }),
    })
    const report = await hc.run()
    expect(report.checks).toHaveLength(1)
    expect(report.checks[0]!.name).toBe('custom')
    expect(report.checks[0]!.status).toBe('healthy')
  })

  it('should include latency in results', async () => {
    const hc = new HealthChecker('test-svc')
    hc.addCheck('fast', async () => {
      /* ok */
    })
    const report = await hc.run()
    expect(report.checks[0]!.latencyMs).toBeGreaterThanOrEqual(0)
  })
})
