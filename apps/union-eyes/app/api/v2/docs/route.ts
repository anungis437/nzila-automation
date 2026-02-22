// @ts-nocheck
/**
 * GET /api/docs
 * Migrated to withApi() framework
 */
import { generateOpenAPISpec } from '@/lib/api/openapi';

import { withApi, ApiError } from '@/lib/api/framework';

export const GET = withApi(
  {
    auth: { required: false },
    openapi: {
      tags: ['Docs'],
      summary: 'GET docs',
    },
  },
  async ({ request, userId, organizationId, user, body, query, params }) => {
    // TODO: migrate handler body
    throw ApiError.internal('Route not yet migrated');
  },
);
