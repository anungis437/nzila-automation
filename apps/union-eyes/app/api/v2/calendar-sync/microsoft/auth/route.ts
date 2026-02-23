import { NextResponse } from 'next/server';
/**
 * GET /api/calendar-sync/microsoft/auth
 * Migrated to withApi() framework
 */
import { logApiAuditEvent } from "@/lib/middleware/api-security";
import { getAuthorizationUrl } from '@/lib/external-calendar-sync/microsoft-calendar-service';
import { withApi, ApiError } from '@/lib/api/framework';

export const GET = withApi(
  {
    auth: { required: true, minRole: 'member' as const },
    openapi: {
      tags: ['Calendar-sync'],
      summary: 'GET auth',
    },
  },
  async ({ request, userId, organizationId, user, body, query }) => {

          // Generate authorization URL with userId as state
          const authUrl = await getAuthorizationUrl(userId);
          // Redirect to Microsoft authorization page
          return NextResponse.redirect(authUrl);
  },
);
