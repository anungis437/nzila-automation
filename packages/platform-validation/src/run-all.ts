/**
 * Run All Audits — orchestrator
 *
 * Runs package, architecture, claim, and doc consistency audits in sequence,
 * then produces a unified scorecard.
 */

import { existsSync, mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { runPackageAudit } from './package-audit.js'
import { runArchitectureAudit } from './architecture-audit.js'
import { runClaimVerification } from './claim-verification.js'
import { runDocConsistency } from './doc-consistency.js'

// ── Types ───────────────────────────────────────────────────────────────────

interface ScorecardEntry {
  dimension: string
  score: string
  errors: number
  warnings: number
  notes: string
}

interface Scorecard {
  generatedAt: string
  overallGrade: string
  dimensions: ScorecardEntry[]
  blockers: string[]
  recommendations: string[]
}

// ── Grading ─────────────────────────────────────────────────────────────────

function grade(errors: number, warnings: number): string {
  if (errors === 0 && warnings === 0) return 'A+'
  if (errors === 0 && warnings <= 3) return 'A'
  if (errors === 0 && warnings <= 10) return 'A-'
  if (errors === 0 && warnings <= 25) return 'B+'
  if (errors === 0) return 'B'
  if (errors <= 3) return 'C+'
  if (errors <= 10) return 'C'
  if (errors <= 20) return 'D'
  return 'F'
}

function overallGrade(dimensions: ScorecardEntry[]): string {
  const gradeValues: Record<string, number> = { 'A+': 4.3, A: 4, 'A-': 3.7, 'B+': 3.3, B: 3, 'C+': 2.3, C: 2, D: 1, F: 0 }
  const avg = dimensions.reduce((sum, d) => sum + (gradeValues[d.score] ?? 0), 0) / dimensions.length
  if (avg >= 4.3) return 'A+'
  if (avg >= 3.85) return 'A'
  if (avg >= 3.5) return 'A-'
  if (avg >= 3.0) return 'B+'
  if (avg >= 2.5) return 'B'
  if (avg >= 2.0) return 'C+'
  if (avg >= 1.5) return 'C'
  if (avg >= 1.0) return 'D'
  return 'F'
}

// ── Main ────────────────────────────────────────────────────────────────────

function findRepoRoot(): string {
  let dir = process.cwd()
  while (dir !== join(dir, '..')) {
    if (existsSync(join(dir, 'pnpm-workspace.yaml'))) return dir
    dir = join(dir, '..')
  }
  throw new Error('Cannot find repo root')
}

if (process.argv[1]?.includes('run-all')) {
  const root = findRepoRoot()
  const reportsDir = join(root, 'reports')
  if (!existsSync(reportsDir)) mkdirSync(reportsDir, { recursive: true })

  console.log('═══════════════════════════════════════════════════════════')
  console.log('          NzilaOS Validation Suite — Full Run')
  console.log('═══════════════════════════════════════════════════════════\n')

  // 1. Package audit
  console.log('🔍 [1/4] Package Audit...')
  const pkgReport = runPackageAudit(root)
  writeFileSync(join(reportsDir, 'package-audit.json'), JSON.stringify(pkgReport, null, 2))
  const pkgErrors = [...pkgReport.packages, ...pkgReport.apps].flatMap(p => p.findings).filter(f => f.type === 'error').length
  const pkgWarnings = [...pkgReport.packages, ...pkgReport.apps].flatMap(p => p.findings).filter(f => f.type === 'warning').length
  console.log(`   ${pkgReport.totalPackages} packages, ${pkgReport.totalApps} apps — ${pkgErrors} errors, ${pkgWarnings} warnings\n`)

  // 2. Architecture audit
  console.log('🏗️  [2/4] Architecture Consistency...')
  const archReport = runArchitectureAudit(root)
  writeFileSync(join(reportsDir, 'architecture-audit.json'), JSON.stringify(archReport, null, 2))
  console.log(`   ${archReport.totalFiles} files — ${archReport.findingsBySeverity.error} errors, ${archReport.findingsBySeverity.warning} warnings\n`)

  // 3. Claim verification
  console.log('📋 [3/4] Claim Verification...')
  const claimReport = runClaimVerification(root)
  writeFileSync(join(reportsDir, 'claim-verification.json'), JSON.stringify(claimReport, null, 2))
  const claimErrors = claimReport.summary.unsupported
  const claimWarnings = claimReport.summary['docs-only']
  console.log(`   ${claimReport.totalClaims} claims — ${claimReport.summary.implemented} verified, ${claimErrors} unsupported, ${claimWarnings} docs-only\n`)

  // 4. Doc consistency
  console.log('📝 [4/4] Documentation Consistency...')
  const docReport = runDocConsistency(root)
  writeFileSync(join(reportsDir, 'doc-consistency.json'), JSON.stringify(docReport, null, 2))
  console.log(`   ${docReport.filesScanned} files — ${docReport.findingsBySeverity.error} errors, ${docReport.findingsBySeverity.warning} warnings\n`)

  // ── Derived metrics ────────────────────────────────────────────────────
  // Security: org-isolation errors + direct-provider-sdk violations
  const secRuleFindings = archReport.findings ?? []
  const secErrors = secRuleFindings.filter((f: { rule: string; severity: string }) => f.rule === 'org-isolation' && f.severity === 'error').length
  const secWarnings = secRuleFindings.filter((f: { rule: string; severity: string }) =>
    ['no-direct-provider-sdk'].includes(f.rule) && f.severity === 'warning').length

  // Governance: claim integrity + policy issues
  const govErrors = claimErrors
  const govWarnings = claimWarnings + claimReport.summary.partial

  // Testing: apps/packages without tests
  const allEntries = [...pkgReport.packages, ...pkgReport.apps]
  const productionAppsWithoutTests = pkgReport.apps.filter(a => !a.hasTests).length
  const platformPkgsWithoutTests = pkgReport.packages.filter(p =>
    p.path.startsWith('packages/platform-') && !p.hasTests && p.srcFileCount > 0
  ).length
  const testWarnings = productionAppsWithoutTests + platformPkgsWithoutTests

  // Portfolio: miscategorized maturity
  const scaffoldApps = pkgReport.apps.filter(a => a.maturity === 'scaffold-only').length
  const portfolioWarnings = scaffoldApps

  // Validation integrity: how many findings are suppressed at info level
  const totalInfo = (archReport.findingsBySeverity?.info ?? 0) + (docReport.findingsBySeverity?.info ?? 0) +
    allEntries.flatMap(p => p.findings).filter(f => f.type === 'info').length
  const integrityWarnings = totalInfo > 100 ? Math.floor(totalInfo / 100) : 0

  // ── Scorecard ─────────────────────────────────────────────────────────
  const dimensions: ScorecardEntry[] = [
    {
      dimension: 'Architecture',
      score: grade(archReport.findingsBySeverity.error, archReport.findingsBySeverity.warning),
      errors: archReport.findingsBySeverity.error,
      warnings: archReport.findingsBySeverity.warning,
      notes: `${archReport.totalFiles} files scanned`,
    },
    {
      dimension: 'Security',
      score: grade(secErrors, secWarnings),
      errors: secErrors,
      warnings: secWarnings,
      notes: `org-isolation + SDK boundary checks`,
    },
    {
      dimension: 'Governance',
      score: grade(govErrors, govWarnings),
      errors: govErrors,
      warnings: govWarnings,
      notes: `${claimReport.summary.implemented}/${claimReport.totalClaims} claims verified, ${claimReport.summary.partial} partial`,
    },
    {
      dimension: 'Documentation',
      score: grade(docReport.findingsBySeverity.error, docReport.findingsBySeverity.warning),
      errors: docReport.findingsBySeverity.error,
      warnings: docReport.findingsBySeverity.warning,
      notes: `${docReport.filesScanned} files scanned`,
    },
    {
      dimension: 'Portfolio Maturity',
      score: grade(pkgErrors, pkgWarnings + portfolioWarnings),
      errors: pkgErrors,
      warnings: pkgWarnings + portfolioWarnings,
      notes: `${pkgReport.summary['production-ready']} production-ready, ${pkgReport.summary['scaffold-only']} scaffold-only`,
    },
    {
      dimension: 'Test Coverage',
      score: grade(0, testWarnings),
      errors: 0,
      warnings: testWarnings,
      notes: `${productionAppsWithoutTests} apps without tests, ${platformPkgsWithoutTests} platform pkgs without tests`,
    },
    {
      dimension: 'Validation Integrity',
      score: grade(0, integrityWarnings),
      errors: 0,
      warnings: integrityWarnings,
      notes: `${totalInfo} info-level findings`,
    },
  ]

  const blockers: string[] = []
  if (pkgErrors > 0) blockers.push(`${pkgErrors} package-level errors`)
  if (archReport.findingsBySeverity.error > 0) blockers.push(`${archReport.findingsBySeverity.error} architecture violations`)
  if (claimErrors > 0) blockers.push(`${claimErrors} unsupported claims in buyer materials`)
  if (secErrors > 0) blockers.push(`${secErrors} security violations (org_id from body)`)

  const recommendations: string[] = []
  if (productionAppsWithoutTests > 0) recommendations.push(`${productionAppsWithoutTests} production apps lack test coverage`)
  if (platformPkgsWithoutTests > 0) recommendations.push(`${platformPkgsWithoutTests} platform packages lack test coverage`)
  if (pkgReport.summary['scaffold-only'] > 5) recommendations.push('Reduce scaffold-only packages — add tests or remove')
  if (pkgReport.crossCutting.circularDeps.length > 0) recommendations.push('Break circular dependency chains')
  if (claimReport.summary['docs-only'] > 0) recommendations.push(`Implement or remove ${claimReport.summary['docs-only']} docs-only claims`)
  if (claimReport.summary.partial > 0) recommendations.push(`Complete ${claimReport.summary.partial} partially-implemented claims`)
  if (docReport.findingsBySeverity.warning > 10) recommendations.push('Fix broken documentation links and stale references')

  const scorecard: Scorecard = {
    generatedAt: new Date().toISOString(),
    overallGrade: overallGrade(dimensions),
    dimensions,
    blockers,
    recommendations,
  }

  // Write scorecard
  writeFileSync(join(reportsDir, 'scorecard.json'), JSON.stringify(scorecard, null, 2))

  const scorecardMd = [
    '# NzilaOS Production Scorecard',
    '',
    `> Generated: ${scorecard.generatedAt}`,
    '',
    `## Overall Grade: **${scorecard.overallGrade}**`,
    '',
    '| Dimension | Grade | Errors | Warnings | Notes |',
    '|-----------|-------|--------|----------|-------|',
    ...dimensions.map(d => `| ${d.dimension} | **${d.score}** | ${d.errors} | ${d.warnings} | ${d.notes} |`),
    '',
    blockers.length > 0
      ? `## 🔴 Blockers\n\n${blockers.map(b => `- ${b}`).join('\n')}\n`
      : '## ✅ No Blockers\n',
    recommendations.length > 0
      ? `## Recommendations\n\n${recommendations.map(r => `- ${r}`).join('\n')}\n`
      : '',
  ].join('\n')

  writeFileSync(join(reportsDir, 'scorecard.md'), scorecardMd)

  // ── Severity Summary ────────────────────────────────────────────────
  const allErrors = dimensions.reduce((sum, d) => sum + d.errors, 0)
  const allWarnings = dimensions.reduce((sum, d) => sum + d.warnings, 0)

  const severitySummary = [
    '# Validation Severity Summary',
    '',
    `> Generated: ${scorecard.generatedAt}`,
    '',
    '## Severity Distribution',
    '',
    `| Severity | Count |`,
    `|----------|-------|`,
    `| ERROR    | ${allErrors} |`,
    `| WARNING  | ${allWarnings} |`,
    `| INFO     | ${totalInfo} |`,
    '',
    '## Findings by Dimension',
    '',
    '| Dimension | Errors | Warnings | Grade |',
    '|-----------|--------|----------|-------|',
    ...dimensions.map(d => `| ${d.dimension} | ${d.errors} | ${d.warnings} | ${d.score} |`),
    '',
    '## Severity Policy',
    '',
    '### ERROR — Must fail release',
    '- Unsupported platform claims in buyer-facing docs',
    '- Missing env validation in production apps',
    '- Missing request correlation ID in API handlers',
    '- Governance bypass on sensitive operations',
    '- Broken doc links in buyer-facing docs',
    '- org_id from request body (tenant isolation violation)',
    '',
    '### WARNING — Degrades score',
    '- Missing README for production-critical package',
    '- Production app without tests',
    '- Missing health route in production app',
    '- Missing audit hook coverage',
    '- API route without correlation ID',
    '- Config without Zod validation',
    '',
    '### INFO — Non-blocking',
    '- Style issues',
    '- Optional docs',
    '- Minor naming inconsistencies',
    '',
  ].join('\n')

  writeFileSync(join(reportsDir, 'validation-severity-summary.md'), severitySummary)

  // ── Adjusted Grade Report ───────────────────────────────────────────
  const adjustedGrade = [
    '# Platform Grade — Adjusted',
    '',
    `> Generated: ${scorecard.generatedAt}`,
    '',
    `## Overall: **${scorecard.overallGrade}**`,
    '',
    'This grade is computed with severity-weighted scoring where:',
    '- Any ERROR immediately caps the dimension at C+ or below',
    '- Warnings degrade from A+ progressively',
    '- INFO findings are non-blocking',
    '',
    '## Per-Dimension Assessment',
    '',
    ...dimensions.map(d => [
      `### ${d.dimension}: **${d.score}**`,
      `- Errors: ${d.errors}`,
      `- Warnings: ${d.warnings}`,
      `- ${d.notes}`,
      '',
    ].join('\n')),
    blockers.length > 0
      ? `## Release Blockers\n\n${blockers.map(b => `- 🔴 ${b}`).join('\n')}\n`
      : '## ✅ No Release Blockers\n',
    '',
    recommendations.length > 0
      ? `## Action Items\n\n${recommendations.map((r, i) => `${i + 1}. ${r}`).join('\n')}\n`
      : '',
  ].join('\n')

  writeFileSync(join(reportsDir, 'platform-grade-adjusted.md'), adjustedGrade)

  // Print scorecard
  console.log('═══════════════════════════════════════════════════════════')
  console.log(`  OVERALL GRADE: ${scorecard.overallGrade}`)
  console.log('═══════════════════════════════════════════════════════════')
  for (const d of dimensions) {
    console.log(`  ${d.dimension.padEnd(25)} ${d.score.padEnd(4)} (${d.errors}E / ${d.warnings}W)`)
  }
  console.log('')

  if (blockers.length > 0) {
    console.log('🔴 BLOCKERS:')
    for (const b of blockers) console.log(`   - ${b}`)
  } else {
    console.log('✅ No release blockers')
  }
  console.log('')
  console.log('Reports written to reports/')
}
