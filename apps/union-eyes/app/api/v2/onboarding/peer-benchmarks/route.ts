// @ts-nocheck
/**
 * GET /api/onboarding/peer-benchmarks
 * Migrated to withApi() framework
 */
import { withRoleAuth } from '@/lib/role-middleware';
import { getPeerBenchmarks } from '@/lib/utils/smart-onboarding';
import { logger } from '@/lib/logger';
import { eventBus, AppEvents } from '@/lib/events';
import { withApi, ApiError, RATE_LIMITS } from '@/lib/api/framework';

import { GET as v1GET } from '@/app/api/onboarding/peer-benchmarks/route';

export const GET = withApi(
  {
    auth: { required: true, minRole: 'member' as const },
    openapi: {
      tags: ['Onboarding'],
      summary: 'GET peer-benchmarks',
    },
  },
  async ({ request, params }) => {
    // Delegate to v1 handler while framework migration is in progress
    const response = await v1GET(request, { params: Promise.resolve(params) });
    return response;
  },
);
