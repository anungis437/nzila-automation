/**
 * @nzila/platform-environment — Type definitions
 *
 * Canonical types for the environment management system.
 *
 * @module @nzila/platform-environment/types
 */

// ── Environment Enums ───────────────────────────────────────────────────────

export type EnvironmentName = 'LOCAL' | 'PREVIEW' | 'STAGING' | 'PRODUCTION'

export const PROTECTED_ENVIRONMENTS: readonly EnvironmentName[] = ['STAGING', 'PRODUCTION'] as const

export const ALL_ENVIRONMENTS: readonly EnvironmentName[] = ['LOCAL', 'PREVIEW', 'STAGING', 'PRODUCTION'] as const

// ── Environment Configuration ───────────────────────────────────────────────

export interface EnvironmentConfig {
  readonly environment: EnvironmentName
  readonly service: string
  readonly deployment_region: string
  readonly observability_namespace: string
  readonly evidence_namespace: string
  readonly allow_ai_experimental: boolean
  readonly allow_debug_logging: boolean
  readonly protected_environment: boolean
}

// ── Deployment Artifact ─────────────────────────────────────────────────────

export interface DeploymentArtifact {
  readonly artifact_digest: string
  readonly sbom_hash: string
  readonly attestation_ref: string
  readonly commit_sha: string
  readonly built_at: string
  readonly source_workflow: string
}

// ── Environment Health ──────────────────────────────────────────────────────

export interface EnvironmentHealthCheck {
  readonly check: string
  readonly status: 'healthy' | 'degraded' | 'unhealthy'
  readonly detail: string
  readonly timestamp: string
}

export interface EnvironmentHealthReport {
  readonly environment: EnvironmentName
  readonly overall: 'healthy' | 'degraded' | 'unhealthy'
  readonly checks: readonly EnvironmentHealthCheck[]
  readonly timestamp: string
}

// ── Governance Snapshot ─────────────────────────────────────────────────────

export interface GovernanceSnapshot {
  readonly environment: EnvironmentName
  readonly commit: string
  readonly artifact_digest: string
  readonly sbom_hash: string
  readonly policy_engine_status: string
  readonly change_record_ref: string
  readonly timestamp: string
}

// ── Feature Flag ────────────────────────────────────────────────────────────

export interface FeatureFlag {
  readonly name: string
  readonly enabled: boolean
  readonly environments: readonly EnvironmentName[]
}

// ── Namespace Info ──────────────────────────────────────────────────────────

export interface EnvironmentNamespace {
  readonly database: string
  readonly storage: string
  readonly queue: string
  readonly observability: string
  readonly evidence: string
  readonly webhooks: string
}
