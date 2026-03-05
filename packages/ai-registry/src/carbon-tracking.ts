/**
 * AI Carbon Emissions Tracking
 *
 * Estimates and records the carbon footprint of AI model inference.
 * Uses provider-published energy data and regional carbon intensity
 * factors to compute CO2-equivalent emissions per request.
 *
 * References:
 * - IEA regional electricity carbon intensity (gCO2/kWh)
 * - ML CO2 Impact methodology (Lacoste et al., 2019)
 * - NIST AI RMF sustainability considerations
 *
 * @module @nzila/ai-registry/carbon-tracking
 */

import { z } from 'zod';

// ── Schemas ─────────────────────────────────────────────────────────────────

export const CarbonRegionSchema = z.enum([
  'us-east', 'us-west', 'eu-west', 'eu-north',
  'africa-south', 'africa-central', 'asia-east', 'asia-south',
  'global-average',
]);

export type CarbonRegion = z.infer<typeof CarbonRegionSchema>;

/** gCO2 per kWh by region (IEA 2024 estimates) */
export const CARBON_INTENSITY_FACTORS: Record<CarbonRegion, number> = {
  'us-east':         390,
  'us-west':         210,
  'eu-west':         230,
  'eu-north':        50,
  'africa-south':    900,
  'africa-central':  450,
  'asia-east':       550,
  'asia-south':      700,
  'global-average':  475,
};

/** Estimated kWh per 1M tokens by model family */
export const MODEL_ENERGY_FACTORS: Record<string, number> = {
  'gpt-4':          4.2,
  'gpt-4o':         2.8,
  'gpt-4o-mini':    0.9,
  'gpt-3.5-turbo':  0.4,
  'claude-3-opus':  5.0,
  'claude-3-sonnet': 2.5,
  'claude-3-haiku': 0.6,
  'claude-3.5-sonnet': 3.0,
  'gemini-1.5-pro': 3.5,
  'gemini-1.5-flash': 1.2,
  'mistral-large':  2.0,
  'mistral-small':  0.5,
  'llama-3-70b':    3.8,
  'llama-3-8b':     0.35,
  'default':        2.0,
};

export const CarbonEstimateInputSchema = z.object({
  /** Model identifier */
  modelId: z.string().min(1),
  /** Model family for energy lookup (e.g. 'gpt-4o', 'claude-3-sonnet') */
  modelFamily: z.string().optional(),
  /** Total tokens (input + output) */
  totalTokens: z.number().int().nonnegative(),
  /** Input tokens */
  inputTokens: z.number().int().nonnegative().optional(),
  /** Output tokens */
  outputTokens: z.number().int().nonnegative().optional(),
  /** Region where inference ran */
  region: CarbonRegionSchema.default('global-average'),
  /** Override kWh per 1M tokens */
  energyPerMillionTokens: z.number().positive().optional(),
  /** Override gCO2/kWh */
  carbonIntensityOverride: z.number().positive().optional(),
  /** Org ID for attribution */
  orgId: z.string().optional(),
  /** Timestamp */
  timestamp: z.date().optional(),
});

export type CarbonEstimateInput = z.infer<typeof CarbonEstimateInputSchema>;

export const CarbonEstimateResultSchema = z.object({
  modelId: z.string(),
  totalTokens: z.number(),
  energyKwh: z.number(),
  carbonGrams: z.number(),
  carbonKg: z.number(),
  region: CarbonRegionSchema,
  carbonIntensity: z.number(),
  energyPerMillionTokens: z.number(),
  equivalents: z.object({
    /** Equivalent km driven in an average car */
    carKm: z.number(),
    /** Equivalent smartphone charges */
    phoneCharges: z.number(),
    /** Equivalent hours of LED bulb */
    ledHours: z.number(),
  }),
  timestamp: z.date(),
  orgId: z.string().optional(),
});

export type CarbonEstimateResult = z.infer<typeof CarbonEstimateResultSchema>;

// ── Core Computation ────────────────────────────────────────────────────────

/**
 * Estimate carbon emissions for a single AI inference call.
 *
 * Formula: CO2(g) = (tokens / 1M) × kWh_per_1M_tokens × gCO2_per_kWh
 */
export function estimateCarbon(input: CarbonEstimateInput): CarbonEstimateResult {
  const validated = CarbonEstimateInputSchema.parse(input);

  const energyFactor = validated.energyPerMillionTokens
    ?? MODEL_ENERGY_FACTORS[validated.modelFamily ?? 'default']
    ?? MODEL_ENERGY_FACTORS['default']!;

  const carbonIntensity = validated.carbonIntensityOverride
    ?? CARBON_INTENSITY_FACTORS[validated.region];

  const tokenMillions = validated.totalTokens / 1_000_000;
  const energyKwh = tokenMillions * energyFactor;
  const carbonGrams = energyKwh * carbonIntensity;
  const carbonKg = carbonGrams / 1000;

  return CarbonEstimateResultSchema.parse({
    modelId: validated.modelId,
    totalTokens: validated.totalTokens,
    energyKwh: round6(energyKwh),
    carbonGrams: round6(carbonGrams),
    carbonKg: round6(carbonKg),
    region: validated.region,
    carbonIntensity,
    energyPerMillionTokens: energyFactor,
    equivalents: {
      carKm: round6(carbonKg / 0.21),      // avg car: 210g CO2/km
      phoneCharges: round6(energyKwh / 0.012), // avg phone charge: 12Wh
      ledHours: round6(energyKwh / 0.01),   // 10W LED bulb
    },
    timestamp: validated.timestamp ?? new Date(),
    orgId: validated.orgId,
  });
}

function round6(n: number): number {
  return Math.round(n * 1_000_000) / 1_000_000;
}

// ── Aggregation ─────────────────────────────────────────────────────────────

export interface CarbonSummary {
  totalCarbonKg: number;
  totalEnergyKwh: number;
  totalTokens: number;
  requestCount: number;
  byModel: Record<string, { carbonKg: number; tokens: number; count: number }>;
  byRegion: Record<string, { carbonKg: number; tokens: number }>;
  period: { from: Date; to: Date };
}

/**
 * Aggregate multiple carbon estimates into a summary.
 * Useful for daily/weekly/monthly reports.
 */
export function aggregateCarbonEstimates(estimates: CarbonEstimateResult[]): CarbonSummary {
  const byModel: CarbonSummary['byModel'] = {};
  const byRegion: CarbonSummary['byRegion'] = {};
  let totalCarbonKg = 0;
  let totalEnergyKwh = 0;
  let totalTokens = 0;
  let minDate = new Date();
  let maxDate = new Date(0);

  for (const est of estimates) {
    totalCarbonKg += est.carbonKg;
    totalEnergyKwh += est.energyKwh;
    totalTokens += est.totalTokens;

    if (est.timestamp < minDate) minDate = est.timestamp;
    if (est.timestamp > maxDate) maxDate = est.timestamp;

    if (!byModel[est.modelId]) {
      byModel[est.modelId] = { carbonKg: 0, tokens: 0, count: 0 };
    }
    byModel[est.modelId]!.carbonKg += est.carbonKg;
    byModel[est.modelId]!.tokens += est.totalTokens;
    byModel[est.modelId]!.count++;

    if (!byRegion[est.region]) {
      byRegion[est.region] = { carbonKg: 0, tokens: 0 };
    }
    byRegion[est.region]!.carbonKg += est.carbonKg;
    byRegion[est.region]!.tokens += est.totalTokens;
  }

  return {
    totalCarbonKg: round6(totalCarbonKg),
    totalEnergyKwh: round6(totalEnergyKwh),
    totalTokens,
    requestCount: estimates.length,
    byModel,
    byRegion,
    period: { from: minDate, to: maxDate },
  };
}
