// @ts-nocheck
/**
 * POST /api/admin/dues/send-reminders
 * Migrated to withApi() framework
 */
import { manualTriggerReminders } from '@/lib/jobs/dues-reminder-scheduler';
import { logger } from '@/lib/logger';

import { withApi, ApiError } from '@/lib/api/framework';

import { POST as v1POST } from '@/app/api/admin/dues/send-reminders/route';

export const POST = withApi(
  {
    auth: { required: true },
    openapi: {
      tags: ['Admin'],
      summary: 'POST send-reminders',
    },
  },
  async ({ request, params }) => {
    // Delegate to v1 handler while framework migration is in progress
    const response = await v1POST(request, { params: Promise.resolve(params) });
    return response;
  },
);
