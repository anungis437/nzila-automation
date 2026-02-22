/**
 * Role-Based Access Control Utilities
 * Union Claims Management System
 * 
 * Server-side utilities for checking user roles and permissions.
 *
 * INV-04: These functions now delegate to @nzila/os-core/policy `authorize()`
 * via the policy adapter.  Existing call-sites continue to work unchanged.
 */

import { auth, currentUser } from '@/lib/api-auth-guard';
import { db } from "@/db/db";
import { organizationUsers } from "@/db/schema/domains/member";
import { eq } from "drizzle-orm";
import { UserRole, Permission, hasPermission, hasAnyPermission, hasAllPermissions, canAccessRoute } from "./roles";
import { mapToOsRole } from './policy-adapter';

/**
 * Get user role from database
 * First checks organization_users table, falls back to Clerk metadata
 */
export async function getUserRole(userId: string): Promise<UserRole> {
  try {
    // Try to get role from database organization_users table
    const OrganizationUser = await db
      .select({ role: organizationUsers.role })
      .from(organizationUsers)
      .where(eq(organizationUsers.userId, userId))
      .limit(1);

    if (OrganizationUser.length > 0 && OrganizationUser[0].role) {
      const role = OrganizationUser[0].role.toLowerCase();
      // Map database role to UserRole enum
      switch (role) {
        case "admin":
          return UserRole.ADMIN;
        case "union_rep":
          return UserRole.UNION_REP;
        case "staff_rep":
          return UserRole.STAFF_REP;
        case "member":
          return UserRole.MEMBER;
        case "guest":
          return UserRole.GUEST;
        default:
          return UserRole.MEMBER; // Default to member
      }
    }

    // Fallback to Clerk metadata
    const user = await currentUser();
    if (user?.publicMetadata?.role) {
      const metadataRole = String(user.publicMetadata.role).toLowerCase();
      switch (metadataRole) {
        case "admin":
          return UserRole.ADMIN;
        case "union_rep":
          return UserRole.UNION_REP;
        case "staff_rep":
          return UserRole.STAFF_REP;
        case "member":
          return UserRole.MEMBER;
        case "guest":
          return UserRole.GUEST;
        default:
          return UserRole.MEMBER;
      }
    }

    // Default role
    return UserRole.MEMBER;
  } catch (error) {
    // SECURITY FIX: Fail closed - authorization system errors should not grant default access
    // Log the error for monitoring and throw to prevent unauthorized access
throw new Error('Authorization system unavailable');
  }
}

/**
 * Get current user's role (server-side only)
 */
export async function getCurrentUserRole(): Promise<UserRole | null> {
  const { userId } = await auth();
  if (!userId) return null;
  return getUserRole(userId);
}

/**
 * Check if current user has a specific permission
 */
export async function userHasPermission(permission: Permission): Promise<boolean> {
  const role = await getCurrentUserRole();
  if (!role) return false;
  return hasPermission(role, permission);
}

/**
 * Check if current user has any of the required permissions
 */
export async function userHasAnyPermission(permissions: Permission[]): Promise<boolean> {
  const role = await getCurrentUserRole();
  if (!role) return false;
  return hasAnyPermission(role, permissions);
}

/**
 * Check if current user has all required permissions
 */
export async function userHasAllPermissions(permissions: Permission[]): Promise<boolean> {
  const role = await getCurrentUserRole();
  if (!role) return false;
  return hasAllPermissions(role, permissions);
}

/**
 * Check if current user can access a route
 */
export async function userCanAccessRoute(route: string): Promise<boolean> {
  const role = await getCurrentUserRole();
  if (!role) return false;
  return canAccessRoute(role, route);
}

/**
 * Require authentication and return user role
 * Throws an error if user is not authenticated
 */
export async function requireAuth(): Promise<{ userId: string; role: UserRole }> {
  const { userId } = await auth();
  if (!userId) {
    throw new Error("Unauthorized - No user ID");
  }
  
  const role = await getUserRole(userId);
  return { userId, role };
}

/**
 * Require specific permission
 * Throws an error if user doesn&apos;t have the permission
 */
export async function requirePermission(permission: Permission): Promise<{ userId: string; role: UserRole }> {
  const authData = await requireAuth();
  
  if (!hasPermission(authData.role, permission)) {
    throw new Error(`Forbidden - Missing permission: ${permission}`);
  }
  
  return authData;
}

/**
 * Require any of the specified permissions
 */
export async function requireAnyPermission(permissions: Permission[]): Promise<{ userId: string; role: UserRole }> {
  const authData = await requireAuth();
  
  if (!hasAnyPermission(authData.role, permissions)) {
    throw new Error(`Forbidden - Missing any of permissions: ${permissions.join(", ")}`);
  }
  
  return authData;
}

/**
 * Require all specified permissions
 */
export async function requireAllPermissions(permissions: Permission[]): Promise<{ userId: string; role: UserRole }> {
  const authData = await requireAuth();
  
  if (!hasAllPermissions(authData.role, permissions)) {
    throw new Error(`Forbidden - Missing all permissions: ${permissions.join(", ")}`);
  }
  
  return authData;
}

/**
 * Require admin role
 */
export async function requireAdmin(): Promise<{ userId: string; role: UserRole }> {
  const authData = await requireAuth();
  
  if (authData.role !== UserRole.ADMIN) {
    throw new Error("Forbidden - Admin access required");
  }
  
  return authData;
}

/**
 * Require union rep or higher role
 */
export async function requireUnionRepOrHigher(): Promise<{ userId: string; role: UserRole }> {
  const authData = await requireAuth();
  
  if (authData.role !== UserRole.ADMIN && authData.role !== UserRole.UNION_REP) {
    throw new Error("Forbidden - Union Representative access required");
  }
  
  return authData;
}

