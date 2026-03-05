/**
 * @nzila/ai-registry — Unified AI/ML Model Registry
 *
 * Provides:
 * - Standardized Model Cards (extending Union Eyes pattern platform-wide)
 * - NIST AI RMF risk classification
 * - Governance lifecycle (draft → review → approved → deployed → retired)
 * - Unified registry across LLM (ai-core) and ML (ml-core) systems
 */

export {
  ModelCardSchema,
  createModelCard,
  type ModelCard,
  type ModelLimitation,
  type SafetyMeasure,
  type GovernanceInfo,
} from './model-card.js';

export {
  classifyRisk,
  RiskClassificationSchema,
  type RiskClassification,
  type RiskFactor,
  type RiskLevel,
  RISK_THRESHOLDS,
} from './risk-classification.js';

export {
  GovernanceLifecycle,
  GovernanceEventSchema,
  type GovernanceState,
  type GovernanceEvent,
  type GovernanceTransition,
} from './governance-lifecycle.js';

export {
  evaluateNistRmf,
  NIST_AI_RMF_FUNCTIONS,
  type NistRmfAssessment,
  type NistRmfFunction,
  type NistRmfCategory,
} from './nist-rmf.js';
