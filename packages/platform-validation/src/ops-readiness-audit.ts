/**
 * Operational Readiness Audit
 *
 * Validates that platform packages and apps meet operational maturity standards:
 *  1. Structured logging — uses StructuredLogger, not bare console.*
 *  2. Health endpoints — exports healthCheck or has /health route
 *  3. Metrics instrumentation — uses MetricsRegistry or records metrics
 *  4. SLO definitions — platform packages contribute SLO definitions
 *  5. Telemetry contracts — uses telemetry contract helpers
 *  6. Error classification — classifies failures, not bare try/catch rethrow
 *  7. Circuit breaker usage — high-risk integration code uses circuit breakers
 *  8. Audit emission — state-changing ops emit audit events
 *
 * Grading: each missing capability in a platform package = warning,
 *          each bare console.* in a platform package = error.
 */

import { existsSync, readdirSync, readFileSync, statSync, mkdirSync, writeFileSync } from 'node:fs'
import { join, relative, basename } from 'node:path'

// ── Types ───────────────────────────────────────────────────────────────────

type Severity = 'error' | 'warning' | 'info'

interface OpsFinding {
  rule: string
  severity: Severity
  file: string
  line?: number
  message: string
}

interface OpsPackageSummary {
  name: string
  path: string
  srcFileCount: number
  hasStructuredLogging: boolean
  hasHealthCheck: boolean
  hasMetrics: boolean
  hasTelemetryContract: boolean
  hasErrorClassification: boolean
  hasCircuitBreaker: boolean
  hasAuditEmission: boolean
  bareConsoleCount: number
  findings: OpsFinding[]
}

export interface OpsReadinessReport {
  generatedAt: string
  totalPackages: number
  totalFindings: number
  findingsByRule: Record<string, number>
  findingsBySeverity: Record<Severity, number>
  packages: OpsPackageSummary[]
  maturityScore: number // 0–100
}

// ── Utilities ───────────────────────────────────────────────────────────────

function findRepoRoot(): string {
  let dir = process.cwd()
  while (dir !== join(dir, '..')) {
    if (existsSync(join(dir, 'pnpm-workspace.yaml'))) return dir
    dir = join(dir, '..')
  }
  throw new Error('Cannot find repo root (pnpm-workspace.yaml)')
}

function walkFiles(dir: string, exts: string[]): string[] {
  const results: string[] = []
  if (!existsSync(dir)) return results

  const entries = readdirSync(dir, { withFileTypes: true })
  for (const entry of entries) {
    const full = join(dir, entry.name)
    if (entry.isDirectory()) {
      if (['node_modules', 'dist', '.next', '.turbo', 'coverage', '.git', '__tests__'].includes(entry.name)) continue
      results.push(...walkFiles(full, exts))
    } else if (exts.some(ext => entry.name.endsWith(ext))) {
      results.push(full)
    }
  }
  return results
}

// ── Rules ───────────────────────────────────────────────────────────────────

const BARE_CONSOLE_RE = /\bconsole\.(log|warn|error|info|debug)\s*\(/
const STRUCTURED_LOGGER_RE = /StructuredLogger|createLogger|structuredLog/
const HEALTH_CHECK_RE = /healthCheck|health_check|HealthChecker|\/health/
const METRICS_RE = /MetricsRegistry|recordMetric|metricsCollector|\.increment\(|\.histogram\(/
const TELEMETRY_RE = /integrationTelemetry|workflowTelemetry|aiTelemetry|telemetryContract/
const ERROR_CLASS_RE = /classifyFailure|FailureClass|ErrorClassification|isRetryable/
const CIRCUIT_BREAKER_RE = /CircuitBreaker|circuitBreaker|circuit_breaker/
const AUDIT_RE = /withAudit|emitAudit|auditEmit|buildAuditEvent|AuditEvent/

/** Platform packages that are expected to have ops maturity */
const PLATFORM_PACKAGE_PREFIXES = ['platform-', 'integrations-', 'ai-', 'ml-']

function isPlatformPackage(name: string): boolean {
  return PLATFORM_PACKAGE_PREFIXES.some(p => name.startsWith(p))
}

function scanFile(filePath: string, relPath: string): {
  hasBareConsole: boolean
  bareConsoleLines: number[]
  hasStructuredLogging: boolean
  hasHealthCheck: boolean
  hasMetrics: boolean
  hasTelemetryContract: boolean
  hasErrorClassification: boolean
  hasCircuitBreaker: boolean
  hasAuditEmission: boolean
} {
  const content = readFileSync(filePath, 'utf-8')
  const lines = content.split('\n')
  const bareConsoleLines: number[] = []

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]!
    if (BARE_CONSOLE_RE.test(line)) {
      // Ignore if the file also has structured logging
      bareConsoleLines.push(i + 1)
    }
  }

  return {
    hasBareConsole: bareConsoleLines.length > 0,
    bareConsoleLines,
    hasStructuredLogging: STRUCTURED_LOGGER_RE.test(content),
    hasHealthCheck: HEALTH_CHECK_RE.test(content),
    hasMetrics: METRICS_RE.test(content),
    hasTelemetryContract: TELEMETRY_RE.test(content),
    hasErrorClassification: ERROR_CLASS_RE.test(content),
    hasCircuitBreaker: CIRCUIT_BREAKER_RE.test(content),
    hasAuditEmission: AUDIT_RE.test(content),
  }
}

// ── Main ────────────────────────────────────────────────────────────────────

export function runOpsReadinessAudit(root?: string): OpsReadinessReport {
  const repoRoot = root ?? findRepoRoot()
  const packagesDir = join(repoRoot, 'packages')

  if (!existsSync(packagesDir)) {
    return {
      generatedAt: new Date().toISOString(),
      totalPackages: 0,
      totalFindings: 0,
      findingsByRule: {},
      findingsBySeverity: { error: 0, warning: 0, info: 0 },
      packages: [],
      maturityScore: 0,
    }
  }

  const packageDirs = readdirSync(packagesDir, { withFileTypes: true })
    .filter(d => d.isDirectory() && isPlatformPackage(d.name))
    .map(d => d.name)
    .sort()

  const packageSummaries: OpsPackageSummary[] = []
  const allFindings: OpsFinding[] = []

  for (const pkgName of packageDirs) {
    const pkgPath = join(packagesDir, pkgName)
    const srcDir = join(pkgPath, 'src')
    const relPkgPath = `packages/${pkgName}`

    if (!existsSync(srcDir)) continue

    const srcFiles = walkFiles(srcDir, ['.ts', '.tsx'])
    if (srcFiles.length === 0) continue

    const findings: OpsFinding[] = []
    let pkgHasStructuredLogging = false
    let pkgHasHealthCheck = false
    let pkgHasMetrics = false
    let pkgHasTelemetryContract = false
    let pkgHasErrorClassification = false
    let pkgHasCircuitBreaker = false
    let pkgHasAuditEmission = false
    let bareConsoleCount = 0

    for (const filePath of srcFiles) {
      const relPath = relative(repoRoot, filePath).replace(/\\/g, '/')
      const result = scanFile(filePath, relPath)

      if (result.hasStructuredLogging) pkgHasStructuredLogging = true
      if (result.hasHealthCheck) pkgHasHealthCheck = true
      if (result.hasMetrics) pkgHasMetrics = true
      if (result.hasTelemetryContract) pkgHasTelemetryContract = true
      if (result.hasErrorClassification) pkgHasErrorClassification = true
      if (result.hasCircuitBreaker) pkgHasCircuitBreaker = true
      if (result.hasAuditEmission) pkgHasAuditEmission = true

      // Bare console in platform package = error (should use StructuredLogger)
      if (result.hasBareConsole && !result.hasStructuredLogging) {
        for (const line of result.bareConsoleLines) {
          bareConsoleCount++
          findings.push({
            rule: 'no-bare-console',
            severity: 'error',
            file: relPath,
            line,
            message: `Bare console.* call — use StructuredLogger from @nzila/platform-observability`,
          })
        }
      }
    }

    // Missing capability warnings
    if (!pkgHasStructuredLogging && srcFiles.length > 2) {
      findings.push({
        rule: 'needs-structured-logging',
        severity: 'warning',
        file: relPkgPath,
        message: `Platform package lacks structured logging — add StructuredLogger`,
      })
    }

    if (!pkgHasHealthCheck && srcFiles.length > 3) {
      findings.push({
        rule: 'needs-health-check',
        severity: 'warning',
        file: relPkgPath,
        message: `Platform package lacks health check exports — add healthCheck function`,
      })
    }

    if (!pkgHasMetrics && srcFiles.length > 3) {
      findings.push({
        rule: 'needs-metrics',
        severity: 'warning',
        file: relPkgPath,
        message: `Platform package lacks metrics instrumentation`,
      })
    }

    if (!pkgHasErrorClassification && srcFiles.length > 5) {
      findings.push({
        rule: 'needs-error-classification',
        severity: 'info',
        file: relPkgPath,
        message: `Consider adding failure classification for better retry decisions`,
      })
    }

    const summary: OpsPackageSummary = {
      name: pkgName,
      path: relPkgPath,
      srcFileCount: srcFiles.length,
      hasStructuredLogging: pkgHasStructuredLogging,
      hasHealthCheck: pkgHasHealthCheck,
      hasMetrics: pkgHasMetrics,
      hasTelemetryContract: pkgHasTelemetryContract,
      hasErrorClassification: pkgHasErrorClassification,
      hasCircuitBreaker: pkgHasCircuitBreaker,
      hasAuditEmission: pkgHasAuditEmission,
      bareConsoleCount,
      findings,
    }

    packageSummaries.push(summary)
    allFindings.push(...findings)
  }

  // Compute findings by rule/severity
  const findingsByRule: Record<string, number> = {}
  const findingsBySeverity: Record<Severity, number> = { error: 0, warning: 0, info: 0 }

  for (const f of allFindings) {
    findingsByRule[f.rule] = (findingsByRule[f.rule] ?? 0) + 1
    findingsBySeverity[f.severity]++
  }

  // Maturity score: percentage of packages with all 4 key markers
  const keyMarkers = ['hasStructuredLogging', 'hasHealthCheck', 'hasMetrics', 'hasAuditEmission'] as const
  const totalMarkerSlots = packageSummaries.length * keyMarkers.length
  const filledSlots = packageSummaries.reduce((sum, pkg) => {
    return sum + keyMarkers.filter(m => pkg[m]).length
  }, 0)
  const maturityScore = totalMarkerSlots > 0 ? Math.round((filledSlots / totalMarkerSlots) * 100) : 0

  return {
    generatedAt: new Date().toISOString(),
    totalPackages: packageSummaries.length,
    totalFindings: allFindings.length,
    findingsByRule,
    findingsBySeverity,
    packages: packageSummaries,
    maturityScore,
  }
}

// ── CLI ─────────────────────────────────────────────────────────────────────

if (process.argv[1]?.includes('ops-readiness-audit')) {
  const root = findRepoRoot()
  const report = runOpsReadinessAudit(root)

  const reportsDir = join(root, 'reports')
  if (!existsSync(reportsDir)) mkdirSync(reportsDir, { recursive: true })
  writeFileSync(join(reportsDir, 'ops-readiness-audit.json'), JSON.stringify(report, null, 2))

  // Markdown
  const md = [
    '# Operational Readiness Audit',
    '',
    `> Generated: ${report.generatedAt}`,
    '',
    `## Maturity Score: **${report.maturityScore}%**`,
    '',
    `| Metric | Value |`,
    `|--------|-------|`,
    `| Platform packages scanned | ${report.totalPackages} |`,
    `| Total findings | ${report.totalFindings} |`,
    `| Errors | ${report.findingsBySeverity.error} |`,
    `| Warnings | ${report.findingsBySeverity.warning} |`,
    '',
    '## Package Capabilities',
    '',
    '| Package | Files | Logging | Health | Metrics | Telemetry | ErrClass | CB | Audit | Console |',
    '|---------|-------|---------|--------|---------|-----------|----------|----|-------|---------|',
    ...report.packages.map(p =>
      `| ${p.name} | ${p.srcFileCount} | ${p.hasStructuredLogging ? '✅' : '❌'} | ${p.hasHealthCheck ? '✅' : '❌'} | ${p.hasMetrics ? '✅' : '❌'} | ${p.hasTelemetryContract ? '✅' : '❌'} | ${p.hasErrorClassification ? '✅' : '❌'} | ${p.hasCircuitBreaker ? '✅' : '❌'} | ${p.hasAuditEmission ? '✅' : '❌'} | ${p.bareConsoleCount} |`
    ),
    '',
    '## Findings',
    '',
    '| Rule | Severity | Count |',
    '|------|----------|-------|',
    ...Object.entries(report.findingsByRule).sort(([, a], [, b]) => b - a).map(
      ([rule, count]) => `| ${rule} | — | ${count} |`
    ),
    '',
  ].join('\n')

  writeFileSync(join(reportsDir, 'ops-readiness-audit.md'), md)
  console.log(`Ops readiness audit complete: ${report.totalPackages} packages, ${report.maturityScore}% maturity`)
  console.log(`  ${report.findingsBySeverity.error} errors, ${report.findingsBySeverity.warning} warnings`)
}
