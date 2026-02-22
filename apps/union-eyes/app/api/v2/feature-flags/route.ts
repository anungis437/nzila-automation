// @ts-nocheck
import { NextResponse } from 'next/server';
/**
 * GET /api/feature-flags
 * Migrated to withApi() framework
 */
import { evaluateFeatures, LRO_FEATURES } from '@/lib/services/feature-flags';
import { withApi, ApiError } from '@/lib/api/framework';

export const GET = withApi(
  {
    auth: { required: true },
    openapi: {
      tags: ['Feature-flags'],
      summary: 'GET feature-flags',
    },
  },
  async ({ request, userId, organizationId, user, body, query }) => {

        // User context provided by withApiAuth guard
        const userId = context.user?.id;
        const orgId = context.user?.organizationId;
        // Evaluate all LRO features for this user
        const featureNames = Object.values(LRO_FEATURES);
        const flags = await evaluateFeatures(featureNames, {
          userId,
          organizationId: orgId || undefined,
        });
        return NextResponse.json({
          flags,
          userId,
          organizationId: orgId || null,
        });
  },
);
