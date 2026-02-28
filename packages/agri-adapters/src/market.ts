// ---------------------------------------------------------------------------
// Market price adapter — interfaces + stub
// ---------------------------------------------------------------------------

export interface MarketPrice {
  cropId: string
  marketId: string
  marketName: string
  date: string
  pricePerKg: number
  currency: string
  source: string
}

export interface MarketAdapter {
  /** Get latest prices for a crop across markets */
  getLatestPrices(cropId: string): Promise<MarketPrice[]>
  /** Get price history for a crop at a specific market */
  getPriceHistory(cropId: string, marketId: string, days: number): Promise<MarketPrice[]>
}

/** In-memory stub for tests and dev */
export function createStubMarketAdapter(data: MarketPrice[]): MarketAdapter {
  return {
    async getLatestPrices(cropId) {
      const byCrop = data.filter((d) => d.cropId === cropId)
      // Return the latest entry per market
      const latest = new Map<string, MarketPrice>()
      for (const d of byCrop) {
        const existing = latest.get(d.marketId)
        if (!existing || d.date > existing.date) {
          latest.set(d.marketId, d)
        }
      }
      return Array.from(latest.values())
    },
    async getPriceHistory(cropId, marketId, days) {
      const cutoff = new Date(Date.now() - days * 86_400_000).toISOString().slice(0, 10)
      return data.filter(
        (d) => d.cropId === cropId && d.marketId === marketId && d.date >= cutoff,
      )
    },
  }
}
