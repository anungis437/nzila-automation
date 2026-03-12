import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  // Demo public key — in production, load from a key vault or env
  return NextResponse.json({
    ok: true,
    data: {
      algorithm: "ed25519",
      keyId: "nzila-os-procurement-2026",
      publicKey:
        "MCowBQYDK2VwAyEADEMOKEYNOTREALPLEASEREPLACEINPRODUCTION0000=",
      createdAt: "2026-01-01T00:00:00.000Z",
    },
  });
}
