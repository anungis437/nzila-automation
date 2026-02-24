/**
 * GET PATCH /api/admin/feature-flags
 * Migrated to withApi() framework
 */
 
 
 
 
 
 
 
 
 
 
 
 
import { withApi, ApiError, z } from '@/lib/api/framework';

const toggleFlagSchema = z.object({
  name: z.string().min(1),
  enabled: z.boolean(),
});

export const GET = withApi(
  {
    auth: { required: true, minRole: 'admin' as const },
    openapi: {
      tags: ['Admin'],
      summary: 'GET feature-flags',
    },
  },
  async () => {
    throw ApiError.notImplemented('Feature flags management is not yet available.');
  },
);

export const PATCH = withApi(
  {
    auth: { required: true, minRole: 'admin' as const },
    body: toggleFlagSchema,
    openapi: {
      tags: ['Admin'],
      summary: 'PATCH feature-flags',
    },
  },
  async () => {
    throw ApiError.notImplemented('Feature flags management is not yet available.');
  },
);
