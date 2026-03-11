/**
 * API — Isolation Certification
 * GET /api/isolation — run isolation audit and return results
 *
 * Supports ?download=true for JSON file export.
 */
import { NextRequest, NextResponse } from 'next/server'
import { authenticateUser, withRequestContext } from '@/lib/api-guards'
import { withSpan } from '@nzila/os-core/telemetry'
import { runIsolationAudit } from '@nzila/platform-isolation'

export async function GET(req: NextRequest) {
  return withRequestContext(req, () =>
    withSpan('api.isolation.audit', {}, async () => {
      const auth = await authenticateUser()
      if (!auth.ok) return auth.response

      const audit = await runIsolationAudit()

      if (req.nextUrl.searchParams.get('download') === 'true') {
        return new NextResponse(JSON.stringify(audit, null, 2), {
          headers: {
            'Content-Type': 'application/json',
            'Content-Disposition': `attachment; filename="isolation-certification-${new Date().toISOString().slice(0, 10)}.json"`,
          },
        })
      }

      return NextResponse.json(audit)
    }),
  )
}
