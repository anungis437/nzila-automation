/**
 * Contracts API
 *
 * GET /api/contracts — List contracts for the org
 */

import { withOrganizationAuth } from "@/lib/organization-middleware";
import { hasMinRole } from "@/lib/api-auth-guard";
import { listContracts } from "@/lib/services/clause-intelligence";
import {
  ErrorCode,
  standardErrorResponse,
  standardSuccessResponse,
} from "@/lib/api/standardized-responses";

export const GET = withOrganizationAuth(async (_request, context) => {
  const { organizationId } = context;

  try {
    const canAccess = await hasMinRole("member");
    if (!canAccess) {
      return standardErrorResponse(ErrorCode.FORBIDDEN, "Unauthorized");
    }

    const contracts = await listContracts(organizationId);
    return standardSuccessResponse(contracts);
  } catch (_error) {
    return standardErrorResponse(ErrorCode.INTERNAL_ERROR, "Failed to list contracts");
  }
});
