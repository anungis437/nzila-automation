/**
 * Contract Test — ABR Org Context Must Not Accept Query Params
 *
 * BLOCKER: If _get_org_id() accepts org_id from request.query_params,
 * adversaries can perform cross-Org data access by parameter injection.
 *
 * This contract test statically scans ABR Python view files to ensure
 * no code path reads org_id from query/body for org-scoping purposes.
 *
 * @invariant INV-30: ABR org derivation is server-only
 */
import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = join(__dirname, '..', '..');
const ABR_BACKEND = join(ROOT, 'apps', 'abr', 'backend');

const FORBIDDEN_PATTERNS = [
  /query_params\.get\s*\(\s*['"]org_id['"]\s*\)/,
  /request\.GET\.get\s*\(\s*['"]org/,
  /request\.GET\s*\[\s*['"]org/,
  /request\.data\.get\s*\(\s*['"]org_id['"]\s*\)/,
  /request\.body\.get\s*\(\s*['"]org_id['"]\s*\)/,
];

/**
 * Allowlisted patterns — these do NOT constitute scoping violations:
 * - Writing org_id into serializer data from server-derived context
 * - Logging org_id from authenticated context
 */
const ALLOWLISTED_CONTEXT = [
  /"org_id":\s*str\(org_id\)/,  // Setting org_id from server-derived variable
];

function scanPythonFiles(dir: string): Array<{ file: string; line: number; content: string; pattern: string }> {
  const violations: Array<{ file: string; line: number; content: string; pattern: string }> = [];

  if (!existsSync(dir)) return violations;

  const entries = readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = join(dir, entry.name);

    if (entry.isDirectory() && !entry.name.startsWith('__pycache__') && entry.name !== 'migrations') {
      violations.push(...scanPythonFiles(fullPath));
      continue;
    }

    if (!entry.isFile() || !entry.name.endsWith('.py')) continue;
    if (entry.name.startsWith('test_')) continue; // Skip test files

    const content = readFileSync(fullPath, 'utf-8');
    const lines = content.split('\n');

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      for (const pattern of FORBIDDEN_PATTERNS) {
        if (pattern.test(line)) {
          // Check if it's an allowlisted usage
          const isAllowed = ALLOWLISTED_CONTEXT.some(a => a.test(line));
          if (!isAllowed) {
            violations.push({
              file: fullPath.replace(ROOT + '\\', '').replace(ROOT + '/', ''),
              line: i + 1,
              content: line.trim(),
              pattern: pattern.source,
            });
          }
        }
      }
    }
  }

  return violations;
}

describe('INV-30 — ABR Org Derivation Is Server-Only', () => {
  it('ABR backend directory exists', () => {
    expect(existsSync(ABR_BACKEND), 'apps/abr/backend must exist').toBe(true);
  });

  it('no ABR view derives org_id from query params or request body', () => {
    const violations = scanPythonFiles(ABR_BACKEND);

    expect(
      violations,
      `BLOCKER: ABR backend files must not read org_id from query params or request body.\n` +
        `Org context must be derived exclusively from authenticated session (Clerk JWT → user.organization_id).\n\n` +
        `Violations found:\n` +
        violations.map(v => `  ${v.file}:${v.line} — ${v.content}`).join('\n'),
    ).toEqual([]);
  });

  it('_get_org_id uses user.organization_id as primary source', () => {
    const viewsPath = join(ABR_BACKEND, 'compliance', 'abr_views.py');
    expect(existsSync(viewsPath), 'abr_views.py must exist').toBe(true);

    const content = readFileSync(viewsPath, 'utf-8');

    // Must contain server-side org derivation
    expect(content).toContain('user.organization_id');

    // Must NOT contain query param fallback
    expect(content).not.toContain('query_params.get("org_id")');
    expect(content).not.toContain("query_params.get('org_id')");
  });
});
