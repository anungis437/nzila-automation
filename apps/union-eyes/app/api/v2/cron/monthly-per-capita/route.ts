/**
 * GET POST /api/cron/monthly-per-capita
 * Migrated to withApi() framework
 */
import { processMonthlyPerCapita } from '@/services/clc/per-capita-calculator';
import { markOverdueRemittances } from '@/services/clc/per-capita-calculator';

import { withApi, ApiError } from '@/lib/api/framework';

export const GET = withApi(
  {
    auth: { required: false },
    openapi: {
      tags: ['Cron'],
      summary: 'GET monthly-per-capita',
    },
  },
  async ({ request, userId, organizationId, user, body, query, params }) => {

        // Verify this is a cron request (Vercel sets this header)
        const authHeader = request.headers.get('authorization');
        if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
          throw ApiError.unauthorized('Unauthorized'
        );
        }
    // Run monthly calculation
        const result = await processMonthlyPerCapita();
        // Mark overdue remittances
        const overdueCount = await markOverdueRemittances();
    return { timestamp: new Date().toISOString(),
          calculation: result,
          overdueMarked: overdueCount, };
  },
);

export const POST = withApi(
  {
    auth: { required: false },
    openapi: {
      tags: ['Cron'],
      summary: 'POST monthly-per-capita',
    },
  },
  async ({ request, userId, organizationId, user, body, query, params }) => {
    // TODO: migrate handler body
    throw ApiError.internal('Route not yet migrated');
  },
);
