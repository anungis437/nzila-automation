// @ts-nocheck
/**
 * GET /api/ready
 * Migrated to withApi() framework
 */
import { db } from '@/db';
import { sql } from 'drizzle-orm';
import { withApi, ApiError } from '@/lib/api/framework';

export const GET = withApi(
  {
    auth: { required: false },
    openapi: {
      tags: ['Ready'],
      summary: 'GET ready',
    },
  },
  async ({ request, userId, organizationId, user, body, query, params }) => {

        const checks = {
          database: await checkDatabaseReady(),
          migrations: await checkMigrationsComplete(),
          cache: await checkCacheReady(),
        };
        const ready = Object.values(checks).every(check => check === true);
        const response: ReadinessCheck = {
          ready,
          timestamp: new Date().toISOString(),
          checks,
          message: ready ? 'Service is ready' : 'Service is not ready',
        };
        return response;
  },
);
