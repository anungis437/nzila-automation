import { NextResponse } from "next/server";
import { getModules } from "@/server/data";

export const dynamic = "force-dynamic";

export async function GET() {
  const data = await getModules();
  return NextResponse.json({ ok: true, data });
}
