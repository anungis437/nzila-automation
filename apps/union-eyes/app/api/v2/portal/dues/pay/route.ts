/**
 * GET POST /api/portal/dues/pay
 * Migrated to withApi() framework
 */
import { auth } from '@clerk/nextjs/server';
import { db } from '@/db/db';
import { memberDuesLedger } from '@/db/schema/dues-finance-schema';
import { eq, and, desc, sql } from 'drizzle-orm';
import { withApi, ApiError, z } from '@/lib/api/framework';

const paymentSchema = z.object({
  organizationId: z.string().uuid(),
  amount: z.number().positive(),
  paymentMethod: z.enum([
    'stripe',
    'bank_transfer',
    'check',
    'cash',
    'direct_debit',
    'payroll_deduction',
    'ewallet',
  ]),
  paymentReference: z.string().optional(),
  description: z.string().optional(),
});

import { GET as v1GET, POST as v1POST } from '@/app/api/portal/dues/pay/route';

export const GET = withApi(
  {
    auth: { required: true },
    openapi: {
      tags: ['Portal'],
      summary: 'GET pay',
    },
  },
  async ({ request, params }) => {
    // Delegate to v1 handler while framework migration is in progress
    const response = await v1GET(request);
    return response;
  },
);

export const POST = withApi(
  {
    auth: { required: true },
    openapi: {
      tags: ['Portal'],
      summary: 'POST pay',
    },
  },
  async ({ request, params }) => {
    // Delegate to v1 handler while framework migration is in progress
    const response = await v1POST(request);
    return response;
  },
);
