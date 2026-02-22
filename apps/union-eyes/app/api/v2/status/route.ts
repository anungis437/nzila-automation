/**
 * GET /api/v2/status
 *
 * Public health-check / status endpoint.
 * Demonstrates the simplest possible `withApi()` usage — no auth, no validation.
 */
import { withApi } from '@/lib/api/framework';

export const GET = withApi(
  {
    auth: { required: false },
    openapi: {
      tags: ['System'],
      summary: 'API health check',
      description: 'Returns API status. No authentication required.',
    },
  },
  async () => {
    return {
      status: 'healthy',
      version: '2.0.0',
      timestamp: new Date().toISOString(),
    };
  },
);
