/**
 * ABR — Platform Smoke Tests
 *
 * Validates the ABR (Arbitration) app's platform integration modules
 * including AI legal actions and ML integration.
 */
import { describe, it, expect } from 'vitest'
import { readFileSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'

const APP = resolve(__dirname, '../..')

describe('ABR platform integration', () => {
  it('has AI legal actions', () => {
    const path = resolve(APP, 'lib/actions/ai-legal-actions.ts')
    expect(existsSync(path)).toBe(true)
    const content = readFileSync(path, 'utf-8')
    expect(content).toContain('classifyCase')
    expect(content).toContain('extractFromComplaint')
    expect(content).toContain('findSimilarCases')
    expect(content).toContain('predictCaseOutcome')
    expect(content).toContain('assessRiskScore')
  })

  it('has AI client wired', () => {
    const ai = resolve(APP, 'lib/ai-client.ts')
    const aiAlt = resolve(APP, 'lib/ai/ai-client.ts')
    expect(existsSync(ai) || existsSync(aiAlt)).toBe(true)
  })

  it('has ML client wired to @nzila/ml-sdk', () => {
    const path = resolve(APP, 'lib/ml-client.ts')
    expect(existsSync(path)).toBe(true)
    const content = readFileSync(path, 'utf-8')
    expect(content).toContain('ml-sdk')
  })

  it('has evidence pipeline', () => {
    const path = resolve(APP, 'lib/evidence.ts')
    expect(existsSync(path)).toBe(true)
    const content = readFileSync(path, 'utf-8')
    expect(content).toContain('buildEvidencePack')
  })

  it('has api-guards with authenticateUser', () => {
    const content = readFileSync(resolve(APP, 'lib/api-guards.ts'), 'utf-8')
    expect(content).toContain('authenticateUser')
    expect(content).toContain('withRequestContext')
  })

  it('has OTel instrumentation', () => {
    expect(existsSync(resolve(APP, 'instrumentation.ts'))).toBe(true)
  })
})
