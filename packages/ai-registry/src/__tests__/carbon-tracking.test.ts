/**
 * AI Carbon Tracking — Tests
 */

import { describe, it, expect } from 'vitest';
import {
  estimateCarbon,
  aggregateCarbonEstimates,
  CARBON_INTENSITY_FACTORS,
  MODEL_ENERGY_FACTORS,
  type CarbonEstimateInput,
} from '../carbon-tracking.js';

describe('estimateCarbon', () => {
  it('estimates carbon for a known model family', () => {
    const result = estimateCarbon({
      modelId: 'my-model',
      modelFamily: 'gpt-4o',
      totalTokens: 1_000_000,
      region: 'us-east',
    });

    expect(result.totalTokens).toBe(1_000_000);
    expect(result.energyKwh).toBe(2.8); // gpt-4o factor
    expect(result.carbonGrams).toBe(2.8 * 390); // us-east intensity
    expect(result.carbonKg).toBeCloseTo(result.carbonGrams / 1000);
    expect(result.region).toBe('us-east');
  });

  it('uses default energy factor for unknown model family', () => {
    const result = estimateCarbon({
      modelId: 'custom-model',
      totalTokens: 500_000,
      region: 'global-average',
    });

    const expectedEnergy = 0.5 * MODEL_ENERGY_FACTORS['default']!;
    expect(result.energyKwh).toBeCloseTo(expectedEnergy);
  });

  it('respects energy override', () => {
    const result = estimateCarbon({
      modelId: 'test',
      totalTokens: 1_000_000,
      region: 'eu-north',
      energyPerMillionTokens: 10.0,
    });

    expect(result.energyKwh).toBe(10.0);
    expect(result.carbonGrams).toBe(10.0 * CARBON_INTENSITY_FACTORS['eu-north']!);
  });

  it('respects carbon intensity override', () => {
    const result = estimateCarbon({
      modelId: 'test',
      modelFamily: 'gpt-4o',
      totalTokens: 1_000_000,
      region: 'us-east',
      carbonIntensityOverride: 100,
    });

    expect(result.carbonIntensity).toBe(100);
    expect(result.carbonGrams).toBe(2.8 * 100);
  });

  it('computes car-km equivalents', () => {
    const result = estimateCarbon({
      modelId: 'test',
      modelFamily: 'gpt-4o',
      totalTokens: 1_000_000,
      region: 'us-east',
    });

    expect(result.equivalents.carKm).toBeGreaterThan(0);
    expect(result.equivalents.phoneCharges).toBeGreaterThan(0);
    expect(result.equivalents.ledHours).toBeGreaterThan(0);
  });

  it('handles zero tokens', () => {
    const result = estimateCarbon({
      modelId: 'test',
      totalTokens: 0,
      region: 'global-average',
    });

    expect(result.carbonGrams).toBe(0);
    expect(result.energyKwh).toBe(0);
  });
});

describe('aggregateCarbonEstimates', () => {
  it('aggregates multiple estimates', () => {
    const estimates = [
      estimateCarbon({ modelId: 'model-a', modelFamily: 'gpt-4o', totalTokens: 1_000_000, region: 'us-east' }),
      estimateCarbon({ modelId: 'model-a', modelFamily: 'gpt-4o', totalTokens: 500_000, region: 'us-east' }),
      estimateCarbon({ modelId: 'model-b', modelFamily: 'claude-3-haiku', totalTokens: 2_000_000, region: 'eu-north' }),
    ];

    const summary = aggregateCarbonEstimates(estimates);

    expect(summary.requestCount).toBe(3);
    expect(summary.totalTokens).toBe(3_500_000);
    expect(summary.totalCarbonKg).toBeGreaterThan(0);
    expect(Object.keys(summary.byModel)).toEqual(['model-a', 'model-b']);
    expect(summary.byModel['model-a']!.count).toBe(2);
    expect(Object.keys(summary.byRegion)).toEqual(['us-east', 'eu-north']);
  });

  it('handles empty array', () => {
    const summary = aggregateCarbonEstimates([]);
    expect(summary.requestCount).toBe(0);
    expect(summary.totalCarbonKg).toBe(0);
  });
});
