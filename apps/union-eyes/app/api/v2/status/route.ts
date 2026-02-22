// @ts-nocheck
/**
 * GET /api/status
 * Migrated to withApi() framework
 */
import { getSystemStatus } from '@/lib/monitoring/status-page';
import { withApi, ApiError } from '@/lib/api/framework';

export const GET = withApi(
  {
    auth: { required: false },
    openapi: {
      tags: ['Status'],
      summary: 'GET status',
    },
  },
  async ({ request, userId, organizationId, user, body, query, params }) => {

        const status = await getSystemStatus();
        // Return 503 if system is down
        const statusCode = status.status === 'down' ? 503 : 200;
        return status;
  },
);
