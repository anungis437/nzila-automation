/**
 * Contract Test — Dependency Policy Gated
 *
 * Structural invariant: A dependency policy must exist and a check script
 * must enforce lockfile integrity, license allowlisting, and dependency
 * count limits.
 *
 * @invariant DEPENDENCY_POLICY_GATED_004
 */
import { describe, it, expect } from 'vitest'
import { readFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'

const ROOT = join(__dirname, '..', '..')

describe('DEPENDENCY_POLICY_GATED_004 — Dependency supply-chain policy', () => {
  it('dependency-policy.yml exists', () => {
    const policyPath = join(ROOT, 'ops', 'dependency-policy.yml')
    expect(existsSync(policyPath), 'ops/dependency-policy.yml must exist').toBe(true)
  })

  it('dependency policy declares license blocklist', () => {
    const content = readFileSync(join(ROOT, 'ops', 'dependency-policy.yml'), 'utf-8')
    expect(content).toContain('blocklist')
    expect(content).toContain('GPL')
    expect(content).toContain('AGPL')
  })

  it('dependency policy declares severity thresholds', () => {
    const content = readFileSync(join(ROOT, 'ops', 'dependency-policy.yml'), 'utf-8')
    expect(content).toContain('severity')
    expect(content).toContain('maxSeverity')
  })

  it('dependency policy declares max dependency count', () => {
    const content = readFileSync(join(ROOT, 'ops', 'dependency-policy.yml'), 'utf-8')
    expect(content).toContain('maxDependencies')
  })

  it('check-dependency-policy.ts script exists', () => {
    const scriptPath = join(ROOT, 'scripts', 'check-dependency-policy.ts')
    expect(existsSync(scriptPath), 'scripts/check-dependency-policy.ts must exist').toBe(true)
  })

  it('check script exports checkDependencyPolicy function', () => {
    const content = readFileSync(join(ROOT, 'scripts', 'check-dependency-policy.ts'), 'utf-8')
    expect(content).toContain('checkDependencyPolicy')
  })

  it('check script validates lockfile integrity', () => {
    const content = readFileSync(join(ROOT, 'scripts', 'check-dependency-policy.ts'), 'utf-8')
    expect(content).toContain('lockfileIntegrity')
  })

  it('check script validates dependency count', () => {
    const content = readFileSync(join(ROOT, 'scripts', 'check-dependency-policy.ts'), 'utf-8')
    expect(content).toContain('maxDependencies')
  })
})
