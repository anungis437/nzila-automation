// @ts-nocheck
/**
 * GET /api/admin/clc/analytics/trends
 * Migrated to withApi() framework
 */
import { logApiAuditEvent } from '@/lib/middleware/api-security';
import { analyzeMultiYearTrends } from '@/services/clc/compliance-reports';
import { withApi, ApiError, RATE_LIMITS } from '@/lib/api/framework';

import { GET as v1GET } from '@/app/api/admin/clc/analytics/trends/route';

export const GET = withApi(
  {
    auth: { required: true, minRole: 'president' as const },
    openapi: {
      tags: ['Admin'],
      summary: 'GET trends',
    },
  },
  async ({ request, params }) => {
    // Delegate to v1 handler while framework migration is in progress
    const response = await v1GET(request, { params: Promise.resolve(params) });
    return response;
  },
);
