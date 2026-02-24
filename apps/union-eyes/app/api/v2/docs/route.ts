/**
 * GET /api/docs
 * Migrated to withApi() framework
 */

 
 
 
 
 
 
 
import { withApi, ApiError } from '@/lib/api/framework';

export const GET = withApi(
  {
    auth: { required: false },
    openapi: {
      tags: ['Docs'],
      summary: 'GET docs',
    },
  },
  async () => {
    throw ApiError.notImplemented('API documentation endpoint is not yet available. See /api-docs for Swagger UI.');
  },
);
