/**
 * Compliance Alerts API
 *
 * GET /api/compliance/alerts — List compliance alerts for the org
 */

import { db } from "@/db/db";
import { complianceAlerts } from "@/db/schema/domains/compliance/employer-compliance";
import { withOrganizationAuth } from "@/lib/organization-middleware";
import { hasMinRole } from "@/lib/api-auth-guard";
import {
  ErrorCode,
  standardErrorResponse,
  standardSuccessResponse,
} from "@/lib/api/standardized-responses";
import { eq, desc } from "drizzle-orm";

export const GET = withOrganizationAuth(async (_request, context) => {
  const { organizationId } = context;

  try {
    const canAccess = await hasMinRole("steward");
    if (!canAccess) {
      return standardErrorResponse(ErrorCode.FORBIDDEN, "Requires steward role or above");
    }

    const alerts = await db
      .select()
      .from(complianceAlerts)
      .where(eq(complianceAlerts.orgId, organizationId))
      .orderBy(desc(complianceAlerts.createdAt));

    return standardSuccessResponse(alerts);
  } catch (error) {
    console.error("[compliance/alerts] Failed:", error instanceof Error ? error.message : error);
    return standardSuccessResponse([]);
  }
});
