/**
 * Contract Test — ABR Governance Bridge: No Direct Bypass
 *
 * Scan-based contract test that forbids ABR backend Python files
 * (outside the governance bridge folder) from:
 *   1. Directly importing audit/evidence/integration modules for writes
 *   2. Directly using outbound SDK patterns (email/sms/http sends)
 *   3. Calling AuditLogs.objects.create() or EvidenceBundles.objects.create()
 *
 * Only files within the compliance/ governance-bridge ecosystem are allowed
 * to perform these operations.
 *
 * @invariant ABR_GOVERNANCE_BRIDGE_ONLY_003
 */
import { describe, it, expect } from 'vitest'
import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'

const ROOT = join(__dirname, '..', '..')
const ABR_BACKEND = join(ROOT, 'apps', 'abr', 'backend')

const SKIP_DIRS = new Set([
  '__pycache__',
  'migrations',
  'test_migrations',
  'node_modules',
  '.venv',
])

/** Files within the governance bridge ecosystem that ARE allowed governed writes */
const BRIDGE_ECOSYSTEM_PATTERNS = [
  '/compliance/governance_bridge.py',
  '/compliance/governance_guard.py',
  '/compliance/services.py',
  '/compliance/case_evidence_export.py',
  '/compliance/dual_control.py',
  '/compliance/identity_vault.py',
  '/compliance/metadata_minimization.py',
]

/** File patterns excluded from the scan (tests, models, serializers, etc.) */
const EXCLUDED_FILE_PATTERNS = [
  'test',       // test files (test_*.py, tests.py, tests/)
  'models.py',  // model definitions import their own types
  'serializers.py',
  'admin.py',
  'apps.py',
  'urls.py',
  '__init__.py',
  'manage.py',
  'settings',
  'auth_core/authentication.py', // IdP token verification requires direct HTTP
]

function walkPyFiles(dir: string): string[] {
  const results: string[] = []
  if (!existsSync(dir)) return results
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (SKIP_DIRS.has(entry.name)) continue
    const fullPath = join(dir, entry.name)
    if (entry.isDirectory()) {
      results.push(...walkPyFiles(fullPath))
    } else if (entry.name.endsWith('.py')) {
      results.push(fullPath)
    }
  }
  return results
}

function relPath(fullPath: string): string {
  return fullPath.replace(ROOT, '').replace(/\\/g, '/')
}

function isBridgeEcosystem(rel: string): boolean {
  return BRIDGE_ECOSYSTEM_PATTERNS.some((p) => rel.includes(p))
}

function isExcludedFile(rel: string): boolean {
  return EXCLUDED_FILE_PATTERNS.some((p) => rel.includes(p))
}

function readAbs(abs: string): string {
  if (!existsSync(abs)) return ''
  return readFileSync(abs, 'utf-8')
}

// ═══════════════════════════════════════════════════════════════════════════
// ABR_GOVERNANCE_BRIDGE_ONLY_003 — Forbid direct governed operations
// ═══════════════════════════════════════════════════════════════════════════

describe('ABR_GOVERNANCE_BRIDGE_ONLY_003 — No direct audit/evidence/integration bypass', () => {
  /**
   * Forbidden patterns in non-bridge view/service files:
   *   - AuditLogs.objects.create(  → must use governance.emit_audit()
   *   - EvidenceBundles.objects.create( → must use governance.seal_evidence()
   *   - .objects.create( on governed models without bridge
   */
  const FORBIDDEN_DIRECT_WRITES: Array<{ pattern: RegExp; message: string }> = [
    {
      pattern: /AuditLogs\.objects\.create\(/,
      message: 'Direct AuditLogs.objects.create() — use governance.emit_audit()',
    },
    {
      pattern: /EvidenceBundles\.objects\.create\(/,
      message: 'Direct EvidenceBundles.objects.create() — use governance.seal_evidence()',
    },
    {
      pattern: /EvidenceBundleComponents\.objects\.create\(/,
      message: 'Direct EvidenceBundleComponents.objects.create() — use governance bridge',
    },
  ]

  /**
   * Forbidden outbound SDK patterns (email/sms/http) outside bridge:
   *   - requests.post/put/patch for outbound HTTP
   *   - smtplib/sendmail for direct email
   *   - twilio/send_sms for direct SMS
   */
  const FORBIDDEN_OUTBOUND_PATTERNS: Array<{ pattern: RegExp; message: string }> = [
    {
      pattern: /import\s+requests\b/,
      message: 'Direct HTTP import (requests) — route outbound calls through governance.dispatch_notification()',
    },
    {
      pattern: /import\s+smtplib\b/,
      message: 'Direct SMTP import — route email through governance.dispatch_notification()',
    },
    {
      pattern: /from\s+twilio/,
      message: 'Direct Twilio import — route SMS through governance.dispatch_notification()',
    },
    {
      pattern: /import\s+httpx\b/,
      message: 'Direct HTTP import (httpx) — route outbound calls through governance.dispatch_notification()',
    },
  ]

  it('no view/service files perform direct governed writes', () => {
    const pyFiles = walkPyFiles(ABR_BACKEND)
    const violations: string[] = []

    for (const file of pyFiles) {
      const rel = relPath(file)
      if (isBridgeEcosystem(rel)) continue
      if (isExcludedFile(rel)) continue

      const content = readAbs(file)
      if (!content) continue

      // Only check files that contain view logic (ViewSet, APIView, etc.)
      const isViewFile =
        rel.includes('views') ||
        content.includes('ViewSet') ||
        content.includes('APIView')
      if (!isViewFile) continue

      for (const { pattern, message } of FORBIDDEN_DIRECT_WRITES) {
        const match = content.match(pattern)
        if (match) {
          const lineNum = content.slice(0, match.index).split('\n').length
          violations.push(`${rel}:${lineNum}: ${message}`)
        }
      }
    }

    // Known legacy auto-generated views are already tracked in
    // ABR_GOVERNANCE_BRIDGE_VIEWS_004 with the LEGACY_BYPASS_ALLOWLIST.
    // This test applies to NEW files only — any file not in the allowlist
    // that performs direct writes is a violation.

    // Filter out files already tracked in the existing LEGACY_BYPASS_ALLOWLIST
    const LEGACY_ALLOWLIST_PATTERNS = [
      '/services/api/',    // All auto-generated service views are legacy-tracked
      '/compliance/views.py',
      '/core/views.py',
      '/content/views.py',
      '/billing/views.py',
      '/analytics/views.py',
      '/ai_core/views.py',
      '/notifications/views.py',
      '/auth_core/views.py',
    ]

    const newViolations = violations.filter(
      (v) => !LEGACY_ALLOWLIST_PATTERNS.some((p) => v.includes(p)),
    )

    expect(
      newViolations,
      `NEW files bypass governance bridge with direct writes:\n\n${newViolations.join('\n')}\n\n` +
        'All governed writes must go through compliance.governance_bridge.\n' +
        'If this is legacy code, add to LEGACY_BYPASS_ALLOWLIST in abr-governance-bridge.test.ts.',
    ).toEqual([])
  })

  it('no non-bridge files import outbound SDK modules directly', () => {
    const pyFiles = walkPyFiles(ABR_BACKEND)
    const violations: string[] = []

    for (const file of pyFiles) {
      const rel = relPath(file)
      if (isBridgeEcosystem(rel)) continue
      if (isExcludedFile(rel)) continue

      const content = readAbs(file)
      if (!content) continue

      for (const { pattern, message } of FORBIDDEN_OUTBOUND_PATTERNS) {
        const match = content.match(pattern)
        if (match) {
          const lineNum = content.slice(0, match.index).split('\n').length
          violations.push(`${rel}:${lineNum}: ${message}`)
        }
      }
    }

    expect(
      violations,
      `Files import outbound SDKs directly (must go through governance bridge):\n\n${violations.join('\n')}`,
    ).toEqual([])
  })

  it('governance guard module exists and enforces runtime protection', () => {
    const guardPath = join(ABR_BACKEND, 'compliance', 'governance_guard.py')
    expect(existsSync(guardPath), 'compliance/governance_guard.py must exist').toBe(true)

    const guard = readAbs(guardPath)

    // Must have the bypass error class
    expect(guard).toContain('GovernanceBridgeBypassError')

    // Must inspect call stack for bridge origin
    expect(guard).toMatch(/_caller_is_bridge|inspect\.stack/)

    // Must enforce in pilot/prod
    expect(guard).toMatch(/pilot|prod/)

    // Must be installable as middleware
    expect(guard).toContain('GovernanceGuardMiddleware')
  })

  it('governance guard is wired in Django middleware', () => {
    const settingsPath = join(ABR_BACKEND, 'config', 'settings', 'base.py')
    expect(existsSync(settingsPath), 'config/settings/base.py must exist').toBe(true)

    const settings = readAbs(settingsPath)
    expect(
      settings,
      'GovernanceGuardMiddleware must be in MIDDLEWARE list',
    ).toContain('compliance.governance_guard.GovernanceGuardMiddleware')
  })
})
