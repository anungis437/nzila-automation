/**
 * Contract Test — ABR Unused Endpoints Quarantine
 *
 * Guarantees auto-generated service endpoints in ABR are quarantined
 * behind the ABR_ENABLE_GENERATED_SERVICES feature flag and cannot
 * be exposed in pilot/prod without explicit opt-in.
 *
 * @invariant ABR_UNUSED_ENDPOINTS_002
 */
import { describe, it, expect } from 'vitest'
import { readFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'

const ROOT = join(__dirname, '..', '..')
const SERVICES_URLS = join(ROOT, 'apps', 'abr', 'backend', 'services', 'api', 'urls.py')

function readContent(path: string): string {
  if (!existsSync(path)) return ''
  return readFileSync(path, 'utf-8')
}

/** All generated service basenames that must be quarantined */
const QUARANTINED_SERVICES = [
  'ai-personalization',
  'ai-quota',
  'ai-quotas',
  'ai-training',
  'ai-verification',
  'audit-logger',
  'canlii-ingestion',
  'case-alerts',
  'ce-credits',
  'certificates',
  'codespring',
  'compliance-reports',
  'course-gamification',
  'course-workflow',
  'courses-enhanced',
  'dashboard-analytics',
  'data-export',
  'embedding-service',
  'entitlements',
  'evidence-bundles',
  'gamification',
  'instructors',
  'lesson-notes',
  'live-session',
  'org-offboarding',
  'outcome-prediction',
  'pdf-generator',
  'quiz',
  'quiz-questions',
  'rbac',
  'risk-analytics',
  'risk-report-export',
  'seat-management',
  'skills',
  'social',
  'sso',
  'watch-history',
  'canlii-rate-limiter',
]

describe('ABR_UNUSED_ENDPOINTS_002 — Generated endpoints are quarantined', () => {
  it('services/api/urls.py exists', () => {
    expect(existsSync(SERVICES_URLS)).toBe(true)
  })

  it('urls.py checks ABR_ENABLE_GENERATED_SERVICES feature flag', () => {
    const content = readContent(SERVICES_URLS)
    expect(content).toContain('ABR_ENABLE_GENERATED_SERVICES')
  })

  it('feature flag defaults to disabled (false)', () => {
    const content = readContent(SERVICES_URLS)
    // Must default to "false" so pilot/prod never exposes stubs
    expect(content).toMatch(/ABR_ENABLE_GENERATED_SERVICES.*["']false["']/)
  })

  it('all generated router.register calls are inside the feature flag guard', () => {
    const content = readContent(SERVICES_URLS)

    // Split the file content at the feature flag check
    const flagIndex = content.indexOf('_GENERATED_SERVICES_ENABLED')
    expect(flagIndex).toBeGreaterThan(-1)

    // Find the conditional block: "if _GENERATED_SERVICES_ENABLED:"
    const conditionalIndex = content.indexOf('if _GENERATED_SERVICES_ENABLED:')
    expect(conditionalIndex).toBeGreaterThan(-1)

    // All router.register calls for quarantined services must appear AFTER the conditional
    const beforeConditional = content.slice(0, conditionalIndex)
    const afterConditional = content.slice(conditionalIndex)

    for (const service of QUARANTINED_SERVICES) {
      const registration = `basename="${service}"`

      // Must NOT appear before the conditional guard
      if (beforeConditional.includes(registration)) {
        expect.fail(
          `Service "${service}" is registered outside the feature flag guard. ` +
            'All generated services must be inside the if _GENERATED_SERVICES_ENABLED: block.',
        )
      }

      // Must appear in the guarded section
      expect(
        afterConditional,
        `Service "${service}" is not registered — must be in the quarantine block`,
      ).toContain(registration)
    }
  })

  it('no router.register calls exist outside the feature flag guard', () => {
    const content = readContent(SERVICES_URLS)
    const conditionalIndex = content.indexOf('if _GENERATED_SERVICES_ENABLED:')
    expect(conditionalIndex).toBeGreaterThan(-1)

    const beforeConditional = content.slice(0, conditionalIndex)
    const registerCalls = beforeConditional.match(/router\.register\(/g)

    expect(
      registerCalls,
      'Found router.register() calls before the feature flag guard. ' +
        'All service endpoints must be quarantined.',
    ).toBeNull()
  })
})
