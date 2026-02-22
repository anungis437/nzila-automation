// @ts-nocheck
/**
 * POST /api/whop/create-checkout
 * Migrated to withApi() framework
 */
import { DEFAULT_REDIRECT_URL } from "../webhooks/utils/constants";
import { logger } from '@/lib/logger';
import { withApi, ApiError } from '@/lib/api/framework';

import { POST as v1POST } from '@/app/api/whop/create-checkout/route';

export const POST = withApi(
  {
    auth: { required: false },
    openapi: {
      tags: ['Whop'],
      summary: 'POST create-checkout',
    },
  },
  async ({ request, params }) => {
    // Delegate to v1 handler while framework migration is in progress
    const response = await v1POST(request, { params: Promise.resolve(params) });
    return response;
  },
);
