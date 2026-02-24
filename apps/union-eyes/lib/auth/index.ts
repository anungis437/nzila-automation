/**
 * Auth Module - Centralized Authentication & Authorization
 * Export all auth-related functionality from a single entry point
 */

// Core auth functions
export * from './unified-auth';

// Types and interfaces
export * from './types';

// Roles and permissions (exclude UserRole to avoid conflict with unified-auth re-export)
export {
  Permission,
  ROLE_PERMISSIONS,
  ROUTE_PERMISSIONS,
  type NavItem,
  NAV_ITEMS,
  ADMIN_NAV_ITEMS,
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
  canAccessRoute,
  getAccessibleNavItems,
  getRoleLevel,
  hasHigherOrEqualRole,
} from './roles';
export * from './permissions';

