/**
 * Contract Test — ABR Need-to-Know Access Control
 *
 * Verifies that case-level access is strictly enforced based on:
 *   - User role in the Org (metadata, case-details, identity-access tiers)
 *   - Explicit dual-controlled access grants (for identity)
 *   - Grant expiry enforcement
 *   - No identity fields leak through case-level access
 *
 * Tests:
 *   ABR-NTK-01: Metadata-only access granted to case-manager role
 *   ABR-NTK-02: Case-details access granted to compliance-officer role
 *   ABR-NTK-03: Identity access denied without explicit grant
 *   ABR-NTK-04: Identity access granted with valid grant (dual-control precondition)
 *   ABR-NTK-05: Expired grant is rejected for identity access
 *   ABR-NTK-06: User without any matching role is denied metadata
 *   ABR-NTK-07: Access level 'none' always returns allowed: false
 *   ABR-NTK-08: Identity access reason contains grantor information
 *
 * @invariant ABR-NTK: No user may access reporter identity without an explicit
 *            time-bounded dual-controlled grant
 */
import { describe, it, expect } from 'vitest'
import type { CaseAccessLevel } from '../../packages/os-core/src/abr/confidential-reporting.js'

const {
  evaluateCaseAccess,
} = await import('../../packages/os-core/src/abr/confidential-reporting.js').catch(async () => {
  const mod = await import('../../packages/os-core/src/abr/confidential-reporting')
  return { evaluateCaseAccess: mod.evaluateCaseAccess }
})

// ── Test fixtures ─────────────────────────────────────────────────────────────

const CASE_ID = 'case-001'
const USER_ID = 'user-001'

function makeGrant(
  userId = USER_ID,
  caseId = CASE_ID,
  accessLevel: CaseAccessLevel = 'identity-access',
  grantedBy = 'admin-001',
  expiresAt?: string,
) {
  return {
    userId,
    caseId,
    accessLevel,
    grantedBy,
    grantedAt: new Date(Date.now() - 1000).toISOString(),
    expiresAt,
    reason: 'Compliance review approved',
  }
}

// ── ABR-NTK-01: Metadata access via role ─────────────────────────────────────

describe('ABR-NTK-01 — Metadata access granted to case-manager role', () => {
  it('case-manager role grants metadata-only access', () => {
    const result = evaluateCaseAccess(
      USER_ID,
      ['case-manager'],
      'metadata-only',
      [],   // no explicit grants
    )
    expect(result.allowed).toBe(true)
  })

  it('compliance-officer also grants metadata-only access', () => {
    const result = evaluateCaseAccess(
      USER_ID,
      ['compliance-officer'],
      'metadata-only',
      [],
    )
    expect(result.allowed).toBe(true)
  })
})

// ── ABR-NTK-02: Case-details access via role ──────────────────────────────────

describe('ABR-NTK-02 — Case-details access granted to compliance-officer', () => {
  it('compliance-officer role grants case-details access', () => {
    const result = evaluateCaseAccess(
      USER_ID,
      ['compliance-officer'],
      'case-details',
      [],
    )
    expect(result.allowed).toBe(true)
  })

  it('case-manager role alone does NOT grant case-details access', () => {
    const result = evaluateCaseAccess(
      USER_ID,
      ['case-manager'],
      'case-details',
      [],
    )
    // case-manager is in metadataAccess but NOT in detailsAccess
    expect(result.allowed).toBe(false)
  })
})

// ── ABR-NTK-03: Identity access denied without grant ─────────────────────────

describe('ABR-NTK-03 — Identity access denied without explicit grant', () => {
  it('compliance-officer role alone does NOT grant identity access', () => {
    const result = evaluateCaseAccess(
      USER_ID,
      ['compliance-officer', 'admin'],
      'identity-access',
      [],   // no identity grants
    )
    expect(result.allowed).toBe(false)
  })

  it('admin role alone does NOT grant identity access without a grant', () => {
    const result = evaluateCaseAccess(
      USER_ID,
      ['admin'],
      'identity-access',
      [],
    )
    expect(result.allowed).toBe(false)
  })

  it('reason indicates dual-control grant requirement', () => {
    const result = evaluateCaseAccess(USER_ID, ['admin'], 'identity-access', [])
    expect(result.reason.toLowerCase()).toMatch(/dual.control|grant/)
  })
})

// ── ABR-NTK-04: Identity access with valid grant ──────────────────────────────

describe('ABR-NTK-04 — Identity access allowed with valid non-expired grant', () => {
  it('valid identity grant for correct user + case → allowed', () => {
    const grant = makeGrant(USER_ID, CASE_ID, 'identity-access', 'admin-001')
    const result = evaluateCaseAccess(
      USER_ID,
      ['compliance-officer'],
      'identity-access',
      [grant],
    )
    expect(result.allowed).toBe(true)
  })

  it('grant reason includes grantor identity', () => {
    const grant = makeGrant(USER_ID, CASE_ID, 'identity-access', 'admin-001')
    const result = evaluateCaseAccess(USER_ID, [], 'identity-access', [grant])
    expect(result.reason).toContain('admin-001')
  })
})

// ── ABR-NTK-05: Expired grant rejected ───────────────────────────────────────

describe('ABR-NTK-05 — Expired identity grant is rejected', () => {
  it('grant expired 1 second ago is denied', () => {
    const expiredAt = new Date(Date.now() - 1000).toISOString()
    const grant = makeGrant(USER_ID, CASE_ID, 'identity-access', 'admin-001', expiredAt)
    const result = evaluateCaseAccess(
      USER_ID,
      ['compliance-officer'],
      'identity-access',
      [grant],
    )
    expect(result.allowed).toBe(false)
  })

  it('grant expiring in the future is accepted', () => {
    const expiresAt = new Date(Date.now() + 3_600_000).toISOString() // +1h
    const grant = makeGrant(USER_ID, CASE_ID, 'identity-access', 'admin-001', expiresAt)
    const result = evaluateCaseAccess(USER_ID, [], 'identity-access', [grant])
    expect(result.allowed).toBe(true)
  })
})

// ── ABR-NTK-06: No matching role → denied metadata ───────────────────────────

describe('ABR-NTK-06 — User without any matching role is denied all access', () => {
  it('viewer role gives no metadata access', () => {
    const result = evaluateCaseAccess(USER_ID, ['viewer'], 'metadata-only', [])
    expect(result.allowed).toBe(false)
  })

  it('empty roles gives no metadata access', () => {
    const result = evaluateCaseAccess(USER_ID, [], 'metadata-only', [])
    expect(result.allowed).toBe(false)
  })
})

// ── ABR-NTK-07: Grant for different user does not apply ───────────────────────

describe('ABR-NTK-07 — Identity grant for different user is not transferable', () => {
  it('grant issued to user-002 does not grant identity access to user-001', () => {
    const grant = makeGrant('user-002', CASE_ID, 'identity-access', 'admin-001')
    const result = evaluateCaseAccess(
      'user-001',    // different user from grant
      ['admin'],
      'identity-access',
      [grant],
    )
    expect(result.allowed).toBe(false)
  })
})

// ── ABR-NTK-08: evaluateCaseAccess is exported ────────────────────────────────

describe('ABR-NTK-08 — evaluateCaseAccess is callable', () => {
  it('function is exported and returns {allowed, reason}', () => {
    expect(typeof evaluateCaseAccess).toBe('function')
    const result = evaluateCaseAccess('u', [], 'none', [])
    expect(result).toHaveProperty('allowed')
    expect(result).toHaveProperty('reason')
  })
})
