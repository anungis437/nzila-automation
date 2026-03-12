import { NextResponse } from "next/server";
import { getGovernanceStatusData } from "@/server/data";
import { requireApiAuth, handleAuthError } from "@/lib/api-auth";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    await requireApiAuth(request);
    const data = await getGovernanceStatusData();
    return NextResponse.json({ ok: true, data });
  } catch (error) {
    return handleAuthError(error);
  }
}
