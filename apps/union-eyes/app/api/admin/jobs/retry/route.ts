import { logApiAuditEvent } from "@/lib/middleware/api-security";
/**
 * API Route: POST /api/admin/jobs/retry
 * 
 * Retry a failed job (admin only)
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from "zod";
import { withAdminAuth } from '@/lib/api-auth-guard';

import {
  ErrorCode,
  standardErrorResponse,
  standardSuccessResponse,
} from '@/lib/api/standardized-responses';

const adminJobsRetrySchema = z.object({
  queue: z.unknown().optional(),
  jobId: z.string().uuid('Invalid jobId'),
});

export const POST = async (request: NextRequest) => {
  return withAdminAuth(async (request, context) => {
  // Import job-queue functions (now delegates to Django Celery task API)
    const { retryJob } = await import('@/lib/job-queue');
    try {
      const body = await request.json();
    // Validate request body
    const validation = adminJobsRetrySchema.safeParse(body);
    if (!validation.success) {
      return standardErrorResponse(
        ErrorCode.VALIDATION_ERROR,
        'Invalid request data',
        validation.error.errors
      );
    }
    
    const { queue, jobId } = validation.data;

      if (!queue || !jobId) {
        return standardErrorResponse(
      ErrorCode.MISSING_REQUIRED_FIELD,
      'Queue and jobId are required'
    );
      }

      await retryJob(queue, jobId);

      return NextResponse.json({ success: true });
    } catch (error) {
return standardErrorResponse(
      ErrorCode.INTERNAL_ERROR,
      'Internal server error',
      error
    );
    }
    })(request);
};

