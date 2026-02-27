/**
 * Contract Test — Integration Dispatcher Enforced
 *
 * Verifies that application code (apps/*) does not directly import
 * provider SDKs for integration channels that have been migrated to
 * the integrations-runtime dispatcher.
 *
 * Direct SDK usage bypasses:
 *   - Circuit breaker protection
 *   - Rate-limit awareness
 *   - Metrics / health telemetry
 *   - Audit trail
 *   - DLQ fail-safe
 *
 * Tests:
 *   DISPATCHER-01: No direct 'resend' SDK import in new apps (console, orchestrator-api, etc.)
 *   DISPATCHER-02: No direct 'twilio' SDK import in new apps
 *   DISPATCHER-03: No direct '@sendgrid/mail' SDK import in any app
 *   DISPATCHER-04: Dispatcher module exists and exports IntegrationDispatcher
 *   DISPATCHER-05: Dispatcher uses adapter registry (not hardcoded SDK calls)
 *
 * Note: apps/union-eyes and apps/cfo are known legacy exceptions —
 * they are tracked in the migration backlog (MIGRATION-001).
 *
 * @invariant INTEGRATION_DISPATCHER_ENFORCED_003
 */
import { describe, it, expect } from 'vitest'
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'

const ROOT = join(__dirname, '..', '..')
const APPS_DIR = join(ROOT, 'apps')

// Legacy apps excluded from the dispatcher mandate (tracked in migration backlog)
const LEGACY_EXCEPTIONS = new Set(['union-eyes', 'cfo'])

// SDK imports that should be routed through the dispatcher
const BANNED_SDK_IMPORTS = [
  /from\s+['"]resend['"]/,
  /from\s+['"]twilio['"]/,
  /from\s+['"]@sendgrid\/mail['"]/,
  /from\s+['"]@slack\/web-api['"]/,
  /require\s*\(\s*['"]resend['"]\s*\)/,
  /require\s*\(\s*['"]twilio['"]\s*\)/,
  /require\s*\(\s*['"]@sendgrid\/mail['"]\s*\)/,
]

// ── Helpers ─────────────────────────────────────────────────────────────────

function walkTs(dir: string, files: string[] = []): string[] {
  if (!existsSync(dir)) return files
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry)
    if (entry === 'node_modules' || entry === '.next' || entry === 'dist' || entry === '.turbo') continue
    try {
      const stat = statSync(full)
      if (stat.isDirectory()) {
        walkTs(full, files)
      } else if (/\.(ts|tsx|js|jsx|mjs|cjs)$/.test(entry)) {
        files.push(full)
      }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (_e) {
      // skip unreadable
    }
  }
  return files
}

// ── DISPATCHER-01/02/03: No direct SDK imports in non-legacy apps ───────────

describe('DISPATCHER-01/02/03 — No direct SDK imports in non-legacy apps', () => {
  const appDirs = existsSync(APPS_DIR) ? readdirSync(APPS_DIR).filter((d) => {
    const full = join(APPS_DIR, d)
    return statSync(full).isDirectory() && !LEGACY_EXCEPTIONS.has(d)
  }) : []

  for (const appName of appDirs) {
    it(`apps/${appName} — no banned SDK imports`, () => {
      const appDir = join(APPS_DIR, appName)
      const tsFiles = walkTs(appDir)
      const violations: string[] = []

      for (const file of tsFiles) {
        const content = readFileSync(file, 'utf-8')
        for (const pattern of BANNED_SDK_IMPORTS) {
          if (pattern.test(content)) {
            const rel = relative(ROOT, file)
            violations.push(`${rel} matches ${pattern.source}`)
          }
        }
      }

      expect(
        violations,
        `apps/${appName} must not directly import provider SDKs. ` +
        `Route through @nzila/integrations-runtime dispatcher instead.\n` +
        `Violations:\n${violations.join('\n')}`,
      ).toHaveLength(0)
    })
  }
})

// ── DISPATCHER-04: Dispatcher module exists ─────────────────────────────────

describe('DISPATCHER-04 — Dispatcher module exports IntegrationDispatcher', () => {
  it('dispatcher.ts exists in integrations-runtime', () => {
    const dispatcherPath = join(ROOT, 'packages/integrations-runtime/src/dispatcher.ts')
    expect(existsSync(dispatcherPath), 'dispatcher.ts must exist').toBe(true)
  })

  it('exports IntegrationDispatcher class', async () => {
    const mod = await import('../../packages/integrations-runtime/src/dispatcher.js').catch(() =>
      import('../../packages/integrations-runtime/src/dispatcher'),
    )
    expect(typeof mod.IntegrationDispatcher).toBe('function')
  })

  it('dispatcher uses adapter port pattern (not hardcoded SDK)', () => {
    const dispatcherPath = join(ROOT, 'packages/integrations-runtime/src/dispatcher.ts')
    const content = readFileSync(dispatcherPath, 'utf-8')

    // Must reference getAdapter port, not import SDKs directly
    expect(content).toContain('getAdapter')
    expect(content).not.toMatch(/from\s+['"]resend['"]/)
    expect(content).not.toMatch(/from\s+['"]twilio['"]/)
    expect(content).not.toMatch(/from\s+['"]@sendgrid\/mail['"]/)
  })
})

// ── DISPATCHER-05: Dispatcher uses adapter registry ─────────────────────────

describe('DISPATCHER-05 — Dispatcher uses dependency-injected adapter registry', () => {
  it('dispatcher.ts defines DispatcherPorts interface', () => {
    const dispatcherPath = join(ROOT, 'packages/integrations-runtime/src/dispatcher.ts')
    const content = readFileSync(dispatcherPath, 'utf-8')

    expect(content).toContain('DispatcherPorts')
    expect(content).toContain('getAdapter')
    expect(content).toContain('getCredentials')
    expect(content).toContain('recordDelivery')
    expect(content).toContain('emitAudit')
  })

  it('adapter registry exists in integrations-core', () => {
    const registryPath = join(ROOT, 'packages/integrations-core/src/registry.ts')
    expect(existsSync(registryPath), 'registry.ts must exist').toBe(true)

    const content = readFileSync(registryPath, 'utf-8')
    expect(content).toContain('IntegrationRegistry')
    expect(content).toContain('register')
    expect(content).toContain('getOrThrow')
  })
})
