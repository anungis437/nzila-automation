/**
 * Package Audit — NzilaOS Platform Validation
 *
 * Scans every package and app in the monorepo, classifies maturity,
 * and outputs structured JSON + Markdown reports.
 *
 * Run: pnpm validate:packages
 */

import { existsSync, readFileSync, readdirSync, statSync, writeFileSync, mkdirSync } from 'node:fs'
import { join, relative, basename } from 'node:path'

// ── Types ───────────────────────────────────────────────────────────────────

export type PackageMaturity =
  | 'production-ready'
  | 'functional'
  | 'scaffold-only'
  | 'deprecated'
  | 'unknown'

export interface PackageFinding {
  type: 'error' | 'warning' | 'info'
  message: string
}

export interface PackageAuditEntry {
  name: string
  path: string
  maturity: PackageMaturity
  hasReadme: boolean
  hasTests: boolean
  hasBarrelExport: boolean
  hasTypeConfig: boolean
  hasDependencies: boolean
  testFileCount: number
  srcFileCount: number
  findings: PackageFinding[]
  exports: string[]
  dependencies: string[]
  devDependencies: string[]
}

export interface PackageAuditReport {
  generatedAt: string
  totalPackages: number
  totalApps: number
  summary: Record<PackageMaturity, number>
  packages: PackageAuditEntry[]
  apps: PackageAuditEntry[]
  crossCutting: {
    circularDeps: string[][]
    orphanedPackages: string[]
    namingViolations: string[]
    duplicateResponsibilities: string[]
  }
}

// ── Utilities ───────────────────────────────────────────────────────────────

function findRepoRoot(): string {
  let dir = process.cwd()
  while (dir !== join(dir, '..')) {
    if (existsSync(join(dir, 'pnpm-workspace.yaml'))) return dir
    dir = join(dir, '..')
  }
  return process.cwd()
}

function countFiles(dir: string, ext: RegExp, exclude: string[] = ['node_modules', '.next', 'dist', 'coverage']): number {
  if (!existsSync(dir)) return 0
  let count = 0
  for (const entry of readdirSync(dir)) {
    if (exclude.includes(entry)) continue
    const full = join(dir, entry)
    try {
      const stat = statSync(full)
      if (stat.isDirectory()) count += countFiles(full, ext, exclude)
      else if (ext.test(entry)) count++
    } catch { /* skip inaccessible */ }
  }
  return count
}

function findTestFiles(dir: string): number {
  return countFiles(dir, /\.(test|spec)\.(ts|tsx|js)$/)
}

function findSrcFiles(dir: string): number {
  return countFiles(dir, /\.(ts|tsx)$/)
}

function safeReadJson(path: string): Record<string, unknown> | null {
  try {
    return JSON.parse(readFileSync(path, 'utf-8'))
  } catch { return null }
}

// ── Package Scanner ─────────────────────────────────────────────────────────

function auditPackage(pkgDir: string, root: string): PackageAuditEntry {
  const pkgJsonPath = join(pkgDir, 'package.json')
  const pkg = safeReadJson(pkgJsonPath) as Record<string, unknown> | null
  const relPath = relative(root, pkgDir).replace(/\\/g, '/')
  const isApp = relPath.startsWith('apps/')

  const findings: PackageFinding[] = []

  const name = (pkg?.name as string) ?? basename(pkgDir)
  const hasReadme = existsSync(join(pkgDir, 'README.md'))
  const hasTests = findTestFiles(pkgDir) > 0
  const testFileCount = findTestFiles(pkgDir)
  // Apps use app/, lib/, components/ — packages use src/
  const srcFileCount = isApp
    ? findSrcFiles(pkgDir) // count from root for apps (excludes node_modules etc.)
    : findSrcFiles(join(pkgDir, 'src'))
  const hasBarrelExport = isApp || existsSync(join(pkgDir, 'src', 'index.ts'))
  const hasTypeConfig = existsSync(join(pkgDir, 'tsconfig.json'))

  // Parse exports
  const exports: string[] = []
  if (pkg?.exports && typeof pkg.exports === 'object') {
    for (const key of Object.keys(pkg.exports as Record<string, unknown>)) {
      exports.push(key)
    }
  }

  // Parse deps
  const dependencies = Object.keys((pkg?.dependencies as Record<string, string>) ?? {})
  const devDependencies = Object.keys((pkg?.devDependencies as Record<string, string>) ?? {})
  const hasDependencies = dependencies.length > 0 || devDependencies.length > 0

  // ── Classify maturity ──
  if (!pkg) {
    findings.push({ type: 'error', message: 'Missing package.json' })
    return { name: basename(pkgDir), path: relPath, maturity: 'unknown', hasReadme, hasTests, hasBarrelExport, hasTypeConfig, hasDependencies, testFileCount, srcFileCount, findings, exports, dependencies, devDependencies }
  }

  // Check for explicit deprecated flag
  if (pkg.deprecated || name.includes('deprecated')) {
    findings.push({ type: 'info', message: 'Package marked as deprecated' })
    return { name, path: relPath, maturity: 'deprecated', hasReadme, hasTests, hasBarrelExport, hasTypeConfig, hasDependencies, testFileCount, srcFileCount, findings, exports, dependencies, devDependencies }
  }

  // Findings
  if (!hasReadme) findings.push({ type: 'info', message: 'Missing README.md' })
  if (!hasBarrelExport) findings.push({ type: 'info', message: 'Missing src/index.ts barrel export' })
  if (!hasTypeConfig) findings.push({ type: 'info', message: 'Missing tsconfig.json' })
  if (!hasTests) findings.push({ type: 'info', message: 'No test files found' })
  if (srcFileCount === 0 && !isApp) findings.push({ type: 'info', message: 'No source files in src/' })

  // Naming
  if (pkg.name && !(pkg.name as string).startsWith('@nzila/')) {
    findings.push({ type: 'info', message: `Package name "${pkg.name}" doesn't follow @nzila/ scope` })
  }

  // Type module
  if (pkg.type !== 'module') {
    findings.push({ type: 'info', message: 'Not using "type": "module"' })
  }

  // Maturity classification
  let maturity: PackageMaturity = 'unknown'
  if (srcFileCount === 0 && !isApp) {
    maturity = 'scaffold-only'
  } else if (isApp && srcFileCount > 0) {
    // Apps are functional if they have source files; production-ready if also README + tsconfig
    maturity = (hasReadme && hasTypeConfig) ? 'production-ready' : 'functional'
  } else if (hasTests && hasBarrelExport && hasReadme && hasTypeConfig) {
    maturity = 'production-ready'
  } else if (srcFileCount > 0) {
    maturity = 'functional'
  } else {
    maturity = 'scaffold-only'
  }

  return { name, path: relPath, maturity, hasReadme, hasTests, hasBarrelExport, hasTypeConfig, hasDependencies, testFileCount, srcFileCount, findings, exports, dependencies, devDependencies }
}

// ── Cross-cutting analysis ──────────────────────────────────────────────────

function detectCircularDeps(entries: PackageAuditEntry[]): string[][] {
  // Build adjacency from @nzila/* deps
  const graph = new Map<string, string[]>()
  for (const e of entries) {
    const nzilaDeps = e.dependencies.filter(d => d.startsWith('@nzila/'))
    graph.set(e.name, nzilaDeps)
  }

  const cycles: string[][] = []
  const visited = new Set<string>()
  const stack = new Set<string>()

  function dfs(node: string, path: string[]): void {
    if (stack.has(node)) {
      const cycleStart = path.indexOf(node)
      if (cycleStart !== -1) {
        cycles.push(path.slice(cycleStart).concat(node))
      }
      return
    }
    if (visited.has(node)) return
    visited.add(node)
    stack.add(node)
    for (const dep of graph.get(node) ?? []) {
      dfs(dep, [...path, node])
    }
    stack.delete(node)
  }

  for (const name of graph.keys()) dfs(name, [])
  return cycles
}

function findOrphanedPackages(entries: PackageAuditEntry[]): string[] {
  const allNames = new Set(entries.map(e => e.name))
  const referenced = new Set<string>()
  for (const e of entries) {
    for (const dep of e.dependencies) {
      if (dep.startsWith('@nzila/')) referenced.add(dep)
    }
    for (const dep of e.devDependencies) {
      if (dep.startsWith('@nzila/')) referenced.add(dep)
    }
  }
  // A package is orphaned if nothing depends on it and it's not an app
  return entries
    .filter(e => !referenced.has(e.name) && !e.path.startsWith('apps/'))
    .map(e => e.name)
}

function findNamingViolations(entries: PackageAuditEntry[]): string[] {
  const violations: string[] = []
  for (const e of entries) {
    if (!e.name.startsWith('@nzila/')) {
      violations.push(`${e.name}: missing @nzila/ scope`)
    }
    // Check kebab-case
    const slug = e.name.replace('@nzila/', '')
    if (slug !== slug.toLowerCase()) {
      violations.push(`${e.name}: not lowercase`)
    }
    if (/[^a-z0-9-]/.test(slug)) {
      violations.push(`${e.name}: contains non-kebab characters`)
    }
  }
  return violations
}

function findDuplicateResponsibilities(entries: PackageAuditEntry[]): string[] {
  const duplicates: string[] = []

  // Group by likely functional area
  const areaMap = new Map<string, string[]>()
  for (const e of entries) {
    const slug = e.name.replace('@nzila/', '')
    // Extract core concept: last segment after last hyphen
    const words = slug.split('-')
    for (const word of words) {
      if (['core', 'db', 'events', 'test', 'tests', 'integration'].includes(word)) continue
      if (!areaMap.has(word)) areaMap.set(word, [])
      areaMap.get(word)!.push(e.name)
    }
  }

  for (const [area, pkgs] of areaMap) {
    if (pkgs.length > 3 && !['platform', 'commerce', 'nzila', 'agri', 'trade', 'mobility'].includes(area)) {
      duplicates.push(`Area "${area}" has ${pkgs.length} packages: ${pkgs.join(', ')}`)
    }
  }
  return duplicates
}

// ── Report Generation ───────────────────────────────────────────────────────

function generateMarkdown(report: PackageAuditReport): string {
  const lines: string[] = []
  lines.push('# NzilaOS Package Audit Report')
  lines.push('')
  lines.push(`> Generated: ${report.generatedAt}`)
  lines.push('')
  lines.push('## Summary')
  lines.push('')
  lines.push(`| Metric | Count |`)
  lines.push(`|--------|-------|`)
  lines.push(`| Total Packages | ${report.totalPackages} |`)
  lines.push(`| Total Apps | ${report.totalApps} |`)
  lines.push(`| Production-Ready | ${report.summary['production-ready']} |`)
  lines.push(`| Functional | ${report.summary['functional']} |`)
  lines.push(`| Scaffold-Only | ${report.summary['scaffold-only']} |`)
  lines.push(`| Deprecated | ${report.summary['deprecated']} |`)
  lines.push(`| Unknown | ${report.summary['unknown']} |`)
  lines.push('')

  // Maturity breakdown
  const maturityOrder: PackageMaturity[] = ['production-ready', 'functional', 'scaffold-only', 'deprecated', 'unknown']
  for (const m of maturityOrder) {
    const items = report.packages.filter(p => p.maturity === m)
    if (items.length === 0) continue
    lines.push(`## Packages — ${m} (${items.length})`)
    lines.push('')
    lines.push('| Package | Tests | README | Barrel | Findings |')
    lines.push('|---------|-------|--------|--------|----------|')
    for (const p of items) {
      const testBadge = p.hasTests ? `${p.testFileCount} files` : 'NONE'
      const findings = p.findings.filter(f => f.type !== 'info').length
      lines.push(`| ${p.name} | ${testBadge} | ${p.hasReadme ? '✓' : '✗'} | ${p.hasBarrelExport ? '✓' : '✗'} | ${findings} |`)
    }
    lines.push('')
  }

  // Apps
  lines.push(`## Apps (${report.totalApps})`)
  lines.push('')
  lines.push('| App | Tests | README | Findings |')
  lines.push('|-----|-------|--------|----------|')
  for (const a of report.apps) {
    const testBadge = a.hasTests ? `${a.testFileCount} files` : 'NONE'
    const findings = a.findings.filter(f => f.type !== 'info').length
    lines.push(`| ${a.name} | ${testBadge} | ${a.hasReadme ? '✓' : '✗'} | ${findings} |`)
  }
  lines.push('')

  // Cross-cutting
  lines.push('## Cross-Cutting Analysis')
  lines.push('')

  if (report.crossCutting.circularDeps.length > 0) {
    lines.push('### ⚠ Circular Dependencies')
    for (const cycle of report.crossCutting.circularDeps) {
      lines.push(`- ${cycle.join(' → ')}`)
    }
    lines.push('')
  } else {
    lines.push('### Circular Dependencies: None detected')
    lines.push('')
  }

  if (report.crossCutting.namingViolations.length > 0) {
    lines.push('### ⚠ Naming Violations')
    for (const v of report.crossCutting.namingViolations) {
      lines.push(`- ${v}`)
    }
    lines.push('')
  }

  if (report.crossCutting.orphanedPackages.length > 0) {
    lines.push('### Orphaned Packages (nothing depends on them)')
    for (const o of report.crossCutting.orphanedPackages) {
      lines.push(`- ${o}`)
    }
    lines.push('')
  }

  if (report.crossCutting.duplicateResponsibilities.length > 0) {
    lines.push('### Potential Duplicate Responsibilities')
    for (const d of report.crossCutting.duplicateResponsibilities) {
      lines.push(`- ${d}`)
    }
    lines.push('')
  }

  // Detailed findings
  const withFindings = [...report.packages, ...report.apps].filter(p => p.findings.length > 0)
  if (withFindings.length > 0) {
    lines.push('## Detailed Findings')
    lines.push('')
    for (const p of withFindings) {
      lines.push(`### ${p.name}`)
      for (const f of p.findings) {
        const icon = f.type === 'error' ? '🔴' : f.type === 'warning' ? '🟡' : 'ℹ️'
        lines.push(`- ${icon} ${f.message}`)
      }
      lines.push('')
    }
  }

  return lines.join('\n')
}

// ── Main ────────────────────────────────────────────────────────────────────

export function runPackageAudit(root?: string): PackageAuditReport {
  const repoRoot = root ?? findRepoRoot()
  const packagesDir = join(repoRoot, 'packages')
  const appsDir = join(repoRoot, 'apps')

  // Scan packages
  const packageDirs = existsSync(packagesDir)
    ? readdirSync(packagesDir)
        .map(d => join(packagesDir, d))
        .filter(d => statSync(d).isDirectory() && existsSync(join(d, 'package.json')))
    : []

  const appDirs = existsSync(appsDir)
    ? readdirSync(appsDir)
        .map(d => join(appsDir, d))
        .filter(d => statSync(d).isDirectory() && existsSync(join(d, 'package.json')))
    : []

  const packages = packageDirs.map(d => auditPackage(d, repoRoot))
  const apps = appDirs.map(d => auditPackage(d, repoRoot))
  const allEntries = [...packages, ...apps]

  const summary: Record<PackageMaturity, number> = {
    'production-ready': 0,
    'functional': 0,
    'scaffold-only': 0,
    'deprecated': 0,
    'unknown': 0,
  }
  for (const p of packages) summary[p.maturity]++

  const report: PackageAuditReport = {
    generatedAt: new Date().toISOString(),
    totalPackages: packages.length,
    totalApps: apps.length,
    summary,
    packages,
    apps,
    crossCutting: {
      circularDeps: detectCircularDeps(allEntries),
      orphanedPackages: findOrphanedPackages(allEntries),
      namingViolations: findNamingViolations(allEntries),
      duplicateResponsibilities: findDuplicateResponsibilities(allEntries),
    },
  }

  return report
}

// ── CLI entry ───────────────────────────────────────────────────────────────

if (process.argv[1]?.includes('package-audit')) {
  const root = findRepoRoot()
  const reportsDir = join(root, 'reports')
  if (!existsSync(reportsDir)) mkdirSync(reportsDir, { recursive: true })

  console.log('🔍 Running NzilaOS Package Audit...\n')
  const report = runPackageAudit(root)

  writeFileSync(join(reportsDir, 'package-audit.json'), JSON.stringify(report, null, 2))
  writeFileSync(join(reportsDir, 'package-audit.md'), generateMarkdown(report))

  // Print summary
  console.log(`Packages: ${report.totalPackages}  |  Apps: ${report.totalApps}`)
  console.log(`  Production-ready: ${report.summary['production-ready']}`)
  console.log(`  Functional:       ${report.summary['functional']}`)
  console.log(`  Scaffold-only:    ${report.summary['scaffold-only']}`)
  console.log(`  Deprecated:       ${report.summary['deprecated']}`)
  console.log(`  Unknown:          ${report.summary['unknown']}`)
  console.log(`\nCross-cutting:`)
  console.log(`  Circular deps:    ${report.crossCutting.circularDeps.length}`)
  console.log(`  Orphaned:         ${report.crossCutting.orphanedPackages.length}`)
  console.log(`  Naming issues:    ${report.crossCutting.namingViolations.length}`)
  console.log(`  Duplicates:       ${report.crossCutting.duplicateResponsibilities.length}`)

  const errorCount = [...report.packages, ...report.apps]
    .flatMap(p => p.findings)
    .filter(f => f.type === 'error').length

  console.log(`\n${errorCount === 0 ? '✅ No critical errors' : `🔴 ${errorCount} critical error(s) — see reports/package-audit.md`}`)
  console.log(`\nReports written to reports/package-audit.json and reports/package-audit.md`)
}
