// @ts-nocheck
/**
 * GET /api/auth/user-role
 * Migrated to withApi() framework
 */
import { getUserRole } from "@/lib/auth/rbac-server";

import { withApi, ApiError } from '@/lib/api/framework';

export const GET = withApi(
  {
    auth: { required: true },
    openapi: {
      tags: ['Auth'],
      summary: 'GET user-role',
    },
  },
  async ({ request, userId, organizationId, user, body, query }) => {

        const { userId: authedUserId } = await auth();
        // Use userId from URL params if provided (for admin use), otherwise use authenticated user
        const searchParams = request.nextUrl.searchParams;
        const queryUserId = searchParams.get('userId');
        const targetUserId = queryUserId || authedUserId;
        if (!targetUserId) {
          throw ApiError.internal('Not authenticated');
        }
        // Fetch role from database/Clerk
        const role = await getUserRole(targetUserId);
        return NextResponse.json({ role });
  },
);
