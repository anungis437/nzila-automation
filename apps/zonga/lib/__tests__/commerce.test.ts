/**
 * Zonga — Commerce Smoke Tests
 *
 * Validates zonga's commerce stack integration: state machine,
 * audit trails, observability, and evidence pipeline.
 */
import { describe, it, expect } from 'vitest'
import { readFileSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'

const APP = resolve(__dirname, '../..')

describe('Zonga commerce stack', () => {
  it('has payout state machine wrapping @nzila/commerce-state', () => {
    const path = resolve(APP, 'lib/payout-machine.ts')
    expect(existsSync(path)).toBe(true)
    const content = readFileSync(path, 'utf-8')
    expect(content).toContain('attemptTransition')
    expect(content).toContain('@nzila/commerce-state')
    expect(content).toContain('payoutMachine')
    expect(content).toContain('transitionPayout')
  })

  it('has commerce telemetry with logTransition', () => {
    const content = readFileSync(resolve(APP, 'lib/commerce-telemetry.ts'), 'utf-8')
    expect(content).toContain('logTransition')
    expect(content).toContain('@nzila/commerce-observability')
  })

  it('has commerce audit wired to @nzila/commerce-audit', () => {
    const path = resolve(APP, 'lib/commerce-audit.ts')
    expect(existsSync(path)).toBe(true)
    const content = readFileSync(path, 'utf-8')
    expect(content).toContain('buildTransitionAuditEntry')
    expect(content).toContain('@nzila/commerce-audit')
  })

  it('has evidence pipeline', () => {
    const path = resolve(APP, 'lib/evidence.ts')
    expect(existsSync(path)).toBe(true)
    const content = readFileSync(path, 'utf-8')
    expect(content).toContain('buildEvidencePack')
  })

  it('payout-actions uses logTransition', () => {
    const content = readFileSync(resolve(APP, 'lib/actions/payout-actions.ts'), 'utf-8')
    expect(content).toContain('logTransition')
    expect(content).toContain('PayoutStatus')
  })
})

describe('Zonga platform integration', () => {
  it('has AI + ML clients', () => {
    const ai = resolve(APP, 'lib/ai-client.ts')
    const ml = resolve(APP, 'lib/ml-client.ts')
    expect(existsSync(ai) || existsSync(resolve(APP, 'lib/ai/ai-client.ts'))).toBe(true)
    expect(existsSync(ml)).toBe(true)
  })

  it('has OTel instrumentation', () => {
    expect(existsSync(resolve(APP, 'instrumentation.ts'))).toBe(true)
  })

  it('has api-guards with authenticateUser', () => {
    const content = readFileSync(resolve(APP, 'lib/api-guards.ts'), 'utf-8')
    expect(content).toContain('authenticateUser')
  })
})
