import { describe, it, expect } from 'vitest'
import {
  ML_MODEL_KEYS,
  ML_DATASET_KEYS,
  type MlModelStatus,
  type MlRunStatus,
  type MlModelKey,
  type MlDatasetKey,
  type UEPriorityClass,
  type FeatureSpec,
} from './types'

describe('ML_MODEL_KEYS', () => {
  it('contains stripe daily iforest key', () => {
    expect(ML_MODEL_KEYS.STRIPE_DAILY_IFOREST_V1).toBe('stripe_anomaly_daily_iforest_v1')
  })

  it('contains stripe txn iforest key', () => {
    expect(ML_MODEL_KEYS.STRIPE_TXN_IFOREST_V1).toBe('stripe_anomaly_txn_iforest_v1')
  })

  it('contains UE case priority key', () => {
    expect(ML_MODEL_KEYS.UE_CASE_PRIORITY_V1).toBe('ue.case_priority_v1')
  })

  it('contains UE SLA breach risk key', () => {
    expect(ML_MODEL_KEYS.UE_SLA_BREACH_RISK_V1).toBe('ue.sla_breach_risk_v1')
  })

  it('has exactly 4 known model keys', () => {
    expect(Object.keys(ML_MODEL_KEYS)).toHaveLength(4)
  })
})

describe('ML_DATASET_KEYS', () => {
  it('contains stripe daily metrics key', () => {
    expect(ML_DATASET_KEYS.STRIPE_DAILY_METRICS_V1).toBe('stripe_daily_metrics_v1')
  })

  it('contains UE case priority dataset key', () => {
    expect(ML_DATASET_KEYS.UE_CASE_PRIORITY_DATASET_V1).toBe('ue_case_priority_dataset_v1')
  })

  it('contains UE case SLA dataset key', () => {
    expect(ML_DATASET_KEYS.UE_CASE_SLA_DATASET_V1).toBe('ue_case_sla_dataset_v1')
  })

  it('has exactly 4 dataset keys', () => {
    expect(Object.keys(ML_DATASET_KEYS)).toHaveLength(4)
  })
})

describe('type contracts', () => {
  it('MlModelStatus covers expected values', () => {
    const statuses: MlModelStatus[] = ['draft', 'active', 'retired']
    expect(statuses).toHaveLength(3)
  })

  it('MlRunStatus covers expected values', () => {
    const statuses: MlRunStatus[] = ['started', 'success', 'failed']
    expect(statuses).toHaveLength(3)
  })

  it('MlModelKey is assignable from constants', () => {
    const key: MlModelKey = ML_MODEL_KEYS.STRIPE_DAILY_IFOREST_V1
    expect(key).toBe('stripe_anomaly_daily_iforest_v1')
  })

  it('MlDatasetKey is assignable from constants', () => {
    const key: MlDatasetKey = ML_DATASET_KEYS.STRIPE_DAILY_METRICS_V1
    expect(key).toBe('stripe_daily_metrics_v1')
  })

  it('UEPriorityClass covers expected values', () => {
    const classes: UEPriorityClass[] = ['low', 'medium', 'high', 'critical']
    expect(classes).toHaveLength(4)
  })

  it('FeatureSpec has required shape', () => {
    const spec: FeatureSpec = {
      numericFeatures: ['a'],
      categoricalFeatures: ['b'],
      encodingMaps: { b: { x: 1 } },
      scalerParams: { a: { mean: 0, std: 1 } },
    }
    expect(spec.numericFeatures).toHaveLength(1)
    expect(spec.scalerParams.a).toEqual({ mean: 0, std: 1 })
  })
})
