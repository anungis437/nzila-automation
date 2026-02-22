// @ts-nocheck
/**
 * GET POST /api/analytics/metrics
 * Migrated to withApi() framework
 */
import { logApiAuditEvent } from "@/lib/middleware/api-security";
import { calculateMetrics, getAnalyticsMetrics } from '@/actions/analytics-actions';
import { withApi, ApiError, z } from '@/lib/api/framework';

const analyticsMetricsSchema = z.object({
  metricType: z.unknown().optional(),
  metricName: z.string().min(1, 'metricName is required'),
  periodType: z.unknown().optional(),
  periodStart: z.unknown().optional(),
  periodEnd: z.unknown().optional(),
});

import { GET as v1GET, POST as v1POST } from '@/app/api/analytics/metrics/route';

export const GET = withApi(
  {
    auth: { required: true, minRole: 'delegate' as const },
    openapi: {
      tags: ['Analytics'],
      summary: 'GET metrics',
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
    auth: { required: true, minRole: 'delegate' as const },
    openapi: {
      tags: ['Analytics'],
      summary: 'POST metrics',
    },
  },
  async ({ request, params }) => {
    // Delegate to v1 handler while framework migration is in progress
    const response = await v1POST(request, { params: Promise.resolve(params) });
    return response;
  },
);
