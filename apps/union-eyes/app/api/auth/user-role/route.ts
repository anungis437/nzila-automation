// @ts-nocheck
import { NextRequest, NextResponse } from "next/server";
import { withApiAuth } from "@/lib/api-auth-guard";
import { getUserRole } from "@/lib/auth/rbac-server";

import {
  ErrorCode,
  standardErrorResponse,
  standardSuccessResponse,
} from '@/lib/api/standardized-responses';

/**
 * GET /api/auth/user-role
 * Fetch the current user's role from the database
 */
export const GET = withApiAuth(async (request: NextRequest, context) => {
  try {
    // Use userId from URL params if provided (for admin use), otherwise use authenticated user
    const searchParams = request.nextUrl.searchParams;
    const queryUserId = searchParams.get('userId');
    const targetUserId = queryUserId || context.userId;

    // Fetch role from database/Clerk
    const role = await getUserRole(targetUserId);

    return NextResponse.json({ role });
  } catch (error) {
return standardErrorResponse(
      ErrorCode.INTERNAL_ERROR,
      'Failed to fetch user role',
      error
    );
  }
});
