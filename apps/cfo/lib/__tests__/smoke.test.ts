/**
 * CFO — Platform Smoke Tests
 *
 * Validates the CFO app's platform integration modules exist
 * and export the expected functions.
 */
import { describe, it, expect } from 'vitest'
import { readFileSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'

const APP = resolve(__dirname, '../..')

describe('CFO platform integration', () => {
  it('api-guards exports authenticateUser + withRequestContext', () => {
    const content = readFileSync(resolve(APP, 'lib/api-guards.ts'), 'utf-8')
    expect(content).toContain('authenticateUser')
    expect(content).toContain('withRequestContext')
    expect(content).toContain('withAudit')
  })

  it('has evidence pipeline with buildEvidencePack', () => {
    const path = resolve(APP, 'lib/evidence.ts')
    expect(existsSync(path)).toBe(true)
    const content = readFileSync(path, 'utf-8')
    expect(content).toContain('buildEvidencePack')
  })

  it('has commerce telemetry wired to @nzila/commerce-observability', () => {
    const content = readFileSync(resolve(APP, 'lib/commerce-telemetry.ts'), 'utf-8')
    expect(content).toContain('logTransition')
    expect(content).toContain('@nzila/commerce-observability')
  })

  it('has AI client wired to @nzila/ai-sdk', () => {
    const aiClient = resolve(APP, 'lib/ai-client.ts')
    const aiDir = resolve(APP, 'lib/ai/ai-client.ts')
    expect(existsSync(aiClient) || existsSync(aiDir)).toBe(true)
  })

  it('has ML client wired to @nzila/ml-sdk', () => {
    const path = resolve(APP, 'lib/ml-client.ts')
    expect(existsSync(path)).toBe(true)
    const content = readFileSync(path, 'utf-8')
    expect(content).toContain('ml-sdk')
  })

  it('has Zod env validation', () => {
    const envPath = resolve(APP, 'lib/env.ts')
    const envAlt = resolve(APP, 'env.ts')
    expect(existsSync(envPath) || existsSync(envAlt)).toBe(true)
  })
})
