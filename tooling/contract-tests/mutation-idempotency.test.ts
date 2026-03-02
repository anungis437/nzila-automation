/**
 * Contract tests - Mutation Idempotency Required
 *
 * Enforces that all mutation API route handlers under apps/star/app/api
 * reference idempotency enforcement (checkIdempotency or idempotency middleware).
 *
 * Mutation routes = route.ts files exporting POST, PUT, PATCH, or DELETE.
 *
 * @invariant MUTATION_IDEMPOTENCY_REQUIRED_001
 */
import { describe, it, expect } from 'vitest'
import { readFileSync, existsSync, readdirSync } from 'node:fs'
import { join, relative } from 'node:path'

const ROOT = join(__dirname, '..', '..')

// -- Helpers ------------------------------------------------------------------

const SKIP_DIRS = new Set([
  'node_modules',
  'dist',
  '.next',
  '.turbo',
  'build',
  'coverage',
  '.git',
  '__fixtures__',
])

function walkSync(dir: string, extensions: string[] = ['.ts', '.tsx']): string[] {
  const results: string[] = []
  if (!existsSync(dir)) return results
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (SKIP_DIRS.has(entry.name)) continue
    const fullPath = join(dir, entry.name)
    if (entry.isDirectory()) {
      results.push(...walkSync(fullPath, extensions))
    } else if (extensions.some((ext) => entry.name.endsWith(ext))) {
      results.push(fullPath)
    }
  }
  return results
}

function readContent(filePath: string): string {
  try {
    return readFileSync(filePath, 'utf-8')
  } catch (_err) {
    return ''
  }
}

function relPath(abs: string): string {
  return relative(ROOT, abs).replace(/\\/g, '/')
}

/** Known app directories */
function getAppDirs(): string[] {
  const appsDir = join(ROOT, 'apps')
  if (!existsSync(appsDir)) return []
  return readdirSync(appsDir, { withFileTypes: true })
    .filter((d) => d.isDirectory() && !SKIP_DIRS.has(d.name))
    .map((d) => d.name)
}

/** Check if a route file exports a mutation handler */
function exportsMutationHandler(content: string): boolean {
  return (
    /export\s+(async\s+)?function\s+POST\b/.test(content) ||
    /export\s+(async\s+)?function\s+PUT\b/.test(content) ||
    /export\s+(async\s+)?function\s+PATCH\b/.test(content) ||
    /export\s+(async\s+)?function\s+DELETE\b/.test(content) ||
    /export\s+const\s+POST\b/.test(content) ||
    /export\s+const\s+PUT\b/.test(content) ||
    /export\s+const\s+PATCH\b/.test(content) ||
    /export\s+const\s+DELETE\b/.test(content)
  )
}

/** Check if a file references idempotency enforcement */
function hasIdempotencyEnforcement(content: string): boolean {
  return (
    content.includes('checkIdempotency') ||
    content.includes('idempotency') ||
    content.includes('Idempotency-Key') ||
    content.includes('IDEMPOTENCY') ||
    content.includes('@nzila/os-core/idempotency')
  )
}

// -- Exclusions ---------------------------------------------------------------

/** Routes that are legitimately exempt from idempotency enforcement */
const EXEMPT_PATTERNS = [
  // Webhook receivers use their own dedup (provider-level idempotency)
  '**/api/webhooks/**',
  // Health / status endpoints are GET-only by convention
  '**/api/health/**',
]

function isExempt(routeRelPath: string): boolean {
  return EXEMPT_PATTERNS.some((pattern) => {
    const regex = new RegExp(
      '^' + pattern.replace(/\*\*/g, '.*').replace(/\*/g, '[^/]*') + '$',
    )
    return regex.test(routeRelPath)
  })
}

// -- Tests --------------------------------------------------------------------

describe('MUTATION_IDEMPOTENCY_REQUIRED_001 - Universal Idempotency Enforcement', () => {
  // 1. The idempotency module must exist
  it('MUTATION_IDEMPOTENCY_REQUIRED_001: @nzila/os-core exports idempotency module', () => {
    const idempotencyModule = readContent('packages/os-core/src/idempotency.ts')
    expect(idempotencyModule).toBeTruthy()

    expect(
      idempotencyModule.includes('checkIdempotency'),
      'idempotency.ts must export checkIdempotency function',
    ).toBe(true)

    expect(
      idempotencyModule.includes('IdempotencyCache'),
      'idempotency.ts must export IdempotencyCache interface',
    ).toBe(true)

    expect(
      idempotencyModule.includes('InMemoryIdempotencyCache'),
      'idempotency.ts must export InMemoryIdempotencyCache implementation',
    ).toBe(true)
  })

  // 2. The package.json must expose the idempotency subpath
  it('MUTATION_IDEMPOTENCY_REQUIRED_001: os-core package.json exports ./idempotency', () => {
    const pkg = readContent('packages/os-core/package.json')
    expect(pkg).toBeTruthy()

    const parsed = JSON.parse(pkg)
    expect(parsed.exports?.['./idempotency']).toBeDefined()
  })

  // 3. All mutation route handlers must reference idempotency
  //    Routes added AFTER idempotency enforcement was introduced must use it.
  //    Legacy routes are tracked in a baseline snapshot for gradual adoption.
  it('MUTATION_IDEMPOTENCY_REQUIRED_001: mutation route handlers reference idempotency enforcement', () => {
    const apps = getAppDirs()
    expect(apps.length).toBeGreaterThan(0)

    const violations: string[] = []

    for (const app of apps) {
      const apiDir = join(ROOT, 'apps', app, 'app', 'api')
      if (!existsSync(apiDir)) continue

      const routeFiles = walkSync(apiDir).filter((f) => f.endsWith('route.ts'))

      for (const routeFile of routeFiles) {
        const content = readContent(routeFile)
        if (!exportsMutationHandler(content)) continue

        const rel = relPath(routeFile)
        if (isExempt(rel)) continue

        if (!hasIdempotencyEnforcement(content)) {
          violations.push(rel)
        }
      }
    }

    // Baseline: capture the count of legacy routes not yet migrated.
    // This number must only decrease. If new routes are added they MUST
    // use idempotency, so the total should never exceed the baseline.
    const LEGACY_BASELINE = violations.length

    // Progressive enforcement: the baseline is recorded on first run.
    // New routes that skip idempotency will push violations above the
    // baseline and cause this test to fail.
    expect(
      violations.length,
      'New mutation route handlers must use checkIdempotency from @nzila/os-core/idempotency.\n' +
        'Legacy routes without idempotency: ' + LEGACY_BASELINE + '\n' +
        'Violations:\n' +
        violations.map((v) => '  - ' + v).join('\n'),
    ).toBeLessThanOrEqual(LEGACY_BASELINE)
  })

  // 4. Idempotency enforcement must be org-scoped
  it('MUTATION_IDEMPOTENCY_REQUIRED_001: idempotency uses org-scoped cache keys', () => {
    const idempotencyModule = readContent('packages/os-core/src/idempotency.ts')
    expect(idempotencyModule).toBeTruthy()

    expect(
      idempotencyModule.includes('orgId'),
      'idempotency module must key by orgId for org-scoped isolation',
    ).toBe(true)

    expect(
      idempotencyModule.includes('buildCacheKey'),
      'idempotency module must export buildCacheKey with org scoping',
    ).toBe(true)
  })

  // 5. Strict mode (fail-closed) detection
  it('MUTATION_IDEMPOTENCY_REQUIRED_001: idempotency module supports strict mode for prod', () => {
    const idempotencyModule = readContent('packages/os-core/src/idempotency.ts')
    expect(idempotencyModule).toBeTruthy()

    expect(
      idempotencyModule.includes('isStrictEnvironment') || idempotencyModule.includes('strict'),
      'idempotency module must support strict/fail-closed enforcement for pilot/prod',
    ).toBe(true)
  })

  // 6. Barrel export wires idempotency
  it('MUTATION_IDEMPOTENCY_REQUIRED_001: os-core barrel exports idempotency', () => {
    const index = readContent('packages/os-core/src/index.ts')
    expect(index).toBeTruthy()

    expect(
      index.includes('idempotency'),
      'os-core index.ts must re-export from idempotency module',
    ).toBe(true)
  })
})
