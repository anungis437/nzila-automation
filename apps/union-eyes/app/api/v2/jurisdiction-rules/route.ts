// @ts-nocheck
/**
 * GET /api/jurisdiction-rules
 * Migrated to withApi() framework
 */
import { withApi, ApiError } from '@/lib/api/framework';

export const GET = withApi(
  {
    auth: { required: true },
    openapi: {
      tags: ['Jurisdiction-rules'],
      summary: 'GET jurisdiction-rules',
    },
  },
  async ({ request, userId, organizationId, user, body, query }) => {
    // TODO: migrate handler body
    throw ApiError.internal('Route not yet migrated');
  },
);
