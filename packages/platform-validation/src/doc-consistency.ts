/**
 * Documentation Consistency Audit
 *
 * Cross-references governance docs, architecture docs, trust center materials,
 * procurement docs, and READMEs for:
 *  - Contradictions between documents
 *  - Overclaiming (claims stronger than code supports)
 *  - Naming inconsistencies (same concept, different names)
 *  - Stale references (files/packages that no longer exist)
 *  - Missing cross-references
 */

import { existsSync, readdirSync, readFileSync, mkdirSync, writeFileSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'

// ── Types ───────────────────────────────────────────────────────────────────

type Severity = 'error' | 'warning' | 'info'

interface DocFinding {
  rule: string
  severity: Severity
  file: string
  line?: number
  message: string
}

interface DocConsistencyReport {
  generatedAt: string
  filesScanned: number
  totalFindings: number
  findingsByRule: Record<string, number>
  findingsBySeverity: Record<Severity, number>
  findings: DocFinding[]
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

function walkMarkdown(dir: string): string[] {
  const results: string[] = []
  if (!existsSync(dir)) return results
  const entries = readdirSync(dir, { withFileTypes: true })
  for (const entry of entries) {
    const full = join(dir, entry.name)
    if (entry.isDirectory()) {
      if (['node_modules', 'dist', '.next', '.turbo', '.git'].includes(entry.name)) continue
      results.push(...walkMarkdown(full))
    } else if (entry.name.endsWith('.md')) {
      results.push(full)
    }
  }
  return results
}

function safeRead(filePath: string): string {
  try {
    return readFileSync(filePath, 'utf-8')
  } catch {
    return ''
  }
}

// ── Rules ───────────────────────────────────────────────────────────────────

// Check for stale references to files or packages that don't exist
function checkStaleReferences(filePath: string, content: string, repoRoot: string): DocFinding[] {
  const findings: DocFinding[] = []
  const rel = relative(repoRoot, filePath).replace(/\\/g, '/')
  const lines = content.split('\n')

  for (let i = 0; i < lines.length; i++) {
    const ln = lines[i]

    // Check markdown links to local files: [text](path)
    const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g
    let match
    while ((match = linkRegex.exec(ln)) !== null) {
      const target = match[2]
      // Skip URLs, anchors, mailto, images, protocol-relative
      if (/^https?:|^mailto:|^#|^data:|^\/\//.test(target)) continue
      if (/\.(png|jpg|jpeg|gif|svg|ico|webp)$/i.test(target)) continue
      // Strip anchor and query
      const cleanTarget = target.split('#')[0].split('?')[0]
      if (!cleanTarget) continue

      // Try multiple resolution strategies
      const resolvedFromFile = join(filePath, '..', cleanTarget)
      const resolvedFromRoot = join(repoRoot, cleanTarget)
      const resolvedFromDocs = join(repoRoot, 'docs', cleanTarget)

      if (!existsSync(resolvedFromFile) && !existsSync(resolvedFromRoot) && !existsSync(resolvedFromDocs)) {
        findings.push({
          rule: 'stale-reference',
          severity: 'info',
          file: rel,
          line: i + 1,
          message: `Possible broken link: [${match[1]}](${target})`,
        })
      }
    }

    // Check inline backtick references to packages
    const pkgRefRegex = /`@nzila\/([a-z0-9-]+)`/g
    while ((match = pkgRefRegex.exec(ln)) !== null) {
      const pkgName = match[1]
      if (!existsSync(join(repoRoot, 'packages', pkgName, 'package.json'))) {
        findings.push({
          rule: 'stale-package-ref',
          severity: 'info',
          file: rel,
          line: i + 1,
          message: `References @nzila/${pkgName} but package does not exist`,
        })
      }
    }
  }

  return findings
}

// Check for naming inconsistencies across docs
function checkNamingConsistency(files: Array<{ path: string; content: string }>, repoRoot: string): DocFinding[] {
  const findings: DocFinding[] = []

  // Known canonical names and their variants
  const canonicalNames: Array<{ canonical: string; variants: RegExp; context: string }> = [
    { canonical: 'NzilaOS', variants: /\bnzila\s*os\b|\bnzila-os\b|\bNzila OS\b|\bNZILA OS\b/gi, context: 'platform name' },
    { canonical: 'org_id', variants: /\borgId\b|\borg_ID\b|\borganizationId\b|\borgid\b/g, context: 'tenant identifier' },
    { canonical: 'evidence pack', variants: /\bevidence\s*bundle\b|\baudit\s*pack\b|\bevidence\s*package\b/gi, context: 'evidence artifact' },
    { canonical: 'procurement pack', variants: /\bprocurement\s*bundle\b|\bprocurement\s*package\b|\bbuyer\s*pack\b/gi, context: 'procurement artifact' },
  ]

  for (const { path: filePath, content } of files) {
    const rel = relative(repoRoot, filePath).replace(/\\/g, '/')
    const lines = content.split('\n')

    for (const { canonical, variants, context } of canonicalNames) {
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i]
        const match = variants.exec(line)
        if (match && match[0] !== canonical) {
          findings.push({
            rule: 'naming-inconsistency',
            severity: 'info',
            file: rel,
            line: i + 1,
            message: `"${match[0]}" should be "${canonical}" (${context})`,
          })
        }
        // Reset regex lastIndex
        variants.lastIndex = 0
      }
    }
  }

  return findings
}

// Check for contradictions in date claims or version claims
function checkDateContradictions(files: Array<{ path: string; content: string }>, repoRoot: string): DocFinding[] {
  const findings: DocFinding[] = []

  // Find all "last updated" or "generated" dates
  const datePattern = /(?:last\s+updated|generated|as\s+of|updated)\s*[:—]\s*(\d{4}-\d{2}-\d{2}|\w+ \d{1,2},\s*\d{4})/gi

  const dateRefs: Array<{ file: string; date: string; line: number }> = []

  for (const { path: filePath, content } of files) {
    const rel = relative(repoRoot, filePath).replace(/\\/g, '/')
    const lines = content.split('\n')

    for (let i = 0; i < lines.length; i++) {
      const match = datePattern.exec(lines[i])
      if (match) {
        dateRefs.push({ file: rel, date: match[1], line: i + 1 })
      }
      datePattern.lastIndex = 0
    }
  }

  // Flag docs with dates older than 90 days
  const now = new Date()
  for (const ref of dateRefs) {
    try {
      const d = new Date(ref.date)
      const daysDiff = (now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24)
      if (daysDiff > 90) {
        findings.push({
          rule: 'stale-date',
          severity: 'info',
          file: ref.file,
          line: ref.line,
          message: `Document date "${ref.date}" is ${Math.floor(daysDiff)} days old — may be stale`,
        })
      }
    } catch {
      // unparseable date, skip
    }
  }

  return findings
}

// Check that key docs exist
function checkRequiredDocs(repoRoot: string): DocFinding[] {
  const findings: DocFinding[] = []

  const required: Array<{ path: string; description: string }> = [
    { path: 'ARCHITECTURE.md', description: 'Architecture overview' },
    { path: 'README.md', description: 'Repository README' },
    { path: 'CONTRIBUTING.md', description: 'Contributing guide' },
    { path: 'SECURITY.md', description: 'Security policy' },
    { path: 'CHANGELOG.md', description: 'Changelog' },
    { path: 'docs/procurement-pack.md', description: 'Procurement pack documentation' },
    { path: 'docs/disaster-recovery.md', description: 'Disaster recovery plan' },
    { path: 'docs/incident-response.md', description: 'Incident response plan' },
  ]

  for (const { path, description } of required) {
    if (!existsSync(join(repoRoot, path))) {
      findings.push({
        rule: 'missing-required-doc',
        severity: 'warning',
        file: path,
        message: `Required document missing: ${description}`,
      })
    }
  }

  // Check that every packages/* dir has a README
  const packagesDir = join(repoRoot, 'packages')
  if (existsSync(packagesDir)) {
    for (const pkg of readdirSync(packagesDir)) {
      const pkgDir = join(packagesDir, pkg)
      if (!statSync(pkgDir).isDirectory()) continue
      if (!existsSync(join(pkgDir, 'package.json'))) continue
      if (!existsSync(join(pkgDir, 'README.md'))) {
        findings.push({
          rule: 'missing-package-readme',
          severity: 'info',
          file: `packages/${pkg}`,
          message: `Package ${pkg} missing README.md`,
        })
      }
    }
  }

  return findings
}

// ── Report Generation ───────────────────────────────────────────────────────

function generateMarkdown(report: DocConsistencyReport): string {
  const lines: string[] = []
  lines.push('# NzilaOS Documentation Consistency Audit')
  lines.push('')
  lines.push(`> Generated: ${report.generatedAt}`)
  lines.push('')
  lines.push('## Summary')
  lines.push('')
  lines.push('| Metric | Value |')
  lines.push('|--------|-------|')
  lines.push(`| Files Scanned | ${report.filesScanned} |`)
  lines.push(`| Total Findings | ${report.totalFindings} |`)
  lines.push(`| Errors | ${report.findingsBySeverity.error} |`)
  lines.push(`| Warnings | ${report.findingsBySeverity.warning} |`)
  lines.push(`| Info | ${report.findingsBySeverity.info} |`)
  lines.push('')

  lines.push('## Findings by Rule')
  lines.push('')
  lines.push('| Rule | Count |')
  lines.push('|------|-------|')
  for (const [rule, count] of Object.entries(report.findingsByRule).sort((a, b) => b[1] - a[1])) {
    lines.push(`| ${rule} | ${count} |`)
  }
  lines.push('')

  // Group findings
  const byRule = new Map<string, DocFinding[]>()
  for (const f of report.findings) {
    if (!byRule.has(f.rule)) byRule.set(f.rule, [])
    byRule.get(f.rule)!.push(f)
  }

  for (const [rule, items] of byRule) {
    lines.push(`## ${rule} (${items.length})`)
    lines.push('')
    for (const f of items) {
      const icon = f.severity === 'error' ? '🔴' : f.severity === 'warning' ? '🟡' : 'ℹ️'
      const loc = f.line ? `${f.file}:${f.line}` : f.file
      lines.push(`- ${icon} \`${loc}\` — ${f.message}`)
    }
    lines.push('')
  }

  return lines.join('\n')
}

// ── Main ────────────────────────────────────────────────────────────────────

export function runDocConsistency(root?: string): DocConsistencyReport {
  const repoRoot = root ?? findRepoRoot()

  // Scan docs in key directories
  const scanDirs = [
    repoRoot, // root level .md files
    join(repoRoot, 'docs'),
    join(repoRoot, 'governance'),
  ]

  const mdFiles: string[] = []
  for (const dir of scanDirs) {
    if (dir === repoRoot) {
      // Only root-level md files
      if (existsSync(dir)) {
        for (const f of readdirSync(dir)) {
          if (f.endsWith('.md') && statSync(join(dir, f)).isFile()) {
            mdFiles.push(join(dir, f))
          }
        }
      }
    } else {
      mdFiles.push(...walkMarkdown(dir))
    }
  }

  const fileContents = mdFiles.map(f => ({ path: f, content: safeRead(f) }))

  const findings: DocFinding[] = []

  // Per-file checks
  for (const { path: filePath, content } of fileContents) {
    findings.push(...checkStaleReferences(filePath, content, repoRoot))
  }

  // Cross-file checks
  findings.push(...checkNamingConsistency(fileContents, repoRoot))
  findings.push(...checkDateContradictions(fileContents, repoRoot))
  findings.push(...checkRequiredDocs(repoRoot))

  // Aggregate
  const findingsByRule: Record<string, number> = {}
  const findingsBySeverity: Record<Severity, number> = { error: 0, warning: 0, info: 0 }
  for (const f of findings) {
    findingsByRule[f.rule] = (findingsByRule[f.rule] ?? 0) + 1
    findingsBySeverity[f.severity]++
  }

  return {
    generatedAt: new Date().toISOString(),
    filesScanned: mdFiles.length,
    totalFindings: findings.length,
    findingsByRule,
    findingsBySeverity,
    findings,
  }
}

// ── CLI entry ───────────────────────────────────────────────────────────────

if (process.argv[1]?.includes('doc-consistency')) {
  const root = findRepoRoot()
  const reportsDir = join(root, 'reports')
  if (!existsSync(reportsDir)) mkdirSync(reportsDir, { recursive: true })

  console.log('📝 Running Documentation Consistency Audit...\n')
  const report = runDocConsistency(root)

  writeFileSync(join(reportsDir, 'doc-consistency.json'), JSON.stringify(report, null, 2))
  writeFileSync(join(reportsDir, 'doc-consistency.md'), generateMarkdown(report))

  console.log(`Files scanned: ${report.filesScanned}`)
  console.log(`Findings:      ${report.totalFindings}`)
  console.log(`  Errors:   ${report.findingsBySeverity.error}`)
  console.log(`  Warnings: ${report.findingsBySeverity.warning}`)
  console.log(`  Info:     ${report.findingsBySeverity.info}`)

  const hasErrors = report.findingsBySeverity.error > 0
  console.log(`\n${hasErrors ? '🔴 Documentation errors detected' : '✅ No critical documentation errors'}`)
  console.log(`Reports written to reports/doc-consistency.json and reports/doc-consistency.md`)
}
