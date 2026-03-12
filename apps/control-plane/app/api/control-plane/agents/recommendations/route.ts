import { NextResponse } from "next/server";
import { getRecommendations } from "@/server/data";

export const dynamic = "force-dynamic";

export async function GET() {
  const data = await getRecommendations();
  return NextResponse.json({ ok: true, data });
}
