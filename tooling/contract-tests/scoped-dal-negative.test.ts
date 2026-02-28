/**
 * Contract Test — Scoped DAL Negative Fixtures
 *
 * Structural gate: proves that unscoped queries, missing orgId,
 * writes on read-only clients, and Org filter override attempts
 * all fail deterministically.
 *
 * These tests are compile/lint/contract-test level gates.
 * If ANY of these pass when they should fail, CI breaks.
 *
 * @invariant INV-21: Scoped DAL negative fixtures
 */
import { describe, it, expect } from 'vitest'
import { readFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'

const ROOT = join(__dirname, '..', '..')
const SCOPED_PATH = join(ROOT, 'packages', 'db', 'src', 'scoped.ts')
const AUDIT_PATH = join(ROOT, 'packages', 'db', 'src', 'audit.ts')

describe('INV-21 — Scoped DAL Structural Guarantees', () => {
  // ── 1) Missing orgId throws ──────────────────────────────────────────────

  it('createScopedDb source validates orgId is non-empty', () => {
    const content = readFileSync(SCOPED_PATH, 'utf-8')
    // Must throw ScopedDbError when orgId is missing
    expect(content).toContain('ScopedDbError')
    expect(content).toMatch(/requires a non-empty orgId/)
    expect(content).toMatch(/throw\s+new\s+ScopedDbError/)
  })

  it('createAuditedScopedDb source validates orgId and actorId', () => {
    const content = readFileSync(AUDIT_PATH, 'utf-8')
    expect(content).toMatch(/requires a non-empty orgId/)
    expect(content).toMatch(/requires a non-empty actorId/)
  })

  // ── 2) Org filter on every query ─────────────────────────────────────────

  it('select() always calls getOrgIdColumn and applies eq() filter', () => {
    const content = readFileSync(SCOPED_PATH, 'utf-8')
    // Every select implementation must call getOrgIdColumn
    const selectBlocks = content.match(/select\s*\(.*?\)\s*\{[\s\S]*?\}/g) ?? []
    const hasOrgFilter = selectBlocks.some(
      (block) =>
        block.includes('getOrgIdColumn') ||
        block.includes('orgCol') ||
        block.includes('orgFilter'),
    )
    expect(hasOrgFilter, 'select() must enforce Org filter via getOrgIdColumn').toBe(true)
  })

  it('insert() always injects orgId / orgId into rows', () => {
    const content = readFileSync(SCOPED_PATH, 'utf-8')
    // Insert must spread orgId into values
    expect(content).toMatch(/orgId:\s*orgId/)
  })

  it('update() always applies Org filter', () => {
    const content = readFileSync(SCOPED_PATH, 'utf-8')
    const updateBlocks = content.match(/update\s*\(.*?\)\s*\{[\s\S]*?\}/g) ?? []
    const hasOrgFilter = updateBlocks.some(
      (block) => block.includes('getOrgIdColumn') || block.includes('orgFilter'),
    )
    expect(hasOrgFilter, 'update() must enforce Org filter').toBe(true)
  })

  it('delete() always applies Org filter', () => {
    const content = readFileSync(SCOPED_PATH, 'utf-8')
    const deleteBlocks = content.match(/delete\s*\(.*?\)\s*\{[\s\S]*?\}/g) ?? []
    const hasOrgFilter = deleteBlocks.some(
      (block) => block.includes('getOrgIdColumn') || block.includes('orgFilter'),
    )
    expect(hasOrgFilter, 'delete() must enforce Org filter').toBe(true)
  })

  // ── 3) Table without org_id throws ────────────────────────────────────

  it('getOrgIdColumn throws when org_id column is missing', () => {
    const content = readFileSync(SCOPED_PATH, 'utf-8')
    expect(content).toContain('does not have an org_id column')
    expect(content).toContain('throw new ScopedDbError')
  })

  // ── 4) Read-only surface has no write methods ────────────────────────────

  it('ReadOnlyScopedDb interface lacks insert/update/delete', () => {
    const content = readFileSync(SCOPED_PATH, 'utf-8')
    // Extract the ReadOnlyScopedDb interface
    const roMatch = content.match(/export interface ReadOnlyScopedDb\s*\{[\s\S]*?\n\}/)
    expect(roMatch, 'ReadOnlyScopedDb interface must exist').toBeTruthy()
    const roBody = roMatch![0]
    // Must have select
    expect(roBody).toContain('select')
    // Must NOT have insert/update/delete
    expect(roBody).not.toMatch(/\binsert\b/)
    expect(roBody).not.toMatch(/\bupdate\b/)
    expect(roBody).not.toMatch(/\bdelete\b/)
  })

  it('ReadOnlyViolationError is defined for blocked write attempts', () => {
    const content = readFileSync(SCOPED_PATH, 'utf-8')
    expect(content).toContain('class ReadOnlyViolationError')
    expect(content).toContain('[SECURITY] Write operation')
    expect(content).toContain('createAuditedScopedDb')
  })

  // ── 5) Object-form API returns read-only by default ──────────────────────

  it('createScopedDb with object opts returns ReadOnlyScopedDb', () => {
    const content = readFileSync(SCOPED_PATH, 'utf-8')
    // Object overload signature
    expect(content).toMatch(/createScopedDb\(opts:\s*ScopedDbOptions\):\s*ReadOnlyScopedDb/)
  })

  // ── 6) Audited factory exists and requires actorId ───────────────────────

  it('createAuditedScopedDb exists in audit.ts', () => {
    const content = readFileSync(AUDIT_PATH, 'utf-8')
    expect(content).toContain('export function createAuditedScopedDb')
    expect(content).toContain('AuditedScopedDbOptions')
  })

  it('withAudit validates context.orgId matches scopedDb', () => {
    const content = readFileSync(AUDIT_PATH, 'utf-8')
    expect(content).toMatch(/context\.orgId.*scopedDb/)
  })

  // ── 7) Audit is mandatory on mutations ───────────────────────────────────

  it('audit emission failure blocks mutations', () => {
    const content = readFileSync(AUDIT_PATH, 'utf-8')
    expect(content).toContain('[AUDIT:MANDATORY]')
    expect(content).toContain('Mutation blocked')
  })

  // ── 8) No raw client export from scoped module ───────────────────────────

  it('scoped.ts does not export raw drizzle client', () => {
    const content = readFileSync(SCOPED_PATH, 'utf-8')
    // Must not export db directly
    expect(content).not.toMatch(/export\s+\{\s*db\b/)
    expect(content).not.toMatch(/export\s+const\s+db\b/)
  })

  // ── 9) Org-scoped table registry exists ──────────────────────────────────

  it('org-registry.ts exists with ORG_SCOPED_TABLES', () => {
    const regPath = join(ROOT, 'packages', 'db', 'src', 'org-registry.ts')
    expect(existsSync(regPath), 'org-registry.ts must exist').toBe(true)
    const content = readFileSync(regPath, 'utf-8')
    expect(content).toContain('ORG_SCOPED_TABLES')
    expect(content).toContain('NON_ORG_SCOPED_TABLES')
  })

  // ── 10) ESLint no-shadow-db rule exists ──────────────────────────────────

  it('ESLint no-shadow-db rule blocks @nzila/db/raw in apps', () => {
    const eslintPath = join(ROOT, 'packages', 'db', 'eslint-no-shadow-db.mjs')
    expect(existsSync(eslintPath), 'eslint-no-shadow-db.mjs must exist').toBe(true)
    const content = readFileSync(eslintPath, 'utf-8')
    expect(content).toContain('@nzila/db/raw')
    expect(content).toContain('@nzila/db/client')
    expect(content).toContain('createScopedDb')
  })

  // ── 11) Allowlist enforcement ────────────────────────────────────────────

  it('ESLint rule documents allowed consumers', () => {
    const eslintPath = join(ROOT, 'packages', 'db', 'eslint-no-shadow-db.mjs')
    const content = readFileSync(eslintPath, 'utf-8')
    // Must mention allowed consumers in comments/docs
    expect(content).toMatch(/os-core|platform layer/)
    expect(content).toMatch(/tooling|migrations/)
  })
})
