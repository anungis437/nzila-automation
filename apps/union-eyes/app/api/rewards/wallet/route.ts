// @ts-nocheck
import { logApiAuditEvent } from "@/lib/middleware/api-security";
import { NextRequest, NextResponse } from 'next';
import { db } from '@/db';
import { getBalance, listLedger } from '@/lib/services/rewards/wallet-service';
import { getCurrentUser, withAdminAuth, withApiAuth, withMinRole, withRoleAuth } from '@/lib/api-auth-guard';
import { NextResponse } from "next/server";

import {
  ErrorCode,
  standardErrorResponse,
  standardSuccessResponse,
} from '@/lib/api/standardized-responses';
export const GET = async (request: NextRequest) => {
  return withRoleAuth(10, async (request, context) => {
  try {
      // 1. Authenticate
      const { userId, organizationId } = context;
      
      if (!organizationId) {
        return standardErrorResponse(
      ErrorCode.MISSING_REQUIRED_FIELD,
      'Organization context required'
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

    } catch (error) {
return standardErrorResponse(
      ErrorCode.INTERNAL_ERROR,
      'Internal server error',
      error
    );
    }
    })(request);
};

