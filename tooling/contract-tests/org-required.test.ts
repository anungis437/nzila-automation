/**
 * ORG_REQUIRED_001 — "Repository APIs must require orgId"
 *
 * Enforces that every exported function/method in repository modules
 * includes orgId (or ctx with orgId) as a parameter.
 *
 * Scope:
 *   packages/*-db/src/**\/*.ts  (repository/data-access modules)
 *   Excludes: test files, schema definitions, index barrels, types
 *
 * Rules:
 *   - FAIL if a public repository method signature lacks orgId / ctx.orgId / orgId
 *   - FAIL if any exception in governance/exceptions/org-required.json is expired
 *   - PASS otherwise
 *
 * @invariant ORG_REQUIRED_001
 */
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

// ── Patterns ────────────────────────────────────────────────────────────────

/**
 * Matches exported async functions or methods that look like repository operations.
 * Captures the function name and its parameter list for inspection.
 */
const EXPORTED_FN_RE =
  /export\s+(?:async\s+)?function\s+(\w+)\s*\(([^)]*)\)/g

/**
 * Matches class methods that are public (no private/protected keyword).
 * Captures method name and parameter list.
 */
const CLASS_METHOD_RE =
  /^\s+(?:async\s+)?(\w+)\s*\(([^)]*)\)/gm

/**
 * Parameter patterns that satisfy the org-scoped requirement.
 */
const ORG_PARAM_PATTERNS = [
  /\borgId\b/,
  /\bentityId\b/,
  /\bctx\b/,           // OrgContext parameter
  /\bcontext\b/,       // Context parameter (assumed to carry orgId)
  /\boptions\b.*\borgId\b/,
]

/**
 * Files that are exempt from scanning (not repository logic).
 */
function isExemptFile(rel: string): boolean {
  if (/\.(test|spec)\.[jt]sx?$/.test(rel)) return true
  if (rel.includes('__tests__/')) return true
  if (rel.endsWith('/index.ts')) return true
  if (rel.includes('/schema/')) return true
  if (rel.includes('/types')) return true
  if (rel.includes('/migrations/')) return true
  if (rel.endsWith('.d.ts')) return true
  return false
}

/**
 * Repository module roots to scan.
 * Only commerce repositories — @nzila/db itself IS the scoping mechanism
 * (ScopedDb, AuditedScopedDb) and is validated by INV-21 instead.
 */
const REPO_ROOTS = [
  'packages/commerce-db',
]

function hasOrgParam(params: string): boolean {
  return ORG_PARAM_PATTERNS.some((p) => p.test(params))
}

// ── Test ─────────────────────────────────────────────────────────────────────

describe('ORG_REQUIRED_001 — Repository APIs must require orgId', () => {
  it('exported repository functions include orgId/orgId/ctx parameter', () => {
    const violations: Violation[] = []
    const exceptionFile = loadExceptions(
      'governance/exceptions/org-required.json',
    )

    for (const root of REPO_ROOTS) {
      const absRoot = join(ROOT, root)
      const files = walkSync(absRoot, ['.ts'])

      for (const file of files) {
        const rel = relPath(file)
        if (isExemptFile(rel)) continue
        if (isExcepted(rel, exceptionFile.entries)) continue

        const content = readContent(file)

        // Check exported functions
        let match: RegExpExecArray | null
        EXPORTED_FN_RE.lastIndex = 0
        while ((match = EXPORTED_FN_RE.exec(content)) !== null) {
          const [, fnName, params] = match
          // Skip utility/helper functions that aren't repo operations
          if (/^(create|with|make|get(?:EntityId|Column))/.test(fnName) && !params.trim()) continue
          if (!hasOrgParam(params)) {
            violations.push({
              ruleId: 'ORG_REQUIRED_001',
              filePath: rel,
              offendingValue: `function ${fnName}(${params.trim()})`,
              remediation: 'Add orgId, orgId, or ctx parameter to function signature',
            })
          }
        }

        // Check class methods in files that export classes
        if (content.includes('export class') || content.includes('export default class')) {
          CLASS_METHOD_RE.lastIndex = 0
          while ((match = CLASS_METHOD_RE.exec(content)) !== null) {
            const [, methodName, params] = match
            // Skip constructors, getters, private-looking methods
            if (methodName === 'constructor') continue
            if (methodName.startsWith('_')) continue
            if (methodName.startsWith('get') && !params.trim()) continue
            if (!hasOrgParam(params)) {
              violations.push({
                ruleId: 'ORG_REQUIRED_001',
                filePath: rel,
                offendingValue: `method ${methodName}(${params.trim()})`,
                remediation: 'Add orgId, orgId, or ctx parameter to method signature',
              })
            }
          }
        }
      }
    }

    expect(
      violations,
      formatViolations(violations),
    ).toHaveLength(0)
  })

  it('no expired exceptions exist for ORG_REQUIRED_001', () => {
    const exceptionFile = loadExceptions(
      'governance/exceptions/org-required.json',
    )
    expect(
      exceptionFile.expiredEntries,
      `${exceptionFile.expiredEntries.length} expired ORG_REQUIRED_001 exception(s)`,
    ).toHaveLength(0)
  })
})
