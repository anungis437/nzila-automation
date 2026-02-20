/**
 * @nzila/ml-core — Shared ML types
 *
 * All ML subsystem types. Never import from packages/db schema directly in apps;
 * use @nzila/ml-sdk instead.
 */

// ── Model status ─────────────────────────────────────────────────────────────

export type MlModelStatus = 'draft' | 'active' | 'retired'
export type MlRunStatus = 'started' | 'success' | 'failed'

// ── Known model keys ─────────────────────────────────────────────────────────

export const ML_MODEL_KEYS = {
  STRIPE_DAILY_IFOREST_V1: 'stripe_anomaly_daily_iforest_v1',
  STRIPE_TXN_IFOREST_V1: 'stripe_anomaly_txn_iforest_v1',
  UE_CASE_PRIORITY_V1: 'ue.case_priority_v1',
  UE_SLA_BREACH_RISK_V1: 'ue.sla_breach_risk_v1',
} as const

export type MlModelKey = (typeof ML_MODEL_KEYS)[keyof typeof ML_MODEL_KEYS]

// ── Dataset keys ─────────────────────────────────────────────────────────────

export const ML_DATASET_KEYS = {
  STRIPE_DAILY_METRICS_V1: 'stripe_daily_metrics_v1',
  STRIPE_TXN_FEATURES_V1: 'stripe_txn_features_v1',
  UE_CASE_PRIORITY_DATASET_V1: 'ue_case_priority_dataset_v1',
  UE_CASE_SLA_DATASET_V1: 'ue_case_sla_dataset_v1',
} as const

export type MlDatasetKey = (typeof ML_DATASET_KEYS)[keyof typeof ML_DATASET_KEYS]

// ── Feature specs ────────────────────────────────────────────────────────────

export interface FeatureSpec {
  numericFeatures: string[]
  categoricalFeatures: string[]
  /** Encoding maps: feature → { value → encoded_int } */
  encodingMaps: Record<string, Record<string, number>>
  /** Scaler params: feature → { mean, std } */
  scalerParams: Record<string, { mean: number; std: number }>
}

// ── API response shapes (consumed by ml-sdk) ─────────────────────────────────

export interface MlModel {
  id: string
  entityId: string
  modelKey: string
  algorithm: string
  version: number
  status: MlModelStatus
  trainingDatasetId: string | null
  artifactDocumentId: string | null
  metricsDocumentId: string | null
  hyperparamsJson: Record<string, unknown>
  featureSpecJson: FeatureSpec | null
  approvedBy: string | null
  approvedAt: string | null
  createdAt: string
  updatedAt: string
}

export interface MlTrainingRun {
  id: string
  entityId: string
  modelKey: string
  datasetId: string
  status: MlRunStatus
  startedAt: string
  finishedAt: string | null
  error: string | null
  createdAt: string
}

export interface MlInferenceRun {
  id: string
  entityId: string
  modelId: string
  status: MlRunStatus
  startedAt: string
  finishedAt: string | null
  inputPeriodStart: string
  inputPeriodEnd: string
  summaryJson: Record<string, unknown>
  error: string | null
  createdAt: string
}

export interface MlScoreStripeDaily {
  id: string
  entityId: string
  date: string
  featuresJson: Record<string, unknown>
  score: string
  isAnomaly: boolean
  threshold: string
  modelId: string
  inferenceRunId: string | null
  createdAt: string
}

// ── UE ML score types ─────────────────────────────────────────────────────────

/** Priority class values for ue.case_priority_v1 */
export type UEPriorityClass = 'low' | 'medium' | 'high' | 'critical'

export interface MlScoreUECasePriority {
  id: string
  entityId: string
  caseId: string
  occurredAt: string
  /** Calibrated confidence for predictedPriority — range 0..1 */
  score: string
  predictedPriority: UEPriorityClass
  /** Snapshot ground-truth label (nullable until eval) */
  actualPriority: UEPriorityClass | null
  featuresJson: Record<string, unknown>
  modelId: string
  inferenceRunId: string | null
  createdAt: string
}

export interface MlScoreUESlaRisk {
  id: string
  entityId: string
  caseId: string
  occurredAt: string
  /** P(SLA breach) — range 0..1 */
  probability: string
  predictedBreach: boolean
  /** Actual breach outcome (nullable until case resolved) */
  actualBreach: boolean | null
  featuresJson: Record<string, unknown>
  modelId: string
  inferenceRunId: string | null
  createdAt: string
}
export interface MlScoreStripeTxn {
  id: string
  entityId: string
  stripeEventId: string | null
  stripeChargeId: string | null
  stripePaymentIntentId: string | null
  stripeBalanceTxnId: string | null
  occurredAt: string
  currency: string
  amount: string
  featuresJson: Record<string, unknown>
  score: string
  isAnomaly: boolean
  threshold: string
  modelId: string
  inferenceRunId: string | null
  createdAt: string
}
