// ARCH_LAYER_001 — "No DB/repo direct access from route handlers"
//
// Enforces clean layering: routes/controllers only call services, never DB directly.
//
// Route/controller files: apps/*/app/api/*, apps/*/pages/api/*,
//   apps/*/src/routes/*, apps/*/server/* endpoints
//
// Prohibited imports: @nzila/db, @nzila/db/client, @nzila/db/raw,
//   prisma imports, repository/repo/data-access layer modules, drizzle() calls
//
// Allowed: services, domain types, schemas/zod, auth guards, logger, audit
//
// Exceptions: governance/exceptions/arch-layer.json
//
// @invariant ARCH_LAYER_001
import { describe, it, expect } from 'vitest'
import { join } from 'node:path'
import {
  ROOT,
  walkSync,
  readContent,
  relPath,
  loadExceptions,
  isExcepted,
  formatViolations,
  type Violation,
} from './governance-helpers'

// ── Route file detection ────────────────────────────────────────────────────

/** Patterns that identify route/controller files (relative path, forward slashes). */
function isRouteFile(rel: string): boolean {
  // Next.js App Router
  if (/apps\/[^/]+\/app\/api\//.test(rel)) return true
  // Next.js Pages Router
  if (/apps\/[^/]+\/pages\/api\//.test(rel)) return true
  // Express/Fastify style routes
  if (/apps\/[^/]+\/src\/routes\//.test(rel)) return true
  // Server endpoints
  if (/apps\/[^/]+\/server\//.test(rel)) return true
  return false
}

// ── Prohibited import patterns ──────────────────────────────────────────────

const PROHIBITED_IMPORT_PATTERNS: Array<{
  pattern: RegExp
  label: string
}> = [
  // Direct DB package imports
  {
    pattern: /from\s+['"]@nzila\/db(?:\/(?:client|raw|index))?['"]/,
    label: '@nzila/db (direct package)',
  },
  {
    pattern: /from\s+['"]@nzila\/db\/schema['"]/,
    label: '@nzila/db/schema (direct schema import)',
  },
  // Prisma client
  {
    pattern: /from\s+['"][^'"]*\/prisma(?:\/client)?['"]/,
    label: 'Prisma client',
  },
  // Repository layer
  {
    pattern: /from\s+['"][^'"]*\/repositories\/['"]/,
    label: 'repository layer',
  },
  {
    pattern: /from\s+['"][^'"]*\/repo\/['"]/,
    label: 'repo layer',
  },
  {
    pattern: /from\s+['"][^'"]*\/data-access\/['"]/,
    label: 'data-access layer',
  },
  // Direct drizzle instantiation
  {
    pattern: /\bdrizzle\s*\(/,
    label: 'drizzle() instantiation',
  },
]

// ── Tests ───────────────────────────────────────────────────────────────────

describe('ARCH_LAYER_001 — No DB/repo direct access from route handlers', () => {
  const exceptions = loadExceptions('governance/exceptions/arch-layer.json')

  it('no governance exceptions are expired', () => {
    expect(
      exceptions.expiredEntries,
      `Expired ARCH_LAYER_001 exceptions:\n${exceptions.expiredEntries
        .map((e) => `  ${e.path} expired ${e.expiresOn} (owner: ${e.owner})`)
        .join('\n')}`,
    ).toHaveLength(0)
  })

  it('route handlers do not import from prohibited DB/repo modules (unless excepted)', () => {
    const appsDir = join(ROOT, 'apps')
    const allFiles = walkSync(appsDir)
    const routeFiles = allFiles.filter((f) => isRouteFile(relPath(f)))
    const violations: Violation[] = []

    for (const file of routeFiles) {
      const rel = relPath(file)

      // Skip test/spec files inside route dirs
      if (/\.(test|spec)\.[jt]sx?$/.test(rel)) continue
      if (rel.includes('__tests__/')) continue

      // Check exceptions
      if (isExcepted(rel, exceptions.entries)) continue

      const content = readContent(file)
      const lines = content.split('\n')

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i]
        for (const { pattern, label } of PROHIBITED_IMPORT_PATTERNS) {
          if (pattern.test(line)) {
            violations.push({
              ruleId: 'ARCH_LAYER_001',
              filePath: rel,
              line: i + 1,
              snippet: line.trim(),
              offendingValue: label,
              remediation:
                'Move DB call into a repository, call it from a service, then call the service from the route handler.',
            })
          }
        }
      }
    }

    expect(
      violations,
      `Architecture layering violations (DB access from route handlers):\n\n${formatViolations(violations)}`,
    ).toHaveLength(0)
  })
})
