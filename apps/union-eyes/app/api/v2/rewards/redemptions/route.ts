/**
 * GET POST /api/rewards/redemptions
 * Migrated to withApi() framework
 */
import { logApiAuditEvent } from "@/lib/middleware/api-security";
import { NextRequest, NextResponse } from 'next';
import { db } from '@/db';
import { initiateRedemptionSchema } from '@/lib/validation/rewards-schemas';
import { withApi, ApiError } from '@/lib/api/framework';

import { GET as v1GET, POST as v1POST } from '@/app/api/rewards/redemptions/route';

export const GET = withApi(
  {
    auth: { required: true, minRole: 'member' as const },
    openapi: {
      tags: ['Rewards'],
      summary: 'GET redemptions',
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
    auth: { required: true, minRole: 'member' as const },
    openapi: {
      tags: ['Rewards'],
      summary: 'POST redemptions',
    },
  },
  async ({ request, params }) => {
    // Delegate to v1 handler while framework migration is in progress
    const response = await v1POST(request, { params: Promise.resolve(params) });
    return response;
  },
);
