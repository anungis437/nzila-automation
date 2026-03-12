import { NextResponse } from "next/server";
import { getInsights } from "@/server/data";

export const dynamic = "force-dynamic";

export async function GET() {
  const data = await getInsights();
  return NextResponse.json({ ok: true, data });
}
