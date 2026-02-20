/**
 * GET /portal/api/ml/summary
 *
 * Returns ML anomaly summary for a partner-entitled entity.
 * Aggregate-only: daily anomaly counts, no per-transaction details,
 * no raw feature vectors, no model internals.
 *
 * RBAC:
 *   - Clerk session required (via partner portal)
 *   - partnerEntities row with `ml:summary` in allowedViews
 *   - ml:summary feature gate (tier ≥ registered)
 *
 * Query params:
 *   entityId    required — must match an entitled entity
 */
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@nzila/db'
import { mlScoresStripeDaily, mlScoresStripeTxn, mlModels } from '@nzila/db/schema'
import { eq, and, desc, gte, count } from 'drizzle-orm'
import { requirePartnerEntityAccess } from '@/lib/partner-auth'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl
    const entityId = searchParams.get('entityId')

    if (!entityId) {
      return NextResponse.json({ error: 'entityId is required' }, { status: 400 })
    }

    // ── Entitlement check ────────────────────────────────────────────────────
    const access = await requirePartnerEntityAccess(entityId, 'ml:summary')
    if (!access.ok) {
      return NextResponse.json({ error: access.error }, { status: access.status })
    }

    // ── Fetch aggregate ML data ──────────────────────────────────────────────
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      .toISOString()
      .slice(0, 10)

    const [recentDailyScores, [totalTxnAnomalies], [totalDailyAnomalies]] = await Promise.all([
      db
        .select({
          date: mlScoresStripeDaily.date,
          isAnomaly: mlScoresStripeDaily.isAnomaly,
          score: mlScoresStripeDaily.score,
          modelKey: mlModels.modelKey,
        })
        .from(mlScoresStripeDaily)
        .innerJoin(mlModels, eq(mlScoresStripeDaily.modelId, mlModels.id))
        .where(
          and(
            eq(mlScoresStripeDaily.entityId, entityId),
            gte(mlScoresStripeDaily.date, thirtyDaysAgo),
          ),
        )
        .orderBy(desc(mlScoresStripeDaily.date))
        .limit(30),

      db
        .select({ count: count() })
        .from(mlScoresStripeTxn)
        .where(
          and(
            eq(mlScoresStripeTxn.entityId, entityId),
            eq(mlScoresStripeTxn.isAnomaly, true),
          ),
        ),

      db
        .select({ count: count() })
        .from(mlScoresStripeDaily)
        .where(
          and(
            eq(mlScoresStripeDaily.entityId, entityId),
            eq(mlScoresStripeDaily.isAnomaly, true),
          ),
        ),
    ])

    const daysScored = recentDailyScores.length
    const recentAnomalyDays = recentDailyScores.filter((s) => s.isAnomaly).length

    return NextResponse.json({
      entityId,
      daysScored,
      recentAnomalyDays,
      totalDailyAnomalies: totalDailyAnomalies?.count ?? 0,
      totalTxnAnomalies: totalTxnAnomalies?.count ?? 0,
      recentDailyScores: recentDailyScores.map((s) => ({
        date: s.date,
        isAnomaly: s.isAnomaly,
        score: String(s.score),
        modelKey: s.modelKey,
      })),
    })
  } catch (err) {
    console.error('[Partner ML /summary]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
