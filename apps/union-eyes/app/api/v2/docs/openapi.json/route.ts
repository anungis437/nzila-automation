/**
 * GET /api/docs/openapi.json
 * Migrated to withApi() framework
 */
 
 
 
 
 
 
 
import { withApi, ApiError } from '@/lib/api/framework';

export const GET = withApi(
  {
    auth: { required: false },
    openapi: {
      tags: ['Docs'],
      summary: 'GET openapi.json',
    },
  },
  async () => {
    throw ApiError.notImplemented('OpenAPI spec generation is not yet available.');
  },
);
