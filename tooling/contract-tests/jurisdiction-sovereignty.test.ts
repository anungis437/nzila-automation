/**
 * @invariant JURISDICTION_001
 *
 * Contract tests for Canada jurisdiction & sovereignty invariants.
 *
 * Rules enforced:
 *   001 — Active source files must NOT contain "POPIA" or "South Africa"
 *         unless inside test fixtures / __tests__ directories.
 *   002 — No source file may contain "we are compliant" phrasing.
 *   003 — real-ports.ts must default to Canada Central / PIPEDA / Québec Law 25.
 *   004 — RFP generator must include a PIPEDA + Québec Law 25 question.
 *   005 — Proof Center page must NOT contain hardcoded mock data arrays.
 *   006 — Golden demo script must use real collector chain, not stubs.
 */
import { describe, it, expect } from 'vitest'
import { readFileSync, existsSync } from 'node:fs'
import { join, relative, resolve } from 'node:path'
import {
  ROOT,
  walkSync,
  readContent,
  relPath,
  formatViolations,
  type Violation,
} from './governance-helpers'

// ── Helpers ─────────────────────────────────────────────────────────────────

/** Directories / patterns that are allowed to reference old jurisdictions */
const EXEMPT_PATTERNS = [
  /__tests__/,
  /__fixtures__/,
  /\.test\.ts$/,
  /\.spec\.ts$/,
  /\.test\.tsx$/,
  /CHANGELOG\.md$/,
  /tooling\/contract-tests\//,
  /node_modules/,
  /dist\//,
  /\.next\//,
  /coverage\//,
  /pnpm-lock\.yaml$/,
]

function isExempt(rel: string): boolean {
  return EXEMPT_PATTERNS.some((p) => p.test(rel))
}

const SCAN_ROOTS = [
  'apps/console/app',
  'apps/console/lib',
  'packages/platform-rfp-generator/src',
  'packages/platform-procurement-proof/src',
  'packages/platform-assurance/src',
  'scripts',
]

function scanFiles(): string[] {
  const files: string[] = []
  for (const root of SCAN_ROOTS) {
    const abs = join(ROOT, root)
    if (!existsSync(abs)) continue
    files.push(...walkSync(abs, ['.ts', '.tsx']))
  }
  return files
}

// ── Tests ───────────────────────────────────────────────────────────────────

describe('JURISDICTION_001 — Canada sovereignty invariants', () => {
  it('no runtime source references POPIA (unless in tests/fixtures)', { timeout: 60_000 }, () => {
    const violations: Violation[] = []

    for (const file of scanFiles()) {
      const rel = relPath(file)
      if (isExempt(rel)) continue

      const content = readContent(file)
      const lines = content.split('\n')

      for (let i = 0; i < lines.length; i++) {
        if (/\bPOPIA\b/i.test(lines[i]!)) {
          violations.push({
            ruleId: 'JURISDICTION_001a',
            filePath: rel,
            line: i + 1,
            snippet: lines[i]!.trim().slice(0, 120),
            offendingValue: 'POPIA',
            remediation: 'Replace POPIA with PIPEDA / Québec Law 25 for Canada jurisdiction',
          })
        }
      }
    }

    expect(
      violations,
      `Found POPIA references in runtime source:\n\n${formatViolations(violations)}`,
    ).toHaveLength(0)
  })

  it('no runtime source references "South Africa" or "southafricanorth"', { timeout: 60_000 }, () => {
    const violations: Violation[] = []
    const SA_RE = /south\s*africa|southafricanorth/gi

    for (const file of scanFiles()) {
      const rel = relPath(file)
      if (isExempt(rel)) continue

      const content = readContent(file)
      const lines = content.split('\n')

      for (let i = 0; i < lines.length; i++) {
        const match = SA_RE.exec(lines[i]!)
        if (match) {
          violations.push({
            ruleId: 'JURISDICTION_001b',
            filePath: rel,
            line: i + 1,
            snippet: lines[i]!.trim().slice(0, 120),
            offendingValue: match[0],
            remediation: 'Replace South Africa references with Canada / Canada Central',
          })
        }
        SA_RE.lastIndex = 0 // reset global regex
      }
    }

    expect(
      violations,
      `Found South Africa references in runtime source:\n\n${formatViolations(violations)}`,
    ).toHaveLength(0)
  })
})

describe('JURISDICTION_002 — No "we are compliant" phrasing', () => {
  it('forbids self-attestation language in generated content', { timeout: 60_000 }, () => {
    const violations: Violation[] = []
    const COMPLIANCE_CLAIM_RE =
      /\bwe\s+are\s+(fully\s+)?compliant\b|100%\s+compliant\b|\bfully\s+compliant\b/gi

    for (const file of scanFiles()) {
      const rel = relPath(file)
      if (isExempt(rel)) continue

      const content = readContent(file)
      const lines = content.split('\n')

      for (let i = 0; i < lines.length; i++) {
        const match = COMPLIANCE_CLAIM_RE.exec(lines[i]!)
        if (match) {
          violations.push({
            ruleId: 'JURISDICTION_002',
            filePath: rel,
            line: i + 1,
            snippet: lines[i]!.trim().slice(0, 120),
            offendingValue: match[0],
            remediation:
              'Use evidence-based language: "cryptographic evidence demonstrates…" not self-attestation',
          })
        }
        COMPLIANCE_CLAIM_RE.lastIndex = 0
      }
    }

    expect(
      violations,
      `Found self-attestation language:\n\n${formatViolations(violations)}`,
    ).toHaveLength(0)
  })
})

describe('JURISDICTION_003 — real-ports.ts Canada defaults', () => {
  const realPortsPath = join(
    ROOT,
    'packages/platform-procurement-proof/src/real-ports.ts',
  )

  it('real-ports.ts exists', () => {
    expect(existsSync(realPortsPath)).toBe(true)
  })

  it('defaults to canadacentral storage region', () => {
    const content = readFileSync(realPortsPath, 'utf-8')
    expect(content).toContain('canadacentral')
  })

  it('defaults to Canada data residency', () => {
    const content = readFileSync(realPortsPath, 'utf-8')
    expect(content).toContain("'Canada'")
  })

  it('defaults to Canada Central deployment region', () => {
    const content = readFileSync(realPortsPath, 'utf-8')
    expect(content).toContain("'Canada Central'")
  })

  it('includes PIPEDA in default regulatory frameworks', () => {
    const content = readFileSync(realPortsPath, 'utf-8')
    expect(content).toContain("'PIPEDA'")
  })

  it('includes Québec Law 25 in default regulatory frameworks', () => {
    const content = readFileSync(realPortsPath, 'utf-8')
    expect(content).toContain('Québec Law 25')
  })
})

describe('JURISDICTION_004 — RFP generator PIPEDA question', () => {
  const generatorPath = join(
    ROOT,
    'packages/platform-rfp-generator/src/generator.ts',
  )

  it('generator.ts exists', () => {
    expect(existsSync(generatorPath)).toBe(true)
  })

  it('includes PIPEDA + Québec Law 25 question', () => {
    const content = readFileSync(generatorPath, 'utf-8')
    expect(content).toContain('PIPEDA')
    expect(content).toContain('Québec Law 25')
  })

  it('includes hosting_sovereignty section generator', () => {
    const content = readFileSync(generatorPath, 'utf-8')
    expect(content).toContain('generateHostingSovereigntySection')
  })

  it('includes verification appendix generator', () => {
    const content = readFileSync(generatorPath, 'utf-8')
    expect(content).toContain('generateVerificationAppendix')
  })
})

describe('JURISDICTION_005 — Proof Center page has no hardcoded mock arrays', () => {
  const pagePath = join(
    ROOT,
    'apps/console/app/(dashboard)/proof-center/page.tsx',
  )

  it('page.tsx exists', () => {
    expect(existsSync(pagePath)).toBe(true)
  })

  it('does not contain hardcoded proofSections array', () => {
    const content = readFileSync(pagePath, 'utf-8')
    // Old pattern: const proofSections = [ { title: 'Security', ...
    expect(content).not.toMatch(/const\s+proofSections\s*=\s*\[/)
  })

  it('does not contain hardcoded POPIA/South Africa references', () => {
    const content = readFileSync(pagePath, 'utf-8')
    expect(content).not.toContain('POPIA')
    expect(content.toLowerCase()).not.toContain('south africa')
  })

  it('imports from platform-procurement-proof', () => {
    const content = readFileSync(pagePath, 'utf-8')
    expect(content).toContain('@nzila/platform-procurement-proof')
  })
})

describe('JURISDICTION_006 — Golden demo uses real collector chain', () => {
  const demoPath = join(ROOT, 'scripts/demo-golden-path.ts')

  it('demo script exists', () => {
    expect(existsSync(demoPath)).toBe(true)
  })

  it('imports collectProcurementPack', () => {
    const content = readFileSync(demoPath, 'utf-8')
    expect(content).toContain('collectProcurementPack')
  })

  it('imports signProcurementPack', () => {
    const content = readFileSync(demoPath, 'utf-8')
    expect(content).toContain('signProcurementPack')
  })

  it('references Canada sovereignty', () => {
    const content = readFileSync(demoPath, 'utf-8')
    expect(content).toContain('Canada')
  })

  it('outputs to demo-output directory', () => {
    const content = readFileSync(demoPath, 'utf-8')
    expect(content).toContain('demo-output')
  })
})
