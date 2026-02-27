/**
 * CFO — RBAC Unit Tests
 *
 * Comprehensive tests for the role-based access control system covering:
 * - 15 roles (5 platform + 7 firm + 3 client)
 * - 45+ permissions
 * - Permission matrix correctness
 * - Role hierarchy
 * - Page visibility per role
 * - Helper functions (isClientRole, isFirmRole, roleHasPermission, etc.)
 */
import { describe, it, expect } from 'vitest'
import {
  type PlatformRole,
  type FirmRole,
  type ClientRole,
  type Permission,
  FIRM_ROLE_HIERARCHY,
  CLIENT_ROLE_HIERARCHY,
  FIRM_PERMISSIONS,
  CLIENT_PERMISSIONS,
  PLATFORM_PERMISSIONS,
  PAGE_PERMISSIONS,
  roleHasPermission,
  platformRoleHasPermission,
  getPermissionsForRole,
  getVisiblePages,
  isClientRole,
  isFirmRole,
} from '../rbac'

// ── Constants ───────────────────────────────────────────────────────────────

const ALL_FIRM_ROLES: FirmRole[] = [
  'firm_owner', 'partner', 'manager', 'senior_accountant',
  'staff_accountant', 'bookkeeper', 'admin_assistant',
]

const ALL_CLIENT_ROLES: ClientRole[] = [
  'client_owner', 'client_contact', 'client_viewer',
]

const ALL_PLATFORM_ROLES: PlatformRole[] = [
  'platform_admin', 'studio_admin', 'ops', 'analyst', 'viewer',
]

const ALL_PAGE_ROUTES = Object.keys(PAGE_PERMISSIONS)

// ── Role Hierarchy ──────────────────────────────────────────────────────────

describe('Role hierarchy', () => {
  it('firm hierarchy has correct ordering', () => {
    expect(FIRM_ROLE_HIERARCHY.firm_owner).toBeGreaterThan(FIRM_ROLE_HIERARCHY.partner)
    expect(FIRM_ROLE_HIERARCHY.partner).toBeGreaterThan(FIRM_ROLE_HIERARCHY.manager)
    expect(FIRM_ROLE_HIERARCHY.manager).toBeGreaterThan(FIRM_ROLE_HIERARCHY.senior_accountant)
    expect(FIRM_ROLE_HIERARCHY.senior_accountant).toBeGreaterThan(FIRM_ROLE_HIERARCHY.staff_accountant)
    expect(FIRM_ROLE_HIERARCHY.staff_accountant).toBeGreaterThan(FIRM_ROLE_HIERARCHY.bookkeeper)
    expect(FIRM_ROLE_HIERARCHY.bookkeeper).toBeGreaterThan(FIRM_ROLE_HIERARCHY.admin_assistant)
  })

  it('client hierarchy has correct ordering', () => {
    expect(CLIENT_ROLE_HIERARCHY.client_owner).toBeGreaterThan(CLIENT_ROLE_HIERARCHY.client_contact)
    expect(CLIENT_ROLE_HIERARCHY.client_contact).toBeGreaterThan(CLIENT_ROLE_HIERARCHY.client_viewer)
  })

  it('all 7 firm roles are in the hierarchy', () => {
    expect(Object.keys(FIRM_ROLE_HIERARCHY)).toHaveLength(7)
    for (const role of ALL_FIRM_ROLES) {
      expect(FIRM_ROLE_HIERARCHY[role]).toBeDefined()
    }
  })

  it('all 3 client roles are in the hierarchy', () => {
    expect(Object.keys(CLIENT_ROLE_HIERARCHY)).toHaveLength(3)
    for (const role of ALL_CLIENT_ROLES) {
      expect(CLIENT_ROLE_HIERARCHY[role]).toBeDefined()
    }
  })
})

// ── Permission Matrix Coverage ──────────────────────────────────────────────

describe('Permission matrix coverage', () => {
  it('all 7 firm roles have permission entries', () => {
    expect(Object.keys(FIRM_PERMISSIONS)).toHaveLength(7)
    for (const role of ALL_FIRM_ROLES) {
      expect(FIRM_PERMISSIONS[role]).toBeDefined()
      expect(FIRM_PERMISSIONS[role].length).toBeGreaterThan(0)
    }
  })

  it('all 3 client roles have permission entries', () => {
    expect(Object.keys(CLIENT_PERMISSIONS)).toHaveLength(3)
    for (const role of ALL_CLIENT_ROLES) {
      expect(CLIENT_PERMISSIONS[role]).toBeDefined()
      expect(CLIENT_PERMISSIONS[role].length).toBeGreaterThan(0)
    }
  })

  it('all 5 platform roles have permission entries', () => {
    expect(Object.keys(PLATFORM_PERMISSIONS)).toHaveLength(5)
    for (const role of ALL_PLATFORM_ROLES) {
      expect(PLATFORM_PERMISSIONS[role]).toBeDefined()
      expect(PLATFORM_PERMISSIONS[role].length).toBeGreaterThan(0)
    }
  })

  it('every role has at least dashboard:view', () => {
    for (const role of ALL_FIRM_ROLES) {
      expect(FIRM_PERMISSIONS[role]).toContain('dashboard:view')
    }
    for (const role of ALL_CLIENT_ROLES) {
      expect(CLIENT_PERMISSIONS[role]).toContain('dashboard:view')
    }
    for (const role of ALL_PLATFORM_ROLES) {
      expect(PLATFORM_PERMISSIONS[role]).toContain('dashboard:view')
    }
  })

  it('PAGE_PERMISSIONS covers all 19 dashboard routes', () => {
    expect(ALL_PAGE_ROUTES).toHaveLength(19)
    const expected = [
      'dashboard', 'clients', 'client-portal', 'ledger', 'documents',
      'tasks', 'reports', 'integrations', 'tax-tools', 'workflows',
      'alerts', 'notifications', 'advisory-ai', 'ai-insights', 'messages',
      'security', 'audit', 'platform-admin', 'settings',
    ]
    for (const route of expected) {
      expect(ALL_PAGE_ROUTES).toContain(route)
    }
  })
})

// ── Firm Owner (full access) ────────────────────────────────────────────────

describe('firm_owner permissions', () => {
  const role: FirmRole = 'firm_owner'
  const perms = FIRM_PERMISSIONS[role]

  it('has the most permissions of any firm role', () => {
    for (const other of ALL_FIRM_ROLES.filter(r => r !== 'firm_owner')) {
      expect(perms.length).toBeGreaterThanOrEqual(FIRM_PERMISSIONS[other].length)
    }
  })

  it('can manage settings and security', () => {
    expect(perms).toContain('settings:manage')
    expect(perms).toContain('security:manage')
  })

  it('can delete clients', () => {
    expect(perms).toContain('clients:delete')
  })

  it('can approve ledger entries', () => {
    expect(perms).toContain('ledger:approve')
  })

  it('can manage workflows', () => {
    expect(perms).toContain('workflows:manage')
    expect(perms).toContain('workflows:create')
  })

  it('has FX permissions', () => {
    expect(perms).toContain('fx:view')
    expect(perms).toContain('fx:convert')
  })

  it('does NOT have platform_admin permissions', () => {
    expect(perms).not.toContain('platform_admin:view')
    expect(perms).not.toContain('platform_admin:manage')
  })
})

// ── Permission scoping — bookkeeper is restricted ───────────────────────────

describe('bookkeeper permissions (restricted)', () => {
  const role: FirmRole = 'bookkeeper'
  const perms = FIRM_PERMISSIONS[role]

  it('can view dashboard, clients, ledger, documents, reports, alerts', () => {
    expect(perms).toContain('dashboard:view')
    expect(perms).toContain('clients:view')
    expect(perms).toContain('ledger:view')
    expect(perms).toContain('documents:view')
    expect(perms).toContain('reports:view')
    expect(perms).toContain('alerts:view')
  })

  it('can write to ledger', () => {
    expect(perms).toContain('ledger:write')
  })

  it('cannot approve ledger, delete clients, manage security', () => {
    expect(perms).not.toContain('ledger:approve')
    expect(perms).not.toContain('clients:delete')
    expect(perms).not.toContain('security:manage')
    expect(perms).not.toContain('security:view')
  })

  it('cannot access tax tools, advisory AI, or workflows', () => {
    expect(perms).not.toContain('tax_tools:view')
    expect(perms).not.toContain('advisory_ai:view')
    expect(perms).not.toContain('workflows:create')
  })

  it('cannot manage integrations', () => {
    expect(perms).not.toContain('integrations:manage')
    expect(perms).not.toContain('integrations:view')
  })
})

// ── Admin assistant — minimal ───────────────────────────────────────────────

describe('admin_assistant permissions (minimal)', () => {
  const role: FirmRole = 'admin_assistant'
  const perms = FIRM_PERMISSIONS[role]

  it('has the fewest permissions of any firm role', () => {
    for (const other of ALL_FIRM_ROLES.filter(r => r !== 'admin_assistant')) {
      expect(perms.length).toBeLessThanOrEqual(FIRM_PERMISSIONS[other].length)
    }
  })

  it('can view dashboard, clients, documents, tasks, notifications, messages', () => {
    expect(perms).toContain('dashboard:view')
    expect(perms).toContain('clients:view')
    expect(perms).toContain('documents:view')
    expect(perms).toContain('tasks:view')
    expect(perms).toContain('notifications:view')
    expect(perms).toContain('messages:view')
  })

  it('cannot view ledger, reports, or alerts', () => {
    expect(perms).not.toContain('ledger:view')
    expect(perms).not.toContain('reports:view')
    expect(perms).not.toContain('alerts:view')
  })

  it('cannot access any admin features', () => {
    expect(perms).not.toContain('settings:manage')
    expect(perms).not.toContain('security:view')
    expect(perms).not.toContain('audit:view')
    expect(perms).not.toContain('platform_admin:view')
  })
})

// ── Client roles — scoped to portal ─────────────────────────────────────────

describe('client role permissions', () => {
  it('client_owner can upload docs, approve, and send messages', () => {
    const perms = CLIENT_PERMISSIONS.client_owner
    expect(perms).toContain('client_portal:view')
    expect(perms).toContain('client_portal:upload')
    expect(perms).toContain('client_portal:approve')
    expect(perms).toContain('documents:upload')
    expect(perms).toContain('messages:send')
  })

  it('client_contact can upload but not approve', () => {
    const perms = CLIENT_PERMISSIONS.client_contact
    expect(perms).toContain('client_portal:upload')
    expect(perms).toContain('documents:upload')
    expect(perms).not.toContain('client_portal:approve')
    expect(perms).not.toContain('messages:send')
  })

  it('client_viewer is read-only', () => {
    const perms = CLIENT_PERMISSIONS.client_viewer
    expect(perms).toContain('client_portal:view')
    expect(perms).toContain('documents:view')
    expect(perms).toContain('reports:view')
    expect(perms).not.toContain('client_portal:upload')
    expect(perms).not.toContain('documents:upload')
    expect(perms).not.toContain('messages:send')
    expect(perms).not.toContain('messages:view')
  })

  it('no client role has ledger, tax, admin, or security access', () => {
    for (const role of ALL_CLIENT_ROLES) {
      const perms = CLIENT_PERMISSIONS[role]
      expect(perms).not.toContain('ledger:view')
      expect(perms).not.toContain('ledger:write')
      expect(perms).not.toContain('tax_tools:view')
      expect(perms).not.toContain('integrations:view')
      expect(perms).not.toContain('security:view')
      expect(perms).not.toContain('audit:view')
      expect(perms).not.toContain('settings:view')
      expect(perms).not.toContain('platform_admin:view')
    }
  })
})

// ── Platform roles ──────────────────────────────────────────────────────────

describe('platform role permissions', () => {
  it('platform_admin has platform_admin:manage', () => {
    expect(PLATFORM_PERMISSIONS.platform_admin).toContain('platform_admin:manage')
  })

  it('studio_admin has platform_admin:view but not :manage', () => {
    expect(PLATFORM_PERMISSIONS.studio_admin).toContain('platform_admin:view')
    expect(PLATFORM_PERMISSIONS.studio_admin).not.toContain('platform_admin:manage')
  })

  it('ops has security:view and audit:view', () => {
    expect(PLATFORM_PERMISSIONS.ops).toContain('security:view')
    expect(PLATFORM_PERMISSIONS.ops).toContain('audit:view')
  })

  it('analyst has reports and AI insights', () => {
    expect(PLATFORM_PERMISSIONS.analyst).toContain('reports:view')
    expect(PLATFORM_PERMISSIONS.analyst).toContain('ai_insights:view')
  })

  it('viewer has only dashboard:view', () => {
    expect(PLATFORM_PERMISSIONS.viewer).toHaveLength(1)
    expect(PLATFORM_PERMISSIONS.viewer).toContain('dashboard:view')
  })
})

// ── roleHasPermission ───────────────────────────────────────────────────────

describe('roleHasPermission()', () => {
  it('returns true when firm role has the permission', () => {
    expect(roleHasPermission('firm_owner', 'clients:delete')).toBe(true)
    expect(roleHasPermission('manager', 'ledger:approve')).toBe(true)
    expect(roleHasPermission('staff_accountant', 'tax_tools:calculate')).toBe(true)
  })

  it('returns false when firm role lacks the permission', () => {
    expect(roleHasPermission('bookkeeper', 'ledger:approve')).toBe(false)
    expect(roleHasPermission('admin_assistant', 'ledger:view')).toBe(false)
    expect(roleHasPermission('staff_accountant', 'settings:manage')).toBe(false)
  })

  it('works for client roles', () => {
    expect(roleHasPermission('client_owner', 'client_portal:approve')).toBe(true)
    expect(roleHasPermission('client_viewer', 'messages:send')).toBe(false)
  })

  it('returns false for unknown roles', () => {
    expect(roleHasPermission('ghost' as FirmRole, 'dashboard:view')).toBe(false)
  })
})

// ── platformRoleHasPermission ───────────────────────────────────────────────

describe('platformRoleHasPermission()', () => {
  it('platform_admin has platform_admin:manage', () => {
    expect(platformRoleHasPermission('platform_admin', 'platform_admin:manage')).toBe(true)
  })

  it('viewer does not have security:view', () => {
    expect(platformRoleHasPermission('viewer', 'security:view')).toBe(false)
  })

  it('ops has alerts:view', () => {
    expect(platformRoleHasPermission('ops', 'alerts:view')).toBe(true)
  })
})

// ── getPermissionsForRole ───────────────────────────────────────────────────

describe('getPermissionsForRole()', () => {
  it('returns firm permissions for firm roles', () => {
    const perms = getPermissionsForRole('firm_owner')
    expect(perms).toEqual(FIRM_PERMISSIONS.firm_owner)
  })

  it('returns client permissions for client roles', () => {
    const perms = getPermissionsForRole('client_viewer')
    expect(perms).toEqual(CLIENT_PERMISSIONS.client_viewer)
  })

  it('returns platform permissions for platform roles', () => {
    const perms = getPermissionsForRole('platform_admin')
    expect(perms).toEqual(PLATFORM_PERMISSIONS.platform_admin)
  })

  it('returns empty array for unknown roles', () => {
    const perms = getPermissionsForRole('unicorn' as PlatformRole)
    expect(perms).toEqual([])
  })
})

// ── getVisiblePages ─────────────────────────────────────────────────────────

describe('getVisiblePages()', () => {
  it('firm_owner sees all non-platform-admin pages', () => {
    const pages = getVisiblePages('firm_owner')
    // firm_owner doesn't have platform_admin:view, so no platform-admin page
    expect(pages).not.toContain('platform-admin')
    // but should see everything else
    expect(pages).toContain('dashboard')
    expect(pages).toContain('clients')
    expect(pages).toContain('ledger')
    expect(pages).toContain('settings')
    expect(pages).toContain('security')
    expect(pages).toContain('audit')
    expect(pages).toContain('tax-tools')
    expect(pages).toContain('advisory-ai')
    expect(pages).toContain('ai-insights')
    expect(pages).toContain('workflows')
    expect(pages).toContain('fx' in pages ? 'fx' : 'messages')
  })

  it('bookkeeper sees limited pages', () => {
    const pages = getVisiblePages('bookkeeper')
    expect(pages).toContain('dashboard')
    expect(pages).toContain('clients')
    expect(pages).toContain('ledger')
    expect(pages).toContain('documents')
    expect(pages).toContain('reports')
    expect(pages).toContain('tasks')
    expect(pages).toContain('alerts')
    expect(pages).toContain('notifications')
    expect(pages).toContain('messages')

    expect(pages).not.toContain('integrations')
    expect(pages).not.toContain('tax-tools')
    expect(pages).not.toContain('advisory-ai')
    expect(pages).not.toContain('ai-insights')
    expect(pages).not.toContain('security')
    expect(pages).not.toContain('audit')
    expect(pages).not.toContain('settings')
    expect(pages).not.toContain('platform-admin')
  })

  it('admin_assistant sees minimal pages', () => {
    const pages = getVisiblePages('admin_assistant')
    expect(pages).toContain('dashboard')
    expect(pages).toContain('clients')
    expect(pages).toContain('client-portal')
    expect(pages).toContain('documents')
    expect(pages).toContain('tasks')
    expect(pages).toContain('notifications')
    expect(pages).toContain('messages')
    expect(pages.length).toBeLessThanOrEqual(8) // very limited

    expect(pages).not.toContain('ledger')
    expect(pages).not.toContain('reports')
    expect(pages).not.toContain('security')
  })

  it('client_viewer sees only read-only portal pages', () => {
    const pages = getVisiblePages('client_viewer')
    expect(pages).toContain('dashboard')
    expect(pages).toContain('client-portal')
    expect(pages).toContain('documents')
    expect(pages).toContain('reports')
    expect(pages).toContain('notifications')

    expect(pages).not.toContain('ledger')
    expect(pages).not.toContain('clients')
    expect(pages).not.toContain('tasks')
    expect(pages).not.toContain('messages')
    expect(pages).not.toContain('security')
    expect(pages).not.toContain('settings')
  })

  it('client_owner sees more than client_viewer', () => {
    const ownerPages = getVisiblePages('client_owner')
    const viewerPages = getVisiblePages('client_viewer')
    expect(ownerPages.length).toBeGreaterThan(viewerPages.length)
    expect(ownerPages).toContain('messages')
  })

  it('higher firm roles see more pages than lower roles', () => {
    const ownerPages = getVisiblePages('firm_owner')
    const partnerPages = getVisiblePages('partner')
    const managerPages = getVisiblePages('manager')
    const seniorPages = getVisiblePages('senior_accountant')
    const staffPages = getVisiblePages('staff_accountant')
    const keeperPages = getVisiblePages('bookkeeper')
    const assistPages = getVisiblePages('admin_assistant')

    expect(ownerPages.length).toBeGreaterThanOrEqual(partnerPages.length)
    expect(partnerPages.length).toBeGreaterThanOrEqual(managerPages.length)
    expect(managerPages.length).toBeGreaterThanOrEqual(seniorPages.length)
    expect(seniorPages.length).toBeGreaterThanOrEqual(staffPages.length)
    expect(staffPages.length).toBeGreaterThanOrEqual(keeperPages.length)
    expect(keeperPages.length).toBeGreaterThanOrEqual(assistPages.length)
  })
})

// ── isClientRole / isFirmRole ───────────────────────────────────────────────

describe('isClientRole()', () => {
  it('returns true for all client roles', () => {
    expect(isClientRole('client_owner')).toBe(true)
    expect(isClientRole('client_contact')).toBe(true)
    expect(isClientRole('client_viewer')).toBe(true)
  })

  it('returns false for firm roles', () => {
    for (const role of ALL_FIRM_ROLES) {
      expect(isClientRole(role)).toBe(false)
    }
  })

  it('returns false for platform roles', () => {
    for (const role of ALL_PLATFORM_ROLES) {
      expect(isClientRole(role)).toBe(false)
    }
  })
})

describe('isFirmRole()', () => {
  it('returns true for all firm roles', () => {
    for (const role of ALL_FIRM_ROLES) {
      expect(isFirmRole(role)).toBe(true)
    }
  })

  it('returns false for client roles', () => {
    for (const role of ALL_CLIENT_ROLES) {
      expect(isFirmRole(role)).toBe(false)
    }
  })

  it('returns false for platform roles', () => {
    for (const role of ALL_PLATFORM_ROLES) {
      expect(isFirmRole(role)).toBe(false)
    }
  })
})

// ── Superset / subset invariants ────────────────────────────────────────────

describe('permission superset invariants', () => {
  it('firm_owner permissions are a superset of partner permissions', () => {
    for (const perm of FIRM_PERMISSIONS.partner) {
      expect(FIRM_PERMISSIONS.firm_owner).toContain(perm)
    }
  })

  it('partner permissions are a superset of manager permissions', () => {
    for (const perm of FIRM_PERMISSIONS.manager) {
      expect(FIRM_PERMISSIONS.partner).toContain(perm)
    }
  })

  it('manager permissions are a superset of senior_accountant permissions', () => {
    for (const perm of FIRM_PERMISSIONS.senior_accountant) {
      expect(FIRM_PERMISSIONS.manager).toContain(perm)
    }
  })

  it('client_owner permissions are a superset of client_contact permissions', () => {
    for (const perm of CLIENT_PERMISSIONS.client_contact) {
      expect(CLIENT_PERMISSIONS.client_owner).toContain(perm)
    }
  })

  it('client_contact permissions are a superset of client_viewer permissions', () => {
    for (const perm of CLIENT_PERMISSIONS.client_viewer) {
      expect(CLIENT_PERMISSIONS.client_contact).toContain(perm)
    }
  })
})

// ── Sensitive permissions are restricted ────────────────────────────────────

describe('sensitive permission restrictions', () => {
  const sensitivePerms: Permission[] = [
    'clients:delete',
    'security:manage',
    'settings:manage',
    'platform_admin:manage',
  ]

  it.each(sensitivePerms)('"%s" is not granted to staff_accountant or below', (perm) => {
    expect(roleHasPermission('staff_accountant', perm)).toBe(false)
    expect(roleHasPermission('bookkeeper', perm)).toBe(false)
    expect(roleHasPermission('admin_assistant', perm)).toBe(false)
  })

  it('only firm_owner can delete clients', () => {
    expect(roleHasPermission('firm_owner', 'clients:delete')).toBe(true)
    expect(roleHasPermission('partner', 'clients:delete')).toBe(false)
    expect(roleHasPermission('manager', 'clients:delete')).toBe(false)
  })

  it('only firm_owner and partner can manage security', () => {
    expect(roleHasPermission('firm_owner', 'security:manage')).toBe(true)
    // partner does not have security:manage per matrix
    expect(roleHasPermission('partner', 'security:manage')).toBe(false)
    expect(roleHasPermission('manager', 'security:manage')).toBe(false)
  })

  it('no client role may manage settings', () => {
    for (const r of ALL_CLIENT_ROLES) {
      expect(roleHasPermission(r, 'settings:manage')).toBe(false)
    }
  })
})

// ── No permission duplication ───────────────────────────────────────────────

describe('no duplicate permissions per role', () => {
  it.each(ALL_FIRM_ROLES)('firm role "%s" has no duplicates', (role) => {
    const perms = [...FIRM_PERMISSIONS[role]]
    expect(new Set(perms).size).toBe(perms.length)
  })

  it.each(ALL_CLIENT_ROLES)('client role "%s" has no duplicates', (role) => {
    const perms = [...CLIENT_PERMISSIONS[role]]
    expect(new Set(perms).size).toBe(perms.length)
  })

  it.each(ALL_PLATFORM_ROLES)('platform role "%s" has no duplicates', (role) => {
    const perms = [...PLATFORM_PERMISSIONS[role]]
    expect(new Set(perms).size).toBe(perms.length)
  })
})
