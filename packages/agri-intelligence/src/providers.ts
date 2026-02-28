// ---------------------------------------------------------------------------
// Intelligence provider interfaces
// ---------------------------------------------------------------------------
// These interfaces define external data sources that the intelligence layer
// consumes.  V1 ships with deterministic in-memory implementations; V2+ will
// swap in ML model providers.
// ---------------------------------------------------------------------------

import type { GeoPoint } from '@nzila/agri-core'

/** Historical yield data point for a crop in a region */
export interface YieldDataPoint {
  cropId: string
  regionId: string
  season: string
  yieldKg: number
  areaHa: number
}

/** Price observation from a market source */
export interface PriceObservation {
  cropId: string
  marketId: string
  date: string
  pricePerKg: number
  currency: string
}

/** Climate risk factor for a region */
export interface ClimateRiskFactor {
  regionId: string
  factor: string
  probability: number
  impactPercent: number
}

// ---------------------------------------------------------------------------
// Provider contracts
// ---------------------------------------------------------------------------

export interface YieldModelProvider {
  /** Return historical yield data for a crop in a region */
  getHistoricalYields(cropId: string, regionId: string, seasons: number): Promise<YieldDataPoint[]>
}

export interface PricingSignalProvider {
  /** Return recent price observations for a crop */
  getRecentPrices(cropId: string, marketId: string, days: number): Promise<PriceObservation[]>
}

export interface ClimateRiskProvider {
  /** Return climate risk factors for a region */
  getRiskFactors(regionId: string, location: GeoPoint): Promise<ClimateRiskFactor[]>
}

// ---------------------------------------------------------------------------
// In-memory stubs (V1 deterministic)
// ---------------------------------------------------------------------------

export function createStubYieldProvider(data: YieldDataPoint[]): YieldModelProvider {
  return {
    async getHistoricalYields(cropId, regionId, seasons) {
      return data
        .filter((d) => d.cropId === cropId && d.regionId === regionId)
        .slice(0, seasons)
    },
  }
}

export function createStubPricingProvider(data: PriceObservation[]): PricingSignalProvider {
  return {
    async getRecentPrices(cropId, marketId, days) {
      const cutoff = Date.now() - days * 86_400_000
      return data.filter(
        (d) => d.cropId === cropId && d.marketId === marketId && new Date(d.date).getTime() >= cutoff,
      )
    },
  }
}

export function createStubClimateProvider(data: ClimateRiskFactor[]): ClimateRiskProvider {
  return {
    async getRiskFactors(regionId) {
      return data.filter((d) => d.regionId === regionId)
    },
  }
}
