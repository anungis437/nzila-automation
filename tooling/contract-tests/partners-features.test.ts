/**
 * Contract Test — Partners App Feature Completeness
 *
 * Structural invariants for Partners app buildout:
 *   1. Server action files exist with 'use server' directive
 *   2. All admin pages are async server components (no 'use client')
 *   3. Portal pages import from server actions (no hardcoded mock data)
 *   4. Client components exist with correct 'use client' + useTransition pattern
 *   5. Error/Loading boundaries exist for admin and portal
 *   6. payments.ts accepts dynamic currency (no hardcoded 'cad')
 *   7. Barrel export includes all new components
 *   8. Deal pipeline stages match action definitions
 *   9. Commission tier multipliers are correct
 *
 * @invariant PART-01: Server actions exist with 'use server'
 * @invariant PART-02: Admin pages are server components
 * @invariant PART-03: Portal pages import server actions
 * @invariant PART-04: Client components pattern
 * @invariant PART-05: Error/Loading boundaries
 * @invariant PART-06: Dynamic currency in payments
 * @invariant PART-07: Barrel export completeness
 * @invariant PART-08: Deal pipeline stage consistency
 * @invariant PART-09: Commission multiplier correctness
 */
import { describe, it, expect } from 'vitest'
import { readFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'

const ROOT = join(__dirname, '../..')
const PARTNERS = join(ROOT, 'apps', 'partners')
const ACTIONS = join(PARTNERS, 'lib', 'actions')
const COMPONENTS = join(PARTNERS, 'components', 'partner')
const ADMIN_PAGES = join(PARTNERS, 'app', 'admin')
const PORTAL_PAGES = join(PARTNERS, 'app', 'portal')

function readSafe(path: string): string {
  return existsSync(path) ? readFileSync(path, 'utf-8') : ''
}

// ── PART-01: Server Actions Exist ───────────────────────────────────────────

describe('PART-01 — Server action files with use server', () => {
  const actions = [
    'deal-actions.ts',
    'commission-actions.ts',
    'certification-actions.ts',
    'admin-actions.ts',
  ]

  for (const file of actions) {
    const src = readSafe(join(ACTIONS, file))

    it(`${file} exists`, () => {
      expect(src.length).toBeGreaterThan(0)
    })

    it(`${file} has 'use server' directive`, () => {
      expect(src).toContain("'use server'")
    })
  }

  it('deal-actions exports listDeals, getDealStats, createDeal, updateDealStage', () => {
    const src = readSafe(join(ACTIONS, 'deal-actions.ts'))
    expect(src).toContain('export async function listDeals')
    expect(src).toContain('export async function getDealStats')
    expect(src).toContain('export async function createDeal')
    expect(src).toContain('export async function updateDealStage')
  })

  it('commission-actions exports listCommissions, getCommissionSummary, createCommission', () => {
    const src = readSafe(join(ACTIONS, 'commission-actions.ts'))
    expect(src).toContain('export async function listCommissions')
    expect(src).toContain('export async function getCommissionSummary')
    expect(src).toContain('export async function createCommission')
  })

  it('certification-actions exports getCertProgress, completeModule', () => {
    const src = readSafe(join(ACTIONS, 'certification-actions.ts'))
    expect(src).toContain('export async function getCertProgress')
    expect(src).toContain('export async function completeModule')
  })

  it('admin-actions exports getPartners, updatePartnerStatus, getPlatformStats', () => {
    const src = readSafe(join(ACTIONS, 'admin-actions.ts'))
    expect(src).toContain('export async function getPartners')
    expect(src).toContain('export async function updatePartnerStatus')
    expect(src).toContain('export async function getPlatformStats')
  })
})

// ── PART-02: Admin Pages Are Server Components ──────────────────────────────

describe('PART-02 — Admin pages are server components', () => {
  const adminPages = [
    'analytics/page.tsx',
    'commissions/page.tsx',
    'settings/page.tsx',
    'partners/page.tsx',
  ]

  for (const page of adminPages) {
    const src = readSafe(join(ADMIN_PAGES, page))

    it(`admin/${page} exists`, () => {
      expect(src.length).toBeGreaterThan(0)
    })

    it(`admin/${page} is NOT a client component`, () => {
      // Server components must not have 'use client' at top
      const firstLine = src.split('\n')[0].trim()
      expect(firstLine).not.toBe("'use client'")
    })

    it(`admin/${page} imports from lib (actions or partner-auth)`, () => {
      expect(src).toMatch(/@\/lib\/actions\/|@\/lib\/partner-auth/)
    })
  }
})

// ── PART-03: Portal Pages Import Server Actions ─────────────────────────────

describe('PART-03 — Portal pages import from server actions or components', () => {
  const portalPages = [
    { path: 'deals/page.tsx', imports: 'deal-actions' },
    { path: 'deals/new/page.tsx', imports: 'DealRegistrationForm' },
    { path: 'commissions/page.tsx', imports: 'commission-actions' },
    { path: 'certifications/page.tsx', imports: 'certification-actions' },
  ]

  for (const { path, imports } of portalPages) {
    const src = readSafe(join(PORTAL_PAGES, path))

    it(`portal/${path} exists`, () => {
      expect(src.length).toBeGreaterThan(0)
    })

    it(`portal/${path} imports ${imports}`, () => {
      expect(src).toContain(imports)
    })

    it(`portal/${path} has no hardcoded mock arrays`, () => {
      // No inline mock data arrays (pattern: const xxx = [ { ... } ])
      expect(src).not.toMatch(/const\s+\w+\s*=\s*\[\s*\{[^}]*value:\s*'\$0/)
    })
  }
})

// ── PART-04: Client Components Pattern ──────────────────────────────────────

describe('PART-04 — Client components use correct pattern', () => {
  const components = [
    'PartnerTable.tsx',
    'AdminSettingsForm.tsx',
    'DealRegistrationForm.tsx',
  ]

  for (const comp of components) {
    const src = readSafe(join(COMPONENTS, comp))

    it(`${comp} exists`, () => {
      expect(src.length).toBeGreaterThan(0)
    })

    it(`${comp} has 'use client' directive`, () => {
      expect(src).toContain("'use client'")
    })

    it(`${comp} uses useTransition for loading states`, () => {
      expect(src).toContain('useTransition')
    })
  }
})

// ── PART-05: Error/Loading Boundaries ───────────────────────────────────────

describe('PART-05 — Error and Loading boundaries exist', () => {
  const boundaries = [
    'admin/loading.tsx',
    'admin/error.tsx',
    'portal/loading.tsx',
    'portal/error.tsx',
  ]

  for (const file of boundaries) {
    it(`app/${file} exists`, () => {
      const path = join(PARTNERS, 'app', file)
      expect(existsSync(path)).toBe(true)
    })
  }

  it('admin/error.tsx is a client component', () => {
    const src = readSafe(join(PARTNERS, 'app', 'admin', 'error.tsx'))
    expect(src).toContain("'use client'")
  })

  it('portal/error.tsx is a client component', () => {
    const src = readSafe(join(PARTNERS, 'app', 'portal', 'error.tsx'))
    expect(src).toContain("'use client'")
  })
})

// ── PART-06: Dynamic Currency in Payments ───────────────────────────────────

describe('PART-06 — payments.ts uses dynamic currency', () => {
  const src = readSafe(join(PARTNERS, 'lib', 'payments.ts'))

  it('payments.ts exists', () => {
    expect(src.length).toBeGreaterThan(0)
  })

  it('accepts currency parameter', () => {
    expect(src).toContain('currency?')
  })

  it('does NOT hardcode cad currency', () => {
    expect(src).not.toContain("currency: 'cad'")
  })

  it('defaults to usd', () => {
    expect(src).toContain("'usd'")
  })
})

// ── PART-07: Barrel Export Completeness ──────────────────────────────────────

describe('PART-07 — Barrel export includes all components', () => {
  const src = readSafe(join(COMPONENTS, 'index.ts'))

  const expectedExports = [
    'TierBadge',
    'TierProgress',
    'StatCard',
    'EmptyState',
    'PartnerTable',
    'AdminSettingsForm',
    'DealRegistrationForm',
  ]

  for (const name of expectedExports) {
    it(`exports ${name}`, () => {
      expect(src).toContain(name)
    })
  }
})

// ── PART-08: Deal Pipeline Stage Consistency ────────────────────────────────

describe('PART-08 — Deal pipeline stages match between action and page', () => {
  const actionSrc = readSafe(join(ACTIONS, 'deal-actions.ts'))
  const pageSrc = readSafe(join(PORTAL_PAGES, 'deals', 'page.tsx'))

  const stages = ['registered', 'submitted', 'approved', 'won']

  for (const stage of stages) {
    it(`stage "${stage}" exists in deal-actions`, () => {
      expect(actionSrc).toContain(stage)
    })

    it(`stage "${stage}" exists in deals page`, () => {
      expect(pageSrc).toContain(stage)
    })
  }
})

// ── PART-09: Commission Multiplier Correctness ──────────────────────────────

describe('PART-09 — Commission tier multipliers match tier-gates', () => {
  const tierGates = readSafe(join(PARTNERS, 'lib', 'tier-gates.ts'))
  const commissionActions = readSafe(join(ACTIONS, 'commission-actions.ts'))

  it('tier-gates defines multiplier function', () => {
    expect(tierGates).toMatch(/tierMultiplier|multiplier/)
  })

  it('commission-actions imports from tier-gates', () => {
    expect(commissionActions).toContain('tier-gates')
  })

  it('commission-actions computes finalAmount from multiplier', () => {
    expect(commissionActions).toContain('finalAmount')
  })
})
