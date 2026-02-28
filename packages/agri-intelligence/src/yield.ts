// ---------------------------------------------------------------------------
// Yield intelligence — deterministic V1 models
// ---------------------------------------------------------------------------

import type { YieldDataPoint, YieldModelProvider } from './providers'

/** Yield efficiency = (actual yield / expected yield) × 100 */
export interface YieldEfficiencyResult {
  cropId: string
  regionId: string
  actualKg: number
  expectedKg: number
  efficiencyPercent: number
}

/** Expected yield = mean of historical yields per hectare × area */
export interface ExpectedYieldResult {
  cropId: string
  regionId: string
  areaHa: number
  expectedKg: number
  historicalMean: number
  sampleSize: number
}

// ---------------------------------------------------------------------------
// Pure computations (no I/O)
// ---------------------------------------------------------------------------

/**
 * Compute the mean yield per hectare from data points.
 * Returns 0 if no data.
 */
export function computeHistoricalMeanYieldPerHa(data: YieldDataPoint[]): number {
  if (data.length === 0) return 0
  const total = data.reduce((sum, d) => sum + (d.areaHa > 0 ? d.yieldKg / d.areaHa : 0), 0)
  return total / data.length
}

/** Compute expected yield for a given area from a historical mean */
export function computeExpectedYield(
  cropId: string,
  regionId: string,
  areaHa: number,
  data: YieldDataPoint[],
): ExpectedYieldResult {
  const mean = computeHistoricalMeanYieldPerHa(data)
  return {
    cropId,
    regionId,
    areaHa,
    expectedKg: mean * areaHa,
    historicalMean: mean,
    sampleSize: data.length,
  }
}

/** Compute yield efficiency = (actual / expected) × 100 */
export function computeYieldEfficiency(
  cropId: string,
  regionId: string,
  actualKg: number,
  expectedKg: number,
): YieldEfficiencyResult {
  return {
    cropId,
    regionId,
    actualKg,
    expectedKg,
    efficiencyPercent: expectedKg > 0 ? (actualKg / expectedKg) * 100 : 0,
  }
}

// ---------------------------------------------------------------------------
// Provider-backed functions
// ---------------------------------------------------------------------------

export async function getExpectedYield(
  provider: YieldModelProvider,
  cropId: string,
  regionId: string,
  areaHa: number,
  seasons: number = 5,
): Promise<ExpectedYieldResult> {
  const data = await provider.getHistoricalYields(cropId, regionId, seasons)
  return computeExpectedYield(cropId, regionId, areaHa, data)
}
