// ---------------------------------------------------------------------------
// Weather adapter — interfaces + stub for external weather data sources
// ---------------------------------------------------------------------------

export interface WeatherForecast {
  regionId: string
  date: string
  tempMinC: number
  tempMaxC: number
  rainfallMm: number
  humidity: number
  condition: string
}

export interface WeatherAdapter {
  getForecast(regionId: string, days: number): Promise<WeatherForecast[]>
  getHistorical(regionId: string, fromDate: string, toDate: string): Promise<WeatherForecast[]>
}

/** In-memory stub for tests and dev */
export function createStubWeatherAdapter(data: WeatherForecast[]): WeatherAdapter {
  return {
    async getForecast(regionId, days) {
      return data.filter((d) => d.regionId === regionId).slice(0, days)
    },
    async getHistorical(regionId, fromDate, toDate) {
      return data.filter(
        (d) => d.regionId === regionId && d.date >= fromDate && d.date <= toDate,
      )
    },
  }
}
