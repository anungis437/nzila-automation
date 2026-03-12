/**
 * @nzila/platform-environment — Zod schemas
 *
 * Runtime validation schemas for environment configuration.
 *
 * @module @nzila/platform-environment/schemas
 */
import { z } from 'zod'

export const environmentNameSchema = z.enum(['LOCAL', 'PREVIEW', 'STAGING', 'PRODUCTION'])

export const environmentConfigSchema = z.object({
  environment: environmentNameSchema,
  service: z.string().min(1),
  deployment_region: z.string().min(1),
  observability_namespace: z.string().min(1),
  evidence_namespace: z.string().min(1),
  allow_ai_experimental: z.boolean(),
  allow_debug_logging: z.boolean(),
  protected_environment: z.boolean(),
})

export const deploymentArtifactSchema = z.object({
  artifact_digest: z.string().min(1),
  sbom_hash: z.string().min(1),
  attestation_ref: z.string().min(1),
  commit_sha: z.string().min(1),
  built_at: z.string().refine((v) => !isNaN(Date.parse(v)), { message: 'Must be ISO timestamp' }),
  source_workflow: z.string().min(1),
})

export const environmentHealthCheckSchema = z.object({
  check: z.string().min(1),
  status: z.enum(['healthy', 'degraded', 'unhealthy']),
  detail: z.string(),
  timestamp: z.string(),
})

export const environmentHealthReportSchema = z.object({
  environment: environmentNameSchema,
  overall: z.enum(['healthy', 'degraded', 'unhealthy']),
  checks: z.array(environmentHealthCheckSchema),
  timestamp: z.string(),
})

export const governanceSnapshotSchema = z.object({
  environment: environmentNameSchema,
  commit: z.string().min(1),
  artifact_digest: z.string().min(1),
  sbom_hash: z.string().min(1),
  policy_engine_status: z.string().min(1),
  change_record_ref: z.string().min(1),
  timestamp: z.string(),
})

export const featureFlagSchema = z.object({
  name: z.string().min(1),
  enabled: z.boolean(),
  environments: z.array(environmentNameSchema),
})
