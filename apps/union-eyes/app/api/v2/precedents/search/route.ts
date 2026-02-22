// @ts-nocheck
/**
 * POST /api/precedents/search
 * Migrated to withApi() framework
 */
import { logApiAuditEvent } from "@/lib/middleware/api-security";
import { searchPrecedents } from "@/lib/services/precedent-service";
import { withApi, ApiError, z } from '@/lib/api/framework';

const precedentSearchSchema = z.object({
  query: z.string().min(1, 'Query is required').max(500, 'Query too long'),
  filters: z.record(z.string(), z.unknown()).default({}),
  limit: z.number().int().min(1).max(100).default(50),
});

export const POST = withApi(
  {
    auth: { required: true, minRole: 'delegate' as const },
    body: precedentSearchSchema,
    openapi: {
      tags: ['Precedents'],
      summary: 'POST search',
    },
    successStatus: 201,
  },
  async ({ request, userId, organizationId, user, body, query }) => {

          // Validate request body
          const results = await searchPrecedents(query, filters, limit);
          return NextResponse.json({ 
            precedents: results,
            count: results.length
          });
  },
);
