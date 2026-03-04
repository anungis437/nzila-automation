/**
 * @nzila/platform-procurement-proof — Collector Types
 *
 * Common types for real procurement pack collectors.
 * Every collector returns a typed result with status, source, and timing.
 *
 * @module @nzila/platform-procurement-proof/collectors/types
 */
import { z } from 'zod'

// ── Collector Status ────────────────────────────────────────────────────────

export type CollectorStatus = 'ok' | 'not_available'

// ── Base Collector Result ───────────────────────────────────────────────────

export interface CollectorResult<T> {
  readonly status: CollectorStatus
  readonly source: string
  readonly collectedAt: string
  readonly data: T | null
  readonly reason?: string
  readonly integrityHash?: string
}

// ── Evidence Pack Collector ─────────────────────────────────────────────────

export interface EvidencePackCollectorData {
  readonly packId: string
  readonly orgId: string
  readonly controlFamily: string
  readonly artifactCount: number
  readonly sealDigest: string | null
  readonly merkleRoot: string | null
  readonly createdAt: string
  readonly sealed: boolean
}

// ── Compliance Snapshot Collector ────────────────────────────────────────────

export interface ComplianceSnapshotCollectorData {
  readonly latestSnapshotId: string
  readonly latestSnapshotHash: string
  readonly previousHash: string | null
  readonly chainValid: boolean
  readonly chainLength: number
  readonly complianceScore: number
  readonly totalControls: number
  readonly compliantControls: number
  readonly collectedAt: string
}

// ── Dependency Posture Collector ────────────────────────────────────────────

export interface DependencyPostureCollectorData {
  readonly criticalCount: number
  readonly highCount: number
  readonly mediumCount: number
  readonly lowCount: number
  readonly totalDependencies: number
  readonly scanTimestamp: string
  readonly toolVersion: string
  readonly lockfileIntegrity: boolean
}

// ── Integrations Health Collector ───────────────────────────────────────────

export interface IntegrationsHealthCollectorData {
  readonly totalProviders: number
  readonly healthyProviders: number
  readonly degradedProviders: number
  readonly downProviders: number
  readonly dlqDepth: number
  readonly providers: readonly IntegrationProviderSummary[]
}

export interface IntegrationProviderSummary {
  readonly provider: string
  readonly status: string
  readonly circuitState: string
  readonly lastSuccessAt: string | null
  readonly failureCount: number
  readonly dlqCount: number
  readonly sevenDaySummary: {
    readonly attempts: number
    readonly successes: number
    readonly failures: number
  }
}

// ── Observability Summary Collector ─────────────────────────────────────────

export interface ObservabilitySummaryCollectorData {
  readonly errorCount24h: number | null
  readonly p95LatencyMs: number | null
  readonly queueDepth: number | null
  readonly healthStatus: string
  readonly healthChecks: readonly HealthCheckSummary[]
}

export interface HealthCheckSummary {
  readonly name: string
  readonly status: string
  readonly latencyMs: number
}

// ── Zod Schemas ─────────────────────────────────────────────────────────────

export const collectorResultSchema = z.object({
  status: z.enum(['ok', 'not_available']),
  source: z.string().min(1),
  collectedAt: z.string().datetime(),
  data: z.unknown().nullable(),
  reason: z.string().optional(),
  integrityHash: z.string().optional(),
})

export const evidencePackCollectorDataSchema = z.object({
  packId: z.string().min(1),
  orgId: z.string().min(1),
  controlFamily: z.string().min(1),
  artifactCount: z.number().int().nonnegative(),
  sealDigest: z.string().nullable(),
  merkleRoot: z.string().nullable(),
  createdAt: z.string().datetime(),
  sealed: z.boolean(),
})

export const complianceSnapshotCollectorDataSchema = z.object({
  latestSnapshotId: z.string().min(1),
  latestSnapshotHash: z.string().regex(/^[a-f0-9]{64}$/),
  previousHash: z.string().regex(/^[a-f0-9]{64}$/).nullable(),
  chainValid: z.boolean(),
  chainLength: z.number().int().nonnegative(),
  complianceScore: z.number().min(0).max(100),
  totalControls: z.number().int().nonnegative(),
  compliantControls: z.number().int().nonnegative(),
  collectedAt: z.string().datetime(),
})

export const dependencyPostureCollectorDataSchema = z.object({
  criticalCount: z.number().int().nonnegative(),
  highCount: z.number().int().nonnegative(),
  mediumCount: z.number().int().nonnegative(),
  lowCount: z.number().int().nonnegative(),
  totalDependencies: z.number().int().nonnegative(),
  scanTimestamp: z.string().datetime(),
  toolVersion: z.string().min(1),
  lockfileIntegrity: z.boolean(),
})

export const integrationProviderSummarySchema = z.object({
  provider: z.string().min(1),
  status: z.string(),
  circuitState: z.string(),
  lastSuccessAt: z.string().nullable(),
  failureCount: z.number().int().nonnegative(),
  dlqCount: z.number().int().nonnegative(),
  sevenDaySummary: z.object({
    attempts: z.number().int().nonnegative(),
    successes: z.number().int().nonnegative(),
    failures: z.number().int().nonnegative(),
  }),
})

export const integrationsHealthCollectorDataSchema = z.object({
  totalProviders: z.number().int().nonnegative(),
  healthyProviders: z.number().int().nonnegative(),
  degradedProviders: z.number().int().nonnegative(),
  downProviders: z.number().int().nonnegative(),
  dlqDepth: z.number().int().nonnegative(),
  providers: z.array(integrationProviderSummarySchema),
})

export const healthCheckSummarySchema = z.object({
  name: z.string().min(1),
  status: z.string(),
  latencyMs: z.number().nonnegative(),
})

export const observabilitySummaryCollectorDataSchema = z.object({
  errorCount24h: z.number().int().nonnegative().nullable(),
  p95LatencyMs: z.number().nonnegative().nullable(),
  queueDepth: z.number().int().nonnegative().nullable(),
  healthStatus: z.string(),
  healthChecks: z.array(healthCheckSummarySchema),
})
