import { describe, it, expect, beforeEach } from 'vitest'
import {
  registerFlag,
  unregisterFlag,
  resetFlags,
  getAllFlags,
  isFeatureEnabled,
  evaluateFlag,
  getEnabledFlags,
} from '../index'

describe('feature flag registry', () => {
  beforeEach(() => {
    resetFlags()
  })

  it('has default flags', () => {
    const flags = getAllFlags()
    const names = flags.map((f) => f.name)
    expect(names).toContain('ai_experimental')
    expect(names).toContain('governance_debug')
    expect(names).toContain('advanced_intelligence')
  })

  it('registers a new flag', () => {
    registerFlag({
      name: 'test_flag',
      enabled: true,
      environments: ['LOCAL'],
    })
    const flags = getAllFlags()
    expect(flags.find((f) => f.name === 'test_flag')).toBeDefined()
  })

  it('overwrites existing flag on re-register', () => {
    registerFlag({
      name: 'ai_experimental',
      enabled: false,
      environments: [],
    })
    const flag = getAllFlags().find((f) => f.name === 'ai_experimental')
    expect(flag?.enabled).toBe(false)
  })

  it('unregisters a flag', () => {
    unregisterFlag('governance_debug')
    const flags = getAllFlags()
    expect(flags.find((f) => f.name === 'governance_debug')).toBeUndefined()
  })

  it('resets to defaults', () => {
    unregisterFlag('ai_experimental')
    resetFlags()
    const flags = getAllFlags()
    expect(flags.find((f) => f.name === 'ai_experimental')).toBeDefined()
  })
})

describe('isFeatureEnabled', () => {
  beforeEach(() => {
    resetFlags()
  })

  it('returns true for allowed environment', () => {
    expect(isFeatureEnabled('ai_experimental', 'LOCAL')).toBe(true)
    expect(isFeatureEnabled('ai_experimental', 'STAGING')).toBe(true)
  })

  it('returns false for blocked environment', () => {
    expect(isFeatureEnabled('ai_experimental', 'PRODUCTION')).toBe(false)
  })

  it('returns false for unknown flag', () => {
    expect(isFeatureEnabled('nonexistent', 'LOCAL')).toBe(false)
  })

  it('returns false for disabled flag', () => {
    registerFlag({
      name: 'disabled_flag',
      enabled: false,
      environments: ['LOCAL', 'STAGING', 'PRODUCTION'],
    })
    expect(isFeatureEnabled('disabled_flag', 'LOCAL')).toBe(false)
  })
})

describe('evaluateFlag', () => {
  beforeEach(() => {
    resetFlags()
  })

  it('returns enabled with reason for allowed env', () => {
    const result = evaluateFlag('ai_experimental', 'STAGING')
    expect(result.enabled).toBe(true)
    expect(result.reason).toBe('environment_allowed')
  })

  it('returns disabled with reason for blocked env', () => {
    const result = evaluateFlag('ai_experimental', 'PRODUCTION')
    expect(result.enabled).toBe(false)
    expect(result.reason).toBe('environment_blocked')
  })

  it('returns disabled for unknown flag', () => {
    const result = evaluateFlag('nonexistent', 'LOCAL')
    expect(result.enabled).toBe(false)
    expect(result.reason).toBe('flag_disabled')
  })
})

describe('getEnabledFlags', () => {
  beforeEach(() => {
    resetFlags()
  })

  it('returns all flags enabled in LOCAL', () => {
    const enabled = getEnabledFlags('LOCAL')
    expect(enabled.length).toBe(3)
  })

  it('returns no default flags in PRODUCTION', () => {
    const enabled = getEnabledFlags('PRODUCTION')
    expect(enabled.length).toBe(0)
  })
})
