/**
 * Contract Test — Trade Server Actions — ORG_REQUIRED
 *
 * TRADE_SERVER_ACTIONS_ORG_REQUIRED_001:
 * Every server action file in apps/trade MUST:
 *   1. Use 'use server' directive
 *   2. Call resolveOrgContext() for authentication + org scoping
 *   3. Build audit entries for mutations
 *
 * @invariant TRADE_SERVER_ACTIONS_ORG_REQUIRED_001
 */
import { describe, it, expect } from 'vitest'
import { readFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'

const ROOT = join(__dirname, '../..')
const TRADE_ACTIONS = join(ROOT, 'apps', 'trade', 'lib', 'actions')

const ACTION_FILES = [
  'party-actions.ts',
  'listing-actions.ts',
  'deal-actions.ts',
  'quote-actions.ts',
  'financing-actions.ts',
  'shipment-actions.ts',
  'document-actions.ts',
  'commission-actions.ts',
]

describe('TRADE-ACT — Server action files exist', () => {
  for (const file of ACTION_FILES) {
    it(`${file} exists`, () => {
      expect(existsSync(join(TRADE_ACTIONS, file))).toBe(true)
    })
  }
})

describe('TRADE-ACT-01 — Every action file uses "use server" directive', () => {
  for (const file of ACTION_FILES) {
    it(`${file} has 'use server'`, () => {
      const path = join(TRADE_ACTIONS, file)
      if (!existsSync(path)) return
      const content = readFileSync(path, 'utf-8')
      expect(content).toContain("'use server'")
    })
  }
})

describe('TRADE-ACT-01 — Every action calls resolveOrgContext()', () => {
  for (const file of ACTION_FILES) {
    it(`${file} calls resolveOrgContext()`, () => {
      const path = join(TRADE_ACTIONS, file)
      if (!existsSync(path)) return
      const content = readFileSync(path, 'utf-8')
      expect(content).toContain('resolveOrgContext')
    })
  }
})

describe('TRADE-ACT-02 — Mutating actions build audit entries', () => {
  const MUTATING_FILES = [
    'party-actions.ts',
    'listing-actions.ts',
    'deal-actions.ts',
    'quote-actions.ts',
    'financing-actions.ts',
    'shipment-actions.ts',
    'document-actions.ts',
    'commission-actions.ts',
  ]

  for (const file of MUTATING_FILES) {
    it(`${file} builds audit entries`, () => {
      const path = join(TRADE_ACTIONS, file)
      if (!existsSync(path)) return
      const content = readFileSync(path, 'utf-8')
      const hasTransitionAudit = content.includes('buildTransitionAuditEntry')
      const hasActionAudit = content.includes('buildActionAuditEntry')
      expect(
        hasTransitionAudit || hasActionAudit,
        `${file} must use buildTransitionAuditEntry or buildActionAuditEntry`,
      ).toBe(true)
    })
  }
})

describe('TRADE-ACT-03 — resolveOrgContext import comes from @/lib/resolve-org', () => {
  for (const file of ACTION_FILES) {
    it(`${file} imports from @/lib/resolve-org`, () => {
      const path = join(TRADE_ACTIONS, file)
      if (!existsSync(path)) return
      const content = readFileSync(path, 'utf-8')
      if (content.includes('resolveOrgContext')) {
        expect(content).toContain("from '@/lib/resolve-org'")
      }
    })
  }
})
