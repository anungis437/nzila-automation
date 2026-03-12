import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { requireApiAuth, handleAuthError } from "@/lib/api-auth";

export const dynamic = "force-dynamic";

const validateSchema = z.object({
  packId: z.string().min(1),
  digest: z.string().min(1),
});

export async function POST(request: NextRequest) {
  try {
    await requireApiAuth(request);
    const body: unknown = await request.json();
    const parsed = validateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, error: "Provide packId and digest." },
        { status: 400 }
      );
    }

    // Demo validation — in production, verify the signature against the real key
    return NextResponse.json({
      ok: true,
      data: {
        packId: parsed.data.packId,
        valid: true,
        verifiedAt: new Date().toISOString(),
        algorithm: "ed25519",
        keyId: "nzila-os-procurement-2026",
      },
    });
  } catch (error) {
    return handleAuthError(error);
  }
}
