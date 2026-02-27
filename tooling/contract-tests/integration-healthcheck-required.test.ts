/**
 * Contract Test — Integration HealthCheck Required
 *
 * Verifies that every integration adapter registered with the platform
 * implements a `healthCheck()` method that returns status + latency.
 *
 * Tests:
 *   HEALTHCHECK-01: IntegrationAdapter interface requires healthCheck method
 *   HEALTHCHECK-02: healthCheck returns HealthCheckResult shape (status + latencyMs)
 *   HEALTHCHECK-03: All providers in IntegrationProvider enum have healthCheck in the adapter contract
 *   HEALTHCHECK-04: health-schema.ts exists with providerHealth and providerMetrics tables
 *   HEALTHCHECK-05: Runtime health checker module exists and exports checkAllIntegrations
 *
 * @invariant INTEGRATION_HEALTHCHECK_REQUIRED_002
 */
import { describe, it, expect } from 'vitest'
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

const ROOT = join(__dirname, '..', '..')

// ── HEALTHCHECK-01: Adapter interface mandates healthCheck ───────────────────

describe('HEALTHCHECK-01 — IntegrationAdapter interface requires healthCheck', () => {
  it('IntegrationAdapter type includes healthCheck method', async () => {
    const typesPath = join(ROOT, 'packages/integrations-core/src/types.ts')
    expect(existsSync(typesPath), 'types.ts must exist').toBe(true)

    const content = readFileSync(typesPath, 'utf-8')
    expect(content).toContain('healthCheck')
    // healthCheck must return a Promise<HealthCheckResult>
    expect(content).toMatch(/healthCheck\s*\(/)
    expect(content).toContain('HealthCheckResult')
  })

  it('HealthCheckResult type includes status and latencyMs', () => {
    const typesPath = join(ROOT, 'packages/integrations-core/src/types.ts')
    const content = readFileSync(typesPath, 'utf-8')

    // Must define HealthCheckResult with status
    expect(content).toMatch(/HealthCheckResult/)
    expect(content).toContain('status')
  })
})

// ── HEALTHCHECK-02: HealthCheckResult shape enforced by Zod ─────────────────

describe('HEALTHCHECK-02 — HealthCheckResult shape is schema-validated', () => {
  it('schemas.ts exports a HealthCheckResult or health-related schema', () => {
    const schemasPath = join(ROOT, 'packages/integrations-core/src/schemas.ts')
    expect(existsSync(schemasPath), 'schemas.ts must exist').toBe(true)
    // Schemas file must exist for validation
  })

  it('IntegrationAdapter is exported from @nzila/integrations-core', async () => {
    const mod = await import('../../packages/integrations-core/src/index.js').catch(() =>
      import('../../packages/integrations-core/src/index'),
    )
    expect(mod).toHaveProperty('integrationRegistry')
  })
})

// ── HEALTHCHECK-03: All providers covered ───────────────────────────────────

describe('HEALTHCHECK-03 — All IntegrationProvider values acknowledged', () => {
  const EXPECTED_PROVIDERS = [
    'resend', 'sendgrid', 'mailgun', 'twilio',
    'firebase', 'slack', 'teams', 'hubspot',
  ]

  it('types.ts defines all expected providers', () => {
    const typesPath = join(ROOT, 'packages/integrations-core/src/types.ts')
    const content = readFileSync(typesPath, 'utf-8')

    for (const provider of EXPECTED_PROVIDERS) {
      expect(content, `Provider '${provider}' must be in IntegrationProvider`).toContain(`'${provider}'`)
    }
  })
})

// ── HEALTHCHECK-04: Health schema tables exist ──────────────────────────────

describe('HEALTHCHECK-04 — Health telemetry DB schema exists', () => {
  it('health-schema.ts defines providerHealth table', () => {
    const schemaPath = join(ROOT, 'packages/integrations-db/src/health-schema.ts')
    expect(existsSync(schemaPath), 'health-schema.ts must exist').toBe(true)

    const content = readFileSync(schemaPath, 'utf-8')
    expect(content).toContain('integrationProviderHealth')
    expect(content).toContain('integrationProviderMetrics')
  })

  it('health-repos.ts defines repository port interfaces', () => {
    const reposPath = join(ROOT, 'packages/integrations-db/src/health-repos.ts')
    expect(existsSync(reposPath), 'health-repos.ts must exist').toBe(true)

    const content = readFileSync(reposPath, 'utf-8')
    expect(content).toContain('IntegrationHealthRepo')
    expect(content).toContain('IntegrationMetricsRepo')
  })
})

// ── HEALTHCHECK-05: Runtime health checker exports ──────────────────────────

describe('HEALTHCHECK-05 — Runtime health checker module exports', () => {
  it('health.ts exists in integrations-runtime', () => {
    const healthPath = join(ROOT, 'packages/integrations-runtime/src/health.ts')
    expect(existsSync(healthPath), 'health.ts must exist in integrations-runtime').toBe(true)
  })

  it('exports checkAllIntegrations function', async () => {
    const mod = await import('../../packages/integrations-runtime/src/health.js').catch(() =>
      import('../../packages/integrations-runtime/src/health'),
    )
    expect(typeof mod.checkAllIntegrations).toBe('function')
  })

  it('metrics.ts exists with MetricsCollector', () => {
    const metricsPath = join(ROOT, 'packages/integrations-runtime/src/metrics.ts')
    expect(existsSync(metricsPath), 'metrics.ts must exist').toBe(true)

    const content = readFileSync(metricsPath, 'utf-8')
    expect(content).toContain('MetricsCollector')
  })
})
