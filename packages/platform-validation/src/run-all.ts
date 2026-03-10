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

  // ── Scorecard ─────────────────────────────────────────────────────────
  const dimensions: ScorecardEntry[] = [
    {
      dimension: 'Package Maturity',
      score: grade(pkgErrors, pkgWarnings),
      errors: pkgErrors,
      warnings: pkgWarnings,
      notes: `${pkgReport.summary['production-ready']} production-ready, ${pkgReport.summary['scaffold-only']} scaffold-only`,
    },
    {
      dimension: 'Architecture Consistency',
      score: grade(archReport.findingsBySeverity.error, archReport.findingsBySeverity.warning),
      errors: archReport.findingsBySeverity.error,
      warnings: archReport.findingsBySeverity.warning,
      notes: `${archReport.totalFiles} files scanned`,
    },
    {
      dimension: 'Claim Integrity',
      score: grade(claimErrors, claimWarnings),
      errors: claimErrors,
      warnings: claimWarnings,
      notes: `${claimReport.summary.implemented}/${claimReport.totalClaims} claims verified`,
    },
    {
      dimension: 'Documentation Quality',
      score: grade(docReport.findingsBySeverity.error, docReport.findingsBySeverity.warning),
      errors: docReport.findingsBySeverity.error,
      warnings: docReport.findingsBySeverity.warning,
      notes: `${docReport.filesScanned} files scanned`,
    },
  ]

  const blockers: string[] = []
  if (pkgErrors > 0) blockers.push(`${pkgErrors} package-level errors`)
  if (archReport.findingsBySeverity.error > 0) blockers.push(`${archReport.findingsBySeverity.error} architecture violations`)
  if (claimErrors > 0) blockers.push(`${claimErrors} unsupported claims in buyer materials`)

  const recommendations: string[] = []
  if (pkgReport.summary['scaffold-only'] > 5) recommendations.push('Reduce scaffold-only packages — add tests or remove')
  if (pkgReport.crossCutting.circularDeps.length > 0) recommendations.push('Break circular dependency chains')
  if (claimReport.summary['docs-only'] > 0) recommendations.push(`Implement or remove ${claimReport.summary['docs-only']} docs-only claims`)
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
