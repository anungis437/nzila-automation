import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { requireApiAuth, handleAuthError } from "@/lib/api-auth";

export const dynamic = "force-dynamic";

const querySchema = z.object({
  query: z.string().min(1).max(500),
});

export async function POST(request: NextRequest) {
  try {
    await requireApiAuth(request);
    const body: unknown = await request.json();
    const parsed = querySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, error: "Invalid query. Provide a non-empty string (max 500 chars)." },
        { status: 400 }
      );
    }

    // Demo response — in production this delegates to platform-ai-query
    return NextResponse.json({
      ok: true,
      data: {
        query: parsed.data.query,
        answer: `Demo answer for: "${parsed.data.query}"`,
        confidence: 0.82,
        sources: ["platform-governance", "platform-observability"],
        evidenceRefs: ["governance-audit-2026-03", "slo-report-2026-q1"],
      },
    });
  } catch (error) {
    return handleAuthError(error);
  }
}
