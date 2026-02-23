/**
 * Exchange Rate Service
 * 
 * Manages currency exchange rates with support for:
 * - Bank of Canada (BOC) official rates
 * - Historical rate tracking
 * - Currency conversion calculations
 * - Rate caching and refresh management
 */

import { Decimal } from 'decimal.js';
import { db } from '@/db';
import { currencyExchangeRates } from '@/db/schema/domains/infrastructure';
import { eq, and, desc, lte, gte } from 'drizzle-orm';
import { logger } from '@/lib/logger';

export interface ExchangeRate {
  baseCurrency: string;
  targetCurrency: string;
  rate: Decimal;
  effectiveDate: Date;
  source: 'BOC' | 'manual' | 'import';
}

export interface ConversionResult {
  amount: Decimal;
  fromCurrency: string;
  toCurrency: string;
  rate: Decimal;
  convertedAmount: Decimal;
  effectiveDate: Date;
}

export interface RateHistoryEntry {
  date: Date;
  rate: Decimal;
  source: string;
}

/**
 * Exchange Rate Service
 * Handles currency conversions and exchange rate management
 */
export class ExchangeRateService {
  private static readonly BOC_API_URL = 'https://www.bankofcanada.ca/valet/observations';
  private static readonly BOC_SERIES_MAP: { [key: string]: string } = {
    'USD': 'FXUSDCAD',      // US Dollar to Canadian Dollar
    'EUR': 'FXEURCAD',      // Euro to Canadian Dollar
    'GBP': 'FXGBPCAD',      // British Pound to Canadian Dollar
    'JPY': 'FXJPYCAD',      // Japanese Yen to Canadian Dollar
    'AUD': 'FXAUDCAD',      // Australian Dollar to Canadian Dollar
    'CHF': 'FXCHFCAD',      // Swiss Franc to Canadian Dollar
    'CNY': 'FXCNYCAD',      // Chinese Yuan to Canadian Dollar
  };

  /**
   * Get the current exchange rate between two currencies
   */
  static async getRate(
    baseCurrency: string,
    targetCurrency: string,
    asOfDate: Date = new Date()
  ): Promise<ExchangeRate | null> {
    // If same currency, return 1:1
    if (baseCurrency === targetCurrency) {
      return {
        baseCurrency,
        targetCurrency,
        rate: new Decimal(1),
        effectiveDate: asOfDate,
        source: 'manual',
      };
    }

    // Query database for most recent rate on or before asOfDate
    const [rateRecord] = await db
      .select()
      .from(currencyExchangeRates)
      .where(
        and(
          eq(currencyExchangeRates.baseCurrency, baseCurrency),
          eq(currencyExchangeRates.targetCurrency, targetCurrency),
          lte(currencyExchangeRates.effectiveDate, asOfDate)
        )
      )
      .orderBy(desc(currencyExchangeRates.effectiveDate))
      .limit(1);

    if (!rateRecord) {
      logger.warn(`Exchange rate not found for ${baseCurrency}/${targetCurrency}`);
      return null;
    }

    return {
      baseCurrency: rateRecord.baseCurrency,
      targetCurrency: rateRecord.targetCurrency,
      rate: new Decimal(rateRecord.rate),
      effectiveDate: rateRecord.effectiveDate,
      source: (rateRecord.source as 'BOC' | 'manual' | 'import') || 'manual',
    };
  }

  /**
   * Convert an amount from one currency to another
   */
  static async convertAmount(
    amount: Decimal,
    fromCurrency: string,
    toCurrency: string,
    asOfDate: Date = new Date()
  ): Promise<ConversionResult> {
    const rate = await this.getRate(fromCurrency, toCurrency, asOfDate);

    if (!rate) {
      throw new Error(
        `Cannot convert ${fromCurrency} to ${toCurrency}: rate not available`
      );
    }

    return {
      amount,
      fromCurrency,
      toCurrency,
      rate: rate.rate,
      convertedAmount: amount.times(rate.rate),
      effectiveDate: rate.effectiveDate,
    };
  }

  /**
   * Save an exchange rate to the database
   */
  static async saveRate(
    organizationId: string,
    baseCurrency: string,
    targetCurrency: string,
    rate: Decimal,
    effectiveDate: Date,
    source: 'BOC' | 'manual' | 'import' = 'manual'
  ): Promise<ExchangeRate> {
    await db.insert(currencyExchangeRates).values({
      organizationId,
      baseCurrency,
      targetCurrency,
      rate: rate.toString(),
      effectiveDate,
      source,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return { baseCurrency, targetCurrency, rate, effectiveDate, source };
  }

  /**
   * Fetch latest rates from Bank of Canada
   */
  static async fetchBOCRates(organizationId: string): Promise<void> {
    try {
      logger.info('Fetching latest exchange rates from Bank of Canada');

      for (const [currencyCode, seriesId] of Object.entries(this.BOC_SERIES_MAP)) {
        try {
          const response = await fetch(
            `${this.BOC_API_URL}/${seriesId}/json?recent=1`,
            { timeout: 5000 }
          );

          if (!response.ok) {
            logger.warn(`Failed to fetch ${currencyCode} rate from BOC: ${response.statusText}`);
            continue;
          }

          const data = await response.json();
          const observations = data.observations || [];

          if (observations.length === 0) {
            logger.warn(`No observations found for ${currencyCode}`);
            continue;
          }

          const observation = observations[0];
          const fieldName = seriesId; // e.g., 'FXUSDCAD'
          
          if (observation[fieldName]?.v) {
            const rateValue = new Decimal(observation[fieldName].v);
            const effectiveDate = new Date(observation.d);

            // Save CAD → Foreign currency rate
            await this.saveRate(
              organizationId,
              'CAD',
              currencyCode,
              new Decimal(1).dividedBy(rateValue), // Inverse rate
              effectiveDate,
              'BOC'
            );

            // Save Foreign currency → CAD rate
            await this.saveRate(
              organizationId,
              currencyCode,
              'CAD',
              rateValue,
              effectiveDate,
              'BOC'
            );

            logger.info(`Updated ${currencyCode}/CAD rate: ${rateValue}`);
          }
        } catch (error) {
          logger.error(`Error fetching ${currencyCode} rate:`, error);
        }
      }
    } catch (error) {
      logger.error('Error fetching BOC rates:', error);
      throw error;
    }
  }

  /**
   * Get historical rates for a currency pair
   */
  static async getHistory(
    baseCurrency: string,
    targetCurrency: string,
    startDate: Date,
    endDate: Date
  ): Promise<RateHistoryEntry[]> {
    const records = await db
      .select()
      .from(currencyExchangeRates)
      .where(
        and(
          eq(currencyExchangeRates.baseCurrency, baseCurrency),
          eq(currencyExchangeRates.targetCurrency, targetCurrency),
          gte(currencyExchangeRates.effectiveDate, startDate),
          lte(currencyExchangeRates.effectiveDate, endDate)
        )
      )
      .orderBy(desc(currencyExchangeRates.effectiveDate));

    return records.map((r) => ({
      date: r.effectiveDate,
      rate: new Decimal(r.rate),
      source: r.source,
    }));
  }

  /**
   * Calculate average exchange rate over a period
   */
  static async getAverageRate(
    baseCurrency: string,
    targetCurrency: string,
    startDate: Date,
    endDate: Date
  ): Promise<Decimal | null> {
    const history = await this.getHistory(baseCurrency, targetCurrency, startDate, endDate);

    if (history.length === 0) return null;

    const sum = history.reduce((acc, entry) => acc.plus(entry.rate), new Decimal(0));
    return sum.dividedBy(history.length);
  }

  /**
   * Validate that both currencies are supported
   */
  static isSupportedCurrency(currency: string): boolean {
    const supportedCurrencies = ['CAD', 'USD', 'EUR', 'GBP', 'JPY', 'AUD', 'CHF', 'CNY'];
    return supportedCurrencies.includes(currency.toUpperCase());
  }

  /**
   * Get list of supported currencies
   */
  static getSupportedCurrencies(): string[] {
    return ['CAD', 'USD', 'EUR', 'GBP', 'JPY', 'AUD', 'CHF', 'CNY'];
  }
}
