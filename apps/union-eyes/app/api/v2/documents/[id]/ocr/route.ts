/**
 * POST /api/documents/[id]/ocr
 * Migrated to withApi() framework
 */
import { logApiAuditEvent } from "@/lib/middleware/api-security";
import { processDocumentOCR } from "@/lib/services/document-service";
import { withApi, ApiError } from '@/lib/api/framework';

export const POST = withApi(
  {
    auth: { required: true, minRole: 'delegate' as const },
    openapi: {
      tags: ['Documents'],
      summary: 'POST ocr',
    },
    successStatus: 201,
  },
  async ({ request, params, userId, organizationId, user, body, query }) => {

            const result = await processDocumentOCR(params.id);
            logApiAuditEvent({
              timestamp: new Date().toISOString(), userId,
              endpoint: `/api/documents/${params.id}/ocr`,
              method: 'POST',
              eventType: 'success',
              severity: 'medium',
              details: { documentId: params.id },
            });
            return result;
  },
);
