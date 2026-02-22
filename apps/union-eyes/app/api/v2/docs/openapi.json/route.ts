/**
 * GET /api/docs/openapi.json
 * Migrated to withApi() framework
 */
import { openApiConfig } from '@/lib/api-docs/openapi-config';
import { withApi, ApiError } from '@/lib/api/framework';

export const GET = withApi(
  {
    auth: { required: false },
    openapi: {
      tags: ['Docs'],
      summary: 'GET openapi.json',
    },
  },
  async ({ request, userId, organizationId, user, body, query, params }) => {
    // TODO: migrate handler body
    throw ApiError.internal('Route not yet migrated');
  },
);
