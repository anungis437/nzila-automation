import { describe, it, expect } from 'vitest'
import {
  validateDeploymentProfile,
  detectDeploymentProfile,
  buildDeploymentProofSection,
  DeploymentProfileConfigSchema,
} from './deploy-profile.js'

describe('DeploymentProfile validation', () => {
  it('managed profile passes with DATABASE_URL set', () => {
    const config = DeploymentProfileConfigSchema.parse({
      profile: 'managed',
      environment: 'production',
    })
    const result = validateDeploymentProfile(config, {
      DATABASE_URL: 'postgres://localhost:5432/nzila',
      NODE_ENV: 'production',
    })
    expect(result.overallPassed).toBe(true)
    expect(result.profile).toBe('managed')
  })

  it('managed profile fails without DATABASE_URL', () => {
    const config = DeploymentProfileConfigSchema.parse({
      profile: 'managed',
      environment: 'production',
    })
    const result = validateDeploymentProfile(config, { NODE_ENV: 'production' })
    expect(result.overallPassed).toBe(false)
    const dbCheck = result.validations.find((v) => v.check === 'DATABASE_URL_SET')
    expect(dbCheck?.passed).toBe(false)
    expect(dbCheck?.severity).toBe('critical')
  })

  it('sovereign profile requires selfHostedDb + egress + integration approval', () => {
    const config = DeploymentProfileConfigSchema.parse({
      profile: 'sovereign',
      environment: 'production',
      selfHostedDb: false,
      egressAllowlistEnforced: false,
      egressAllowlist: [],
      integrationApprovalRequired: false,
    })
    const result = validateDeploymentProfile(config, {
      DATABASE_URL: 'postgres://local:5432/db',
      NODE_ENV: 'production',
    })
    expect(result.overallPassed).toBe(false)
    const criticals = result.validations.filter(
      (v) => v.severity === 'critical' && !v.passed,
    )
    expect(criticals.length).toBeGreaterThanOrEqual(3)
  })

  it('sovereign profile passes when all sovereign requirements met', () => {
    const config = DeploymentProfileConfigSchema.parse({
      profile: 'sovereign',
      environment: 'production',
      selfHostedDb: true,
      egressAllowlistEnforced: true,
      egressAllowlist: ['api.stripe.com'],
      integrationApprovalRequired: true,
      dataResidency: 'ZA',
    })
    const result = validateDeploymentProfile(config, {
      DATABASE_URL: 'postgres://local:5432/db',
      NODE_ENV: 'production',
    })
    expect(result.overallPassed).toBe(true)
  })

  it('hybrid profile warns about selfHostedDb but is not critical', () => {
    const config = DeploymentProfileConfigSchema.parse({
      profile: 'hybrid',
      environment: 'staging',
      selfHostedDb: false,
    })
    const result = validateDeploymentProfile(config, {
      DATABASE_URL: 'postgres://local:5432/db',
      NODE_ENV: 'staging',
    })
    // selfHostedDb is a warning (not critical) for hybrid, so overall still passes
    expect(result.overallPassed).toBe(true)
    const selfHostedCheck = result.validations.find(
      (v) => v.check === 'SELF_HOSTED_DB',
    )
    expect(selfHostedCheck?.severity).toBe('warning')
    expect(selfHostedCheck?.passed).toBe(false)
  })
})

describe('detectDeploymentProfile', () => {
  it('returns explicit NZILA_DEPLOYMENT_PROFILE', () => {
    expect(detectDeploymentProfile({ NZILA_DEPLOYMENT_PROFILE: 'sovereign' })).toBe(
      'sovereign',
    )
    expect(detectDeploymentProfile({ NZILA_DEPLOYMENT_PROFILE: 'hybrid' })).toBe(
      'hybrid',
    )
  })

  it('detects sovereign from SOVEREIGN_MODE=true', () => {
    expect(detectDeploymentProfile({ SOVEREIGN_MODE: 'true' })).toBe('sovereign')
  })

  it('detects hybrid from HYBRID_MODE=true', () => {
    expect(detectDeploymentProfile({ HYBRID_MODE: 'true' })).toBe('hybrid')
  })

  it('defaults to managed', () => {
    expect(detectDeploymentProfile({})).toBe('managed')
  })
})

describe('buildDeploymentProofSection', () => {
  it('builds a proof section with correct shape', () => {
    const config = DeploymentProfileConfigSchema.parse({
      profile: 'managed',
      environment: 'production',
    })
    const result = validateDeploymentProfile(config, {
      DATABASE_URL: 'postgres://local:5432/db',
      NODE_ENV: 'production',
    })
    const proof = buildDeploymentProofSection(result)
    expect(proof.section).toBe('deployment_profile')
    expect(proof.profile).toBe('managed')
    expect(proof.environment).toBe('production')
    expect(Array.isArray(proof.validations)).toBe(true)
    expect(typeof proof.generatedAt).toBe('string')
  })
})
