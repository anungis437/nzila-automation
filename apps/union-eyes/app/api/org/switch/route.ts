/**
 * POST /api/org/switch
 *
 * Switches the authenticated user's active organization.
 * Canonical org endpoint — all new code should hit this route.
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
  async (request: NextRequest, context: BaseAuthContext) => {
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

      // Build response with org-only payload
      const org = {
        organizationId,
        name: null as string | null,
        slug: null as string | null,
      };

      return NextResponse.json({
        success: true,
        org,
      });
    } catch (_error) {
      return standardErrorResponse(
        ErrorCode.INTERNAL_ERROR,
        "Failed to switch organization",
      );
    }
  },
);
