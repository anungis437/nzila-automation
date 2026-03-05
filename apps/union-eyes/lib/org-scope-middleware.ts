/**
 * Organization Scope Middleware
 *
 * Thin wrapper around organization-middleware for use in routes that need
 * org-scoped auth. Supersedes the former tenant-middleware.ts.
 */

import { NextRequest, NextResponse } from "next/server";
import { withOrganizationAuth, validateOrganizationAccess, getOrganizationIdFromRequest, type OrganizationContext } from "@/lib/organization-middleware";

export interface OrgScopeContext {
  organizationId: string;
  userId: string;
  memberId: string;
}

/**
 * Middleware to extract and validate organization context
 *
 * Usage in API routes:
 * ```typescript
 * import { withOrgAuth } from "@/lib/org-scope-middleware";
 *
 * export const GET = withOrgAuth(async (request, context) => {
 *   const { organizationId, userId } = context;
 *   // Your org-aware logic here
 * });
 * ```
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function withOrgAuth<T = any>(
  handler: (
    request: NextRequest,
    context: OrgScopeContext,
    params?: T
  ) => Promise<NextResponse> | NextResponse
) {
  return withOrganizationAuth(async (request: NextRequest, context: OrganizationContext, params?: T) => {
    const orgContext: OrgScopeContext = {
      organizationId: context.organizationId,
      userId: context.userId,
      memberId: context.memberId,
    };

    return await handler(request, orgContext, params);
  });
}

/**
 * Validate organization access for a specific organization ID
 *
 * Use this when the organization ID comes from the request (e.g., URL parameter)
 * to ensure the user has access to that specific organization.
 */
export async function validateOrgAccess(
  userId: string,
  requestedOrganizationId: string
): Promise<boolean> {
  return validateOrganizationAccess(userId, requestedOrganizationId);
}

/**
 * Extract organization ID from request headers or cookies
 *
 * Checks in order:
 * 1. X-Org-ID / X-Organization-ID header
 * 2. selected_org_id / selected_organization_id cookie
 * 3. User's default organization
 *
 * Legacy fallbacks: X-Tenant-ID header, selected_tenant_id cookie
 */
export async function getOrgIdFromRequest(
  request: NextRequest,
  userId: string
): Promise<string> {
  return getOrganizationIdFromRequest(request, userId);
}

