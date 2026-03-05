/**
 * AI Bias Detection — Tests
 */

import { describe, it, expect } from 'vitest';
import { assessBias, buildBiasEvidenceArtifact, type BiasAssessmentInput } from '../bias-detection.js';

const FAIR_INPUT: BiasAssessmentInput = {
  modelId: 'loan-classifier-v2',
  modelVersion: '2.1.0',
  protectedAttribute: 'gender',
  referenceGroup: 'male',
  groups: [
    { groupName: 'male', attribute: 'gender', sampleCount: 1000, positiveCount: 600, negativeCount: 400 },
    { groupName: 'female', attribute: 'gender', sampleCount: 1000, positiveCount: 560, negativeCount: 440 },
  ],
};

const BIASED_INPUT: BiasAssessmentInput = {
  modelId: 'hiring-classifier-v1',
  protectedAttribute: 'ethnicity',
  referenceGroup: 'group_a',
  groups: [
    { groupName: 'group_a', attribute: 'ethnicity', sampleCount: 1000, positiveCount: 800, negativeCount: 200 },
    { groupName: 'group_b', attribute: 'ethnicity', sampleCount: 1000, positiveCount: 300, negativeCount: 700 },
  ],
};

const INPUT_WITH_GROUND_TRUTH: BiasAssessmentInput = {
  modelId: 'risk-scorer-v3',
  protectedAttribute: 'region',
  referenceGroup: 'urban',
  groups: [
    {
      groupName: 'urban', attribute: 'region', sampleCount: 500, positiveCount: 250, negativeCount: 250,
      truePositives: 200, falsePositives: 50, trueNegatives: 200, falseNegatives: 50,
    },
    {
      groupName: 'rural', attribute: 'region', sampleCount: 500, positiveCount: 200, negativeCount: 300,
      truePositives: 120, falsePositives: 80, trueNegatives: 220, falseNegatives: 80,
    },
  ],
};

describe('assessBias', () => {
  it('returns PASS for a fair model', () => {
    const result = assessBias(FAIR_INPUT);
    expect(result.overallVerdict).toBe('PASS');
    expect(result.modelId).toBe('loan-classifier-v2');
    expect(result.metrics.length).toBeGreaterThanOrEqual(2);
    expect(result.metrics.every(m => m.passes)).toBe(true);
  });

  it('returns FAIL for a biased model', () => {
    const result = assessBias(BIASED_INPUT);
    expect(result.overallVerdict).toBe('FAIL');
    expect(result.recommendations.length).toBeGreaterThan(0);

    const diMetric = result.metrics.find(m => m.metricName === 'Disparate Impact Ratio');
    expect(diMetric).toBeDefined();
    expect(diMetric!.passes).toBe(false);
    expect(diMetric!.value).toBeLessThan(0.8);
  });

  it('computes equalized odds when ground truth is available', () => {
    const result = assessBias(INPUT_WITH_GROUND_TRUTH);
    const eoMetric = result.metrics.find(m => m.metricName === 'Equalized Odds Difference');
    expect(eoMetric).toBeDefined();
    expect(typeof eoMetric!.value).toBe('number');
  });

  it('does not compute equalized odds without ground truth', () => {
    const result = assessBias(FAIR_INPUT);
    const eoMetric = result.metrics.find(m => m.metricName === 'Equalized Odds Difference');
    expect(eoMetric).toBeUndefined();
  });

  it('throws when reference group is missing', () => {
    expect(() =>
      assessBias({ ...FAIR_INPUT, referenceGroup: 'nonexistent' }),
    ).toThrow('Reference group "nonexistent" not found');
  });

  it('includes group selection rates in results', () => {
    const result = assessBias(FAIR_INPUT);
    expect(result.groupResults).toHaveLength(2);
    expect(result.groupResults[0]!.selectionRate).toBe(0.6);
  });
});

describe('buildBiasEvidenceArtifact', () => {
  it('builds an evidence artifact from assessment result', () => {
    const result = assessBias(FAIR_INPUT);
    const artifact = buildBiasEvidenceArtifact(result);
    expect(artifact.type).toBe('ai_bias_assessment');
    expect(artifact.modelId).toBe('loan-classifier-v2');
    expect(artifact.verdict).toBe('PASS');
    expect(artifact.metrics.length).toBeGreaterThan(0);
  });
});
