import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { existsSync, mkdirSync, writeFileSync, rmSync } from 'node:fs'
import { join } from 'node:path'
import { runOpsReadinessAudit } from '../ops-readiness-audit.js'

// ── Test fixtures ───────────────────────────────────────────────────────────

const TEMP_ROOT = join(process.cwd(), '__ops-audit-test-root__')

function setupFixture(packages: Record<string, Record<string, string>>) {
  if (existsSync(TEMP_ROOT)) rmSync(TEMP_ROOT, { recursive: true })
  mkdirSync(TEMP_ROOT, { recursive: true })
  writeFileSync(join(TEMP_ROOT, 'pnpm-workspace.yaml'), 'packages:\n  - packages/*\n')

  const pkgRoot = join(TEMP_ROOT, 'packages')
  mkdirSync(pkgRoot, { recursive: true })

  for (const [pkgName, files] of Object.entries(packages)) {
    const pkgDir = join(pkgRoot, pkgName)
    const srcDir = join(pkgDir, 'src')
    mkdirSync(srcDir, { recursive: true })

    for (const [fileName, content] of Object.entries(files)) {
      writeFileSync(join(srcDir, fileName), content)
    }
  }
}

function cleanupFixture() {
  if (existsSync(TEMP_ROOT)) rmSync(TEMP_ROOT, { recursive: true })
}

// ── Tests ───────────────────────────────────────────────────────────────────

describe('ops-readiness-audit', () => {
  afterEach(cleanupFixture)

  it('returns empty report for missing packages dir', () => {
    const tempDir = join(process.cwd(), '__empty-test__')
    mkdirSync(tempDir, { recursive: true })
    writeFileSync(join(tempDir, 'pnpm-workspace.yaml'), '')
    try {
      const report = runOpsReadinessAudit(tempDir)
      expect(report.totalPackages).toBe(0)
      expect(report.maturityScore).toBe(0)
    } finally {
      rmSync(tempDir, { recursive: true })
    }
  })

  it('skips non-platform packages', () => {
    setupFixture({
      'some-utility': {
        'index.ts': 'export const foo = 1;\nconsole.log("hello")\n',
      },
    })
    const report = runOpsReadinessAudit(TEMP_ROOT)
    expect(report.totalPackages).toBe(0)
  })

  it('detects bare console.* as errors in platform packages', () => {
    setupFixture({
      'platform-foo': {
        'index.ts': 'export const x = 1;\n',
        'service.ts': 'console.log("oops");\nconsole.error("bad");\n',
        'util.ts': 'export function y() { return 2; }\n',
      },
    })
    const report = runOpsReadinessAudit(TEMP_ROOT)
    expect(report.totalPackages).toBe(1)
    const pkg = report.packages[0]!
    expect(pkg.bareConsoleCount).toBe(2)
    expect(report.findingsBySeverity.error).toBe(2)
  })

  it('no bare-console error when StructuredLogger is present in same file', () => {
    setupFixture({
      'platform-bar': {
        'index.ts': 'export const x = 1;\n',
        'service.ts':
          'import { StructuredLogger } from "@nzila/platform-observability";\nconsole.log("debug");\n',
        'util.ts': 'export function y() { return 2; }\n',
      },
    })
    const report = runOpsReadinessAudit(TEMP_ROOT)
    const pkg = report.packages[0]!
    // The bare console finding should be suppressed when the same file uses StructuredLogger
    expect(pkg.bareConsoleCount).toBe(0)
  })

  it('detects missing structured logging', () => {
    setupFixture({
      'platform-baz': {
        'a.ts': 'export const a = 1;\n',
        'b.ts': 'export const b = 2;\n',
        'c.ts': 'export const c = 3;\n',
      },
    })
    const report = runOpsReadinessAudit(TEMP_ROOT)
    const logging = report.packages[0]!.findings.find(f => f.rule === 'needs-structured-logging')
    expect(logging).toBeDefined()
    expect(logging!.severity).toBe('warning')
  })

  it('detects missing health check', () => {
    setupFixture({
      'platform-health-test': {
        'a.ts': 'export const a = 1;\n',
        'b.ts': 'export const b = 2;\n',
        'c.ts': 'export const c = 3;\n',
        'd.ts': 'export const d = 4;\n',
      },
    })
    const report = runOpsReadinessAudit(TEMP_ROOT)
    const health = report.packages[0]!.findings.find(f => f.rule === 'needs-health-check')
    expect(health).toBeDefined()
    expect(health!.severity).toBe('warning')
  })

  it('recognises all ops maturity markers', () => {
    setupFixture({
      'platform-mature': {
        'index.ts': 'export const x = 1;\n',
        'logging.ts': 'import { StructuredLogger } from "@nzila/platform-observability";\n',
        'health.ts': 'export function healthCheck() { return true; }\n',
        'metrics.ts': 'const collector = new MetricsRegistry();\n',
        'telemetry.ts': 'import { integrationTelemetry } from "@nzila/platform-observability";\n',
        'errors.ts': 'import { classifyFailure } from "@nzila/platform-ops";\n',
        'circuit.ts': 'import { CircuitBreaker } from "@nzila/integrations-runtime";\n',
        'audit.ts': 'export function withAudit() {}\n',
      },
    })
    const report = runOpsReadinessAudit(TEMP_ROOT)
    const pkg = report.packages[0]!
    expect(pkg.hasStructuredLogging).toBe(true)
    expect(pkg.hasHealthCheck).toBe(true)
    expect(pkg.hasMetrics).toBe(true)
    expect(pkg.hasTelemetryContract).toBe(true)
    expect(pkg.hasErrorClassification).toBe(true)
    expect(pkg.hasCircuitBreaker).toBe(true)
    expect(pkg.hasAuditEmission).toBe(true)
    expect(pkg.bareConsoleCount).toBe(0)
  })

  it('computes maturity score correctly', () => {
    // Package with all 4 key markers: 100%
    setupFixture({
      'platform-full': {
        'index.ts': 'export const x = 1;\n',
        'log.ts': 'const logger = new StructuredLogger();\n',
        'health.ts': 'export function healthCheck() {}\n',
        'met.ts': 'const m = new MetricsRegistry();\n',
        'aud.ts': 'export function withAudit() {}\n',
      },
    })
    const report = runOpsReadinessAudit(TEMP_ROOT)
    expect(report.maturityScore).toBe(100)
  })

  it('computes partial maturity score', () => {
    // Package with 2/4 key markers: 50%
    setupFixture({
      'platform-half': {
        'index.ts': 'export const x = 1;\n',
        'log.ts': 'const logger = new StructuredLogger();\n',
        'health.ts': 'export function healthCheck() {}\n',
      },
    })
    const report = runOpsReadinessAudit(TEMP_ROOT)
    expect(report.maturityScore).toBe(50)
  })

  it('scans integrations- and ai- prefixed packages', () => {
    setupFixture({
      'integrations-foo': {
        'index.ts': 'export const x = 1;\n',
      },
      'ai-bar': {
        'index.ts': 'export const y = 2;\n',
      },
    })
    const report = runOpsReadinessAudit(TEMP_ROOT)
    expect(report.totalPackages).toBe(2)
    expect(report.packages.map(p => p.name).sort()).toEqual(['ai-bar', 'integrations-foo'])
  })
})
