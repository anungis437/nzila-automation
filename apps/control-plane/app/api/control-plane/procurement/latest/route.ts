import { NextResponse } from "next/server";
import { getProcurementSummary } from "@/server/data";

export const dynamic = "force-dynamic";

export async function GET() {
  const data = await getProcurementSummary();
  return NextResponse.json({ ok: true, data });
}
