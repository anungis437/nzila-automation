// @ts-nocheck
/**
 * POST /api/admin/jobs/retry
 * Migrated to withApi() framework
 */
import { logApiAuditEvent } from "@/lib/middleware/api-security";
import { withApi, ApiError, z } from '@/lib/api/framework';

const adminJobsRetrySchema = z.object({
  queue: z.unknown().optional(),
  jobId: z.string().uuid('Invalid jobId'),
});

export const POST = withApi(
  {
    auth: { required: true, minRole: 'admin' as const },
    body: adminJobsRetrySchema,
    openapi: {
      tags: ['Admin'],
      summary: 'POST retry',
    },
    successStatus: 201,
  },
  async ({ request, userId, organizationId, user, body, query }) => {

          // Validate request body
        if (!queue || !jobId) {
            throw ApiError.internal('Queue and jobId are required'
        );
          }
          await retryJob(queue, jobId);
          return {};
  },
);
