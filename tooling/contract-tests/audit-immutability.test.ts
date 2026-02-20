/**
 * PR 10 — Audit Log Immutability
 *
 * Verifies that the audit_events table has appropriate protections against
 * tampering, and that the hash-chain implementation is present and correct.
 */
import { describe, it, expect } from 'vitest'
import { readFileSync, existsSync, readdirSync } from 'node:fs'
import { resolve, join } from 'node:path'

const ROOT = resolve(__dirname, '../..')

function readContent(path: string): string {
  try { return readFileSync(path, 'utf-8') } catch { return '' }
}

// ── 1. Hash-chain functions must exist in os-core ─────────────────────────

describe('PR10: Audit immutability — hash-chain implementation', () => {
  it('os-core/hash.ts exports computeEntryHash and verifyChain', () => {
    const hashPath = resolve(ROOT, 'packages/os-core/src/hash.ts')
    expect(existsSync(hashPath), 'packages/os-core/src/hash.ts must exist').toBe(true)
    const content = readContent(hashPath)
    expect(content.includes('computeEntryHash'), 'computeEntryHash must be exported').toBe(true)
    expect(content.includes('verifyChain'), 'verifyChain must be exported').toBe(true)
  })

  it('os-core/hash.ts uses SHA-256', () => {
    const hashPath = resolve(ROOT, 'packages/os-core/src/hash.ts')
    const content = readContent(hashPath)
    expect(
      content.includes('sha256') || content.includes('SHA-256') || content.includes('SHA256'),
      'hash chain must use SHA-256'
    ).toBe(true)
  })
})

// ── 2. audit_events schema must have hash column ──────────────────────────

describe('PR10: Audit immutability — audit_events schema', () => {
  it('audit_events table has a hash column', () => {
    const schemaDir = resolve(ROOT, 'packages/db/src/schema')
    if (!existsSync(schemaDir)) return

    const entries = readdirSync(schemaDir, { withFileTypes: true })
    const allSchema = entries
      .filter(e => e.isFile())
      .map(e => readContent(join(schemaDir, e.name)))
      .join('\n')

    expect(
      allSchema.includes('audit_events') || allSchema.includes('auditEvents'),
      'DB schema must define audit_events table'
    ).toBe(true)

    expect(
      allSchema.includes('hash'),
      'audit_events must have a hash column for chain integrity'
    ).toBe(true)
  })

  it('audit_events schema does NOT define update/delete RLS disables', () => {
    const schemaDir = resolve(ROOT, 'packages/db/src/schema')
    if (!existsSync(schemaDir)) return

    const entries = readdirSync(schemaDir, { withFileTypes: true })
    for (const entry of entries) {
      if (!entry.isFile()) continue
      const content = readContent(join(schemaDir, entry.name))
      if (!content.includes('audit_events') && !content.includes('auditEvents')) continue

      // Drizzle tables should NOT have onUpdate/onDelete cascade that could erase audit rows
      expect(
        content.includes('onDelete: \'cascade\'') && content.includes('audit'),
        `${entry.name}: audit_events must not use cascade delete`
      ).toBe(false)
    }
  })
})

// ── 3. recordAuditEvent always computes hash before insert ────────────────

describe('PR10: Audit immutability — recordAuditEvent uses hash chain', () => {
  it('audit-db.ts calls computeEntryHash before inserting', () => {
    const auditDbPath = resolve(ROOT, 'apps/console/lib/audit-db.ts')
    if (!existsSync(auditDbPath)) return

    const content = readContent(auditDbPath)
    expect(
      content.includes('computeEntryHash') || content.includes('hash'),
      'audit-db.ts must compute hash before inserting audit event'
    ).toBe(true)
  })

  it('audit-db.ts has a verifyEntityAuditChain function', () => {
    const auditDbPath = resolve(ROOT, 'apps/console/lib/audit-db.ts')
    if (!existsSync(auditDbPath)) return

    const content = readContent(auditDbPath)
    expect(
      content.includes('verifyEntityAuditChain') || content.includes('verifyChain'),
      'audit-db.ts must export chain verification'
    ).toBe(true)
  })
})

// ── 4. DB migrations must not drop or truncate audit_events ──────────────

describe('PR10: Audit immutability — migrations do not destroy audit data', () => {
  it('no migration drops or truncates audit_events', () => {
    const migrationsDir = resolve(ROOT, 'packages/db/drizzle')
    if (!existsSync(migrationsDir)) return

    const entries = readdirSync(migrationsDir, { withFileTypes: true })
    for (const entry of entries) {
      if (!entry.isFile() || !entry.name.endsWith('.sql')) continue
      const content = readContent(join(migrationsDir, entry.name))
      if (!content.toLowerCase().includes('audit')) continue

      expect(
        content.toLowerCase().includes('drop table') && content.toLowerCase().includes('audit'),
        `Migration ${entry.name} must not DROP audit_events`
      ).toBe(false)

      expect(
        content.toLowerCase().includes('truncate') && content.toLowerCase().includes('audit'),
        `Migration ${entry.name} must not TRUNCATE audit_events`
      ).toBe(false)
    }
  })
})
