import { describe, it, expect } from 'vitest'
import {
  createStubWeatherAdapter,
  createStubMarketAdapter,
  createStubMobileMoneyAdapter,
  createStubSmsAdapter,
} from './index'
import type { WeatherForecast } from './weather'
import type { MarketPrice } from './market'

// ---------------------------------------------------------------------------
// Weather adapter
// ---------------------------------------------------------------------------

const weatherData: WeatherForecast[] = [
  { regionId: 'kasai', date: '2026-03-10', tempMinC: 18, tempMaxC: 30, rainfallMm: 12, humidity: 72, condition: 'cloudy' },
  { regionId: 'kasai', date: '2026-03-11', tempMinC: 19, tempMaxC: 31, rainfallMm: 0, humidity: 60, condition: 'sunny' },
  { regionId: 'katanga', date: '2026-03-10', tempMinC: 16, tempMaxC: 28, rainfallMm: 5, humidity: 65, condition: 'rain' },
]

describe('createStubWeatherAdapter', () => {
  const adapter = createStubWeatherAdapter(weatherData)

  it('returns forecasts filtered by region', async () => {
    const result = await adapter.getForecast('kasai', 10)
    expect(result).toHaveLength(2)
    expect(result.every((r) => r.regionId === 'kasai')).toBe(true)
  })

  it('limits results to requested days', async () => {
    const result = await adapter.getForecast('kasai', 1)
    expect(result).toHaveLength(1)
  })

  it('returns historical data within date range', async () => {
    const result = await adapter.getHistorical('kasai', '2026-03-10', '2026-03-10')
    expect(result).toHaveLength(1)
    expect(result[0].date).toBe('2026-03-10')
  })

  it('returns empty for unknown region', async () => {
    expect(await adapter.getForecast('unknown', 10)).toEqual([])
  })
})

// ---------------------------------------------------------------------------
// Market adapter
// ---------------------------------------------------------------------------

const marketData: MarketPrice[] = [
  { cropId: 'maize', marketId: 'lshi', marketName: 'Lubumbashi Central', date: '2026-03-09', pricePerKg: 0.45, currency: 'USD', source: 'stub' },
  { cropId: 'maize', marketId: 'lshi', marketName: 'Lubumbashi Central', date: '2026-03-10', pricePerKg: 0.48, currency: 'USD', source: 'stub' },
  { cropId: 'maize', marketId: 'kin', marketName: 'Kinshasa Market', date: '2026-03-10', pricePerKg: 0.52, currency: 'USD', source: 'stub' },
]

describe('createStubMarketAdapter', () => {
  const adapter = createStubMarketAdapter(marketData)

  it('returns latest price per market', async () => {
    const result = await adapter.getLatestPrices('maize')
    expect(result).toHaveLength(2)
    const lshi = result.find((r) => r.marketId === 'lshi')
    expect(lshi?.pricePerKg).toBe(0.48) // latest entry
  })

  it('returns empty for unknown crop', async () => {
    expect(await adapter.getLatestPrices('unknown')).toEqual([])
  })
})

// ---------------------------------------------------------------------------
// Mobile money adapter
// ---------------------------------------------------------------------------

describe('createStubMobileMoneyAdapter', () => {
  const adapter = createStubMobileMoneyAdapter()

  it('initiates a transfer and returns completed status', async () => {
    const result = await adapter.initiateTransfer({
      recipientPhone: '+243833333333',
      amountCents: 1000,
      currency: 'CDF',
      reference: 'test-ref-001',
    })
    expect(result.status).toBe('completed')
    expect(result.recipientPhone).toBe('+243833333333')
    expect(result.transactionId).toBeTruthy()
  })

  it('retrieves a transfer by id after initiation', async () => {
    const created = await adapter.initiateTransfer({
      recipientPhone: '+243811111111',
      amountCents: 5000,
      currency: 'CDF',
      reference: 'test-ref-002',
    })
    const result = await adapter.getTransferStatus(created.transactionId)
    expect(result.amountCents).toBe(5000)
  })

  it('throws for unknown transfer id', async () => {
    await expect(adapter.getTransferStatus('unknown')).rejects.toThrow()
  })
})

// ---------------------------------------------------------------------------
// SMS adapter
// ---------------------------------------------------------------------------

describe('createStubSmsAdapter', () => {
  const adapter = createStubSmsAdapter()

  it('sends an SMS and returns a message with delivered status', async () => {
    const result = await adapter.send('+243811111111', 'Hello')
    expect(result.messageId).toBeTruthy()
    expect(result.status).toBe('delivered')
    expect(result.recipientPhone).toBe('+243811111111')
  })
})
