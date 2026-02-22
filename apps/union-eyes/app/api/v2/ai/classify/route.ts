// @ts-nocheck
/**
 * POST /api/ai/classify
 * Migrated to withApi() framework
 */
import { logApiAuditEvent } from "@/lib/middleware/api-security";
import { checkEntitlement, consumeCredits, getCreditCost } from '@/lib/services/entitlements';

import { withApi, ApiError, z, RATE_LIMITS } from '@/lib/api/framework';

const aiClassifySchema = z.object({
  action: z.enum(['classify-clause', 'generate-tags', 'detect-refs', 'classify-precedent', 'enrich', 'batch-classify']).default('classify-clause'),
  content: z.string().max(50000, 'Content too long').optional(),
  context: z.record(z.string(), z.unknown()).default({}),
  clauses: z.array(z.any()).default([]),
  caseTitle: z.string().optional(),
  facts: z.string().optional(),
  reasoning: z.string().optional(),
  decision: z.string().optional(),
});

export const POST = withApi(
  {
    auth: { required: true, minRole: 'delegate' as const },
    body: aiClassifySchema,
    rateLimit: RATE_LIMITS.AI_COMPLETION,
    openapi: {
      tags: ['Ai'],
      summary: 'POST classify',
    },
    successStatus: 201,
  },
  async ({ request, userId, organizationId, user, body, query }) => {

          // Validate request body
          switch (action) {
            case 'classify-clause':
              if (!content) {
                throw ApiError.internal('Content is required'
        );
              }
              const classification = await classifyClause(content, context);
              return NextResponse.json({
                action: 'classify-clause',
                classification,
              });
            case 'generate-tags':
              if (!content) {
                throw ApiError.internal('Content is required'
        );
              }
              if (!context.clauseType) {
                throw ApiError.internal('clauseType is required in context'
        );
              }
              const tags = await generateClauseTags(content, context.clauseType);
              return NextResponse.json({
                action: 'generate-tags',
                tags,
              });
            case 'detect-refs':
              if (!content) {
                throw ApiError.internal('Content is required'
        );
              }
              const crossReferences = await detectCrossReferences(content);
              return NextResponse.json({
                action: 'detect-refs',
                crossReferences,
              });
            case 'classify-precedent':
              if (!caseTitle || !facts || !reasoning || !decision) {
                throw ApiError.internal('caseTitle, facts, reasoning, and decision are required'
        );
              }
              const precedentClass = await classifyPrecedent(caseTitle, facts, reasoning, decision);
              return NextResponse.json({
                action: 'classify-precedent',
                classification: precedentClass,
              });
            case 'enrich':
              if (!content) {
                throw ApiError.internal('Content is required'
        );
              }
              const enriched = await enrichClauseMetadata(content, context);
              return NextResponse.json({
                action: 'enrich',
                enrichment: enriched,
              });
            case 'batch-classify':
              if (!clauses || clauses.length === 0) {
                throw ApiError.internal('Clauses array is required and must not be empty'
        );
              }
              let completed = 0;
              const total = clauses.length;
              const batchResults = await batchClassifyClauses(clauses, {
                concurrency: 5,
                onProgress: (comp, tot) => {
                  completed = comp;
                },
              });
              const resultsArray = Array.from(batchResults.entries()).map(([id, result]) => ({
                id,
                ...result,
              }));
              return NextResponse.json({
                action: 'batch-classify',
                total,
                completed,
                results: resultsArray,
              });
            default:
              throw ApiError.badRequest('Invalid action. Use: classify-clause, generate-tags, detect-refs, classify-precedent, enrich, or batch-classify');
          }
  },
);
