import { NextResponse } from "next/server";
import { getGovernanceTimeline } from "@/server/data";

export const dynamic = "force-dynamic";

export async function GET() {
  const data = await getGovernanceTimeline();
  return NextResponse.json({ ok: true, data });
}
