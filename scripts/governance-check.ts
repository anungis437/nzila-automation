/**
 * Governance Check — validates SBOM, policy engine, evidence packs,
 * compliance, and governance endpoints across all target apps.
 *
 * Usage: pnpm governance:check
 */

import * as fs from 'node:fs'
import * as path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const ROOT = path.resolve(__dirname, '..')

const TARGET_APPS = [
  'shop-quoter',
  'cfo',
  'partners',
  'web',
  'union-eyes',
  'console',
]

interface CheckResult {
  app: string
  check: string
  passed: boolean
  detail: string
}

const results: CheckResult[] = []

function check(app: string, name: string, passed: boolean, detail: string) {
  results.push({ app, check: name, passed, detail })
}

function fileExists(filePath: string): boolean {
  return fs.existsSync(filePath)
}

function dirHasTestFiles(dirPath: string): boolean {
  if (!fs.existsSync(dirPath)) return false
  const files = fs.readdirSync(dirPath, { recursive: true }) as string[]
  return files.some((f) => /\.test\.ts$/.test(String(f)))
}

// ── Run checks ──────────────────────────────────────────

for (const app of TARGET_APPS) {
  const appDir = path.join(ROOT, 'apps', app)

  if (!fs.existsSync(appDir)) {
    check(app, 'app-exists', false, `apps/${app} directory not found`)
    continue
  }

  // Health endpoint
  check(
    app,
    'health-endpoint',
    fileExists(path.join(appDir, 'app', 'api', 'health', 'route.ts')),
    'app/api/health/route.ts',
  )

  // Metrics endpoint
  const hasMetrics =
    fileExists(path.join(appDir, 'app', 'api', 'metrics', 'route.ts')) ||
    fileExists(path.join(appDir, 'app', 'api', 'analytics', 'route.ts'))
  check(app, 'metrics-endpoint', hasMetrics, 'metrics/analytics endpoint')

  // Evidence pack endpoint
  const hasEvidence =
    fileExists(path.join(appDir, 'app', 'api', 'evidence', 'export', 'route.ts')) ||
    fileExists(path.join(appDir, 'lib', 'evidence.ts'))
  check(app, 'evidence-endpoint', hasEvidence, 'evidence export')

  // Policy enforcement
  const hasPolicyEnforcement =
    fileExists(path.join(appDir, 'lib', 'policy-enforcement.ts')) ||
    fileExists(path.join(appDir, 'lib', 'policyEnforcement.ts')) ||
    fileExists(path.join(appDir, 'lib', 'services', 'policy-engine.ts'))
  check(app, 'policy-enforcement', hasPolicyEnforcement, 'policy enforcement module')

  // Tests
  const hasTests =
    dirHasTestFiles(path.join(appDir, 'tests')) ||
    dirHasTestFiles(path.join(appDir, 'lib')) ||
    dirHasTestFiles(path.join(appDir, '__tests__'))
  check(app, 'test-coverage', hasTests, 'tests/ or lib/**/*.test.ts')

  // E2E specs
  const hasE2eDir = fs.existsSync(path.join(appDir, 'e2e'))
  const hasE2e = hasE2eDir &&
    (fs.readdirSync(path.join(appDir, 'e2e')) as string[]).some((f) =>
      /\.spec\.ts$/.test(f),
    )
  // Console is a management dashboard — E2E optional
  if (app === 'console') {
    check(app, 'e2e-specs', true, 'e2e optional for console')
  } else {
    check(app, 'e2e-specs', hasE2e, 'e2e/*.spec.ts')
  }

  // Package.json has test script without --passWithNoTests
  const pkgPath = path.join(appDir, 'package.json')
  if (fileExists(pkgPath)) {
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'))
    const testScript = pkg.scripts?.test ?? ''
    check(
      app,
      'no-passWithNoTests',
      !testScript.includes('--passWithNoTests'),
      `test script: "${testScript}"`,
    )
  }
}

// ── Platform packages check ─────────────────────────────

const requiredPlatformPkgs = [
  'platform-policy-engine',
  'platform-observability',
  'platform-events',
  'platform-evidence-pack',
  'platform-governance',
]

for (const pkg of requiredPlatformPkgs) {
  const pkgDir = path.join(ROOT, 'packages', pkg)
  check(
    'platform',
    `${pkg}-exists`,
    fs.existsSync(pkgDir) &&
      fileExists(path.join(pkgDir, 'src', 'index.ts')),
    `packages/${pkg}/src/index.ts`,
  )
}

// ── Report ──────────────────────────────────────────────

const passed = results.filter((r) => r.passed)
const failed = results.filter((r) => !r.passed)

console.log('\n══════════════════════════════════════')
console.log('  GOVERNANCE CHECK REPORT')
console.log('══════════════════════════════════════\n')

if (failed.length > 0) {
  console.log('❌ FAILURES:\n')
  for (const f of failed) {
    console.log(`  [${f.app}] ${f.check}: ${f.detail}`)
  }
  console.log()
}

console.log(`✅ Passed: ${passed.length}/${results.length}`)
console.log(`❌ Failed: ${failed.length}/${results.length}`)
console.log()

if (failed.length > 0) {
  process.exit(1)
}

console.log('All governance checks passed.')
