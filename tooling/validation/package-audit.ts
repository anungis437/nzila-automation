/**
 * Package Audit — scans every workspace package for structural health.
 *
 * Checks per package:
 *   1. package.json exists & is valid JSON
 *   2. Has "name" field matching @nzila/* convention
 *   3. Has "type": "module"
 *   4. Has "exports" (or "main") field
 *   5. Entry file referenced by exports actually exists
 *   6. Has test script
 *   7. Has at least one test file (*.test.ts)
 *   8. Has README.md
 *   9. tsconfig.json exists
 *  10. No circular workspace dependencies (deferred)
 *  11. Dependencies reference workspace:* for internal packages
 *  12. Registered in vitest.config.ts test projects
 *
 * Output: reports/package-audit.json + reports/package-audit.md
 */

import { readFileSync, readdirSync, existsSync, writeFileSync, mkdirSync, statSync } from 'node:fs'
import { join, resolve, relative, basename } from 'node:path'

// ────────────────────────────────────────────────────────────────────
// Types
// ────────────────────────────────────────────────────────────────────

interface PackageCheck {
  check: string
  passed: boolean
  detail: string
}

interface PackageAuditResult {
  name: string
  dir: string
  checks: PackageCheck[]
  score: number        // 0–100
  passCount: number
  failCount: number
  grade: 'A' | 'B' | 'C' | 'D' | 'F'
}

interface AuditSummary {
  timestamp: string
  totalPackages: number
  overallScore: number
  overallGrade: 'A' | 'B' | 'C' | 'D' | 'F'
  gradeDistribution: Record<string, number>
  criticalFindings: string[]
  packages: PackageAuditResult[]
}

// ────────────────────────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────────────────────────

const ROOT = resolve(import.meta.dirname, '..', '..')

function grade(score: number): 'A' | 'B' | 'C' | 'D' | 'F' {
  if (score >= 90) return 'A'
  if (score >= 80) return 'B'
  if (score >= 70) return 'C'
  if (score >= 60) return 'D'
  return 'F'
}

function findTestFiles(dir: string): string[] {
  const results: string[] = []
  const srcDir = join(dir, 'src')
  if (!existsSync(srcDir)) return results

  function walk(d: string) {
    for (const entry of readdirSync(d, { withFileTypes: true })) {
      if (entry.isDirectory() && entry.name !== 'node_modules') {
        walk(join(d, entry.name))
      } else if (entry.isFile() && /\.(test|spec)\.(ts|tsx|js|jsx)$/.test(entry.name)) {
        results.push(join(d, entry.name))
      }
    }
  }
  walk(srcDir)
  return results
}

function loadVitestProjects(): Set<string> {
  const configPath = join(ROOT, 'vitest.config.ts')
  if (!existsSync(configPath)) return new Set()
  const content = readFileSync(configPath, 'utf-8')
  const dirs = new Set<string>()
  // Match workspace('packages/...') or workspace('apps/...')
  const re = /workspace\(\s*['"]([^'"]+)['"]\s*\)/g
  let m: RegExpExecArray | null
  while ((m = re.exec(content)) !== null) dirs.add(m[1])
  return dirs
}

// ────────────────────────────────────────────────────────────────────
// Audit logic
// ────────────────────────────────────────────────────────────────────

function auditPackage(pkgDir: string, vitestProjects: Set<string>): PackageAuditResult | null {
  const pkgJsonPath = join(pkgDir, 'package.json')
  const checks: PackageCheck[] = []
  const relDir = relative(ROOT, pkgDir).replace(/\\/g, '/')

  // 1. package.json exists & valid
  if (!existsSync(pkgJsonPath)) {
    return null // skip dirs without package.json
  }

  let pkg: Record<string, unknown>
  try {
    pkg = JSON.parse(readFileSync(pkgJsonPath, 'utf-8'))
    checks.push({ check: 'package.json valid', passed: true, detail: 'Valid JSON' })
  } catch {
    checks.push({ check: 'package.json valid', passed: false, detail: 'Invalid JSON — parse error' })
    return {
      name: relDir,
      dir: relDir,
      checks,
      score: 0,
      passCount: 0,
      failCount: 1,
      grade: 'F',
    }
  }

  const name = (pkg.name as string) ?? '(unnamed)'

  // 2. Naming convention
  const hasNzilaName = typeof pkg.name === 'string' && pkg.name.startsWith('@nzila/')
  checks.push({
    check: '@nzila/* naming',
    passed: hasNzilaName,
    detail: hasNzilaName ? name : `Name "${name}" does not follow @nzila/* convention`,
  })

  // 3. ESM type
  const isModule = pkg.type === 'module'
  checks.push({
    check: '"type": "module"',
    passed: isModule,
    detail: isModule ? 'ESM' : `type = "${pkg.type ?? '(missing)'}"`,
  })

  // 4. Has exports or main
  const hasExports = !!pkg.exports || !!pkg.main
  checks.push({
    check: 'Has exports/main',
    passed: hasExports,
    detail: hasExports
      ? pkg.exports ? 'Has "exports" field' : 'Has "main" field'
      : 'Missing both "exports" and "main"',
  })

  // 5. Entry file exists
  let entryExists = false
  if (typeof pkg.exports === 'string') {
    entryExists = existsSync(join(pkgDir, pkg.exports))
  } else if (typeof pkg.exports === 'object' && pkg.exports !== null) {
    const exps = pkg.exports as Record<string, unknown>
    const dot = exps['.']
    const entry = typeof dot === 'string' ? dot : (typeof dot === 'object' && dot !== null ? (dot as Record<string, unknown>).import ?? (dot as Record<string, unknown>).default : null)
    if (typeof entry === 'string') {
      entryExists = existsSync(join(pkgDir, entry))
    }
  } else if (typeof pkg.main === 'string') {
    entryExists = existsSync(join(pkgDir, pkg.main as string))
  }
  checks.push({
    check: 'Entry file exists',
    passed: entryExists || !hasExports,
    detail: entryExists ? 'Entry file found' : hasExports ? 'Entry file missing on disk' : 'N/A (no exports)',
  })

  // 6. Has test script
  const scripts = (pkg.scripts as Record<string, string>) ?? {}
  const hasTestScript = !!scripts.test
  checks.push({
    check: 'Has test script',
    passed: hasTestScript,
    detail: hasTestScript ? `test: "${scripts.test}"` : 'No "test" script in package.json',
  })

  // 7. Has test files
  const testFiles = findTestFiles(pkgDir)
  const hasTests = testFiles.length > 0
  checks.push({
    check: 'Has test files',
    passed: hasTests,
    detail: hasTests ? `${testFiles.length} test file(s)` : 'No *.test.ts files under src/',
  })

  // 8. Has README
  const hasReadme = existsSync(join(pkgDir, 'README.md'))
  checks.push({
    check: 'Has README.md',
    passed: hasReadme,
    detail: hasReadme ? 'Present' : 'Missing',
  })

  // 9. tsconfig.json
  const hasTsconfig = existsSync(join(pkgDir, 'tsconfig.json'))
  checks.push({
    check: 'Has tsconfig.json',
    passed: hasTsconfig,
    detail: hasTsconfig ? 'Present' : 'Missing',
  })

  // 10. Internal deps use workspace:*
  const deps = { ...(pkg.dependencies as Record<string, string> ?? {}), ...(pkg.devDependencies as Record<string, string> ?? {}) }
  const internalDeps = Object.entries(deps).filter(([k]) => k.startsWith('@nzila/'))
  const badInternalDeps = internalDeps.filter(([, v]) => v !== 'workspace:*')
  const workspaceDepsOk = badInternalDeps.length === 0
  checks.push({
    check: 'workspace:* for internals',
    passed: workspaceDepsOk,
    detail: workspaceDepsOk
      ? `${internalDeps.length} internal dep(s), all workspace:*`
      : `Non-workspace internal deps: ${badInternalDeps.map(([k, v]) => `${k}@${v}`).join(', ')}`,
  })

  // 11. Registered in vitest.config.ts
  const inVitest = vitestProjects.has(relDir)
  checks.push({
    check: 'In vitest.config.ts',
    passed: inVitest,
    detail: inVitest ? 'Registered' : 'Not registered in root vitest.config.ts',
  })

  const passCount = checks.filter(c => c.passed).length
  const failCount = checks.filter(c => !c.passed).length
  const score = Math.round((passCount / checks.length) * 100)

  return {
    name,
    dir: relDir,
    checks,
    score,
    passCount,
    failCount,
    grade: grade(score),
  }
}

// ────────────────────────────────────────────────────────────────────
// Discovery
// ────────────────────────────────────────────────────────────────────

function discoverPackages(): string[] {
  const dirs: string[] = []

  function scan(parent: string) {
    if (!existsSync(parent)) return
    for (const entry of readdirSync(parent, { withFileTypes: true })) {
      if (!entry.isDirectory()) continue
      if (entry.name === 'node_modules' || entry.name === '.git') continue
      const candidate = join(parent, entry.name)
      if (existsSync(join(candidate, 'package.json'))) {
        dirs.push(candidate)
      }
    }
  }

  scan(join(ROOT, 'packages'))
  scan(join(ROOT, 'apps'))
  scan(join(ROOT, 'tooling'))
  return dirs.sort()
}

// ────────────────────────────────────────────────────────────────────
// Main
// ────────────────────────────────────────────────────────────────────

function main() {
  const vitestProjects = loadVitestProjects()
  const packageDirs = discoverPackages()
  const results: PackageAuditResult[] = []

  for (const dir of packageDirs) {
    const result = auditPackage(dir, vitestProjects)
    if (result) results.push(result)
  }

  results.sort((a, b) => a.score - b.score) // worst first

  const overallScore = Math.round(results.reduce((s, r) => s + r.score, 0) / results.length)
  const gradeDistribution: Record<string, number> = { A: 0, B: 0, C: 0, D: 0, F: 0 }
  for (const r of results) gradeDistribution[r.grade]++

  const criticalFindings: string[] = []
  for (const r of results) {
    if (r.grade === 'F') criticalFindings.push(`${r.name}: Grade F (${r.score}%)`)
    for (const c of r.checks) {
      if (!c.passed && (c.check === 'package.json valid' || c.check === 'Entry file exists')) {
        criticalFindings.push(`${r.name}: ${c.check} — ${c.detail}`)
      }
    }
  }

  const summary: AuditSummary = {
    timestamp: new Date().toISOString(),
    totalPackages: results.length,
    overallScore,
    overallGrade: grade(overallScore),
    gradeDistribution,
    criticalFindings,
    packages: results,
  }

  // Write JSON
  const reportsDir = join(ROOT, 'reports')
  mkdirSync(reportsDir, { recursive: true })
  writeFileSync(join(reportsDir, 'package-audit.json'), JSON.stringify(summary, null, 2))

  // Write Markdown
  const md = generateMarkdown(summary)
  writeFileSync(join(reportsDir, 'package-audit.md'), md)

  // Console summary
  console.log(`\n${'═'.repeat(60)}`)
  console.log(`  PACKAGE AUDIT REPORT`)
  console.log(`${'═'.repeat(60)}`)
  console.log(`  Packages scanned:  ${summary.totalPackages}`)
  console.log(`  Overall score:     ${summary.overallScore}% (${summary.overallGrade})`)
  console.log(`  Grade distribution: A=${gradeDistribution.A} B=${gradeDistribution.B} C=${gradeDistribution.C} D=${gradeDistribution.D} F=${gradeDistribution.F}`)
  if (summary.criticalFindings.length > 0) {
    console.log(`\n  Critical findings (${summary.criticalFindings.length}):`)
    for (const f of summary.criticalFindings) console.log(`    ⛔ ${f}`)
  }
  console.log(`\n  Reports written to reports/package-audit.json + .md`)
  console.log(`${'═'.repeat(60)}\n`)
}

function generateMarkdown(s: AuditSummary): string {
  const lines: string[] = []
  lines.push('# Package Audit Report')
  lines.push('')
  lines.push(`**Generated:** ${s.timestamp}`)
  lines.push(`**Packages scanned:** ${s.totalPackages}`)
  lines.push(`**Overall score:** ${s.overallScore}% (${s.overallGrade})`)
  lines.push('')
  lines.push('## Grade Distribution')
  lines.push('')
  lines.push('| Grade | Count |')
  lines.push('|-------|-------|')
  for (const [g, c] of Object.entries(s.gradeDistribution)) {
    lines.push(`| ${g} | ${c} |`)
  }
  lines.push('')

  if (s.criticalFindings.length > 0) {
    lines.push('## Critical Findings')
    lines.push('')
    for (const f of s.criticalFindings) lines.push(`- ⛔ ${f}`)
    lines.push('')
  }

  lines.push('## Package Details')
  lines.push('')
  lines.push('| Package | Score | Grade | Pass | Fail | Failures |')
  lines.push('|---------|-------|-------|------|------|----------|')
  for (const r of s.packages) {
    const failures = r.checks.filter(c => !c.passed).map(c => c.check).join(', ') || '—'
    lines.push(`| ${r.name} | ${r.score}% | ${r.grade} | ${r.passCount} | ${r.failCount} | ${failures} |`)
  }
  lines.push('')

  // Failed checks detail
  const failedPkgs = s.packages.filter(p => p.failCount > 0)
  if (failedPkgs.length > 0) {
    lines.push('## Failure Details')
    lines.push('')
    for (const p of failedPkgs) {
      const fails = p.checks.filter(c => !c.passed)
      if (fails.length === 0) continue
      lines.push(`### ${p.name}`)
      lines.push('')
      for (const c of fails) {
        lines.push(`- **${c.check}**: ${c.detail}`)
      }
      lines.push('')
    }
  }

  return lines.join('\n')
}

main()
