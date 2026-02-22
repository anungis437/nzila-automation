// @ts-nocheck
/**
 * GET POST /api/integrations/shopify/webhooks
 * Migrated to withApi() framework
 */
import { logger } from '@/lib/logger';

import { withApi, ApiError, RATE_LIMITS } from '@/lib/api/framework';

import { GET as v1GET, POST as v1POST } from '@/app/api/integrations/shopify/webhooks/route';

export const GET = withApi(
  {
    auth: { required: false },
    openapi: {
      tags: ['Integrations'],
      summary: 'GET webhooks',
    },
  },
  async ({ request, params }) => {
    // Delegate to v1 handler while framework migration is in progress
    const response = await v1GET(request, { params: Promise.resolve(params) });
    return response;
  },
);

export const POST = withApi(
  {
    auth: { required: false },
    rateLimit: RATE_LIMITS.WEBHOOK_CALLS,
    openapi: {
      tags: ['Integrations'],
      summary: 'POST webhooks',
    },
  },
  async ({ request, params }) => {
    // Delegate to v1 handler while framework migration is in progress
    const response = await v1POST(request, { params: Promise.resolve(params) });
    return response;
  },
);
