import { NextResponse } from "next/server";
import { getSignals } from "@/server/data";

export const dynamic = "force-dynamic";

export async function GET() {
  const data = await getSignals();
  return NextResponse.json({ ok: true, data });
}
