import { NextResponse } from 'next/server';
/**
 * POST /api/ml/query
 * Migrated to withApi() framework
 */
import { logApiAuditEvent } from '@/lib/middleware/api-security';
import { withApi, ApiError, z, RATE_LIMITS } from '@/lib/api/framework';

const QuerySchema = z.object({
  question: z.string().min(1).max(500),
  context: z.any().optional(),
});

export const POST = withApi(
  {
    auth: { required: true, minRole: 'delegate' as const },
    body: QuerySchema,
    rateLimit: RATE_LIMITS.ML_PREDICTIONS,
    openapi: {
      tags: ['Ml'],
      summary: 'POST query',
    },
    successStatus: 201,
  },
  async ({ request, userId, organizationId, user, body, query }) => {

        const { question, context: queryContext } = QuerySchema.parse(body);
        const organizationScopeId = organizationId || userId;
        // Call AI service for natural language query
        const aiServiceUrl = process.env.AI_SERVICE_URL || 'http://localhost:3005';
        const response = await fetch(`${aiServiceUrl}/api/query`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.AI_SERVICE_TOKEN}`,
            'X-Organization-ID': organizationScopeId
          },
          body: JSON.stringify({
            question,
            organizationId: organizationScopeId,
            context: queryContext
          })
        });
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
    throw new Error('AI service query failed');
        }
        const result = await response.json();
        // Generate follow-up suggestions based on the query type
        const suggestions = generateFollowUpSuggestions(question, result);
        // Log audit event
        await logApiAuditEvent({
          action: 'ml_query',
          resourceType: 'AI_ML',
          organizationId,
          userId,
          metadata: {
            question: question.substring(0, 100),
            confidence: result.confidence,
          },
        });
        return NextResponse.json({
          ...result,
          suggestions
        });
  },
);
