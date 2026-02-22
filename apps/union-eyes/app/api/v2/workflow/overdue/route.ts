// @ts-nocheck
/**
 * GET /api/workflow/overdue
 * Migrated to withApi() framework
 */
import { getOverdueClaims, getClaimsApproachingDeadline } from "@/lib/workflow-engine";
import { logger } from '@/lib/logger';

import { withApi, ApiError } from '@/lib/api/framework';

export const GET = withApi(
  {
    auth: { required: false },
    openapi: {
      tags: ['Workflow'],
      summary: 'GET overdue',
    },
  },
  async ({ request, userId, organizationId, user, body, query, params }) => {

        // Authentication guard with organization isolation
        const { userId, organizationId } = await requireApiAuth({
          organization: true,
          roles: ['admin', 'steward'],
        });
        const searchParams = request.nextUrl.searchParams;
        const type = searchParams.get("type") || "overdue";
        let result;
        if (type === "approaching") {
          result = await getClaimsApproachingDeadline();
        } else {
          result = await getOverdueClaims();
        }
        return { count: result.length,
          claims: result, };
  },
);
