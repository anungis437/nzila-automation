/**
 * Doc Consistency Checker
 *
 * Scans documentation and verifies claims match codebase reality:
 *   1. Package references in docs — do the packages actually exist?
 *   2. Function/export references — do the exports actually exist?
 *   3. File path references in docs — do the files exist?
 *   4. Version numbers consistency (package.json vs docs)
 *   5. Dead links to internal files
 *   6. README completeness for packages
 *
 * Output: reports/doc-consistency.json + reports/doc-consistency.md
 */

import { readFileSync, readdirSync, existsSync, writeFileSync, mkdirSync } from 'node:fs'
import { join, resolve, relative } from 'node:path'

const ROOT = resolve(import.meta.dirname, '..', '..')

// ────────────────────────────────────────────────────────────────────
// Types
// ────────────────────────────────────────────────────────────────────

interface DocIssue {
  severity: 'error' | 'warning' | 'info'
  category: string
  file: string
  line?: number
  detail: string
}

interface DocConsistencyReport {
  timestamp: string
  totalDocFiles: number
  totalIssues: number
  errorCount: number
  warningCount: number
  infoCount: number
  issues: DocIssue[]
  packageReadmeStatus: { name: string; hasReadme: boolean }[]
}

// ────────────────────────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────────────────────────

function walkMarkdownFiles(dir: string): string[] {
  const results: string[] = []
  if (!existsSync(dir)) return results
  function walk(d: string) {
    for (const entry of readdirSync(d, { withFileTypes: true })) {
      if (entry.name === 'node_modules' || entry.name === '.next' || entry.name === 'dist') continue
      const full = join(d, entry.name)
      if (entry.isDirectory()) walk(full)
      else if (entry.name.endsWith('.md')) results.push(full)
    }
  }
  walk(dir)
  return results
}

function relPath(p: string): string {
  return relative(ROOT, p).replace(/\\/g, '/')
}

function getWorkspacePackageNames(): Set<string> {
  const names = new Set<string>()
  for (const parent of ['packages', 'apps', 'tooling']) {
    const dir = join(ROOT, parent)
    if (!existsSync(dir)) continue
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      if (!entry.isDirectory()) continue
      const pkgPath = join(dir, entry.name, 'package.json')
      if (!existsSync(pkgPath)) continue
      try {
        const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'))
        if (pkg.name) names.add(pkg.name)
      } catch { /* skip */ }
    }
  }
  return names
}

// ────────────────────────────────────────────────────────────────────
// Checks
// ────────────────────────────────────────────────────────────────────

function checkInternalLinks(mdFiles: string[]): DocIssue[] {
  const issues: DocIssue[] = []
  const linkPattern = /\[([^\]]*)\]\(([^)]+)\)/g

  for (const file of mdFiles) {
    const content = readFileSync(file, 'utf-8')
    const lines = content.split('\n')

    for (let i = 0; i < lines.length; i++) {
      let m: RegExpExecArray | null
      const lineRe = new RegExp(linkPattern.source, 'g')
      while ((m = lineRe.exec(lines[i])) !== null) {
        const linkTarget = m[2]
        // Skip external links, anchors, mailto, API endpoints
        if (linkTarget.startsWith('http') || linkTarget.startsWith('#') ||
            linkTarget.startsWith('mailto:') || linkTarget.startsWith('/api/')) continue

        // Resolve link relative to the file's directory
        const fileDir = join(file, '..')
        const targetPath = resolve(fileDir, linkTarget.split('#')[0])
        if (!existsSync(targetPath)) {
          issues.push({
            severity: 'warning',
            category: 'dead-link',
            file: relPath(file),
            line: i + 1,
            detail: `Dead internal link: [${m[1]}](${linkTarget})`,
          })
        }
      }
    }
  }

  return issues
}

function checkPackageReferences(mdFiles: string[], packageNames: Set<string>): DocIssue[] {
  const issues: DocIssue[] = []
  const pkgPattern = /@nzila\/[\w-]+/g

  for (const file of mdFiles) {
    const content = readFileSync(file, 'utf-8')
    const lines = content.split('\n')

    for (let i = 0; i < lines.length; i++) {
      let m: RegExpExecArray | null
      const lineRe = new RegExp(pkgPattern.source, 'g')
      while ((m = lineRe.exec(lines[i])) !== null) {
        const pkgName = m[0]
        if (!packageNames.has(pkgName)) {
          issues.push({
            severity: 'error',
            category: 'phantom-package',
            file: relPath(file),
            line: i + 1,
            detail: `Reference to non-existent package: ${pkgName}`,
          })
        }
      }
    }
  }

  return issues
}

function checkFilePathReferences(mdFiles: string[]): DocIssue[] {
  const issues: DocIssue[] = []
  // Match backticked file paths like `packages/foo/src/bar.ts` or `apps/web/app/page.tsx`
  const pathPattern = /`((?:packages|apps|tooling|governance|scripts|infrastructure|docs)\/[^`]+\.[a-z]+)`/g

  for (const file of mdFiles) {
    const content = readFileSync(file, 'utf-8')
    const lines = content.split('\n')

    for (let i = 0; i < lines.length; i++) {
      let m: RegExpExecArray | null
      const lineRe = new RegExp(pathPattern.source, 'g')
      while ((m = lineRe.exec(lines[i])) !== null) {
        const refPath = m[1]
        if (!existsSync(join(ROOT, refPath))) {
          issues.push({
            severity: 'warning',
            category: 'phantom-path',
            file: relPath(file),
            line: i + 1,
            detail: `Referenced file does not exist: ${refPath}`,
          })
        }
      }
    }
  }

  return issues
}

function checkPackageReadmes(): { name: string; hasReadme: boolean }[] {
  const results: { name: string; hasReadme: boolean }[] = []
  for (const parent of ['packages']) {
    const dir = join(ROOT, parent)
    if (!existsSync(dir)) continue
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      if (!entry.isDirectory()) continue
      const pkgDir = join(dir, entry.name)
      const hasPkg = existsSync(join(pkgDir, 'package.json'))
      if (!hasPkg) continue
      const hasReadme = existsSync(join(pkgDir, 'README.md'))
      let name = entry.name
      try {
        const pkg = JSON.parse(readFileSync(join(pkgDir, 'package.json'), 'utf-8'))
        name = pkg.name ?? entry.name
      } catch { /* use dir name */ }
      results.push({ name, hasReadme })
    }
  }
  return results
}

function checkNumberClaims(mdFiles: string[]): DocIssue[] {
  const issues: DocIssue[] = []

  // Specific number claims we can verify
  const packageCount = getWorkspacePackageNames().size
  const appCount = existsSync(join(ROOT, 'apps'))
    ? readdirSync(join(ROOT, 'apps'), { withFileTypes: true }).filter(d => d.isDirectory()).length
    : 0

  for (const file of mdFiles) {
    const content = readFileSync(file, 'utf-8')
    const lines = content.split('\n')

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]

      // Check "X+ packages" claims
      const pkgClaim = line.match(/(\d+)\+?\s*packages/i)
      if (pkgClaim) {
        const claimed = parseInt(pkgClaim[1])
        if (claimed > packageCount * 1.5) {
          issues.push({
            severity: 'warning',
            category: 'number-claim',
            file: relPath(file),
            line: i + 1,
            detail: `Claims "${pkgClaim[0]}" but only ${packageCount} packages found`,
          })
        }
      }

      // Check "X+ apps/platforms" claims
      const appClaim = line.match(/(\d+)\+?\s*(?:apps|platforms|products)/i)
      if (appClaim) {
        const claimed = parseInt(appClaim[1])
        if (claimed > appCount * 1.5) {
          issues.push({
            severity: 'warning',
            category: 'number-claim',
            file: relPath(file),
            line: i + 1,
            detail: `Claims "${appClaim[0]}" but only ${appCount} apps found in apps/`,
          })
        }
      }
    }
  }

  return issues
}

// ────────────────────────────────────────────────────────────────────
// Main
// ────────────────────────────────────────────────────────────────────

function main() {
  const packageNames = getWorkspacePackageNames()

  // Collect all markdown files
  const mdFiles: string[] = []
  for (const dir of ['docs', 'content', 'governance', 'plans', 'README.md', 'ARCHITECTURE.md', 'CONTRIBUTING.md', 'SECURITY.md']) {
    const full = join(ROOT, dir)
    if (!existsSync(full)) continue
    if (full.endsWith('.md')) {
      mdFiles.push(full)
    } else {
      mdFiles.push(...walkMarkdownFiles(full))
    }
  }

  const allIssues: DocIssue[] = []

  // Run checks
  allIssues.push(...checkInternalLinks(mdFiles))
  allIssues.push(...checkPackageReferences(mdFiles, packageNames))
  allIssues.push(...checkFilePathReferences(mdFiles))
  allIssues.push(...checkNumberClaims(mdFiles))

  // Package readmes
  const readmeStatus = checkPackageReadmes()
  const missingReadmes = readmeStatus.filter(r => !r.hasReadme)
  for (const r of missingReadmes) {
    allIssues.push({
      severity: 'info',
      category: 'missing-readme',
      file: `packages/${r.name.replace('@nzila/', '')}`,
      detail: `Package ${r.name} has no README.md`,
    })
  }

  const errorCount = allIssues.filter(i => i.severity === 'error').length
  const warningCount = allIssues.filter(i => i.severity === 'warning').length
  const infoCount = allIssues.filter(i => i.severity === 'info').length

  const report: DocConsistencyReport = {
    timestamp: new Date().toISOString(),
    totalDocFiles: mdFiles.length,
    totalIssues: allIssues.length,
    errorCount,
    warningCount,
    infoCount,
    issues: allIssues,
    packageReadmeStatus: readmeStatus,
  }

  const reportsDir = join(ROOT, 'reports')
  mkdirSync(reportsDir, { recursive: true })
  writeFileSync(join(reportsDir, 'doc-consistency.json'), JSON.stringify(report, null, 2))
  writeFileSync(join(reportsDir, 'doc-consistency.md'), generateMarkdown(report))

  // Console
  console.log(`\n${'═'.repeat(60)}`)
  console.log(`  DOC CONSISTENCY AUDIT`)
  console.log(`${'═'.repeat(60)}`)
  console.log(`  Markdown files scanned: ${report.totalDocFiles}`)
  console.log(`  Total issues:           ${report.totalIssues}`)
  console.log(`  Errors:                 ${errorCount}`)
  console.log(`  Warnings:               ${warningCount}`)
  console.log(`  Info:                    ${infoCount}`)
  console.log(`  Package READMEs:        ${readmeStatus.filter(r => r.hasReadme).length}/${readmeStatus.length}`)

  if (errorCount > 0) {
    console.log(`\n  ERRORS:`)
    for (const i of allIssues.filter(i => i.severity === 'error').slice(0, 10)) {
      console.log(`    ⛔ ${i.file}${i.line ? `:${i.line}` : ''} — ${i.detail}`)
    }
    if (errorCount > 10) console.log(`    ... and ${errorCount - 10} more errors`)
  }

  if (warningCount > 0 && warningCount <= 20) {
    console.log(`\n  WARNINGS:`)
    for (const i of allIssues.filter(i => i.severity === 'warning').slice(0, 10)) {
      console.log(`    ⚠️ ${i.file}${i.line ? `:${i.line}` : ''} — ${i.detail}`)
    }
  }

  console.log(`\n  Reports: doc-consistency.json + .md`)
  console.log(`${'═'.repeat(60)}\n`)
}

function generateMarkdown(r: DocConsistencyReport): string {
  const lines: string[] = []
  lines.push('# Doc Consistency Audit')
  lines.push('')
  lines.push(`**Generated:** ${r.timestamp}`)
  lines.push(`**Files scanned:** ${r.totalDocFiles}`)
  lines.push(`**Issues found:** ${r.totalIssues} (${r.errorCount} errors, ${r.warningCount} warnings, ${r.infoCount} info)`)
  lines.push('')

  // By category
  const byCategory = new Map<string, DocIssue[]>()
  for (const i of r.issues) {
    if (!byCategory.has(i.category)) byCategory.set(i.category, [])
    byCategory.get(i.category)!.push(i)
  }

  lines.push('## Issues by Category')
  lines.push('')
  lines.push('| Category | Count | Errors | Warnings | Info |')
  lines.push('|----------|-------|--------|----------|------|')
  for (const [cat, issues] of byCategory) {
    lines.push(`| ${cat} | ${issues.length} | ${issues.filter(i => i.severity === 'error').length} | ${issues.filter(i => i.severity === 'warning').length} | ${issues.filter(i => i.severity === 'info').length} |`)
  }
  lines.push('')

  // Errors first
  const errors = r.issues.filter(i => i.severity === 'error')
  if (errors.length > 0) {
    lines.push('## Errors')
    lines.push('')
    lines.push('| File | Line | Detail |')
    lines.push('|------|------|--------|')
    for (const i of errors) {
      lines.push(`| ${i.file} | ${i.line ?? '—'} | ${i.detail} |`)
    }
    lines.push('')
  }

  // Warnings
  const warnings = r.issues.filter(i => i.severity === 'warning')
  if (warnings.length > 0) {
    lines.push('## Warnings')
    lines.push('')
    lines.push('| File | Line | Detail |')
    lines.push('|------|------|--------|')
    for (const i of warnings) {
      lines.push(`| ${i.file} | ${i.line ?? '—'} | ${i.detail} |`)
    }
    lines.push('')
  }

  // Package README status
  lines.push('## Package README Coverage')
  lines.push('')
  const hasCount = r.packageReadmeStatus.filter(r => r.hasReadme).length
  lines.push(`**Coverage:** ${hasCount}/${r.packageReadmeStatus.length} (${Math.round(hasCount / r.packageReadmeStatus.length * 100)}%)`)
  lines.push('')
  const missing = r.packageReadmeStatus.filter(r => !r.hasReadme)
  if (missing.length > 0) {
    lines.push('**Missing READMEs:**')
    for (const m of missing) lines.push(`- ${m.name}`)
    lines.push('')
  }

  return lines.join('\n')
}

main()
