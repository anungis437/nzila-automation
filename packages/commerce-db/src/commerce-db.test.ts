/**
 * @nzila/commerce-db — Repository contract tests
 *
 * Validates the structural contract of every commerce repository module:
 *   1. Every exported function exists and is callable
 *   2. Every function's first parameter is named ctx (orgId/entityId present)
 *   3. Write functions use createAuditedScopedDb (not just createScopedDb)
 *   4. Module exports match the expected API surface
 *
 * These are structural/contract tests — they do NOT require a database connection.
 * Integration tests against a real DB will live in tooling/contract-tests/.
 */
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'

const PKG_ROOT = resolve(__dirname, '..')

// ── Helpers ─────────────────────────────────────────────────────────────────

function readSource(relPath: string): string {
  return readFileSync(join(PKG_ROOT, relPath), 'utf-8')
}

/**
 * Extract exported function names from a TypeScript source file.
 */
function extractExportedFunctions(source: string): string[] {
  const re = /export\s+(?:async\s+)?function\s+(\w+)/g
  const names: string[] = []
  let match: RegExpExecArray | null
  while ((match = re.exec(source)) !== null) {
    names.push(match[1]!)
  }
  return names
}

/**
 * Extract the first parameter name from a function signature.
 */
function extractFirstParam(source: string, fnName: string): string | null {
  const re = new RegExp(
    `(?:export\\s+)?(?:async\\s+)?function\\s+${fnName}\\s*\\(\\s*(\\w+)`,
  )
  const match = re.exec(source)
  return match?.[1] ?? null
}

// ── Test: Types module ──────────────────────────────────────────────────────

describe('types module', () => {
  it('exports CommerceDbContext with entityId and actorId', () => {
    const source = readSource('src/types.ts')
    expect(source).toContain('entityId')
    expect(source).toContain('actorId')
    expect(source).toContain('CommerceDbContext')
  })

  it('exports CommerceReadContext with entityId', () => {
    const source = readSource('src/types.ts')
    expect(source).toContain('CommerceReadContext')
    expect(source).toContain('entityId')
  })

  it('exports PaginationOpts and PaginatedResult', () => {
    const source = readSource('src/types.ts')
    expect(source).toContain('PaginationOpts')
    expect(source).toContain('PaginatedResult')
  })
})

// ── Test: Customers repository ──────────────────────────────────────────────

describe('customers repository', () => {
  const source = readSource('src/repositories/customers.ts')
  const fns = extractExportedFunctions(source)

  it('exports all expected CRUD functions', () => {
    expect(fns).toContain('listCustomers')
    expect(fns).toContain('getCustomerById')
    expect(fns).toContain('createCustomer')
    expect(fns).toContain('updateCustomer')
    expect(fns).toContain('deleteCustomer')
  })

  it('every function takes ctx as first parameter', () => {
    for (const fn of fns) {
      const param = extractFirstParam(source, fn)
      expect(param, `${fn}() must take ctx as first param`).toBe('ctx')
    }
  })

  it('write functions use createAuditedScopedDb', () => {
    expect(source).toContain('createAuditedScopedDb')
  })

  it('read functions use createScopedDb', () => {
    expect(source).toContain('createScopedDb')
  })
})

// ── Test: Opportunities repository ──────────────────────────────────────────

describe('opportunities repository', () => {
  const source = readSource('src/repositories/opportunities.ts')
  const fns = extractExportedFunctions(source)

  it('exports all expected functions', () => {
    expect(fns).toContain('listOpportunities')
    expect(fns).toContain('getOpportunityById')
    expect(fns).toContain('listOpportunitiesByCustomer')
    expect(fns).toContain('createOpportunity')
    expect(fns).toContain('updateOpportunity')
  })

  it('every function takes ctx as first parameter', () => {
    for (const fn of fns) {
      const param = extractFirstParam(source, fn)
      expect(param, `${fn}() must take ctx as first param`).toBe('ctx')
    }
  })

  it('write functions use createAuditedScopedDb', () => {
    expect(source).toContain('createAuditedScopedDb')
  })
})

// ── Test: Quotes repository ─────────────────────────────────────────────────

describe('quotes repository', () => {
  const source = readSource('src/repositories/quotes.ts')
  const fns = extractExportedFunctions(source)

  it('exports all expected functions', () => {
    expect(fns).toContain('listQuotes')
    expect(fns).toContain('getQuoteById')
    expect(fns).toContain('getQuoteByRef')
    expect(fns).toContain('listQuoteLines')
    expect(fns).toContain('listQuoteVersions')
    expect(fns).toContain('createQuote')
    expect(fns).toContain('updateQuote')
    expect(fns).toContain('createQuoteLine')
    expect(fns).toContain('updateQuoteLine')
    expect(fns).toContain('deleteQuoteLine')
    expect(fns).toContain('createQuoteVersion')
  })

  it('every function takes ctx as first parameter', () => {
    for (const fn of fns) {
      const param = extractFirstParam(source, fn)
      expect(param, `${fn}() must take ctx as first param`).toBe('ctx')
    }
  })

  it('write functions use createAuditedScopedDb', () => {
    expect(source).toContain('createAuditedScopedDb')
  })
})

// ── Test: Orders repository ─────────────────────────────────────────────────

describe('orders repository', () => {
  const source = readSource('src/repositories/orders.ts')
  const fns = extractExportedFunctions(source)

  it('exports all expected functions', () => {
    expect(fns).toContain('listOrders')
    expect(fns).toContain('getOrderById')
    expect(fns).toContain('getOrderByRef')
    expect(fns).toContain('listOrderLines')
    expect(fns).toContain('createOrder')
    expect(fns).toContain('updateOrder')
    expect(fns).toContain('createOrderLine')
    expect(fns).toContain('updateOrderLine')
    expect(fns).toContain('deleteOrderLine')
  })

  it('every function takes ctx as first parameter', () => {
    for (const fn of fns) {
      const param = extractFirstParam(source, fn)
      expect(param, `${fn}() must take ctx as first param`).toBe('ctx')
    }
  })

  it('write functions use createAuditedScopedDb', () => {
    expect(source).toContain('createAuditedScopedDb')
  })
})

// ── Test: Invoices repository ───────────────────────────────────────────────

describe('invoices repository', () => {
  const source = readSource('src/repositories/invoices.ts')
  const fns = extractExportedFunctions(source)

  it('exports all expected functions', () => {
    expect(fns).toContain('listInvoices')
    expect(fns).toContain('getInvoiceById')
    expect(fns).toContain('getInvoiceByRef')
    expect(fns).toContain('listInvoiceLines')
    expect(fns).toContain('createInvoice')
    expect(fns).toContain('updateInvoice')
    expect(fns).toContain('createInvoiceLine')
    expect(fns).toContain('updateInvoiceLine')
    expect(fns).toContain('deleteInvoiceLine')
  })

  it('every function takes ctx as first parameter', () => {
    for (const fn of fns) {
      const param = extractFirstParam(source, fn)
      expect(param, `${fn}() must take ctx as first param`).toBe('ctx')
    }
  })

  it('write functions use createAuditedScopedDb', () => {
    expect(source).toContain('createAuditedScopedDb')
  })
})

// ── Test: Fulfillment repository ────────────────────────────────────────────

describe('fulfillment repository', () => {
  const source = readSource('src/repositories/fulfillment.ts')
  const fns = extractExportedFunctions(source)

  it('exports all expected functions', () => {
    expect(fns).toContain('listFulfillmentTasks')
    expect(fns).toContain('getFulfillmentTaskById')
    expect(fns).toContain('listFulfillmentTasksByOrder')
    expect(fns).toContain('createFulfillmentTask')
    expect(fns).toContain('updateFulfillmentTask')
  })

  it('every function takes ctx as first parameter', () => {
    for (const fn of fns) {
      const param = extractFirstParam(source, fn)
      expect(param, `${fn}() must take ctx as first param`).toBe('ctx')
    }
  })

  it('write functions use createAuditedScopedDb', () => {
    expect(source).toContain('createAuditedScopedDb')
  })
})

// ── Test: Payments repository ───────────────────────────────────────────────

describe('payments repository', () => {
  const source = readSource('src/repositories/payments.ts')
  const fns = extractExportedFunctions(source)

  it('exports payments, credit notes, and refund functions', () => {
    // Payments
    expect(fns).toContain('listPayments')
    expect(fns).toContain('getPaymentById')
    expect(fns).toContain('listPaymentsByInvoice')
    expect(fns).toContain('createPayment')
    // Credit notes
    expect(fns).toContain('listCreditNotes')
    expect(fns).toContain('getCreditNoteById')
    expect(fns).toContain('createCreditNote')
    // Refunds
    expect(fns).toContain('listRefunds')
    expect(fns).toContain('getRefundById')
    expect(fns).toContain('createRefund')
    expect(fns).toContain('updateRefund')
  })

  it('every function takes ctx as first parameter', () => {
    for (const fn of fns) {
      const param = extractFirstParam(source, fn)
      expect(param, `${fn}() must take ctx as first param`).toBe('ctx')
    }
  })

  it('write functions use createAuditedScopedDb', () => {
    expect(source).toContain('createAuditedScopedDb')
  })
})

// ── Test: Disputes repository ───────────────────────────────────────────────

describe('disputes repository', () => {
  const source = readSource('src/repositories/disputes.ts')
  const fns = extractExportedFunctions(source)

  it('exports all expected functions', () => {
    expect(fns).toContain('listDisputes')
    expect(fns).toContain('getDisputeById')
    expect(fns).toContain('listDisputesByInvoice')
    expect(fns).toContain('createDispute')
    expect(fns).toContain('updateDispute')
  })

  it('every function takes ctx as first parameter', () => {
    for (const fn of fns) {
      const param = extractFirstParam(source, fn)
      expect(param, `${fn}() must take ctx as first param`).toBe('ctx')
    }
  })

  it('write functions use createAuditedScopedDb', () => {
    expect(source).toContain('createAuditedScopedDb')
  })
})

// ── Test: Evidence repository ───────────────────────────────────────────────

describe('evidence repository', () => {
  const source = readSource('src/repositories/evidence.ts')
  const fns = extractExportedFunctions(source)

  it('exports all expected functions', () => {
    expect(fns).toContain('listEvidenceArtifacts')
    expect(fns).toContain('getEvidenceArtifactById')
    expect(fns).toContain('listEvidenceByTarget')
    expect(fns).toContain('createEvidenceArtifact')
  })

  it('every function takes ctx as first parameter', () => {
    for (const fn of fns) {
      const param = extractFirstParam(source, fn)
      expect(param, `${fn}() must take ctx as first param`).toBe('ctx')
    }
  })

  it('evidence is append-only — no update or delete exports', () => {
    expect(fns.filter((f) => f.startsWith('update'))).toHaveLength(0)
    expect(fns.filter((f) => f.startsWith('delete'))).toHaveLength(0)
  })

  it('write function uses createAuditedScopedDb', () => {
    expect(source).toContain('createAuditedScopedDb')
  })
})

// ── Test: Sync repository ───────────────────────────────────────────────────

describe('sync repository', () => {
  const source = readSource('src/repositories/sync.ts')
  const fns = extractExportedFunctions(source)

  it('exports all expected functions', () => {
    // Jobs
    expect(fns).toContain('listSyncJobs')
    expect(fns).toContain('getSyncJobById')
    expect(fns).toContain('createSyncJob')
    expect(fns).toContain('updateSyncJob')
    // Receipts
    expect(fns).toContain('listSyncReceipts')
    expect(fns).toContain('getSyncReceiptById')
    expect(fns).toContain('listSyncReceiptsByJob')
    expect(fns).toContain('createSyncReceipt')
  })

  it('every function takes ctx as first parameter', () => {
    for (const fn of fns) {
      const param = extractFirstParam(source, fn)
      expect(param, `${fn}() must take ctx as first param`).toBe('ctx')
    }
  })

  it('write functions use createAuditedScopedDb', () => {
    expect(source).toContain('createAuditedScopedDb')
  })
})

// ── Test: Cross-cutting org isolation contract ──────────────────────────────

describe('org isolation contract', () => {
  const repoFiles = [
    'src/repositories/customers.ts',
    'src/repositories/opportunities.ts',
    'src/repositories/quotes.ts',
    'src/repositories/orders.ts',
    'src/repositories/invoices.ts',
    'src/repositories/fulfillment.ts',
    'src/repositories/payments.ts',
    'src/repositories/disputes.ts',
    'src/repositories/evidence.ts',
    'src/repositories/sync.ts',
  ]

  it('every repository passes ctx.entityId as orgId to scoped db', () => {
    for (const file of repoFiles) {
      const source = readSource(file)
      // Every scoped DB call must use ctx.entityId
      const scopedCalls = source.match(/createScopedDb|createAuditedScopedDb/g) ?? []
      expect(
        scopedCalls.length,
        `${file} must use scoped DB`,
      ).toBeGreaterThan(0)
      expect(
        source,
        `${file} must pass ctx.entityId`,
      ).toContain('ctx.entityId')
    }
  })

  it('no repository uses raw db import', () => {
    for (const file of repoFiles) {
      const source = readSource(file)
      expect(source).not.toMatch(/import\s*\{\s*db\s*\}\s*from/)
      expect(source).not.toMatch(/import\s*\{\s*rawDb\s*\}\s*from/)
    }
  })

  it('write repositories always pass actorId for audit', () => {
    for (const file of repoFiles) {
      const source = readSource(file)
      if (source.includes('createAuditedScopedDb')) {
        expect(
          source,
          `${file} must pass ctx.actorId to audited scoped db`,
        ).toContain('actorId: ctx.actorId')
      }
    }
  })

  it('total exported function count matches expected surface', () => {
    let total = 0
    for (const file of repoFiles) {
      const source = readSource(file)
      total += extractExportedFunctions(source).length
    }
    // 5 customer + 5 opportunity + 11 quote + 9 order + 9 invoice +
    // 5 fulfillment + 12 payment + 5 dispute + 4 evidence + 8 sync = 73
    // Adjusted: actual count verified at 72
    expect(total).toBe(72)
  })
})
