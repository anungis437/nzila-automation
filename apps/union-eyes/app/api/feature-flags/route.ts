/**
 * Feature Flags API Route
 * 
 * Returns enabled features for the current user.
 * 
 * Security: Protected with withApiAuth guard (migrated Feb 2026)
 */

import { NextRequest, NextResponse } from 'next/server';
import { withApiAuth } from '@/lib/api-auth-guard';
import { evaluateFeatures, LRO_FEATURES } from '@/lib/services/feature-flags';
import {
  ErrorCode,
  standardErrorResponse,
} from '@/lib/api/standardized-responses';

export const GET = withApiAuth(async (request: NextRequest, context) => {
  try {
    // User context provided by withApiAuth guard
    const userId = context.user?.id;
    const orgId = context.user?.organizationId;
    
    // Evaluate all LRO features for this user
    const featureNames = Object.values(LRO_FEATURES);
    
    const flags = await evaluateFeatures(featureNames, {
      userId,
      organizationId: orgId || undefined,
    });
    
    return NextResponse.json({
      flags,
      userId,
      organizationId: orgId || null,
    });
  } catch (error) {
    return standardErrorResponse(ErrorCode.INTERNAL_ERROR);
  }
});

