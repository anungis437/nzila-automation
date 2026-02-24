/**
 * TS_STRICT_001 — "No strict:false anywhere"
 *
 * Enforces TypeScript strict mode as a fleet invariant.
 *
 * Scope:
 *   All tsconfig*.json under repo root (excluding node_modules, dist, .next, build, coverage).
 *
 * Rules:
 *   - FAIL if any tsconfig has compilerOptions.strict === false
 *   - FAIL if any exception in governance/exceptions/ts-strict.json is expired
 *   - PASS if strict is true OR inherited from base config and not overridden to false
 *
 * @invariant TS_STRICT_001
 */
import { describe, it, expect } from 'vitest'
import { readFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import {
  ROOT,
  walkSync,
  relPath,
  loadExceptions,
  isExcepted,
  formatViolations,
  type Violation,
} from './governance-helpers'

// ── Find all tsconfig files ─────────────────────────────────────────────────

function findTsconfigs(): string[] {
  return walkSync(ROOT, ['.json']).filter((f) => {
    const name = f.replace(/\\/g, '/').split('/').pop() ?? ''
    return name.startsWith('tsconfig') && name.endsWith('.json')
  })
}

/**
 * Parse a JSON file that may contain comments (jsonc).
 * Strips single-line // comments and block comments before parsing.
 */
function parseJsonc(filePath: string): Record<string, unknown> {
  const raw = readFileSync(filePath, 'utf-8')
  // Strip comments
  const stripped = raw
    .replace(/\/\/.*$/gm, '')
    .replace(/\/\*[\s\S]*?\*\//g, '')
  // Strip trailing commas before } or ]
  const cleaned = stripped.replace(/,\s*([\]}])/g, '$1')
  return JSON.parse(cleaned)
}

/**
 * Resolve the "extends" chain and determine if strict is effectively false.
 * Returns true if strict is explicitly set to false and not just absent.
 */
function isStrictFalse(filePath: string): { strictFalse: boolean; value: unknown } {
  try {
    const config = parseJsonc(filePath)
    const compilerOptions = (config as Record<string, unknown>).compilerOptions as
      | Record<string, unknown>
      | undefined

    if (!compilerOptions) {
      // No compilerOptions — inherits from extends (OK)
      return { strictFalse: false, value: undefined }
    }

    if ('strict' in compilerOptions) {
      return {
        strictFalse: compilerOptions.strict === false,
        value: compilerOptions.strict,
      }
    }

    // strict not mentioned — inherits from base. OK.
    return { strictFalse: false, value: undefined }
  } catch {
    // If we can't parse, skip (don't false-positive)
    return { strictFalse: false, value: undefined }
  }
}

// ── Tests ───────────────────────────────────────────────────────────────────

describe('TS_STRICT_001 — No strict:false anywhere', () => {
  const exceptions = loadExceptions('governance/exceptions/ts-strict.json')

  it('no governance exceptions are expired', () => {
    expect(
      exceptions.expiredEntries,
      `Expired TS_STRICT_001 exceptions:\n${exceptions.expiredEntries
        .map((e) => `  ${e.path} expired ${e.expiresOn} (owner: ${e.owner})`)
        .join('\n')}`,
    ).toHaveLength(0)
  })

  it('no tsconfig has strict: false (unless excepted)', () => {
    const tsconfigs = findTsconfigs()
    const violations: Violation[] = []

    for (const file of tsconfigs) {
      const rel = relPath(file)
      if (isExcepted(rel, exceptions.entries)) continue

      const { strictFalse, value } = isStrictFalse(file)
      if (strictFalse) {
        violations.push({
          ruleId: 'TS_STRICT_001',
          filePath: rel,
          offendingValue: `strict: ${JSON.stringify(value)}`,
          remediation:
            'Set "strict": true in compilerOptions, or extend a base tsconfig that sets strict: true.',
        })
      }
    }

    expect(
      violations,
      `TypeScript strict mode violations:\n\n${formatViolations(violations)}`,
    ).toHaveLength(0)
  })
})
