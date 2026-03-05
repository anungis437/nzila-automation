/**
 * AI Bias Detection Framework
 *
 * Provides automated fairness metrics and bias detection for AI models.
 * Implements statistical parity, equalized odds, and disparate impact
 * analysis aligned with NIST AI RMF MAP-3 (Bias Assessment).
 *
 * This module does NOT replace external tooling (SHAP, LIME, Fairlearn)
 * but provides a Nzila-native pipeline for:
 * - Collecting prediction outcomes by demographic group
 * - Computing fairness metrics
 * - Generating bias evidence packs
 * - Alerting on threshold violations
 *
 * @module @nzila/ai-registry/bias-detection
 */

import { z } from 'zod';

// ── Schemas ─────────────────────────────────────────────────────────────────

export const DemographicGroupSchema = z.object({
  /** Group name (e.g. 'age_18_25', 'region_kinshasa', 'gender_F') */
  groupName: z.string().min(1),
  /** Attribute used for grouping */
  attribute: z.string().min(1),
  /** Total samples in this group */
  sampleCount: z.number().int().nonnegative(),
  /** Positive outcome count */
  positiveCount: z.number().int().nonnegative(),
  /** Negative outcome count */
  negativeCount: z.number().int().nonnegative(),
  /** True positive count (if ground truth available) */
  truePositives: z.number().int().nonnegative().optional(),
  /** False positive count */
  falsePositives: z.number().int().nonnegative().optional(),
  /** True negative count */
  trueNegatives: z.number().int().nonnegative().optional(),
  /** False negative count */
  falseNegatives: z.number().int().nonnegative().optional(),
});

export type DemographicGroup = z.infer<typeof DemographicGroupSchema>;

export const BiasAssessmentInputSchema = z.object({
  /** Model ID from the registry */
  modelId: z.string().min(1),
  /** Model version */
  modelVersion: z.string().optional(),
  /** Protected attribute being assessed */
  protectedAttribute: z.string().min(1),
  /** Reference group (privileged group for comparison) */
  referenceGroup: z.string().min(1),
  /** All demographic groups */
  groups: z.array(DemographicGroupSchema).min(2),
  /** Assessment timestamp */
  assessedAt: z.string().datetime().optional(),
  /** Who initiated the assessment */
  assessedBy: z.string().optional(),
});

export type BiasAssessmentInput = z.infer<typeof BiasAssessmentInputSchema>;

// ── Fairness Metrics ────────────────────────────────────────────────────────

export interface FairnessMetric {
  metricName: string;
  description: string;
  value: number;
  /** Whether this metric passes the fairness threshold */
  passes: boolean;
  /** Threshold used for pass/fail */
  threshold: number;
  /** Direction: 'closer_to_1' means 1.0 is fair, 'closer_to_0' means 0 is fair */
  fairDirection: 'closer_to_1' | 'closer_to_0';
}

export interface GroupFairnessResult {
  groupName: string;
  selectionRate: number;
  truePositiveRate: number | null;
  falsePositiveRate: number | null;
}

export interface BiasAssessmentResult {
  modelId: string;
  modelVersion: string | undefined;
  protectedAttribute: string;
  referenceGroup: string;
  overallVerdict: 'PASS' | 'WARN' | 'FAIL';
  metrics: FairnessMetric[];
  groupResults: GroupFairnessResult[];
  recommendations: string[];
  assessedAt: string;
}

// ── Thresholds ──────────────────────────────────────────────────────────────

/** EEOC/legal standard: disparate impact ratio should be ≥ 0.8 (four-fifths rule) */
const DISPARATE_IMPACT_THRESHOLD = 0.8;

/** Statistical parity difference should be ≤ 0.1 */
const STATISTICAL_PARITY_THRESHOLD = 0.1;

/** Equalized odds difference should be ≤ 0.1 */
const EQUALIZED_ODDS_THRESHOLD = 0.1;

// ── Core Computation ────────────────────────────────────────────────────────

function selectionRate(group: DemographicGroup): number {
  if (group.sampleCount === 0) return 0;
  return group.positiveCount / group.sampleCount;
}

function truePositiveRate(group: DemographicGroup): number | null {
  if (group.truePositives === undefined || group.falseNegatives === undefined) return null;
  const total = group.truePositives + group.falseNegatives;
  if (total === 0) return null;
  return group.truePositives / total;
}

function falsePositiveRate(group: DemographicGroup): number | null {
  if (group.falsePositives === undefined || group.trueNegatives === undefined) return null;
  const total = group.falsePositives + group.trueNegatives;
  if (total === 0) return null;
  return group.falsePositives / total;
}

/**
 * Run a comprehensive bias assessment for a model.
 *
 * Computes:
 * 1. Disparate Impact Ratio (four-fifths rule)
 * 2. Statistical Parity Difference
 * 3. Equalized Odds Difference (if ground truth available)
 */
export function assessBias(input: BiasAssessmentInput): BiasAssessmentResult {
  const validated = BiasAssessmentInputSchema.parse(input);
  const refGroup = validated.groups.find(g => g.groupName === validated.referenceGroup);
  if (!refGroup) {
    throw new Error(`Reference group "${validated.referenceGroup}" not found in groups`);
  }

  const refSelectionRate = selectionRate(refGroup);
  const refTPR = truePositiveRate(refGroup);
  const refFPR = falsePositiveRate(refGroup);

  const metrics: FairnessMetric[] = [];
  const groupResults: GroupFairnessResult[] = [];
  const recommendations: string[] = [];

  let worstDisparateImpact = 1.0;
  let worstStatisticalParity = 0.0;
  let worstEqualizedOdds = 0.0;

  for (const group of validated.groups) {
    const sr = selectionRate(group);
    const tpr = truePositiveRate(group);
    const fpr = falsePositiveRate(group);

    groupResults.push({
      groupName: group.groupName,
      selectionRate: sr,
      truePositiveRate: tpr,
      falsePositiveRate: fpr,
    });

    if (group.groupName === validated.referenceGroup) continue;

    // Disparate Impact Ratio
    const diRatio = refSelectionRate > 0 ? sr / refSelectionRate : (sr === 0 ? 1 : 0);
    if (diRatio < worstDisparateImpact) worstDisparateImpact = diRatio;

    // Statistical Parity Difference
    const spDiff = Math.abs(sr - refSelectionRate);
    if (spDiff > worstStatisticalParity) worstStatisticalParity = spDiff;

    // Equalized Odds Difference
    if (tpr !== null && refTPR !== null) {
      const tprDiff = Math.abs(tpr - refTPR);
      if (tprDiff > worstEqualizedOdds) worstEqualizedOdds = tprDiff;
    }
    if (fpr !== null && refFPR !== null) {
      const fprDiff = Math.abs(fpr - refFPR);
      if (fprDiff > worstEqualizedOdds) worstEqualizedOdds = fprDiff;
    }
  }

  // Disparate Impact metric
  const diPasses = worstDisparateImpact >= DISPARATE_IMPACT_THRESHOLD;
  metrics.push({
    metricName: 'Disparate Impact Ratio',
    description: 'Ratio of selection rates between groups (four-fifths rule: ≥ 0.8)',
    value: Math.round(worstDisparateImpact * 1000) / 1000,
    passes: diPasses,
    threshold: DISPARATE_IMPACT_THRESHOLD,
    fairDirection: 'closer_to_1',
  });
  if (!diPasses) {
    recommendations.push(
      `Disparate Impact Ratio (${worstDisparateImpact.toFixed(3)}) is below the four-fifths threshold (${DISPARATE_IMPACT_THRESHOLD}). ` +
      'Review training data for representation gaps and consider resampling or reweighting.',
    );
  }

  // Statistical Parity metric
  const spPasses = worstStatisticalParity <= STATISTICAL_PARITY_THRESHOLD;
  metrics.push({
    metricName: 'Statistical Parity Difference',
    description: 'Maximum difference in selection rates between groups (target: ≤ 0.1)',
    value: Math.round(worstStatisticalParity * 1000) / 1000,
    passes: spPasses,
    threshold: STATISTICAL_PARITY_THRESHOLD,
    fairDirection: 'closer_to_0',
  });
  if (!spPasses) {
    recommendations.push(
      `Statistical Parity Difference (${worstStatisticalParity.toFixed(3)}) exceeds threshold. ` +
      'Investigate feature correlations with protected attributes.',
    );
  }

  // Equalized Odds (only if ground truth was provided)
  const hasGroundTruth = validated.groups.some(g => g.truePositives !== undefined);
  if (hasGroundTruth) {
    const eoPasses = worstEqualizedOdds <= EQUALIZED_ODDS_THRESHOLD;
    metrics.push({
      metricName: 'Equalized Odds Difference',
      description: 'Maximum TPR/FPR difference between groups (target: ≤ 0.1)',
      value: Math.round(worstEqualizedOdds * 1000) / 1000,
      passes: eoPasses,
      threshold: EQUALIZED_ODDS_THRESHOLD,
      fairDirection: 'closer_to_0',
    });
    if (!eoPasses) {
      recommendations.push(
        `Equalized Odds Difference (${worstEqualizedOdds.toFixed(3)}) exceeds threshold. ` +
        'Consider post-processing calibration or threshold adjustment per group.',
      );
    }
  }

  // Overall verdict
  const failCount = metrics.filter(m => !m.passes).length;
  let overallVerdict: 'PASS' | 'WARN' | 'FAIL';
  if (failCount === 0) {
    overallVerdict = 'PASS';
  } else if (failCount === 1 && metrics.length > 1) {
    overallVerdict = 'WARN';
    recommendations.push('One fairness metric failed — human review required before deployment.');
  } else {
    overallVerdict = 'FAIL';
    recommendations.push('Multiple fairness metrics failed — model deployment should be blocked pending bias remediation.');
  }

  if (recommendations.length === 0) {
    recommendations.push('All fairness metrics pass. Continue monitoring in production.');
  }

  return {
    modelId: validated.modelId,
    modelVersion: validated.modelVersion,
    protectedAttribute: validated.protectedAttribute,
    referenceGroup: validated.referenceGroup,
    overallVerdict,
    metrics,
    groupResults,
    recommendations,
    assessedAt: validated.assessedAt ?? new Date().toISOString(),
  };
}

/**
 * Generate a bias evidence artifact suitable for inclusion in an evidence pack.
 */
export function buildBiasEvidenceArtifact(result: BiasAssessmentResult): {
  type: 'ai_bias_assessment';
  modelId: string;
  verdict: string;
  metrics: FairnessMetric[];
  assessedAt: string;
} {
  return {
    type: 'ai_bias_assessment',
    modelId: result.modelId,
    verdict: result.overallVerdict,
    metrics: result.metrics,
    assessedAt: result.assessedAt,
  };
}
