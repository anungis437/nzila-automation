// @ts-nocheck
/**
 * GET /api/deadlines/dashboard
 * Migrated to withApi() framework
 */
import { getDashboardSummary } from '@/lib/deadline-service';
import { withApi, ApiError } from '@/lib/api/framework';

export const GET = withApi(
  {
    auth: { required: true },
    openapi: {
      tags: ['Deadlines'],
      summary: 'GET dashboard',
    },
  },
  async ({ request, userId, organizationId, user, body, query }) => {

        const summary = await getDashboardSummary(organizationId);
        return summary;
  },
);
