/**
 * Contract Test — ABR Dual-Control Enforcement
 *
 * Verifies that all sensitive ABR operations require approval by a
 * distinct actor from the requester. This prevents a single actor from
 * initiating AND approving their own sensitive action.
 *
 * Tests:
 *   ABR-DC-01: Self-approve is rejected (requester === approver)
 *   ABR-DC-02: Execute without approval is rejected
 *   ABR-DC-03: Execution after valid approval by different actor succeeds
 *   ABR-DC-04: Requester without required role is rejected
 *   ABR-DC-05: Approver without required role is rejected
 *   ABR-DC-06: Covers case-close, severity-change, identity-unmask actions
 *   ABR-DC-07: validateDualControl exported and callable
 *
 * @invariant ABR-DUAL-CONTROL: No single actor can both request and approve
 *            any sensitive ABR operation
 */
import { describe, it, expect } from 'vitest'
import type { DualControlAction } from '../../packages/os-core/src/abr/confidential-reporting.js'

const {
  validateDualControl,
} = await import('../../packages/os-core/src/abr/confidential-reporting.js').catch(() =>
  import('../../packages/os-core/src/abr/confidential-reporting'),
)

// ── Test fixtures ─────────────────────────────────────────────────────────────

const REQUIRED_ROLES = ['compliance-officer', 'admin']

function makeRequest(requestedBy = 'user-A', action: DualControlAction = 'case-close', caseId = 'case-001') {
  return {
    action,
    caseId,
    requestedBy,
    requestedAt: new Date().toISOString(),
    justification: 'Required compliance review',
  }
}

function makeApproval(approvedBy = 'user-B', requestId = 'req-001') {
  return {
    requestId,
    approvedBy,
    approvedAt: new Date().toISOString(),
  }
}

// ── ABR-DC-01: Self-approve is rejected ───────────────────────────────────────

describe('ABR-DC-01 — Self-approve is rejected', () => {
  it('case-close: requester == approver → approved: false', () => {
    const request = makeRequest('user-A', 'case-close')
    const approval = makeApproval('user-A')    // same actor!
    const result = validateDualControl(
      request, approval,
      REQUIRED_ROLES,
      ['compliance-officer'],     // requestor roles
      ['compliance-officer'],     // approver roles
    )
    expect(result.approved).toBe(false)
  })

  it('severity-change: self-approve rejected regardless of roles', () => {
    const request = makeRequest('user-X', 'severity-change')
    const approval = makeApproval('user-X')
    const result = validateDualControl(
      request, approval,
      REQUIRED_ROLES,
      ['admin'],
      ['admin'],
    )
    expect(result.approved).toBe(false)
  })

  it('identity-unmask: self-approve rejected', () => {
    const request = makeRequest('officer-1', 'identity-unmask')
    const approval = makeApproval('officer-1')   // same person
    const result = validateDualControl(
      request, approval,
      REQUIRED_ROLES,
      ['compliance-officer'],
      ['compliance-officer'],
    )
    expect(result.approved).toBe(false)
  })
})

// ── ABR-DC-02: Execute without approval is rejected ──────────────────────────

describe('ABR-DC-02 — No approval → rejected', () => {
  it('null approval causes approved: false', () => {
    const request = makeRequest('user-A')
    const result = validateDualControl(
      request,
      null,           // no approval
      REQUIRED_ROLES,
      ['compliance-officer'],
      [],
    )
    expect(result.approved).toBe(false)
  })
})

// ── ABR-DC-03: Valid approval by distinct actor succeeds ──────────────────────

describe('ABR-DC-03 — Valid approval by distinct actor succeeds', () => {
  it('case-close: different actors with required roles → approved: true', () => {
    const request = makeRequest('user-A', 'case-close')
    const approval = makeApproval('user-B')   // different actor
    const result = validateDualControl(
      request, approval,
      REQUIRED_ROLES,
      ['compliance-officer'],
      ['compliance-officer'],
    )
    expect(result.approved).toBe(true)
    expect(result.approvedBy).toBe('user-B')
    expect(result.requestedBy).toBe('user-A')
  })

  it('identity-unmask: admin approves compliance-officer request → approved: true', () => {
    const request = makeRequest('officer-1', 'identity-unmask')
    const approval = makeApproval('admin-1')
    const result = validateDualControl(
      request, approval,
      REQUIRED_ROLES,
      ['compliance-officer'],
      ['admin'],
    )
    expect(result.approved).toBe(true)
  })
})

// ── ABR-DC-04: Requester without required role is rejected ────────────────────

describe('ABR-DC-04 — Requester without required role → rejected', () => {
  it('user with only viewer role cannot request case-close', () => {
    const request = makeRequest('viewer-1')
    const approval = makeApproval('admin-1')
    const result = validateDualControl(
      request, approval,
      REQUIRED_ROLES,
      ['viewer'],           // requestor has no required role
      ['admin'],
    )
    expect(result.approved).toBe(false)
  })

  it('requester with empty roles → rejected', () => {
    const request = makeRequest('user-A')
    const approval = makeApproval('user-B')
    const result = validateDualControl(
      request, approval,
      REQUIRED_ROLES,
      [],                // no roles
      ['compliance-officer'],
    )
    expect(result.approved).toBe(false)
  })
})

// ── ABR-DC-05: Approver without required role is rejected ─────────────────────

describe('ABR-DC-05 — Approver without required role → rejected', () => {
  it('approver with only viewer role → rejected', () => {
    const request = makeRequest('user-A')
    const approval = makeApproval('user-B')
    const result = validateDualControl(
      request, approval,
      REQUIRED_ROLES,
      ['compliance-officer'],
      ['viewer'],         // approver has no required role
    )
    expect(result.approved).toBe(false)
  })
})

// ── ABR-DC-06: All three sensitive actions covered ────────────────────────────

describe('ABR-DC-06 — All DualControlAction types enforce dual-control', () => {
  const sensitiveActions: DualControlAction[] = ['case-close', 'severity-change', 'identity-unmask']

  for (const action of sensitiveActions) {
    it(`${action}: self-approve rejected`, () => {
      const request = makeRequest('user-A', action)
      const approval = makeApproval('user-A')
      const result = validateDualControl(
        request, approval,
        REQUIRED_ROLES,
        ['compliance-officer'],
        ['compliance-officer'],
      )
      expect(result.approved, `${action} must reject self-approval`).toBe(false)
    })

    it(`${action}: valid two-actor approval succeeds`, () => {
      const request = makeRequest('user-A', action)
      const approval = makeApproval('user-B')
      const result = validateDualControl(
        request, approval,
        REQUIRED_ROLES,
        ['compliance-officer'],
        ['admin'],
      )
      expect(result.approved, `${action} must pass with two distinct actors`).toBe(true)
    })
  }
})

// ── ABR-DC-07: Result always contains action + caseId ─────────────────────────

describe('ABR-DC-07 — Result shape invariants', () => {
  it('result always contains action and caseId', () => {
    const request = makeRequest('user-A', 'case-close', 'case-999')
    const result = validateDualControl(request, null, REQUIRED_ROLES, ['compliance-officer'], [])
    expect(result.action).toBe('case-close')
    expect(result.caseId).toBe('case-999')
    expect(result.requestedBy).toBe('user-A')
  })
})
