import { auth } from '@clerk/nextjs/server'

/**
 * Nzila RBAC roles (stored in Clerk publicMetadata or org membership).
 */
export type NzilaRole =
  | 'platform_admin'
  | 'studio_admin'
  | 'ops'
  | 'analyst'
  | 'viewer'

/**
 * Extract the user's Nzila role from Clerk session claims.
 * Falls back to 'viewer' if nothing is set.
 */
export async function getUserRole(): Promise<NzilaRole> {
  const { sessionClaims } = await auth()
  const meta = sessionClaims?.publicMetadata as Record<string, unknown> | undefined
  const role = meta?.nzilaRole as NzilaRole | undefined
  return role || 'viewer'
}

/**
 * Guard that throws a 403-equivalent redirect if the user doesn't have the
 * required role.  Use in server components / route handlers.
 *
 * @example
 *   await requireRole('platform_admin', 'ops')
 */
export async function requireRole(...allowed: NzilaRole[]): Promise<NzilaRole> {
  const role = await getUserRole()
  if (!allowed.includes(role)) {
    throw new Error(`Forbidden: role "${role}" is not in [${allowed.join(', ')}]`)
  }
  return role
}

/**
 * Check role without throwing — returns boolean.
 */
export async function hasRole(...allowed: NzilaRole[]): Promise<boolean> {
  const role = await getUserRole()
  return allowed.includes(role)
}
