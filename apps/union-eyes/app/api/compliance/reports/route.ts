/**
 * Compliance Reports API
 *
 * GET /api/compliance/reports — List compliance reports for the org
 */

import { db } from "@/db/db";
import {
  employerReports,
  employers,
} from "@/db/schema/domains/compliance/employer-compliance";
import { withOrganizationAuth } from "@/lib/organization-middleware";
import { hasMinRole } from "@/lib/api-auth-guard";
import {
  ErrorCode,
  standardErrorResponse,
  standardSuccessResponse,
} from "@/lib/api/standardized-responses";
import { eq, desc, inArray } from "drizzle-orm";

export const GET = withOrganizationAuth(async (_request, context) => {
  const { organizationId } = context;

  try {
    const canAccess = await hasMinRole("steward");
    if (!canAccess) {
      return standardErrorResponse(ErrorCode.FORBIDDEN, "Requires steward role or above");
    }

    // Get employer IDs for this org
    const orgEmployers = await db
      .select({ id: employers.id })
      .from(employers)
      .where(eq(employers.orgId, organizationId));

    const employerIds = orgEmployers.map((e) => e.id);

    if (employerIds.length === 0) {
      return standardSuccessResponse([]);
    }

    const reports = await db
      .select()
      .from(employerReports)
      .where(inArray(employerReports.employerId, employerIds))
      .orderBy(desc(employerReports.createdAt));

    return standardSuccessResponse(reports);
  } catch (_error) {
    return standardErrorResponse(ErrorCode.INTERNAL_ERROR, "Failed to list compliance reports");
  }
});
