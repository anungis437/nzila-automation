/**
 * Contract Test — Trade Integrations Dispatcher
 *
 * TRADE_INTEGRATIONS_DISPATCHER_ONLY_003:
 *   1. Trade event emitter must exist
 *   2. Event emitter must not directly import third-party HTTP/SMTP/etc. libraries
 *   3. Integration events should reference integrations-runtime pattern
 *   4. No hardcoded external URLs in trade event handlers
 *
 * @invariant TRADE_INTEGRATIONS_DISPATCHER_ONLY_003
 */
import { describe, it, expect } from 'vitest'
import { readFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'

const ROOT = join(__dirname, '../..')
const EVENT_EMITTER_PATH = join(
  ROOT,
  'apps',
  'trade',
  'lib',
  'events',
  'trade-event-emitter.ts',
)

describe('TRADE-INT-01 — Event emitter exists', () => {
  it('trade-event-emitter.ts exists', () => {
    expect(existsSync(EVENT_EMITTER_PATH)).toBe(true)
  })
})

describe('TRADE-INT-02 — No direct HTTP calls from event emitter', () => {
  it('does not import node-fetch, axios, or got', () => {
    if (!existsSync(EVENT_EMITTER_PATH)) return
    const content = readFileSync(EVENT_EMITTER_PATH, 'utf-8')
    expect(content).not.toContain("from 'node-fetch'")
    expect(content).not.toContain("from 'axios'")
    expect(content).not.toContain("from 'got'")
  })

  it('does not contain hardcoded URLs', () => {
    if (!existsSync(EVENT_EMITTER_PATH)) return
    const content = readFileSync(EVENT_EMITTER_PATH, 'utf-8')
    expect(content).not.toMatch(/https?:\/\/[a-zA-Z0-9]/)
  })
})

describe('TRADE-INT-03 — Event types are centralized in trade-core', () => {
  it('event emitter imports TradeEventTypes from @nzila/trade-core', () => {
    if (!existsSync(EVENT_EMITTER_PATH)) return
    const content = readFileSync(EVENT_EMITTER_PATH, 'utf-8')
    expect(content).toContain('@nzila/trade-core')
    expect(content).toContain('TradeEventTypes')
  })
})

describe('TRADE-INT-04 — Trade event types exist in trade-core', () => {
  it('events.ts exists in trade-core/src', () => {
    const path = join(ROOT, 'packages', 'trade-core', 'src', 'events.ts')
    expect(existsSync(path)).toBe(true)
  })

  it('defines all required event types', () => {
    const path = join(ROOT, 'packages', 'trade-core', 'src', 'events.ts')
    const content = readFileSync(path, 'utf-8')
    const required = [
      'DEAL_CREATED',
      'DEAL_QUALIFIED',
      'DEAL_FUNDED',
      'DEAL_CANCELLED',
      'QUOTE_ACCEPTED',
      'SHIPMENT_DELIVERED',
      'COMMISSION_FINALIZED',
    ]
    for (const event of required) {
      expect(content, `Missing event type: ${event}`).toContain(event)
    }
  })
})
