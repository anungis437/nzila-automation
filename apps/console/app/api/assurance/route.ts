/**
 * API — Executive Assurance Dashboard
 * GET /api/assurance — fetch KPI scores and overall assurance rating
 */
import { NextRequest, NextResponse } from 'next/server'
import { authenticateUser } from '@/lib/api-guards'
import { createLogger } from '@nzila/os-core'
import { gradeFromScore } from '@nzila/platform-assurance'

const logger = createLogger('api:assurance')

export async function GET(_req: NextRequest) {
  try {
    const auth = await authenticateUser()
    if (!auth.ok) return auth.response

    // TODO(prod): replace mock KPIs with computeAssuranceDashboard(ports)
    const kpis = {
      compliance: { value: 97, grade: 'A', weight: 25, trend: 'up' },
      security: { value: 92, grade: 'A', weight: 25, trend: 'up' },
      operations: { value: 91, grade: 'A', weight: 20, trend: 'flat' },
      cost: { value: 78, grade: 'B', weight: 15, trend: 'down' },
      integrationReliability: { value: 95, grade: 'A', weight: 15, trend: 'up' },
    }

    const overall = Math.round(
      Object.values(kpis).reduce(
        (sum, kpi) => sum + kpi.value * (kpi.weight / 100),
        0,
      ),
    )

    const grade = gradeFromScore(overall)

    return NextResponse.json({
      orgId: auth.userId,
      generatedAt: new Date().toISOString(),
      kpis,
      overall: { value: overall, grade },
    })
  } catch (err) {
    logger.error('[Assurance GET Error]', err instanceof Error ? err : { detail: err })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
