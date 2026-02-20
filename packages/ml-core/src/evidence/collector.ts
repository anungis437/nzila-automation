/**
 * @nzila/ml-core — ML Evidence Pack Collector
 *
 * Collects ML model, dataset, and inference run references for inclusion
 * in evidence packs via generate-evidence-index.ts --include-ml.
 */
import { db } from '@nzila/db'
import {
  mlModels,
  mlDatasets,
  mlInferenceRuns,
  mlScoresStripeDaily,
  mlScoresStripeTxn,
  mlScoresUECasesPriority,
  mlScoresUESlaRisk,
} from '@nzila/db/schema'
import { eq, and, gte, lte, count } from 'drizzle-orm'

export interface MlDatasetRef {
  datasetId: string
  datasetKey: string
  periodStart: string
  periodEnd: string
  rowCount: number
  sha256: string
  documentId: string | null
}

export interface MlModelRef {
  modelId: string
  modelKey: string
  version: number
  status: string
  artifactDocumentId: string | null
  metricsDocumentId: string | null
}

export interface MlInferenceRef {
  runId: string
  modelId: string
  status: string
  inputPeriodStart: string
  inputPeriodEnd: string
  outputDocumentId: string | null
  summaryJson: Record<string, unknown>
}

export interface TopTxnAnomaly {
  occurredAt: string
  amount: string
  currency: string
  score: string
  stripePaymentIntentId: string | null
  stripeChargeId: string | null
}

// ── UE supervisor summaries ──────────────────────────────────────────────────

export interface UEPriorityClassCount {
  class: 'low' | 'medium' | 'high' | 'critical'
  count: number
}

export interface UEPrioritySummary {
  /** Total case-priority scores in the period (across all classes). */
  totalScored: number
  /** Distribution of predictedPriority values. */
  byClass: UEPriorityClassCount[]
}

export interface UESlaSummary {
  /** Total SLA-risk scores recorded in the period. */
  totalScored: number
  /** Cases where predictedBreach === true. */
  predictedBreachCount: number
}

export interface MlAnomalySummary {
  dailyAnomalies: number
  txnAnomalies: number
  topTxnAnomalies: TopTxnAnomaly[]
}

export interface MlEvidenceAppendix {
  schemaVersion: '1.0'
  entityId: string
  periodLabel: string
  collectedAt: string
  datasets: MlDatasetRef[]
  activeModels: MlModelRef[]
  inferenceRuns: MlInferenceRef[]
  anomalySummary: MlAnomalySummary
  /** UE case priority model summary for the period. Null if no scores exist. */
  uePrioritySummary: UEPrioritySummary | null
  /** UE SLA breach risk model summary for the period. Null if no scores exist. */
  ueSlaSummary: UESlaSummary | null
}

/**
 * Collect ML evidence for an entity in a given period.
 *
 * @param entityId  - Entity UUID
 * @param periodLabel - e.g., "2026-02"
 */
export async function collectMlEvidence(
  entityId: string,
  periodLabel: string,
): Promise<MlEvidenceAppendix> {
  const periodStart = `${periodLabel}-01`
  const periodEnd = new Date(
    new Date(periodStart).getFullYear(),
    new Date(periodStart).getMonth() + 1,
    0,
  )
    .toISOString()
    .slice(0, 10)

  const [datasets, models, inferenceRuns] = await Promise.all([
    // Datasets created during the period (any key)
    db
      .select()
      .from(mlDatasets)
      .where(
        and(
          eq(mlDatasets.entityId, entityId),
          gte(mlDatasets.periodStart, periodStart),
          lte(mlDatasets.periodEnd, periodEnd),
        ),
      ),

    // All active models for entity
    db
      .select()
      .from(mlModels)
      .where(and(eq(mlModels.entityId, entityId), eq(mlModels.status, 'active'))),

    // Inference runs that overlap the period
    db
      .select()
      .from(mlInferenceRuns)
      .where(
        and(
          eq(mlInferenceRuns.entityId, entityId),
          gte(mlInferenceRuns.inputPeriodStart, periodStart),
          lte(mlInferenceRuns.inputPeriodEnd, periodEnd),
        ),
      ),
  ])

  // ── UE ML summaries ──────────────────────────────────────────────────────
  const ueStart = new Date(periodStart)
  const ueEnd = new Date(periodEnd + 'T23:59:59Z')

  const [ueLoCount, ueMedCount, ueHighCount, ueCritCount, uePriorityTotal,
         ueSlaBreachCount, ueSlaTotal] = await Promise.all([
    db
      .select({ n: count() })
      .from(mlScoresUECasesPriority)
      .where(
        and(
          eq(mlScoresUECasesPriority.entityId, entityId),
          eq(mlScoresUECasesPriority.predictedPriority, 'low'),
          gte(mlScoresUECasesPriority.occurredAt, ueStart),
          lte(mlScoresUECasesPriority.occurredAt, ueEnd),
        ),
      )
      .then((r) => Number(r[0]?.n ?? 0)),

    db
      .select({ n: count() })
      .from(mlScoresUECasesPriority)
      .where(
        and(
          eq(mlScoresUECasesPriority.entityId, entityId),
          eq(mlScoresUECasesPriority.predictedPriority, 'medium'),
          gte(mlScoresUECasesPriority.occurredAt, ueStart),
          lte(mlScoresUECasesPriority.occurredAt, ueEnd),
        ),
      )
      .then((r) => Number(r[0]?.n ?? 0)),

    db
      .select({ n: count() })
      .from(mlScoresUECasesPriority)
      .where(
        and(
          eq(mlScoresUECasesPriority.entityId, entityId),
          eq(mlScoresUECasesPriority.predictedPriority, 'high'),
          gte(mlScoresUECasesPriority.occurredAt, ueStart),
          lte(mlScoresUECasesPriority.occurredAt, ueEnd),
        ),
      )
      .then((r) => Number(r[0]?.n ?? 0)),

    db
      .select({ n: count() })
      .from(mlScoresUECasesPriority)
      .where(
        and(
          eq(mlScoresUECasesPriority.entityId, entityId),
          eq(mlScoresUECasesPriority.predictedPriority, 'critical'),
          gte(mlScoresUECasesPriority.occurredAt, ueStart),
          lte(mlScoresUECasesPriority.occurredAt, ueEnd),
        ),
      )
      .then((r) => Number(r[0]?.n ?? 0)),

    db
      .select({ n: count() })
      .from(mlScoresUECasesPriority)
      .where(
        and(
          eq(mlScoresUECasesPriority.entityId, entityId),
          gte(mlScoresUECasesPriority.occurredAt, ueStart),
          lte(mlScoresUECasesPriority.occurredAt, ueEnd),
        ),
      )
      .then((r) => Number(r[0]?.n ?? 0)),

    db
      .select({ n: count() })
      .from(mlScoresUESlaRisk)
      .where(
        and(
          eq(mlScoresUESlaRisk.entityId, entityId),
          eq(mlScoresUESlaRisk.predictedBreach, true),
          gte(mlScoresUESlaRisk.occurredAt, ueStart),
          lte(mlScoresUESlaRisk.occurredAt, ueEnd),
        ),
      )
      .then((r) => Number(r[0]?.n ?? 0)),

    db
      .select({ n: count() })
      .from(mlScoresUESlaRisk)
      .where(
        and(
          eq(mlScoresUESlaRisk.entityId, entityId),
          gte(mlScoresUESlaRisk.occurredAt, ueStart),
          lte(mlScoresUESlaRisk.occurredAt, ueEnd),
        ),
      )
      .then((r) => Number(r[0]?.n ?? 0)),
  ])

  const uePrioritySummary: UEPrioritySummary | null = uePriorityTotal > 0
    ? {
        totalScored: uePriorityTotal,
        byClass: [
          { class: 'low', count: ueLoCount },
          { class: 'medium', count: ueMedCount },
          { class: 'high', count: ueHighCount },
          { class: 'critical', count: ueCritCount },
        ],
      }
    : null

  const ueSlaSummary: UESlaSummary | null = ueSlaTotal > 0
    ? { totalScored: ueSlaTotal, predictedBreachCount: ueSlaBreachCount }
    : null

  // Anomaly counts
  const [dailyCount, txnCount] = await Promise.all([
    db
      .select({ n: count() })
      .from(mlScoresStripeDaily)
      .where(
        and(
          eq(mlScoresStripeDaily.entityId, entityId),
          eq(mlScoresStripeDaily.isAnomaly, true),
          gte(mlScoresStripeDaily.date, periodStart),
          lte(mlScoresStripeDaily.date, periodEnd),
        ),
      )
      .then((r) => Number(r[0]?.n ?? 0)),

    db
      .select({ n: count() })
      .from(mlScoresStripeTxn)
      .where(
        and(
          eq(mlScoresStripeTxn.entityId, entityId),
          eq(mlScoresStripeTxn.isAnomaly, true),
          gte(mlScoresStripeTxn.occurredAt, new Date(periodStart)),
          lte(mlScoresStripeTxn.occurredAt, new Date(periodEnd + 'T23:59:59Z')),
        ),
      )
      .then((r) => Number(r[0]?.n ?? 0)),
  ])

  // Top 5 transaction anomalies (by score desc) — identifiers only (no PII)
  const topTxnRows = await db
    .select({
      occurredAt: mlScoresStripeTxn.occurredAt,
      amount: mlScoresStripeTxn.amount,
      currency: mlScoresStripeTxn.currency,
      score: mlScoresStripeTxn.score,
      stripePaymentIntentId: mlScoresStripeTxn.stripePaymentIntentId,
      stripeChargeId: mlScoresStripeTxn.stripeChargeId,
    })
    .from(mlScoresStripeTxn)
    .where(
      and(
        eq(mlScoresStripeTxn.entityId, entityId),
        eq(mlScoresStripeTxn.isAnomaly, true),
        gte(mlScoresStripeTxn.occurredAt, new Date(periodStart)),
        lte(mlScoresStripeTxn.occurredAt, new Date(periodEnd + 'T23:59:59Z')),
      ),
    )
    .orderBy(mlScoresStripeTxn.score)
    .limit(5)

  return {
    schemaVersion: '1.0',
    entityId,
    periodLabel,
    collectedAt: new Date().toISOString(),
    datasets: datasets.map((d) => ({
      datasetId: d.id,
      datasetKey: d.datasetKey,
      periodStart: d.periodStart,
      periodEnd: d.periodEnd,
      rowCount: d.rowCount,
      sha256: d.sha256,
      documentId: d.snapshotDocumentId,
    })),
    activeModels: models.map((m) => ({
      modelId: m.id,
      modelKey: m.modelKey,
      version: m.version,
      status: m.status,
      artifactDocumentId: m.artifactDocumentId,
      metricsDocumentId: m.metricsDocumentId,
    })),
    inferenceRuns: inferenceRuns.map((r) => ({
      runId: r.id,
      modelId: r.modelId,
      status: r.status,
      inputPeriodStart: r.inputPeriodStart,
      inputPeriodEnd: r.inputPeriodEnd,
      outputDocumentId: r.outputDocumentId,
      summaryJson: (r.summaryJson as Record<string, unknown>) ?? {},
    })),
    anomalySummary: {
      dailyAnomalies: dailyCount,
      txnAnomalies: txnCount,
      topTxnAnomalies: topTxnRows.map((t) => ({
        occurredAt: t.occurredAt.toISOString(),
        amount: String(t.amount),
        currency: t.currency,
        score: String(t.score),
        stripePaymentIntentId: t.stripePaymentIntentId,
        stripeChargeId: t.stripeChargeId,
      })),
    },
    uePrioritySummary,
    ueSlaSummary,
  }
}
