/**
 * Nzila OS — Deployment Profile Validation
 *
 * Validates environment topology and requirements for each deployment profile.
 * Exposes the active deployment profile to Console and proof packs.
 *
 * Profiles:
 *   - managed:   Standard cloud deployment (Azure/Vercel)
 *   - sovereign: Self-hosted DB, strict egress controls, data residency
 *   - hybrid:    Mixed — managed compute with sovereign data tier
 *
 * @module @nzila/platform-deploy
 */
import { z } from 'zod'

// ── Profiles ────────────────────────────────────────────────────────────────

export const DEPLOYMENT_PROFILES = ['managed', 'sovereign', 'hybrid'] as const
export type DeploymentProfile = (typeof DEPLOYMENT_PROFILES)[number]

// ── Schemas ─────────────────────────────────────────────────────────────────

export const DeploymentProfileConfigSchema = z.object({
  profile: z.enum(DEPLOYMENT_PROFILES),
  environment: z.string().min(1),
  region: z.string().optional(),
  dataResidency: z.string().optional(),

  /** Database connection is self-hosted (sovereign/hybrid) */
  selfHostedDb: z.boolean().default(false),

  /** Egress allowlist enforced (sovereign mode) */
  egressAllowlistEnforced: z.boolean().default(false),

  /** Approved egress hosts (only used when egressAllowlistEnforced=true) */
  egressAllowlist: z.array(z.string()).default([]),

  /** Whether external integrations require explicit approval */
  integrationApprovalRequired: z.boolean().default(false),
})

export type DeploymentProfileConfig = z.infer<typeof DeploymentProfileConfigSchema>

// ── Validation Rules ────────────────────────────────────────────────────────

export interface ProfileValidation {
  check: string
  passed: boolean
  detail: string
  severity: 'critical' | 'warning' | 'info'
}

export interface ProfileValidationResult {
  profile: DeploymentProfile
  environment: string
  validations: ProfileValidation[]
  overallPassed: boolean
  timestamp: string
}

/**
 * Validate that the current environment meets the requirements for the
 * declared deployment profile.
 */
export function validateDeploymentProfile(
  config: DeploymentProfileConfig,
  env: Record<string, string | undefined> = process.env as Record<string, string | undefined>,
): ProfileValidationResult {
  const validations: ProfileValidation[] = []

  // Common checks
  validations.push({
    check: 'DATABASE_URL_SET',
    passed: !!env.DATABASE_URL,
    detail: 'DATABASE_URL environment variable must be set',
    severity: 'critical',
  })

  validations.push({
    check: 'NODE_ENV_SET',
    passed: !!env.NODE_ENV,
    detail: `NODE_ENV is "${env.NODE_ENV ?? 'unset'}"`,
    severity: 'warning',
  })

  // Profile-specific checks
  if (config.profile === 'sovereign' || config.profile === 'hybrid') {
    validations.push({
      check: 'SELF_HOSTED_DB',
      passed: config.selfHostedDb === true,
      detail: `Sovereign/hybrid profiles require selfHostedDb=true (got ${config.selfHostedDb})`,
      severity: config.profile === 'sovereign' ? 'critical' : 'warning',
    })

    validations.push({
      check: 'DATA_RESIDENCY_DECLARED',
      passed: !!config.dataResidency,
      detail: `Data residency: ${config.dataResidency ?? 'NOT DECLARED'}`,
      severity: 'warning',
    })
  }

  if (config.profile === 'sovereign') {
    validations.push({
      check: 'EGRESS_ALLOWLIST_ENFORCED',
      passed: config.egressAllowlistEnforced === true,
      detail: 'Sovereign profile requires egress allowlist enforcement',
      severity: 'critical',
    })

    validations.push({
      check: 'EGRESS_ALLOWLIST_NON_EMPTY',
      passed: config.egressAllowlist.length > 0,
      detail: `Egress allowlist has ${config.egressAllowlist.length} entries`,
      severity: 'critical',
    })

    validations.push({
      check: 'INTEGRATION_APPROVAL_REQUIRED',
      passed: config.integrationApprovalRequired === true,
      detail: 'Sovereign profile requires explicit integration approval',
      severity: 'critical',
    })
  }

  if (config.profile === 'managed') {
    // Managed deployments should NOT have egress restrictions
    validations.push({
      check: 'MANAGED_NO_EGRESS_LOCK',
      passed: !config.egressAllowlistEnforced,
      detail: 'Managed profiles should not enforce egress allowlists',
      severity: 'info',
    })
  }

  const overallPassed = validations.filter((v) => v.severity === 'critical').every((v) => v.passed)

  return {
    profile: config.profile,
    environment: config.environment,
    validations,
    overallPassed,
    timestamp: new Date().toISOString(),
  }
}

// ── Ports ────────────────────────────────────────────────────────────────────

export interface DeploymentProfilePorts {
  persistValidation(result: ProfileValidationResult): Promise<void>
  emitAudit(event: {
    action: string
    metadata: Record<string, unknown>
    timestamp: Date
  }): Promise<void>
}

/**
 * Validate and persist the deployment profile.
 * Emits an audit event on completion.
 */
export async function validateAndPersistProfile(
  config: DeploymentProfileConfig,
  ports: DeploymentProfilePorts,
): Promise<ProfileValidationResult> {
  const result = validateDeploymentProfile(config)

  await ports.persistValidation(result)
  await ports.emitAudit({
    action: 'deploy.profile.validated',
    metadata: {
      profile: result.profile,
      environment: result.environment,
      overallPassed: result.overallPassed,
      criticalFailures: result.validations
        .filter((v) => v.severity === 'critical' && !v.passed)
        .map((v) => v.check),
    },
    timestamp: new Date(),
  })

  return result
}

/**
 * Detect the active deployment profile from environment variables.
 */
export function detectDeploymentProfile(
  env: Record<string, string | undefined> = process.env as Record<string, string | undefined>,
): DeploymentProfile {
  const explicit = env.NZILA_DEPLOYMENT_PROFILE
  if (explicit && DEPLOYMENT_PROFILES.includes(explicit as DeploymentProfile)) {
    return explicit as DeploymentProfile
  }

  // Heuristics
  if (env.SOVEREIGN_MODE === 'true' || env.SELF_HOSTED_DB === 'true') {
    return 'sovereign'
  }
  if (env.HYBRID_MODE === 'true') {
    return 'hybrid'
  }

  return 'managed'
}

/**
 * Build a proof-pack section for the deployment profile.
 */
export function buildDeploymentProofSection(
  result: ProfileValidationResult,
): {
  section: 'deployment_profile'
  profile: DeploymentProfile
  environment: string
  overallPassed: boolean
  validations: ProfileValidation[]
  generatedAt: string
} {
  return {
    section: 'deployment_profile',
    profile: result.profile,
    environment: result.environment,
    overallPassed: result.overallPassed,
    validations: result.validations,
    generatedAt: result.timestamp,
  }
}
