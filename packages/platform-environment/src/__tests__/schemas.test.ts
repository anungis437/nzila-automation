import { describe, it, expect } from 'vitest'
import {
  environmentNameSchema,
  environmentConfigSchema,
  deploymentArtifactSchema,
  governanceSnapshotSchema,
  featureFlagSchema,
} from '../schemas'

describe('environmentNameSchema', () => {
  it('accepts valid names', () => {
    expect(environmentNameSchema.parse('LOCAL')).toBe('LOCAL')
    expect(environmentNameSchema.parse('PREVIEW')).toBe('PREVIEW')
    expect(environmentNameSchema.parse('STAGING')).toBe('STAGING')
    expect(environmentNameSchema.parse('PRODUCTION')).toBe('PRODUCTION')
  })

  it('rejects invalid names', () => {
    expect(() => environmentNameSchema.parse('DEV')).toThrow()
  })
})

describe('environmentConfigSchema', () => {
  it('validates a full config', () => {
    const config = {
      environment: 'STAGING',
      service: 'web',
      deployment_region: 'eastus',
      observability_namespace: 'nzila.staging',
      evidence_namespace: 'nzila-staging-evidence',
      allow_ai_experimental: true,
      allow_debug_logging: true,
      protected_environment: true,
    }
    expect(environmentConfigSchema.parse(config)).toEqual(config)
  })
})

describe('deploymentArtifactSchema', () => {
  it('validates an artifact', () => {
    const artifact = {
      artifact_digest: 'sha256:abc',
      sbom_hash: 'sha256:def',
      attestation_ref: 'sigstore://ref',
      commit_sha: 'abc1234',
      built_at: '2025-01-01T00:00:00Z',
      source_workflow: 'deploy-staging',
    }
    expect(deploymentArtifactSchema.parse(artifact)).toEqual(artifact)
  })
})

describe('governanceSnapshotSchema', () => {
  it('validates a snapshot', () => {
    const snapshot = {
      environment: 'PRODUCTION',
      commit: 'abc1234',
      artifact_digest: 'sha256:abc',
      sbom_hash: 'sha256:def',
      policy_engine_status: 'pass',
      change_record_ref: 'CHG-001',
      timestamp: '2025-01-01T00:00:00Z',
    }
    expect(governanceSnapshotSchema.parse(snapshot)).toEqual(snapshot)
  })
})

describe('featureFlagSchema', () => {
  it('validates a flag', () => {
    const flag = {
      name: 'test_flag',
      enabled: true,
      environments: ['LOCAL', 'STAGING'],
    }
    expect(featureFlagSchema.parse(flag)).toEqual(flag)
  })
})
