/**
 * GET /api/health/liveness
 * Migrated to withApi() framework
 */
import { withApi, ApiError } from '@/lib/api/framework';

export const GET = withApi(
  {
    auth: { required: false },
    openapi: {
      tags: ['Health'],
      summary: 'GET liveness',
    },
  },
  async ({ request, userId, organizationId, user, body, query, params }) => {
    // TODO: migrate handler body
    throw ApiError.internal('Route not yet migrated');
  },
);
