/**
 * @nzila/platform-policy-engine — Policy Loader
 *
 * Loads and validates governance policy YAML files against Zod schemas.
 *
 * @module @nzila/platform-policy-engine/loader
 */
import { parse as parseYaml } from 'yaml'
import { createLogger } from '@nzila/os-core/telemetry'
import {
  policyFileSchema,
  type PolicyDefinition,
  type PolicyEnginePorts,
  type PolicyFile,
} from './types'

const logger = createLogger('policy-loader')

/**
 * Load and validate all policy files from the configured directory.
 */
export async function loadPolicies(
  ports: PolicyEnginePorts,
): Promise<readonly PolicyDefinition[]> {
  const files = await ports.listPolicyFiles()
  const allPolicies: PolicyDefinition[] = []

  for (const filePath of files) {
    try {
      const raw = await ports.loadPolicyFile(filePath)
      const parsed = parseYaml(raw) as unknown
      const validated = policyFileSchema.parse(parsed) as PolicyFile

      for (const policy of validated.policies) {
        if (policy.enabled) {
          allPolicies.push(policy)
        } else {
          logger.info('Skipping disabled policy', { policyId: policy.id, file: filePath })
        }
      }

      logger.info('Loaded policy file', {
        file: filePath,
        policyCount: validated.policies.length,
      })
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      logger.error('Failed to load policy file', { file: filePath, error: msg })
      throw new Error(`Invalid policy file '${filePath}': ${msg}`)
    }
  }

  logger.info('All policies loaded', { total: allPolicies.length })
  return allPolicies
}

/**
 * Load a single policy by ID from all available policy files.
 */
export async function loadPolicyById(
  policyId: string,
  ports: PolicyEnginePorts,
): Promise<PolicyDefinition | null> {
  const policies = await loadPolicies(ports)
  return policies.find((p) => p.id === policyId) ?? null
}
