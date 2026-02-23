/**
 * GET /api/test-auth
 * Migrated to withApi() framework
 */
import { auth } from '@clerk/nextjs/server';

import { withApi, ApiError } from '@/lib/api/framework';

export const GET = withApi(
  {
    auth: { required: true },
    openapi: {
      tags: ['Test-auth'],
      summary: 'GET test-auth',
    },
  },
  async ({ request, userId, organizationId, user, body, query, params }) => {

        const r = await fetch(`${DJANGO}/api/auth_core/health/`, { cache: 'no-store' });
        healthStatus = r.status;
        healthBody = await r.json();
  },
);
