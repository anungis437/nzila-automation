/**
 * @nzila/platform-feature-flags — Types
 *
 * @module @nzila/platform-feature-flags/types
 */
import type { EnvironmentName } from '@nzila/platform-environment'

export interface FeatureFlag {
  readonly name: string
  readonly enabled: boolean
  readonly environments: readonly EnvironmentName[]
  readonly description?: string
}

export interface FeatureFlagEvaluation {
  readonly flag: string
  readonly enabled: boolean
  readonly environment: EnvironmentName
  readonly reason: 'flag_disabled' | 'environment_allowed' | 'environment_blocked'
}
