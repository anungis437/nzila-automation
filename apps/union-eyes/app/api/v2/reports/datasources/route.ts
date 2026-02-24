/**
 * GET /api/reports/datasources
 * Migrated to withApi() framework
 */

 
 
 
 
 
 
import { withApi, ApiError } from '@/lib/api/framework';

export const GET = withApi(
  {
    auth: { required: true },
    openapi: {
      tags: ['Reports'],
      summary: 'GET datasources',
    },
  },
  async () => {
    throw ApiError.notImplemented('Report datasources endpoint is not yet available.');
  },
);
