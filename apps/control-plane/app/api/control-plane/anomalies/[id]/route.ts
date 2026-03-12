import { NextResponse, type NextRequest } from "next/server";
import { getAnomalyById } from "@/server/data";

export const dynamic = "force-dynamic";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const anomaly = await getAnomalyById(id);

  if (!anomaly) {
    return NextResponse.json(
      { ok: false, error: "Anomaly not found" },
      { status: 404 }
    );
  }

  return NextResponse.json({ ok: true, data: anomaly });
}
