/**
 * GET /api/workflow/overdue
 * Migrated to withApi() framework
 */
import { getOverdueClaims, getClaimsApproachingDeadline } from "@/lib/workflow-engine";

import { withApi } from '@/lib/api/framework';

export const GET = withApi(
  {
    auth: { required: true, minRole: 'steward' as const },
    openapi: {
      tags: ['Workflow'],
      summary: 'GET overdue',
    },
  },
  async ({ request, userId, organizationId, user, body, query, params }) => {

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
