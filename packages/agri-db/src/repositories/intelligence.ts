import type { AgriReadContext, AgriDbContext, PaginationOpts, PaginatedResult } from '../types'
import type { AgriForcast, PriceSignal, RiskScore } from '@nzila/agri-core'

// ─── Forecasts ───

export async function listForecasts(
  ctx: AgriReadContext,
  opts: PaginationOpts & { cropId?: string; season?: string; forecastType?: string } = {},
): Promise<PaginatedResult<AgriForcast>> {
  const limit = Math.min(opts.limit ?? 50, 200)
  const offset = opts.offset ?? 0
  void ctx
  return { rows: [], total: 0, limit, offset }
}

export async function saveForecast(ctx: AgriDbContext, forecast: Omit<AgriForcast, 'id' | 'orgId' | 'createdAt'>): Promise<AgriForcast> {
  const id = crypto.randomUUID()
  return { id, orgId: ctx.orgId, ...forecast, createdAt: new Date().toISOString() }
}

// ─── Price Signals ───

export async function listPriceSignals(
  ctx: AgriReadContext,
  opts: PaginationOpts & { cropType?: string; market?: string } = {},
): Promise<PaginatedResult<PriceSignal>> {
  const limit = Math.min(opts.limit ?? 50, 200)
  const offset = opts.offset ?? 0
  void ctx
  return { rows: [], total: 0, limit, offset }
}

export async function savePriceSignal(ctx: AgriDbContext, signal: Omit<PriceSignal, 'id' | 'orgId' | 'createdAt'>): Promise<PriceSignal> {
  const id = crypto.randomUUID()
  return { id, orgId: ctx.orgId, ...signal, createdAt: new Date().toISOString() }
}

// ─── Risk Scores ───

export async function listRiskScores(
  ctx: AgriReadContext,
  opts: PaginationOpts & { scope?: string; riskType?: string } = {},
): Promise<PaginatedResult<RiskScore>> {
  const limit = Math.min(opts.limit ?? 50, 200)
  const offset = opts.offset ?? 0
  void ctx
  return { rows: [], total: 0, limit, offset }
}

export async function saveRiskScore(ctx: AgriDbContext, score: Omit<RiskScore, 'id' | 'orgId' | 'createdAt'>): Promise<RiskScore> {
  const id = crypto.randomUUID()
  return { id, orgId: ctx.orgId, ...score, createdAt: new Date().toISOString() }
}
