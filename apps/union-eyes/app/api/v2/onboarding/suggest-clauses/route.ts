// @ts-nocheck
/**
 * POST /api/onboarding/suggest-clauses
 * Migrated to withApi() framework
 */
import { withRoleAuth } from '@/lib/role-middleware';
import { suggestRelevantClauses } from '@/lib/utils/smart-onboarding';
import { logger } from '@/lib/logger';
import { eventBus, AppEvents } from '@/lib/events';
import { withApi, ApiError, z, RATE_LIMITS } from '@/lib/api/framework';

const onboardingSuggestClausesSchema = z.object({
  organizationId: z.string().uuid('Invalid organizationId'),
});

import { POST as v1POST } from '@/app/api/onboarding/suggest-clauses/route';

export const POST = withApi(
  {
    auth: { required: true, minRole: 'officer' as const },
    rateLimit: RATE_LIMITS.ONBOARDING,
    openapi: {
      tags: ['Onboarding'],
      summary: 'POST suggest-clauses',
    },
  },
  async ({ request, params }) => {
    // Delegate to v1 handler while framework migration is in progress
    const response = await v1POST(request, { params: Promise.resolve(params) });
    return response;
  },
);
