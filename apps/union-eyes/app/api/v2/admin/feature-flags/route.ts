/**
 * GET PATCH /api/admin/feature-flags
 * Migrated to withApi() framework
 */
import { getAllFeatureFlags, toggleFeatureFlag } from '@/lib/feature-flags';
import { logApiAuditEvent } from '@/lib/middleware/api-security';
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
  async ({ request, userId, organizationId, user, body, query }) => {
    // TODO: migrate handler body
    throw ApiError.internal('Route not yet migrated');
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
  async ({ request, userId, organizationId, user, body, query }) => {
    // TODO: migrate handler body
    throw ApiError.internal('Route not yet migrated');
  },
);
