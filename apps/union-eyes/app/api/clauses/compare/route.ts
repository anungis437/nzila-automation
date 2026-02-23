import { logApiAuditEvent } from "@/lib/middleware/api-security";
/**
 * Clause Comparison API Route
 * POST /api/clauses/compare - Compare multiple clauses
 * GET /api/clauses/compare - List saved comparisons
 */

import { NextRequest, NextResponse } from "next/server";
import { 
  compareClauses,
  saveClauseComparison 
} from "@/lib/services/clause-service";
import { z } from "zod";
import { getCurrentUser, withAdminAuth, withApiAuth, withMinRole, withRoleAuth } from '@/lib/api-auth-guard';

import {
  ErrorCode,
  standardErrorResponse,
  standardSuccessResponse,
} from '@/lib/api/standardized-responses';

const clausesCompareSchema = z.object({
  clauseIds: z.string().uuid('Invalid clauseIds'),
  analysisType: z.boolean().optional().default("all"),
  save: z.unknown().optional().default(false),
  comparisonName: z.boolean().optional(),
  organizationId: z.string().uuid('Invalid organizationId'),
});

export const POST = async (request: NextRequest) => {
  return withRoleAuth(20, async (request, context) => {
    const { userId, organizationId: contextOrganizationId } = context;

  try {
      const body = await request.json();
    // Validate request body
    const validation = clausesCompareSchema.safeParse(body);
    if (!validation.success) {
      return standardErrorResponse(
        ErrorCode.VALIDATION_ERROR,
        'Invalid request data',
        validation.error.errors
      );
    }
    
    const { clauseIds, analysisType = "all", save = false, comparisonName, organizationId } = validation.data;
    // DUPLICATE REMOVED (Phase 2): Multi-line destructuring of body
    // const { 
    // clauseIds, 
    // analysisType = "all",
    // save = false,
    // comparisonName,
    // organizationId
    // } = body;
  if (organizationId && organizationId !== contextOrganizationId) {
    return standardErrorResponse(
      ErrorCode.FORBIDDEN,
      'Forbidden'
    );
  }


      if (!clauseIds || !Array.isArray(clauseIds) || clauseIds.length < 2) {
        return standardErrorResponse(
      ErrorCode.MISSING_REQUIRED_FIELD,
      'At least 2 clause IDs are required for comparison'
    );
      }

      if (clauseIds.length > 10) {
        return NextResponse.json(
          { error: "Maximum 10 clauses can be compared at once" },
          { status: 400 }
        );
      }

      // Perform comparison
      const result = await compareClauses({
        clauseIds,
        analysisType
      });

      // Optionally save the comparison
      if (save) {
        if (!comparisonName || !organizationId) {
          return standardErrorResponse(
      ErrorCode.MISSING_REQUIRED_FIELD,
      'comparisonName and organizationId are required to save comparison'
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

      return NextResponse.json(result);
    } catch (error) {
return standardErrorResponse(
      ErrorCode.INTERNAL_ERROR,
      'Internal server error',
      error
    );
    }
    })(request);
};
