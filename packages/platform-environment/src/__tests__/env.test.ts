import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import {
  getEnvironment,
  isProtectedEnvironment,
  allowsDebugLogging,
  allowsAIExperimental,
} from '../env'

describe('env detection', () => {
  const originalEnv = { ...process.env }

  beforeEach(() => {
    delete process.env.ENVIRONMENT
    delete process.env.GITHUB_REF
    delete process.env.GITHUB_EVENT_NAME
    delete process.env.CI
  })

  afterEach(() => {
    process.env = { ...originalEnv }
  })

  it('returns LOCAL as default fallback', () => {
    expect(getEnvironment()).toBe('LOCAL')
  })

  it('reads ENVIRONMENT env var when set', () => {
    process.env.ENVIRONMENT = 'STAGING'
    expect(getEnvironment()).toBe('STAGING')
  })

  it('detects PRODUCTION from tag ref', () => {
    process.env.CI = 'true'
    process.env.GITHUB_REF = 'refs/tags/v1.0.0'
    expect(getEnvironment()).toBe('PRODUCTION')
  })

  it('detects PREVIEW from pull_request event', () => {
    process.env.CI = 'true'
    process.env.GITHUB_EVENT_NAME = 'pull_request'
    expect(getEnvironment()).toBe('PREVIEW')
  })

  it('detects STAGING from main branch', () => {
    process.env.CI = 'true'
    process.env.GITHUB_REF = 'refs/heads/main'
    expect(getEnvironment()).toBe('STAGING')
  })
})

describe('isProtectedEnvironment', () => {
  it('returns true for STAGING', () => {
    expect(isProtectedEnvironment('STAGING')).toBe(true)
  })

  it('returns true for PRODUCTION', () => {
    expect(isProtectedEnvironment('PRODUCTION')).toBe(true)
  })

  it('returns false for LOCAL', () => {
    expect(isProtectedEnvironment('LOCAL')).toBe(false)
  })

  it('returns false for PREVIEW', () => {
    expect(isProtectedEnvironment('PREVIEW')).toBe(false)
  })
})

describe('allowsDebugLogging', () => {
  it('allows debug for LOCAL', () => {
    expect(allowsDebugLogging('LOCAL')).toBe(true)
  })

  it('blocks debug for PRODUCTION', () => {
    expect(allowsDebugLogging('PRODUCTION')).toBe(false)
  })
})

describe('allowsAIExperimental', () => {
  it('allows AI for STAGING', () => {
    expect(allowsAIExperimental('STAGING')).toBe(true)
  })

  it('blocks AI for PRODUCTION', () => {
    expect(allowsAIExperimental('PRODUCTION')).toBe(false)
  })
})
