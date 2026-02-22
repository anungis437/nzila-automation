// @ts-nocheck
import { logApiAuditEvent } from "@/lib/middleware/api-security";
import { NextRequest, NextResponse } from 'next';
import { db } from '@/db';
import {
  initiateRedemption,
  cancelRedemption,
  listUserRedemptions,
} from '@/lib/services/rewards/redemption-service';
import { initiateRedemptionSchema } from '@/lib/validation/rewards-schemas';
import { z } from 'zod';
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
      const status = searchParams.get('status') || undefined;
      const limit = Math.min(
        parseInt(searchParams.get('limit') || '20', 10),
        100
      );
      const offset = parseInt(searchParams.get('offset') || '0', 10);

      // 3. Validate status if provided
      const validStatuses = ['pending', 'ordered', 'fulfilled', 'cancelled', 'refunded'];
      if (status && !validStatuses.includes(status)) {
        return NextResponse.json(
          { error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` },
          { status: 400 }
        );
      }

      // 4. List redemptions
      const redemptions = await listUserRedemptions(
        db, userId,
        organizationId,
        {
          status: status,
          limit,
          offset,
        }
      );

      // 5. Return response
      return NextResponse.json(
        {
          redemptions,
          pagination: {
            limit,
            offset,
            hasMore: redemptions.length === limit,
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

export const POST = async (request: NextRequest) => {
  return withRoleAuth(20, async (request, context) => {
  try {
      // 1. Authenticate
      const { userId, organizationId } = context;
      
      if (!organizationId) {
        return standardErrorResponse(
      ErrorCode.MISSING_REQUIRED_FIELD,
      'Organization context required'
    );
      }

      // 2. Parse and validate request body
      const body = await request.json();
      
      let validatedData;
      try {
        validatedData = initiateRedemptionSchema.parse(body);
      } catch (error) {
        if (error instanceof z.ZodError) {
          return standardErrorResponse(
      ErrorCode.VALIDATION_ERROR,
      'Validation failed',
      error
    );
        }
        throw error;
      }

      // 2. Get redemption ID from query
      const { searchParams } = new URL(request.url);
      const redemptionId = searchParams.get('id');

      if (!redemptionId) {
        return standardErrorResponse(
      ErrorCode.MISSING_REQUIRED_FIELD,
      'Redemption ID required'
    );
      }

      // 3. Cancel redemption
      const cancelledRedemption = await cancelRedemption(
        db,
        redemptionId,
        'member_cancelled'
      );

      // 4. Return response
      return standardSuccessResponse(
      { 
          redemption: cancelledRedemption,
          message: 'Redemption cancelled and credits refunded',
         },
      undefined,
      200
    );

    } catch (error: Record<string, unknown>) {
// Handle specific business logic errors
      if (error.message?.includes('Cannot cancel')) {
        return NextResponse.json(
          { error: error.message },
          { status: 400 }
        );
      }

      if (error.message?.includes('not found')) {
        return standardErrorResponse(
      ErrorCode.RESOURCE_NOT_FOUND,
      'Redemption not found',
      error
    );
      }

      return standardErrorResponse(
      ErrorCode.INTERNAL_ERROR,
      'Internal server error',
      error
    );
    }
    })(request);
};

