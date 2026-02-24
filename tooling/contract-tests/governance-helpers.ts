/**
 * Shared helpers for governance contract tests.
 *
 * Provides file-walking, exception loading, and violation reporting
 * used across all governance rules.
 */
import { readFileSync, readdirSync, existsSync } from 'node:fs'
import { join, relative, resolve } from 'node:path'
import { minimatch } from 'minimatch'

/** Repo root — two directories above tooling/contract-tests */
export const ROOT = resolve(__dirname, '../..')

// ── File scanning ───────────────────────────────────────────────────────────

const SKIP_DIRS = new Set([
  'node_modules',
  'dist',
  '.next',
  '.turbo',
  'build',
  'coverage',
  '.git',
  '__fixtures__',
  '.venv',
])

/**
 * Recursively collect files under `dir` matching `extensions`.
 * Skips node_modules, dist, .next, build, coverage by default.
 */
export function walkSync(
  dir: string,
  extensions: string[] = ['.ts', '.tsx', '.js', '.jsx', '.mjs'],
): string[] {
  const results: string[] = []
  if (!existsSync(dir)) return results
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (SKIP_DIRS.has(entry.name)) continue
    const fullPath = join(dir, entry.name)
    if (entry.isDirectory()) {
      results.push(...walkSync(fullPath, extensions))
    } else if (extensions.some((ext) => entry.name.endsWith(ext))) {
      results.push(fullPath)
    }
  }
  return results
}

/**
 * Find all files matching a glob under ROOT.
 */
export function findFilesGlob(
  pattern: string,
  extensions?: string[],
): string[] {
  // Walk root and filter by glob
  const allFiles = walkSync(ROOT, extensions)
  return allFiles.filter((f) => {
    const rel = relative(ROOT, f).replace(/\\/g, '/')
    return minimatch(rel, pattern)
  })
}

/**
 * Read file content, returning '' if the file doesn't exist.
 */
export function readContent(filePath: string): string {
  try {
    return readFileSync(filePath, 'utf-8')
  } catch {
    return ''
  }
}

/**
 * Return relative path from ROOT with forward slashes.
 */
export function relPath(abs: string): string {
  return relative(ROOT, abs).replace(/\\/g, '/')
}

// ── Exception loading ───────────────────────────────────────────────────────

export interface ExceptionEntry {
  path: string
  owner: string
  justification: string
  expiresOn: string
}

export interface ExceptionFile {
  ruleId: string
  description: string
  entries: ExceptionEntry[]
}

/**
 * Load a governance exception file.
 * Validates expiry dates — throws on expired entries.
 */
export function loadExceptions(
  relativeJsonPath: string,
  today: Date = new Date(),
): ExceptionFile & { expiredEntries: ExceptionEntry[] } {
  const absPath = join(ROOT, relativeJsonPath)
  if (!existsSync(absPath)) {
    return {
      ruleId: '',
      description: '',
      entries: [],
      expiredEntries: [],
    }
  }
  const data: ExceptionFile = JSON.parse(readFileSync(absPath, 'utf-8'))
  const expiredEntries = data.entries.filter(
    (e) => new Date(e.expiresOn) < today,
  )
  return { ...data, expiredEntries }
}

/**
 * Check if a file's relative path is covered by an exception glob.
 */
export function isExcepted(
  relFilePath: string,
  exceptions: ExceptionEntry[],
): boolean {
  return exceptions.some((e) => minimatch(relFilePath, e.path))
}

// ── Violation formatting ────────────────────────────────────────────────────

export interface Violation {
  ruleId: string
  filePath: string
  offendingValue?: string
  line?: number
  snippet?: string
  remediation?: string
}

/**
 * Format violations for human-readable output.
 */
export function formatViolations(violations: Violation[]): string {
  return violations
    .map((v) => {
      const loc = v.line ? `:${v.line}` : ''
      const parts = [
        `[${v.ruleId}] ${v.filePath}${loc}`,
        v.offendingValue ? `  Value: ${v.offendingValue}` : '',
        v.snippet ? `  Snippet: ${v.snippet.trim().slice(0, 120)}` : '',
        v.remediation ? `  Fix: ${v.remediation}` : '',
      ]
      return parts.filter(Boolean).join('\n')
    })
    .join('\n\n')
}
