/**
 * GET /api/reports/datasources
 * Migrated to withApi() framework
 */
import { getAllDataSources } from '@/lib/report-executor';

import { withApi, ApiError } from '@/lib/api/framework';

export const GET = withApi(
  {
    auth: { required: true },
    openapi: {
      tags: ['Reports'],
      summary: 'GET datasources',
    },
  },
  async ({ request, userId, organizationId, user, body, query }) => {
    // TODO: migrate handler body
    throw ApiError.internal('Route not yet migrated');
  },
);
