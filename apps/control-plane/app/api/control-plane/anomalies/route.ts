import { NextResponse } from "next/server";
import { getAnomalies } from "@/server/data";

export const dynamic = "force-dynamic";

export async function GET() {
  const data = await getAnomalies();
  return NextResponse.json({ ok: true, data });
}
