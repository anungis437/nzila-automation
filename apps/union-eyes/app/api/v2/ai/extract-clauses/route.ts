// @ts-nocheck
/**
 * POST /api/ai/extract-clauses
 * Migrated to withApi() framework
 */
import { logApiAuditEvent } from "@/lib/middleware/api-security";
import { extractClausesFromPDF, batchExtractClauses } from '@/lib/services/ai/clause-extraction-service';
import { checkEntitlement, consumeCredits, getCreditCost } from '@/lib/services/entitlements';

import { withApi, ApiError, z, RATE_LIMITS } from '@/lib/api/framework';

const aiExtractClausesSchema = z.object({
  pdfUrl: z.string().url('Invalid URL'),
  cbaId: z.string().uuid('Invalid cbaId'),
  organizationId: z.string().uuid('Invalid organizationId'),
  autoSave: z.boolean().default(true).optional(),
  batch: z.boolean().default(false).optional(),
  cbas: z.array(z.any()).default([]).optional(),
});

export const POST = withApi(
  {
    auth: { required: true, minRole: 'member' as const },
    body: aiExtractClausesSchema,
    rateLimit: RATE_LIMITS.AI_COMPLETION,
    openapi: {
      tags: ['Ai'],
      summary: 'POST extract-clauses',
    },
    successStatus: 201,
  },
  async ({ request, userId, organizationId, user, body, query }) => {

          // Validate request body
          // DUPLICATE REMOVED (Phase 2): Multi-line destructuring of body
          // const {
          // pdfUrl,
          // cbaId,
          // organizationId,
          // autoSave = true,
          // batch = false,
          // cbas = [],
          // } = body;
          if (organizationId && organizationId !== context.organizationId) {
            throw ApiError.forbidden('Forbidden'
            );
          }
          // Batch extraction
          if (batch && cbas.length > 0) {
            const results = await batchExtractClauses(cbas, {
              autoSave,
              concurrency: 3,
            });
            const resultsArray = Array.from(results.entries()).map(([cbaId, result]) => ({
              cbaId,
              ...result,
            }));
            return { batch: true,
              results: resultsArray,
              totalCBAs: cbas.length,
              successfulExtractions: resultsArray.filter(r => r.success).length, };
          }
          // Single extraction
          if (!pdfUrl || !cbaId || !organizationId) {
            throw ApiError.badRequest('Missing required fields: pdfUrl, cbaId, organizationId'
            );
          }
          const result = await extractClausesFromPDF(pdfUrl, cbaId, {
            organizationId,
            autoSave,
          });
          return NextResponse.json({
            success: result.success,
            totalClauses: result.totalClauses,
            processingTime: result.processingTime,
            clauses: result.clauses,
            errors: result.errors,
          });
  },
);
