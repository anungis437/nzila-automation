/**
 * POST /api/reports/execute
 * Migrated to withApi() framework
 */
import { ReportExecutor } from '@/lib/report-executor';
import { logApiAuditEvent } from '@/lib/middleware/api-security';

import { withApi, ApiError, z, RATE_LIMITS } from '@/lib/api/framework';

const reportsExecuteSchema = z.object({
  config: z.unknown().optional(),
});

import { POST as v1POST } from '@/app/api/reports/execute/route';

export const POST = withApi(
  {
    auth: { required: true, minRole: 'officer' as const },
    rateLimit: RATE_LIMITS.REPORT_EXECUTION,
    openapi: {
      tags: ['Reports'],
      summary: 'POST execute',
    },
  },
  async ({ request, params }) => {
    // Delegate to v1 handler while framework migration is in progress
    const response = await v1POST(request, { params: Promise.resolve(params) });
    return response;
  },
);
