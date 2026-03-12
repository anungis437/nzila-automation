import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import {
  getEnvironmentConfig,
  resolveServiceConfig,
} from '../service'

describe('getEnvironmentConfig', () => {
  it('returns config for a service and environment', () => {
    const config = getEnvironmentConfig('web', 'STAGING')
    expect(config.environment).toBe('STAGING')
    expect(config.service).toBe('web')
    expect(config.protected_environment).toBe(true)
    expect(config.allow_debug_logging).toBe(true)
    expect(config.observability_namespace).toBe('nzila.staging')
  })

  it('returns config for PRODUCTION', () => {
    const config = getEnvironmentConfig('api', 'PRODUCTION')
    expect(config.environment).toBe('PRODUCTION')
    expect(config.protected_environment).toBe(true)
    expect(config.allow_debug_logging).toBe(false)
    expect(config.allow_ai_experimental).toBe(false)
  })

  it('returns config for LOCAL', () => {
    const config = getEnvironmentConfig('console', 'LOCAL')
    expect(config.protected_environment).toBe(false)
    expect(config.allow_debug_logging).toBe(true)
  })
})

describe('resolveServiceConfig', () => {
  const originalEnv = { ...process.env }

  beforeEach(() => {
    delete process.env.ENVIRONMENT
  })

  afterEach(() => {
    process.env = { ...originalEnv }
  })

  it('resolves config using detected environment', () => {
    // With no ENVIRONMENT set, defaults to LOCAL
    const config = resolveServiceConfig('web')
    expect(config.environment).toBe('LOCAL')
    expect(config.service).toBe('web')
  })
})
