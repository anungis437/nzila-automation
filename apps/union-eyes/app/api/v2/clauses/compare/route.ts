// @ts-nocheck
import { NextResponse } from 'next/server';
/**
 * POST /api/clauses/compare
 * Migrated to withApi() framework
 */
import { logApiAuditEvent } from "@/lib/middleware/api-security";
import { withApi, ApiError, z } from '@/lib/api/framework';

const clausesCompareSchema = z.object({
  clauseIds: z.string().uuid('Invalid clauseIds'),
  analysisType: z.boolean().optional().default("all"),
  save: z.unknown().optional().default(false),
  comparisonName: z.boolean().optional(),
  organizationId: z.string().uuid('Invalid organizationId'),
});

export const POST = withApi(
  {
    auth: { required: true, minRole: 'delegate' as const },
    body: clausesCompareSchema,
    openapi: {
      tags: ['Clauses'],
      summary: 'POST compare',
    },
    successStatus: 201,
  },
  async ({ request, userId, organizationId, user, body, query }) => {

          // Validate request body
        // DUPLICATE REMOVED (Phase 2): Multi-line destructuring of body
        // const { 
        // clauseIds, 
        // analysisType = "all",
        // save = false,
        // comparisonName,
        // organizationId
        // } = body;
      if (organizationId && organizationId !== contextOrganizationId) {
        throw ApiError.forbidden('Forbidden'
        );
      }
          if (!clauseIds || !Array.isArray(clauseIds) || clauseIds.length < 2) {
            throw ApiError.internal('At least 2 clause IDs are required for comparison'
        );
          }
          if (clauseIds.length > 10) {
            throw ApiError.badRequest('Maximum 10 clauses can be compared at once');
          }
          // Perform comparison
          const result = await compareClauses({
            clauseIds,
            analysisType
          });
          // Optionally save the comparison
          if (save) {
            if (!comparisonName || !organizationId) {
              throw ApiError.internal('comparisonName and organizationId are required to save comparison'
        );
            }
            const clauseType = result.clauses[0]?.clauseType || "other";
            const savedComparison = await saveClauseComparison(
              comparisonName,
              clauseType,
              clauseIds,
              organizationId, userId,
              {
                similarities: result.similarities,
                differences: result.differences,
                bestPractices: result.bestPractices,
                recommendations: result.recommendations
              }
            );
            return NextResponse.json({ 
              ...result,
              savedComparison
            });
          }
          return result;
  },
);
