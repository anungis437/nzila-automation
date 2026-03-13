/**
 * Contract Clauses API
 *
 * GET /api/contracts/[id]/clauses — List clauses for a contract
 */

import { withOrganizationAuth } from "@/lib/organization-middleware";
import { hasMinRole } from "@/lib/api-auth-guard";
import { listClauses } from "@/lib/services/clause-intelligence";
import {
  ErrorCode,
  standardErrorResponse,
  standardSuccessResponse,
} from "@/lib/api/standardized-responses";

export const GET = withOrganizationAuth(async (_request, context, params?: { id: string }) => {
  try {
    if (!params?.id) return standardErrorResponse(ErrorCode.VALIDATION_ERROR, "Missing ID");
    const canAccess = await hasMinRole("member");
    if (!canAccess) {
      return standardErrorResponse(ErrorCode.FORBIDDEN, "Unauthorized");
    }

    const clauses = await listClauses(params.id);
    return standardSuccessResponse(clauses);
  } catch (_error) {
    return standardErrorResponse(ErrorCode.INTERNAL_ERROR, "Failed to list clauses");
  }
});
