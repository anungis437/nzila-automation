import { NextResponse } from 'next/server';
/**
 * GET PATCH DELETE /api/clauses/[id]
 * Migrated to withApi() framework
 */
import { logApiAuditEvent } from "@/lib/middleware/api-security";
import { withApi, ApiError } from '@/lib/api/framework';

export const GET = withApi(
  {
    auth: { required: true, minRole: 'member' as const },
    openapi: {
      tags: ['Clauses'],
      summary: 'GET [id]',
    },
  },
  async ({ request, params, userId, organizationId, user, body, query }) => {

          const { id } = params;
          const { searchParams } = new URL(request.url);
          const includeHierarchy = searchParams.get("includeHierarchy") === "true";
          if (includeHierarchy) {
            const hierarchy = await getClauseHierarchy(id);
            if (!hierarchy.clause) {
              throw ApiError.notFound('Clause not found'
        );
            }
            return hierarchy;
          }
          // Fetch clause
          const clause = await getClauseById(id);
          if (!clause) {
            throw ApiError.notFound('Clause not found'
        );
          }
          return NextResponse.json({ clause });
  },
);

export const PATCH = withApi(
  {
    auth: { required: true, minRole: 'member' as const },
    openapi: {
      tags: ['Clauses'],
      summary: 'PATCH [id]',
    },
  },
  async ({ request, params, userId, organizationId, user, body, query }) => {

          const { id } = params;
          // Update clause
          const updatedClause = await updateClause(id, body);
          if (!updatedClause) {
            throw ApiError.notFound('Clause not found'
        );
          }
          return NextResponse.json({ clause: updatedClause });
  },
);

export const DELETE = withApi(
  {
    auth: { required: true, minRole: 'member' as const },
    openapi: {
      tags: ['Clauses'],
      summary: 'DELETE [id]',
    },
  },
  async ({ request, params, userId, organizationId, user, body, query }) => {

          const { id } = params;
          const success = await deleteClause(id);
          if (!success) {
            throw ApiError.notFound('Clause not found'
        );
          }
          return NextResponse.json({ 
            message: "Clause deleted successfully",
            deleted: true 
          });
  },
);
