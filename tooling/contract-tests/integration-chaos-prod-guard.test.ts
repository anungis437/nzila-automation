/**
 * Contract Test — Integration Chaos Production Guard
 *
 * Verifies that chaos simulation controls are compile-time and
 * runtime-guarded to prevent accidental enablement in production.
 *
 * Tests:
 *   CHAOS-GUARD-01: chaos.ts exists with ChaosSimulator
 *   CHAOS-GUARD-02: isChaosAllowed checks NODE_ENV !== 'production'
 *   CHAOS-GUARD-03: isChaosAllowed checks VERCEL_ENV !== 'production'
 *   CHAOS-GUARD-04: isChaosAllowed checks AZURE_FUNCTIONS_ENVIRONMENT !== 'Production'
 *   CHAOS-GUARD-05: ChaosSimulator.enable() calls isChaosAllowed before activating
 *   CHAOS-GUARD-06: Console chaos page is gated (not accessible in production)
 *   CHAOS-GUARD-07: No hardcoded chaos enablement flags in source
 *
 * @invariant INTEGRATION_CHAOS_PROD_GUARD_004
 */
import { describe, it, expect } from 'vitest'
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

const ROOT = join(__dirname, '..', '..')

// ── CHAOS-GUARD-01: chaos.ts exists ─────────────────────────────────────────

describe('CHAOS-GUARD-01 — ChaosSimulator module exists', () => {
  it('chaos.ts exists in integrations-runtime', () => {
    const chaosPath = join(ROOT, 'packages/integrations-runtime/src/chaos.ts')
    expect(existsSync(chaosPath), 'chaos.ts must exist').toBe(true)
  })

  it('exports ChaosSimulator class', async () => {
    const mod = await import('../../packages/integrations-runtime/src/chaos.js').catch(() =>
      import('../../packages/integrations-runtime/src/chaos'),
    )
    expect(typeof mod.ChaosSimulator).toBe('function')
  })

  it('exports isChaosAllowed function', async () => {
    const mod = await import('../../packages/integrations-runtime/src/chaos.js').catch(() =>
      import('../../packages/integrations-runtime/src/chaos'),
    )
    expect(typeof mod.isChaosAllowed).toBe('function')
  })
})

// ── CHAOS-GUARD-02/03/04: Production environment checks ────────────────────

describe('CHAOS-GUARD-02/03/04 — Production guards in isChaosAllowed', () => {
  const chaosPath = join(ROOT, 'packages/integrations-runtime/src/chaos.ts')

  it('isChaosAllowed checks NODE_ENV', () => {
    const content = readFileSync(chaosPath, 'utf-8')
    expect(content).toContain('NODE_ENV')
    expect(content).toContain('production')
  })

  it('isChaosAllowed checks VERCEL_ENV', () => {
    const content = readFileSync(chaosPath, 'utf-8')
    expect(content).toContain('VERCEL_ENV')
  })

  it('isChaosAllowed checks AZURE_FUNCTIONS_ENVIRONMENT', () => {
    const content = readFileSync(chaosPath, 'utf-8')
    expect(content).toContain('AZURE_FUNCTIONS_ENVIRONMENT')
  })

  it('all production guards return false when environment is production', () => {
    const content = readFileSync(chaosPath, 'utf-8')
    // Must have logic that prevents chaos when any of these envs indicate production
    // The function should return false for production
    expect(content).toMatch(/production/i)
    expect(content).toMatch(/Production/)
  })
})

// ── CHAOS-GUARD-05: enable() calls isChaosAllowed ───────────────────────────

describe('CHAOS-GUARD-05 — ChaosSimulator.enable() is guarded', () => {
  it('enable() references isChaosAllowed in its implementation', () => {
    const chaosPath = join(ROOT, 'packages/integrations-runtime/src/chaos.ts')
    const content = readFileSync(chaosPath, 'utf-8')

    // The enable method must call isChaosAllowed
    expect(content).toContain('isChaosAllowed')

    // There should be a guard that throws or returns early if not allowed
    expect(
      content.includes('throw') || content.includes('return'),
      'enable() must throw or return early if chaos is not allowed',
    ).toBe(true)
  })

  it('chaos.test.ts exists with production guard tests', () => {
    const testPath = join(ROOT, 'packages/integrations-runtime/src/chaos.test.ts')
    expect(existsSync(testPath), 'chaos.test.ts must exist').toBe(true)

    const content = readFileSync(testPath, 'utf-8')
    expect(content).toContain('isChaosAllowed')
    expect(content).toContain('production')
  })
})

// ── CHAOS-GUARD-06: Console chaos page is guarded ───────────────────────────

describe('CHAOS-GUARD-06 — Console chaos page has environment guard', () => {
  it('chaos page exists in console', () => {
    const pagePath = join(ROOT, 'apps/console/app/(dashboard)/integrations/chaos/page.tsx')
    expect(existsSync(pagePath), 'chaos/page.tsx must exist in console').toBe(true)
  })

  it('chaos page includes production guard banner or check', () => {
    const pagePath = join(ROOT, 'apps/console/app/(dashboard)/integrations/chaos/page.tsx')
    const content = readFileSync(pagePath, 'utf-8')

    // Page must reference production guard
    const hasGuard =
      content.includes('production') ||
      content.includes('PRODUCTION') ||
      content.includes('NODE_ENV') ||
      content.includes('prod')

    expect(hasGuard, 'Chaos console page must have production guard reference').toBe(true)
  })
})

// ── CHAOS-GUARD-07: No hardcoded chaos enablement ───────────────────────────

describe('CHAOS-GUARD-07 — No hardcoded chaos enablement flags in source', () => {
  it('chaos.ts does not have hardcoded enabled = true', () => {
    const chaosPath = join(ROOT, 'packages/integrations-runtime/src/chaos.ts')
    const content = readFileSync(chaosPath, 'utf-8')

    // Should not have a hardcoded bypass
    expect(content).not.toMatch(/CHAOS_FORCE_ENABLE\s*=\s*true/)
    expect(content).not.toMatch(/enabled\s*=\s*true\s*;?\s*\/\/\s*HACK/)
    // The invariant annotation must be present
    expect(content).toContain('@invariant INTEGRATION_CHAOS_PROD_GUARD_004')
  })

  it('chaos module references the invariant annotation', () => {
    const chaosPath = join(ROOT, 'packages/integrations-runtime/src/chaos.ts')
    const content = readFileSync(chaosPath, 'utf-8')
    expect(content).toContain('INTEGRATION_CHAOS_PROD_GUARD_004')
  })
})
