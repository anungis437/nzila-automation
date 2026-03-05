/**
 * Resilience Testing Framework
 *
 * Programmatic chaos experiments for Nzila OS.
 * Runs fault injection locally or in CI to validate resilience patterns.
 */

export { ChaosExperiment, type ExperimentConfig, type ExperimentResult } from './experiment.js';
export { FaultInjector, type FaultType } from './injector.js';
export {
  NZILA_EXPERIMENTS,
  type NzilaExperiment,
} from './experiments.js';
