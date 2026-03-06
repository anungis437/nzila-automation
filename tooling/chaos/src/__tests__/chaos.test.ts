import { describe, it, expect } from 'vitest';
import { ChaosExperiment, type ExperimentConfig } from '../experiment.js';
import { NZILA_EXPERIMENTS } from '../experiments.js';

describe('ChaosExperiment', () => {
  const baseConfig: ExperimentConfig = {
    name: 'test-experiment',
    description: 'Unit test experiment',
    category: 'availability',
    targetService: 'test-service',
    faultType: 'network-delay',
    faultParams: {},
    durationMs: 50,
    steadyStateTimeout: 200,
    rollbackOnFailure: true,
  };

  it('fails when no fault injection is configured', async () => {
    const experiment = new ChaosExperiment(baseConfig);
    const result = await experiment.run();
    expect(result.status).toBe('error');
    expect(result.details).toContain('No fault injection configured');
  });

  it('passes when fault is injected and steady state recovers', async () => {
    const experiment = new ChaosExperiment(baseConfig);
    experiment.setFaultInjection(
      async () => {},
      async () => {},
    );
    experiment.addPostCheck(async () => true);
    const result = await experiment.run();
    expect(result.status).toBe('passed');
    expect(result.steadyStateRecovered).toBe(true);
  });

  it('fails when pre-condition check fails', async () => {
    const experiment = new ChaosExperiment(baseConfig);
    experiment.addPreCheck(async () => false);
    experiment.setFaultInjection(
      async () => {},
      async () => {},
    );
    const result = await experiment.run();
    expect(result.status).toBe('failed');
    expect(result.details).toContain('Pre-condition');
  });
});

describe('NZILA_EXPERIMENTS', () => {
  it('exports a non-empty array of experiments', () => {
    expect(Array.isArray(NZILA_EXPERIMENTS)).toBe(true);
    expect(NZILA_EXPERIMENTS.length).toBeGreaterThan(0);
  });

  it('each experiment has required fields', () => {
    for (const exp of NZILA_EXPERIMENTS) {
      expect(exp.config.name).toBeTruthy();
      expect(exp.category).toBeTruthy();
      expect(exp.config.targetService).toBeTruthy();
      expect(exp.description).toBeTruthy();
      expect(exp.frequency).toBeTruthy();
    }
  });
});
