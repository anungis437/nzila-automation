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
  async () => {
    throw ApiError.notImplemented('Jurisdiction rules endpoint is not yet available.');
  },
);
