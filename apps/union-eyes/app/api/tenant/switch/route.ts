/**
 * POST /api/tenant/switch — DEPRECATED
 *
 * Legacy compat wrapper. All new code should use /api/org/switch instead.
 * Response still uses org-only language.
 */

import { NextRequest, NextResponse } from "next/server";
import { withApiAuth, BaseAuthContext } from "@/lib/api-auth-guard";
import { validateOrganizationExists } from "@/lib/organization-utils";
import {
  ErrorCode,
  standardErrorResponse,
} from "@/lib/api/standardized-responses";

export const dynamic = "force-dynamic";

export const POST = withApiAuth(
  async (request: NextRequest, _context: BaseAuthContext) => {
    try {
      const body = await request.json();
      const { organizationId } = body;

      if (!organizationId || typeof organizationId !== "string") {
        return standardErrorResponse(
          ErrorCode.VALIDATION_ERROR,
          "organizationId is required",
        );
      }

      const exists = await validateOrganizationExists(organizationId);
      if (!exists) {
        return standardErrorResponse(
          ErrorCode.NOT_FOUND,
          "Organization not found",
        );
      }

      const org = {
        organizationId,
        name: null as string | null,
        slug: null as string | null,
      };

      const response = NextResponse.json({ success: true, org });
      response.headers.set("X-Deprecated", "true; use /api/org/switch");
      return response;
    } catch (_error) {
      return standardErrorResponse(
        ErrorCode.INTERNAL_ERROR,
        "Failed to switch organization",
      );
    }
  },
);
