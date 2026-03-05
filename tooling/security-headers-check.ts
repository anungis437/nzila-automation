#!/usr/bin/env tsx
/**
 * Nzila OS — Security Headers Validation
 *
 * Middleware-level validation of HTTP security headers across all
 * application entry points. Can be run as a CI gate or standalone check.
 *
 * Verifies:
 *   - Content-Security-Policy (CSP)
 *   - Strict-Transport-Security (HSTS)
 *   - X-Frame-Options
 *   - Referrer-Policy
 *   - X-Content-Type-Options
 *
 * Usage:
 *   pnpm verify:security
 *   npx tsx tooling/security-headers-check.ts
 *
 * Exit codes:
 *   0 — all checks pass
 *   1 — one or more checks fail
 *
 * @module tooling/security-headers-check
 */
import { readFileSync, existsSync, readdirSync } from 'node:fs'
import { resolve, join } from 'node:path'
import { nowISO } from '@nzila/platform-utils/time'

// ── Types ───────────────────────────────────────────────────────────────────

interface SecurityHeaderCheck {
  readonly header: string
  readonly required: boolean
  readonly description: string
  readonly recommendedValue?: string
  readonly validator: (value: string) => boolean
}

interface CheckResult {
  readonly header: string
  readonly status: 'present' | 'missing' | 'invalid'
  readonly value?: string
  readonly file?: string
}

// ── Constants ───────────────────────────────────────────────────────────────

const ROOT = resolve(import.meta.dirname ?? __dirname, '..')

const REQUIRED_HEADERS: readonly SecurityHeaderCheck[] = [
  {
    header: 'Content-Security-Policy',
    required: true,
    description: 'Prevents XSS and data injection attacks',
    recommendedValue: "default-src 'self'",
    validator: (v) => v.includes('default-src') || v.includes('script-src'),
  },
  {
    header: 'Strict-Transport-Security',
    required: true,
    description: 'Enforces HTTPS connections',
    recommendedValue: 'max-age=31536000; includeSubDomains',
    validator: (v) => v.includes('max-age=') && Number.parseInt(v.match(/max-age=(\d+)/)?.[1] ?? '0', 10) >= 31536000,
  },
  {
    header: 'X-Frame-Options',
    required: true,
    description: 'Prevents clickjacking attacks',
    recommendedValue: 'DENY',
    validator: (v) => v === 'DENY' || v === 'SAMEORIGIN',
  },
  {
    header: 'Referrer-Policy',
    required: true,
    description: 'Controls referrer information leakage',
    recommendedValue: 'strict-origin-when-cross-origin',
    validator: (v) =>
      ['no-referrer', 'strict-origin', 'strict-origin-when-cross-origin', 'same-origin'].includes(v),
  },
  {
    header: 'X-Content-Type-Options',
    required: true,
    description: 'Prevents MIME-type sniffing',
    recommendedValue: 'nosniff',
    validator: (v) => v === 'nosniff',
  },
] as const

// ── Scan Patterns ───────────────────────────────────────────────────────────

/**
 * Patterns that indicate a security header is configured in source code.
 * Covers Next.js headers config, Express middleware, and raw header setting.
 */
const HEADER_PATTERNS: ReadonlyMap<string, readonly RegExp[]> = new Map([
  ['Content-Security-Policy', [
    /Content-Security-Policy/i,
    /contentSecurityPolicy/i,
    /csp/i,
  ]],
  ['Strict-Transport-Security', [
    /Strict-Transport-Security/i,
    /hsts/i,
  ]],
  ['X-Frame-Options', [
    /X-Frame-Options/i,
    /xFrameOptions/i,
  ]],
  ['Referrer-Policy', [
    /Referrer-Policy/i,
    /referrerPolicy/i,
  ]],
  ['X-Content-Type-Options', [
    /X-Content-Type-Options/i,
    /nosniff/i,
  ]],
])

// ── Helpers ─────────────────────────────────────────────────────────────────

let passCount = 0
let failCount = 0

function ok(msg: string): void {
  passCount++
  process.stdout.write(`  \u2714 ${msg}\n`)
}

function fail(msg: string): void {
  failCount++
  process.stderr.write(`  \u2718 ${msg}\n`)
}

/**
 * Scan configuration files for security header definitions.
 */
function scanForHeaders(): Map<string, { found: boolean; file: string; value: string }> {
  const results = new Map<string, { found: boolean; file: string; value: string }>()

  // Initialize all as not found
  for (const check of REQUIRED_HEADERS) {
    results.set(check.header, { found: false, file: '', value: '' })
  }

  // Files to scan for header configuration
  const scanTargets = [
    // Next.js config files
    ...findFiles(resolve(ROOT, 'apps'), 'next.config.'),
    // Middleware files
    ...findFiles(resolve(ROOT, 'apps'), 'middleware.'),
    // Security config files
    ...findFiles(resolve(ROOT, 'packages'), 'security'),
    // Header config files
    ...findFiles(resolve(ROOT, 'apps'), 'headers'),
  ]

  for (const file of scanTargets) {
    if (!existsSync(file)) continue
    let content: string
    try {
      content = readFileSync(file, 'utf-8')
    } catch {
      continue
    }

    for (const [header, patterns] of HEADER_PATTERNS) {
      const current = results.get(header)
      if (current?.found) continue

      for (const pattern of patterns) {
        if (pattern.test(content)) {
          // Try to extract the value
          const valueMatch = content.match(
            new RegExp(`['"]?${header.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}['"]?\\s*[,:=]\\s*['"]([^'"]+)['"]`, 'i'),
          )
          results.set(header, {
            found: true,
            file: file.replace(ROOT, '').replace(/\\/g, '/'),
            value: valueMatch?.[1] ?? '(configured)',
          })
          break
        }
      }
    }
  }

  return results
}

function findFiles(dir: string, pattern: string): string[] {
  const results: string[] = []
  if (!existsSync(dir)) return results

  try {
    const entries = readdirSync(dir, { withFileTypes: true })
    for (const entry of entries) {
      const fullPath = join(dir, entry.name)
      if (entry.name === 'node_modules' || entry.name === '.next' || entry.name === 'dist') continue
      if (entry.isDirectory()) {
        results.push(...findFiles(fullPath, pattern))
      } else if (entry.name.includes(pattern)) {
        results.push(fullPath)
      }
    }
  } catch {
    // Permission or read error — skip
  }

  return results
}

// ── Policy Document Check ───────────────────────────────────────────────────

function checkSecurityPolicies(): void {
  const policyFiles = [
    'ops/security-operations/README.md',
    'security/README.md',
    'SECURITY.md',
  ]

  const found = policyFiles.some((f) => existsSync(resolve(ROOT, f)))
  if (found) {
    ok('Security policy documentation present')
  } else {
    fail('No security policy documentation found')
  }
}

// ── Main ────────────────────────────────────────────────────────────────────

function main(): void {
  process.stdout.write(`\n\u2501\u2501\u2501 Nzila OS \u2014 Security Headers Validation \u2501\u2501\u2501\n`)
  process.stdout.write(`Started: ${nowISO()}\n\n`)

  // Check for header configurations in source
  process.stdout.write('[1/2] Scanning for security header configurations\u2026\n')
  const headerResults = scanForHeaders()

  for (const check of REQUIRED_HEADERS) {
    const result = headerResults.get(check.header)
    if (result?.found) {
      ok(`${check.header}: configured in ${result.file}`)
    } else {
      fail(`${check.header}: not configured (${check.description})`)
      process.stderr.write(`        Recommended: ${check.recommendedValue}\n`)
    }
  }

  // Check security policy docs
  process.stdout.write('\n[2/2] Validating security policies\u2026\n')
  checkSecurityPolicies()

  process.stdout.write(`\n  ${passCount} passed, ${failCount} failed\n\n`)

  if (failCount > 0) {
    process.exit(1)
  }
}

main()
