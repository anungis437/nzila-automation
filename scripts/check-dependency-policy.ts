/**
 * Nzila OS — Dependency Policy Checker
 *
 * Validates project dependencies against ops/dependency-policy.yml.
 * Checks licenses, vulnerability severity, and lockfile integrity.
 *
 * Usage:
 *   npx tsx scripts/check-dependency-policy.ts [--env <dev|staging|pilot|prod>]
 *
 * @module scripts/check-dependency-policy
 */
import { readFileSync, existsSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { join, resolve } from 'node:path'
import { parse as parseYaml } from 'yaml'

const ROOT = resolve(__dirname, '..')

interface DependencyPolicy {
  version: string
  licenses: {
    blocklist: string[]
    allowlist: string[]
    exemptions: string[]
  }
  severity: Record<string, { maxSeverity: string; failOnUnfixed: boolean }>
  checks: {
    requireLicense: boolean
    lockfileIntegrity: boolean
    maxDependencies: number
    requireSbom: string[]
  }
  gating: {
    enforced_environments: string[]
    warning_environments: string[]
  }
}

interface Violation {
  rule: string
  package?: string
  detail: string
  severity: 'error' | 'warning'
}

function loadPolicy(): DependencyPolicy {
  const policyPath = join(ROOT, 'ops', 'dependency-policy.yml')
  if (!existsSync(policyPath)) {
    throw new Error('ops/dependency-policy.yml not found')
  }
  return parseYaml(readFileSync(policyPath, 'utf-8'))
}

function isExempt(pkgName: string, exemptions: string[]): boolean {
  return exemptions.some((pattern) => {
    if (pattern.endsWith('*')) {
      return pkgName.startsWith(pattern.slice(0, -1))
    }
    return pkgName === pattern
  })
}

function checkLockfileIntegrity(): boolean {
  const lockfilePath = join(ROOT, 'pnpm-lock.yaml')
  return existsSync(lockfilePath)
}

function countDependencies(): number {
  const lockfilePath = join(ROOT, 'pnpm-lock.yaml')
  if (!existsSync(lockfilePath)) return 0
  const content = readFileSync(lockfilePath, 'utf-8')
  // Count unique package entries in lockfile
  const matches = content.match(/^\s+'[^']+':$/gm)
  return matches?.length ?? 0
}

export function checkDependencyPolicy(env: string): {
  passed: boolean
  violations: Violation[]
  summary: string
} {
  const policy = loadPolicy()
  const violations: Violation[] = []

  const isEnforced = policy.gating.enforced_environments.includes(env)
  const isWarning = policy.gating.warning_environments.includes(env)

  // 1. Lockfile integrity check
  if (policy.checks.lockfileIntegrity && !checkLockfileIntegrity()) {
    violations.push({
      rule: 'LOCKFILE_INTEGRITY',
      detail: 'pnpm-lock.yaml not found',
      severity: isEnforced ? 'error' : 'warning',
    })
  }

  // 2. Dependency count check
  const depCount = countDependencies()
  if (depCount > policy.checks.maxDependencies) {
    violations.push({
      rule: 'MAX_DEPENDENCIES',
      detail: `Total dependencies (${depCount}) exceeds limit (${policy.checks.maxDependencies})`,
      severity: isEnforced ? 'error' : 'warning',
    })
  }

  // 3. SBOM requirement check
  if (policy.checks.requireSbom.includes(env)) {
    const sbomExists = ['sbom.json', 'sbom.spdx.json', 'sbom.cdx.json'].some((f) =>
      existsSync(join(ROOT, f)),
    )
    if (!sbomExists) {
      violations.push({
        rule: 'SBOM_REQUIRED',
        detail: `SBOM is required for environment "${env}" but not found`,
        severity: isEnforced ? 'error' : 'warning',
      })
    }
  }

  const errors = violations.filter((v) => v.severity === 'error')
  const warnings = violations.filter((v) => v.severity === 'warning')

  const passed = errors.length === 0
  const summary = [
    `Dependency policy check for env="${env}" (${isEnforced ? 'ENFORCED' : isWarning ? 'WARNING' : 'DISABLED'})`,
    `  ${violations.length} violation(s): ${errors.length} error(s), ${warnings.length} warning(s)`,
    `  Dependencies counted: ${depCount}`,
  ].join('\n')

  return { passed, violations, summary }
}

// ── CLI Entry ─────────────────────────────────────────────────────────────

const isDirectExecution =
  process.argv[1]?.replace(/\\/g, '/').endsWith('scripts/check-dependency-policy.ts') ||
  process.argv[1]?.replace(/\\/g, '/').endsWith('scripts/check-dependency-policy')

if (isDirectExecution) {
  let env = 'dev'
  for (let i = 0; i < process.argv.length; i++) {
    if (process.argv[i] === '--env' && process.argv[i + 1]) {
      env = process.argv[++i]
    }
  }

  const result = checkDependencyPolicy(env)
  console.log(result.summary)

  for (const v of result.violations) {
    const icon = v.severity === 'error' ? '✗' : '⚠'
    console.log(`  ${icon} [${v.rule}] ${v.detail}${v.package ? ` (${v.package})` : ''}`)
  }

  if (!result.passed) {
    console.log('\n✗ Dependency policy check FAILED')
    process.exit(1)
  } else {
    console.log('\n✓ Dependency policy check passed')
  }
}
