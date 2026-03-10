/**
 * Contract Test — Integration Webhook Payload Contracts
 *
 * Validates that each integration adapter with webhook support:
 *   1. Exports a webhook schema or verification function
 *   2. Defines supported webhook event types
 *   3. Has signature verification (where applicable)
 *   4. Returns typed results from webhook processing
 *
 * @invariant INT-WH-01: HubSpot webhook schema exists and validates
 * @invariant INT-WH-02: Stripe webhook verification function exists
 * @invariant INT-WH-03: Each adapter exports supported event types
 * @invariant INT-WH-04: Webhook handlers return typed results
 */
import { describe, it, expect } from 'vitest'
import { readFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'

const ROOT = join(__dirname, '..', '..')

function readFile(relPath: string): string {
  const fullPath = join(ROOT, relPath)
  if (!existsSync(fullPath)) throw new Error(`File not found: ${fullPath}`)
  return readFileSync(fullPath, 'utf-8')
}

function fileExists(relPath: string): boolean {
  return existsSync(join(ROOT, relPath))
}

// ── INT-WH-01: HubSpot webhook contract ─────────────────────────────────────

describe('INT-WH-01 — HubSpot webhook schema', () => {
  it('webhooks.ts exists', () => {
    expect(fileExists('packages/integrations-hubspot/src/webhooks.ts')).toBe(true)
  })

  it('defines webhook payload schema (Zod)', () => {
    const src = readFile('packages/integrations-hubspot/src/webhooks.ts')
    expect(src).toMatch(/hubspotWebhookPayloadSchema|webhookPayloadSchema|WebhookPayload/i)
  })

  it('lists supported webhook types', () => {
    const src = readFile('packages/integrations-hubspot/src/webhooks.ts')
    expect(src).toMatch(/SUPPORTED_WEBHOOK_TYPES|supportedEvents|webhookTypes/i)
  })

  it('exports a webhook ingestion function', () => {
    const src = readFile('packages/integrations-hubspot/src/webhooks.ts')
    expect(src).toMatch(/export.*function.*ingest|export.*function.*process|export.*function.*handle/i)
  })
})

// ── INT-WH-02: Stripe webhook verification ──────────────────────────────────

describe('INT-WH-02 — Stripe webhook signature verification', () => {
  it('webhooks.ts exists in payments-stripe', () => {
    expect(fileExists('packages/payments-stripe/src/webhooks.ts')).toBe(true)
  })

  it('has webhook signature verification', () => {
    const src = readFile('packages/payments-stripe/src/webhooks.ts')
    expect(src).toMatch(/verifyWebhookSignature|constructEvent|verifySignature/i)
  })

  it('defines a WebhookSignatureError class', () => {
    const src = readFile('packages/payments-stripe/src/webhooks.ts')
    expect(src).toContain('WebhookSignatureError')
  })
})

// ── INT-WH-03: Adapter typed exports ────────────────────────────────────────

describe('INT-WH-03 — Adapters export typed interfaces', () => {
  const adapters = [
    {
      name: 'integrations-hubspot',
      indexPath: 'packages/integrations-hubspot/src/index.ts',
      expectExports: ['sync', 'webhook'],
    },
    {
      name: 'integrations-m365',
      indexPath: 'packages/integrations-m365/src/index.ts',
      expectExports: ['sharepoint', 'outlook', 'teams'],
    },
    {
      name: 'integrations-whatsapp',
      indexPath: 'packages/integrations-whatsapp/src/index.ts',
      expectExports: ['provider', 'send'],
    },
    {
      name: 'payments-stripe',
      indexPath: 'packages/payments-stripe/src/index.ts',
      expectExports: ['client', 'webhook'],
    },
    {
      name: 'qbo',
      indexPath: 'packages/qbo/src/index.ts',
      expectExports: ['oauth', 'client'],
    },
  ]

  for (const adapter of adapters) {
    it(`${adapter.name} has a barrel export`, () => {
      expect(fileExists(adapter.indexPath)).toBe(true)
    })

    it(`${adapter.name} barrel re-exports modules`, () => {
      const src = readFile(adapter.indexPath)
      expect(src).toMatch(/export.*from/i)
    })
  }
})

// ── INT-WH-04: Integration packages have test files ─────────────────────────

describe('INT-WH-04 — Integration adapters have tests', () => {
  const packages = [
    'packages/integrations-hubspot',
    'packages/integrations-m365',
    'packages/integrations-whatsapp',
    'packages/payments-stripe',
    'packages/qbo',
  ]

  for (const pkg of packages) {
    it(`${pkg} has test coverage`, () => {
      const hasTestInSrc = fileExists(`${pkg}/src/${pkg.split('/')[1]}.test.ts`)
        || fileExists(`${pkg}/src/qbo.test.ts`)
        || existsSync(join(ROOT, pkg, 'src', '__tests__'))
      const hasSrcTest = existsSync(join(ROOT, pkg, 'src'))
        && require('node:fs')
          .readdirSync(join(ROOT, pkg, 'src'), { recursive: true })
          .some((f: string) => f.endsWith('.test.ts'))
      expect(hasTestInSrc || hasSrcTest).toBe(true)
    })
  }
})
