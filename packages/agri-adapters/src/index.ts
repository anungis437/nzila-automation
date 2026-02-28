// ---------------------------------------------------------------------------
// @nzila/agri-adapters — barrel export
// ---------------------------------------------------------------------------

export type { WeatherForecast, WeatherAdapter } from './weather'
export { createStubWeatherAdapter } from './weather'

export type { MarketPrice, MarketAdapter } from './market'
export { createStubMarketAdapter } from './market'

export type { MobileMoneyTransfer, MobileMoneyAdapter } from './mobile-money'
export { createStubMobileMoneyAdapter } from './mobile-money'

export type { SmsMessage, SmsAdapter } from './sms'
export { createStubSmsAdapter } from './sms'
