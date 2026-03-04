/**
 * @nzila/os-core — mTLS Contract Tests
 */
import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  parseXFCC,
  verifyServiceIdentity,
  createMtlsMiddleware,
  getMtlsHealth,
  type MtlsConfig,
} from './index'

const enabledConfig: MtlsConfig = {
  enabled: true,
  allowedServices: ['web-service', 'console-service', 'api-service'],
  rejectUnauthorized: true,
}

const openConfig: MtlsConfig = {
  enabled: true,
  allowedServices: [],
  rejectUnauthorized: true,
}

const disabledConfig: MtlsConfig = {
  enabled: false,
  allowedServices: [],
  rejectUnauthorized: false,
}

describe('mTLS — XFCC Header Parsing', () => {
  it('parses standard Envoy XFCC header', () => {
    const header =
      'Hash=abc123;Subject="CN=web-service,O=Nzila";URI=spiffe://nzila.app/web'
    const result = parseXFCC(header)
    expect(result.hash).toBe('abc123')
    expect(result.cn).toBe('web-service')
    expect(result.uri).toBe('spiffe://nzila.app/web')
  })

  it('extracts CN from Subject', () => {
    const header = 'Subject="CN=console-service,OU=platform"'
    const result = parseXFCC(header)
    expect(result.cn).toBe('console-service')
  })

  it('handles DNS SANs', () => {
    const header =
      'Subject="CN=api-service";DNS=api-service.nzila.svc.cluster.local;DNS=api.nzila.app'
    const result = parseXFCC(header)
    expect(result.cn).toBe('api-service')
    expect(result.dns).toContain('api-service.nzila.svc.cluster.local')
    expect(result.dns).toContain('api.nzila.app')
  })

  it('handles empty header gracefully', () => {
    const result = parseXFCC('')
    expect(result.cn).toBeUndefined()
  })
})

describe('mTLS — Service Identity Verification', () => {
  it('rejects missing XFCC when mTLS is enabled', () => {
    const result = verifyServiceIdentity(undefined, enabledConfig)
    expect(result.verified).toBe(false)
    expect(result.reason).toContain('Missing')
  })

  it('rejects empty XFCC when mTLS is enabled', () => {
    const result = verifyServiceIdentity('', enabledConfig)
    expect(result.verified).toBe(false)
    expect(result.reason).toContain('Missing')
  })

  it('allows known service CN', () => {
    const header = 'Subject="CN=web-service,O=Nzila"'
    const result = verifyServiceIdentity(header, enabledConfig)
    expect(result.verified).toBe(true)
    expect(result.identity?.commonName).toBe('web-service')
    expect(result.identity?.authorized).toBe(true)
  })

  it('rejects unknown service CN', () => {
    const header = 'Subject="CN=malicious-service"'
    const result = verifyServiceIdentity(header, enabledConfig)
    expect(result.verified).toBe(false)
    expect(result.reason).toContain('not in allow-list')
  })

  it('allows any service when allow-list is empty', () => {
    const header = 'Subject="CN=any-service"'
    const result = verifyServiceIdentity(header, openConfig)
    expect(result.verified).toBe(true)
  })

  it('passes through when mTLS is disabled', () => {
    const result = verifyServiceIdentity(undefined, disabledConfig)
    expect(result.verified).toBe(true)
    expect(result.reason).toContain('not enabled')
  })

  it('allows service by DNS SAN', () => {
    const header =
      'Subject="CN=other-name";DNS=web-service'
    const result = verifyServiceIdentity(header, enabledConfig)
    expect(result.verified).toBe(true)
    expect(result.identity?.commonName).toBe('other-name')
  })

  it('includes fingerprint in identity', () => {
    const header = 'Hash=deadbeef;Subject="CN=web-service"'
    const result = verifyServiceIdentity(header, enabledConfig)
    expect(result.identity?.fingerprint).toBe('deadbeef')
  })

  it('generates fingerprint when hash not in header', () => {
    const header = 'Subject="CN=web-service"'
    const result = verifyServiceIdentity(header, enabledConfig)
    expect(result.identity?.fingerprint).toBeTruthy()
    expect(result.identity?.fingerprint).toHaveLength(64) // SHA-256 hex
  })
})

describe('mTLS — Middleware', () => {
  it('returns verified=true for valid service', () => {
    const middleware = createMtlsMiddleware(enabledConfig)
    const result = middleware({
      headers: { 'x-forwarded-client-cert': 'Subject="CN=api-service"' },
    })
    expect(result.verified).toBe(true)
  })

  it('returns verified=false for missing cert', () => {
    const middleware = createMtlsMiddleware(enabledConfig)
    const result = middleware({ headers: {} })
    expect(result.verified).toBe(false)
  })

  it('falls back to x-client-cert-cn header', () => {
    const middleware = createMtlsMiddleware(enabledConfig)
    const result = middleware({
      headers: { 'x-client-cert-cn': 'Subject="CN=console-service"' },
    })
    expect(result.verified).toBe(true)
  })
})

describe('mTLS — Health Check', () => {
  it('reports disabled when not configured', () => {
    const health = getMtlsHealth()
    // Default env has mTLS disabled
    expect(health.enabled).toBe(false)
  })
})
