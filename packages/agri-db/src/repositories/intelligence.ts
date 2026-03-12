import type { AgriReadContext, AgriDbContext, PaginationOpts, PaginatedResult } from '../types'
import type { AgriForcast, PriceSignal, RiskScore } from '@nzila/agri-core'
import { db } from '@nzila/db'
import { agriForecasts, agriPriceSignals, agriRiskScores } from '@nzila/db/schema'
import { eq, and, count, type SQL } from 'drizzle-orm'

// ─── Mappers ───

function toForecast(row: typeof agriForecasts.$inferSelect): AgriForcast {
  return {
    id: row.id,
    orgId: row.orgId,
    cropId: row.cropId,
    season: row.season,
    forecastType: row.forecastType,
    value: Number(row.value),
    confidence: Number(row.confidence),
    modelVersion: row.modelVersion,
    computedAt: row.computedAt.toISOString(),
    createdAt: row.createdAt.toISOString(),
  }
}

function toPriceSignal(row: typeof agriPriceSignals.$inferSelect): PriceSignal {
  return {
    id: row.id,
    orgId: row.orgId,
    cropType: row.cropType,
    market: row.market,
    price: Number(row.price),
    currency: row.currency,
    source: row.source,
    observedAt: row.observedAt.toISOString(),
    createdAt: row.createdAt.toISOString(),
  }
}

function toRiskScore(row: typeof agriRiskScores.$inferSelect): RiskScore {
  return {
    id: row.id,
    orgId: row.orgId,
    scope: row.scope,
    scopeId: row.scopeId,
    riskType: row.riskType,
    score: Number(row.score),
    factors: (row.factors ?? {}) as Record<string, unknown>,
    computedAt: row.computedAt.toISOString(),
    createdAt: row.createdAt.toISOString(),
  }
}

// ─── Forecasts ───

export async function listForecasts(
  ctx: AgriReadContext,
  opts: PaginationOpts & { cropId?: string; season?: string; forecastType?: string } = {},
): Promise<PaginatedResult<AgriForcast>> {
  const limit = Math.min(opts.limit ?? 50, 200)
  const offset = opts.offset ?? 0
  const conditions: SQL[] = [eq(agriForecasts.orgId, ctx.orgId)]
  if (opts.cropId) conditions.push(eq(agriForecasts.cropId, opts.cropId))
  if (opts.season) conditions.push(eq(agriForecasts.season, opts.season))
  if (opts.forecastType)
    conditions.push(eq(agriForecasts.forecastType, opts.forecastType as typeof agriForecasts.$inferSelect.forecastType))
  const where = and(...conditions)!
  const [rows, [{ total }]] = await Promise.all([
    db.select().from(agriForecasts).where(where).limit(limit).offset(offset),
    db.select({ total: count() }).from(agriForecasts).where(where),
  ])
  return { rows: rows.map(toForecast), total, limit, offset }
}

export async function saveForecast(ctx: AgriDbContext, forecast: Omit<AgriForcast, 'id' | 'orgId' | 'createdAt'>): Promise<AgriForcast> {
  const [row] = await db
    .insert(agriForecasts)
    .values({
      orgId: ctx.orgId,
      cropId: forecast.cropId,
      season: forecast.season,
      forecastType: forecast.forecastType,
      value: forecast.value.toString(),
      confidence: forecast.confidence.toString(),
      modelVersion: forecast.modelVersion,
      computedAt: new Date(forecast.computedAt),
    })
    .returning()
  return toForecast(row)
}

// ─── Price Signals ───

export async function listPriceSignals(
  ctx: AgriReadContext,
  opts: PaginationOpts & { cropType?: string; market?: string } = {},
): Promise<PaginatedResult<PriceSignal>> {
  const limit = Math.min(opts.limit ?? 50, 200)
  const offset = opts.offset ?? 0
  const conditions: SQL[] = [eq(agriPriceSignals.orgId, ctx.orgId)]
  if (opts.cropType) conditions.push(eq(agriPriceSignals.cropType, opts.cropType))
  if (opts.market) conditions.push(eq(agriPriceSignals.market, opts.market))
  const where = and(...conditions)!
  const [rows, [{ total }]] = await Promise.all([
    db.select().from(agriPriceSignals).where(where).limit(limit).offset(offset),
    db.select({ total: count() }).from(agriPriceSignals).where(where),
  ])
  return { rows: rows.map(toPriceSignal), total, limit, offset }
}

export async function savePriceSignal(ctx: AgriDbContext, signal: Omit<PriceSignal, 'id' | 'orgId' | 'createdAt'>): Promise<PriceSignal> {
  const [row] = await db
    .insert(agriPriceSignals)
    .values({
      orgId: ctx.orgId,
      cropType: signal.cropType,
      market: signal.market,
      price: signal.price.toString(),
      currency: signal.currency,
      source: signal.source,
      observedAt: new Date(signal.observedAt),
    })
    .returning()
  return toPriceSignal(row)
}

// ─── Risk Scores ───

export async function listRiskScores(
  ctx: AgriReadContext,
  opts: PaginationOpts & { scope?: string; riskType?: string } = {},
): Promise<PaginatedResult<RiskScore>> {
  const limit = Math.min(opts.limit ?? 50, 200)
  const offset = opts.offset ?? 0
  const conditions: SQL[] = [eq(agriRiskScores.orgId, ctx.orgId)]
  if (opts.scope) conditions.push(eq(agriRiskScores.scope, opts.scope as typeof agriRiskScores.$inferSelect.scope))
  if (opts.riskType)
    conditions.push(eq(agriRiskScores.riskType, opts.riskType as typeof agriRiskScores.$inferSelect.riskType))
  const where = and(...conditions)!
  const [rows, [{ total }]] = await Promise.all([
    db.select().from(agriRiskScores).where(where).limit(limit).offset(offset),
    db.select({ total: count() }).from(agriRiskScores).where(where),
  ])
  return { rows: rows.map(toRiskScore), total, limit, offset }
}

export async function saveRiskScore(ctx: AgriDbContext, score: Omit<RiskScore, 'id' | 'orgId' | 'createdAt'>): Promise<RiskScore> {
  const [row] = await db
    .insert(agriRiskScores)
    .values({
      orgId: ctx.orgId,
      scope: score.scope,
      scopeId: score.scopeId,
      riskType: score.riskType,
      score: score.score.toString(),
      factors: score.factors,
      computedAt: new Date(score.computedAt),
    })
    .returning()
  return toRiskScore(row)
}
