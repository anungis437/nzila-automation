// @ts-nocheck
/**
 * GET /api/rewards/wallet
 * Migrated to withApi() framework
 */
import { logApiAuditEvent } from "@/lib/middleware/api-security";
import { NextRequest, NextResponse } from 'next';
import { db } from '@/db';
import { getBalance, listLedger } from '@/lib/services/rewards/wallet-service';
import { withApi, ApiError } from '@/lib/api/framework';

export const GET = withApi(
  {
    auth: { required: true, minRole: 'member' as const },
    openapi: {
      tags: ['Rewards'],
      summary: 'GET wallet',
    },
  },
  async ({ request, userId, organizationId, user, body, query }) => {

          // 1. Authenticate
          const { userId, organizationId } = context;
          if (!organizationId) {
            throw ApiError.internal('Organization context required'
        );
          }
          // 2. Parse query parameters
          const { searchParams } = new URL(request.url);
          const limit = Math.min(
            parseInt(searchParams.get('limit') || '20', 10),
            100
          );
          const offset = parseInt(searchParams.get('offset') || '0', 10);
          // 3. Get wallet balance
          const balance = await getBalance(db, userId, organizationId);
          // 4. Get recent ledger entries
          const ledger = await listLedger(db, userId, organizationId, {
            limit,
            offset,
          });
          // 5. Return response
          return NextResponse.json(
            {
              balance,
              ledger: {
                entries: ledger,
                pagination: {
                  limit,
                  offset,
                  hasMore: ledger.length === limit,
                },
              },
            },
            { status: 200 }
          );
  },
);
