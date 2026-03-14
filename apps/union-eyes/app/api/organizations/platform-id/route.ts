import { NextResponse } from "next/server";
import { DEFAULT_ORGANIZATION_ID } from "@/lib/organization-utils";

/**
 * GET /api/organizations/platform-id
 * Returns the platform (default) organization ID so client components
 * can distinguish "viewing platform" from "viewing a tenant org".
 */
export async function GET() {
  return NextResponse.json({ platformOrgId: DEFAULT_ORGANIZATION_ID });
}
