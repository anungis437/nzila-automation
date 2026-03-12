import { describe, it, expect } from 'vitest'
import {
  getEnvironmentPrefix,
  getEnvironmentNamespace,
  getObservabilityNamespace,
  getDatabaseName,
  getStorageName,
} from '../environment'

describe('getEnvironmentPrefix', () => {
  it('returns local for LOCAL', () => {
    expect(getEnvironmentPrefix('LOCAL')).toBe('local')
  })

  it('returns staging for STAGING', () => {
    expect(getEnvironmentPrefix('STAGING')).toBe('staging')
  })

  it('returns prod for PRODUCTION', () => {
    expect(getEnvironmentPrefix('PRODUCTION')).toBe('prod')
  })

  it('returns preview for PREVIEW', () => {
    expect(getEnvironmentPrefix('PREVIEW')).toBe('preview')
  })
})

describe('getEnvironmentNamespace', () => {
  it('returns scoped names for STAGING', () => {
    const ns = getEnvironmentNamespace('STAGING')
    expect(ns.database).toBe('nzila-staging-db')
    expect(ns.storage).toBe('nzila-staging-storage')
    expect(ns.queue).toBe('nzila-staging-queue')
    expect(ns.observability).toBe('nzila.staging')
    expect(ns.evidence).toBe('nzila-staging-evidence')
    expect(ns.webhooks).toBe('nzila-staging-webhooks')
  })

  it('returns scoped names for PRODUCTION', () => {
    const ns = getEnvironmentNamespace('PRODUCTION')
    expect(ns.database).toBe('nzila-prod-db')
    expect(ns.storage).toBe('nzila-prod-storage')
  })
})

describe('convenience helpers', () => {
  it('getObservabilityNamespace returns dotted format', () => {
    expect(getObservabilityNamespace('STAGING')).toBe('nzila.staging')
  })

  it('getDatabaseName returns db name', () => {
    expect(getDatabaseName('PRODUCTION')).toBe('nzila-prod-db')
  })

  it('getStorageName returns storage name', () => {
    expect(getStorageName('LOCAL')).toBe('nzila-local-storage')
  })
})
