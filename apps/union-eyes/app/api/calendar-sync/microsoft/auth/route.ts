import { logApiAuditEvent } from "@/lib/middleware/api-security";
/**
 * Microsoft Outlook Calendar OAuth Authorization
 * 
 * Initiates the OAuth flow by redirecting to Microsoft's authorization page.
 * 
 * @module api/calendar-sync/microsoft/auth
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAuthorizationUrl } from '@/lib/external-calendar-sync/microsoft-calendar-service';
import { getCurrentUser, withAdminAuth, withApiAuth, withMinRole, withRoleAuth } from '@/lib/api-auth-guard';

import {
  ErrorCode,
  standardErrorResponse,
  standardSuccessResponse,
} from '@/lib/api/standardized-responses';
export const GET = async (request: NextRequest) => {
  return withRoleAuth(10, async (request, context) => {
    const { userId, organizationId } = context;

  try {
      // Generate authorization URL with userId as state
      const authUrl = await getAuthorizationUrl(userId);

      // Redirect to Microsoft authorization page
      return NextResponse.redirect(authUrl);
    } catch (error) {
return standardErrorResponse(
      ErrorCode.INTERNAL_ERROR,
      'Failed to initiate Microsoft Calendar authorization',
      error
    );
    }
    })(request);
};

