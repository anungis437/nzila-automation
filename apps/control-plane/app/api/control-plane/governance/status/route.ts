import { NextResponse } from "next/server";
import { getGovernanceStatusData } from "@/server/data";

export const dynamic = "force-dynamic";

export async function GET() {
  const data = await getGovernanceStatusData();
  return NextResponse.json({ ok: true, data });
}
