/**
 * Contract Test — ABR TODO Policy
 *
 * Guarantees no free-form TODOs exist in the ABR backend.
 * Every TODO must reference a tracked issue: TODO(NZ-###) or TODO(####).
 *
 * @invariant ABR_TODO_POLICY_001
 */
import { describe, it, expect } from 'vitest'
import { readdirSync, readFileSync, existsSync } from 'node:fs'
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

/** Tracked TODO pattern: TODO(NZ-###) or TODO(####) */
const TRACKED_TODO_RE = /TODO\((NZ-\d+|#\d+)\):/

/** Any TODO comment (Python-style) */
const ANY_TODO_RE = /# TODO:/

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

describe('ABR_TODO_POLICY_001 — All TODOs must reference a tracked issue', () => {
  it('no untracked TODO: comments exist in ABR backend Python files', () => {
    const pyFiles = walkPyFiles(ABR_BACKEND)
    const violations: string[] = []

    for (const file of pyFiles) {
      const content = readFileSync(file, 'utf-8')
      const lines = content.split('\n')

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i]
        if (ANY_TODO_RE.test(line) && !TRACKED_TODO_RE.test(line)) {
          violations.push(
            `${relPath(file)}:${i + 1}: ${line.trim()}\n` +
              '  Fix: Use TODO(NZ-###): or TODO(####): format with a tracked issue reference',
          )
        }
      }
    }

    expect(
      violations,
      `Untracked TODOs found in ABR backend:\n\n${violations.join('\n\n')}\n\n` +
        'All TODOs must reference a tracked issue. See docs/backlog/abr-backend.md.',
    ).toEqual([])
  })

  it('backlog doc exists with tracked TODO references', () => {
    const backlogPath = join(ROOT, 'docs', 'backlog', 'abr-backend.md')
    expect(existsSync(backlogPath), 'docs/backlog/abr-backend.md must exist').toBe(true)

    const content = readFileSync(backlogPath, 'utf-8')
    expect(content).toContain('NZ-301')
    expect(content).toContain('NZ-302')
  })
})
