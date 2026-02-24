/**
 * GET /api/health/liveness
 * Kubernetes/load-balancer liveness probe — returns 200 if the process is alive.
 */

import { withApi } from '@/lib/api/framework';

export const GET = withApi(
  {
    auth: { required: false },
    openapi: {
      tags: ['Health'],
      summary: 'Liveness probe',
    },
  },
  async () => {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  },
);
