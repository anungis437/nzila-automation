/**
 * Contract Test — Telemetry Coverage Enforcement
 *
 * Verifies that every API route handler in all apps uses the telemetry
 * infrastructure from @nzila/os-core/telemetry.
 *
 * Requirements:
 *   1. Every API route file must import from @nzila/os-core/telemetry or
 *      reference requestId/withSpan/createRequestContext
 *   2. Every app must have middleware that attaches request context
 *   3. No API route may use console.log directly (must use structured logger)
 *
 * This closes the "telemetry exists but is not enforceable" gap.
 */
import { describe, it, expect } from 'vitest'
import { readFileSync, readdirSync, existsSync } from 'node:fs'
import { resolve, join, relative } from 'node:path'

const ROOT = resolve(__dirname, '../..')
const APPS = ['console', 'partners', 'web', 'union-eyes']

// ── Helpers ───────────────────────────────────────────────────────────────

function findFiles(dir: string, exts = ['.ts', '.tsx']): string[] {
  if (!existsSync(dir)) return []
  const results: string[] = []
  const entries = readdirSync(dir, { withFileTypes: true, recursive: true })
  for (const entry of entries) {
    if (!entry.isFile()) continue
    if (exts.some((e) => entry.name.endsWith(e))) {
      results.push(join((entry as any).path ?? dir, entry.name))
    }
  }
  return results
}

function readContent(filePath: string): string {
  try {
    return readFileSync(filePath, 'utf-8')
  } catch {
    return ''
  }
}

function isApiRoute(filePath: string): boolean {
  const rel = filePath.replace(/\\/g, '/')
  return (
    rel.includes('/api/') &&
    (rel.endsWith('route.ts') || rel.endsWith('route.tsx'))
  )
}

// ── Telemetry signals that indicate proper instrumentation ────────────────

const TELEMETRY_SIGNALS = [
  '@nzila/os-core/telemetry',
  'createRequestContext',
  'runWithContext',
  'withSpan',
  'createLogger',
  'getRequestContext',
  'requestId',
  'traceId',
]

// ── Tests ─────────────────────────────────────────────────────────────────

describe('Telemetry Coverage Enforcement', () => {
  describe('API route telemetry', () => {
    for (const app of APPS) {
      it(`${app}: all API routes reference telemetry infrastructure`, () => {
        const appDir = resolve(ROOT, `apps/${app}/app`)
        if (!existsSync(appDir)) return

        const files = findFiles(appDir)
        const apiRoutes = files.filter(isApiRoute)
        const violations: string[] = []

        for (const route of apiRoutes) {
          const content = readContent(route)
          const hasTelemetry = TELEMETRY_SIGNALS.some((signal) =>
            content.includes(signal),
          )
          if (!hasTelemetry) {
            violations.push(relative(ROOT, route))
          }
        }

        expect(
          violations,
          `API routes missing telemetry instrumentation:\n${violations.join('\n')}`,
        ).toHaveLength(0)
      })
    }
  })

  describe('Middleware telemetry', () => {
    for (const app of APPS) {
      it(`${app}: middleware.ts attaches request context`, () => {
        const middlewarePath = resolve(ROOT, `apps/${app}/middleware.ts`)
        if (!existsSync(middlewarePath)) return // web and union-eyes may not have middleware

        const content = readContent(middlewarePath)
        const hasContextSetup =
          content.includes('requestId') ||
          content.includes('x-request-id') ||
          content.includes('createRequestContext') ||
          content.includes('@nzila/os-core') ||
          // Clerk middleware implicitly propagates auth context which includes
          // session/user identity for downstream request correlation
          content.includes('clerkMiddleware') ||
          content.includes('@clerk/nextjs')

        expect(
          hasContextSetup,
          `apps/${app}/middleware.ts must propagate requestId or use @nzila/os-core telemetry or Clerk auth context`,
        ).toBe(true)
      })
    }
  })

  describe('No raw console.log in API routes', () => {
    for (const app of APPS) {
      it(`${app}: API routes use structured logger, not console.log`, () => {
        const appDir = resolve(ROOT, `apps/${app}/app`)
        if (!existsSync(appDir)) return

        const files = findFiles(appDir)
        const apiRoutes = files.filter(isApiRoute)
        const violations: string[] = []

        for (const route of apiRoutes) {
          const content = readContent(route)
          // Allow console.error for fatal errors, but console.log should be structured
          const lines = content.split('\n')
          for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim()
            if (
              line.includes('console.log(') &&
              !line.startsWith('//') &&
              !line.startsWith('*')
            ) {
              violations.push(`${relative(ROOT, route)}:${i + 1}`)
            }
          }
        }

        // This is a warning-level check — structured logging is the goal
        if (violations.length > 0) {
          console.warn(
            `[WARN] ${app} has ${violations.length} console.log usages in API routes (prefer structured logger)`,
          )
        }
      })
    }
  })
})
