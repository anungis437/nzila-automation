/**
 * @nzila/shop-quoter — Adapter Service
 *
 * Orchestrates the full migration/adaptation flow from legacy ShopMoiÇa
 * data into the NzilaOS commerce engine.
 *
 * Architecture:
 *   Legacy Supabase tables
 *     ↓  (extract)
 *   Zod-validated legacy types
 *     ↓  (mapper.ts — pure transforms)
 *   @nzila/commerce-core canonical types
 *     ↓  (commerce-services — orchestrated lifecycle)
 *   NzilaOS commerce entities (quotes, customers, audit trail)
 *
 * Design rules:
 *  - Adapter owns the legacy ↔ canonical boundary; nothing else touches legacy shapes
 *  - All DB operations injected via ports (QuoteRepository, CustomerRepository)
 *  - Batch operations produce a BatchImportSummary with per-record diagnostics
 *  - Every import action produces audit entries (via commerce-services)
 *  - Idempotent: re-importing the same legacy ID updates rather than duplicates
 *
 * IRAP relevance:
 *  - Evidence trail: every adaptation produces AuditEntry records
 *  - Data lineage: legacy IDs preserved in externalIds/metadata
 *  - Validation: Zod schemas enforce legacy data integrity before entry
 *  - Org isolation: all operations scoped via OrgContext.entityId
 *
 * @module @nzila/shop-quoter/adapter
 */
import type { OrgContext } from '@nzila/commerce-core/types'
import type {
  QuoteRepository,
  QuoteEntity,
} from '@nzila/commerce-services/quote'
import { createQuoteService } from '@nzila/commerce-services'
import {
  buildActionAuditEntry,
  CommerceEntityType,
  AuditAction,
  type AuditEntry,
} from '@nzila/commerce-audit'
import { OrgRole } from '@nzila/commerce-core/enums'
import type { PricingTemplate } from '@nzila/pricing-engine'
import {
  mapRequestToQuoteInput,
  mapLegacyClient,
  mapLegacyStatus,
  buildMigrationContext,
} from './mapper'
import {
  legacyRequestSchema,
  legacyProposalSchema,
  legacyClientSchema,
  type LegacyRequest,
  type LegacyProposal,
  type LegacyClient,
  type ShopQuoterAdapterConfig,
  type BatchImportSummary,
  type AdapterResult,
  DEFAULT_ADAPTER_CONFIG,
} from './types'

// ── Port Interfaces ─────────────────────────────────────────────────────────

/**
 * Customer persistence port (injected by caller).
 */
export interface CustomerRepository {
  findByExternalId(ctx: OrgContext, key: string, value: string): Promise<{ id: string } | null>
  createCustomer(
    ctx: OrgContext,
    data: {
      name: string
      email: string | null
      phone: string | null
      externalIds: Record<string, string>
    },
  ): Promise<{ id: string }>
}

// ── Adapter Factory ─────────────────────────────────────────────────────────

/**
 * Create a Shop Quoter adapter instance.
 *
 * The adapter encapsulates all legacy-to-NzilaOS transformation logic
 * and delegates persistence to injected repository ports.
 */
export function createShopQuoterAdapter(
  quoteRepo: QuoteRepository,
  customerRepo: CustomerRepository,
  config?: Partial<ShopQuoterAdapterConfig>,
  pricingTemplate?: PricingTemplate,
) {
  const resolvedConfig: ShopQuoterAdapterConfig = { ...DEFAULT_ADAPTER_CONFIG, ...config }
  const quoteService = createQuoteService(quoteRepo, pricingTemplate)

  // ── Single Record Import ────────────────────────────────────────────────

  /**
   * Import a single legacy request + optional proposal into NzilaOS.
   *
   * Flow:
   *  1. Validate legacy data via Zod
   *  2. Resolve or create customer
   *  3. Map to CreateQuoteInput
   *  4. Create quote via commerce-services
   *  5. Return result with audit entries
   */
  async function importRequest(
    rawRequest: unknown,
    rawProposal: unknown | null,
    rawClient: unknown | null,
    requestId?: string,
  ): Promise<AdapterResult<{ quoteId: string; auditEntries: readonly AuditEntry[] }>> {
    const reqId = requestId ?? crypto.randomUUID()
    const ctx = buildMigrationContext(resolvedConfig, reqId)

    // 1. Validate legacy shapes
    const reqParse = legacyRequestSchema.safeParse(rawRequest)
    if (!reqParse.success) {
      return {
        ok: false,
        error: `Invalid legacy request: ${reqParse.error.message}`,
        legacyId: (rawRequest as { id?: string })?.id ?? 'unknown',
      }
    }
    const legacyRequest: LegacyRequest = reqParse.data as LegacyRequest

    let legacyProposal: LegacyProposal | null = null
    if (rawProposal !== null && rawProposal !== undefined) {
      const propParse = legacyProposalSchema.safeParse(rawProposal)
      if (!propParse.success) {
        return {
          ok: false,
          error: `Invalid legacy proposal: ${propParse.error.message}`,
          legacyId: legacyRequest.id,
        }
      }
      legacyProposal = propParse.data as LegacyProposal
    }

    // 2. Resolve customer
    let customerId: string
    if (rawClient) {
      const clientParse = legacyClientSchema.safeParse(rawClient)
      if (!clientParse.success) {
        return {
          ok: false,
          error: `Invalid legacy client: ${clientParse.error.message}`,
          legacyId: legacyRequest.id,
        }
      }
      const legacyClient = clientParse.data as LegacyClient

      // Check for existing customer by legacy ID
      const existing = await customerRepo.findByExternalId(
        ctx,
        'legacyClientId',
        legacyClient.id,
      )
      if (existing) {
        customerId = existing.id
      } else {
        const mapped = mapLegacyClient(legacyClient, ctx.entityId)
        if (!mapped.ok) {
          return { ok: false, error: mapped.error, legacyId: legacyRequest.id }
        }
        const created = await customerRepo.createCustomer(ctx, {
          name: mapped.data.name,
          email: mapped.data.email,
          phone: mapped.data.phone,
          externalIds: mapped.data.externalIds,
        })
        customerId = created.id
      }
    } else {
      customerId = legacyRequest.client_id
    }

    // 3. Map to CreateQuoteInput
    const mappingResult = mapRequestToQuoteInput(
      { ...legacyRequest, client_id: customerId },
      legacyProposal,
      resolvedConfig,
    )
    if (!mappingResult.ok) {
      return { ok: false, error: mappingResult.error, legacyId: legacyRequest.id }
    }

    // 4. Create quote
    const quoteResult = await quoteService.createQuote(ctx, mappingResult.data)
    if (!quoteResult.ok) {
      return { ok: false, error: quoteResult.error, legacyId: legacyRequest.id }
    }

    // 5. Build migration audit entry
    const migrationAudit = buildActionAuditEntry({
      id: crypto.randomUUID(),
      entityId: ctx.entityId,
      actorId: ctx.actorId,
      role: ctx.role as OrgRole,
      entityType: CommerceEntityType.QUOTE,
      targetEntityId: quoteResult.data.id,
      action: AuditAction.CREATE,
      label: 'Migrated from legacy Shop Quoter',
      metadata: {
        legacyRequestId: legacyRequest.id,
        legacyProposalId: legacyProposal?.id ?? null,
        legacyStatus: legacyRequest.status,
        mappedStatus: mapLegacyStatus(legacyRequest.status),
        source: 'shop-quoter-adapter',
        warnings: mappingResult.warnings,
      },
    })

    const allAuditEntries = [...quoteResult.auditEntries, migrationAudit]

    return {
      ok: true,
      data: { quoteId: quoteResult.data.id, auditEntries: allAuditEntries },
      warnings: mappingResult.warnings,
    }
  }

  // ── Batch Import ────────────────────────────────────────────────────────

  /**
   * Import a batch of legacy records.
   *
   * Processes sequentially to maintain ordering guarantees.
   * Returns a comprehensive summary with per-record diagnostics.
   */
  async function importBatch(
    records: readonly {
      request: unknown
      proposal: unknown | null
      client: unknown | null
    }[],
  ): Promise<BatchImportSummary> {
    const startTime = Date.now()
    const failures: { legacyId: string; error: string }[] = []
    const warnings: { legacyId: string; message: string }[] = []
    let successCount = 0

    for (const record of records) {
      const result = await importRequest(
        record.request,
        record.proposal,
        record.client,
      )

      if (result.ok) {
        successCount++
        for (const w of result.warnings) {
          const legacyId =
            (record.request as { id?: string })?.id ?? 'unknown'
          warnings.push({ legacyId, message: w })
        }
      } else {
        failures.push({ legacyId: result.legacyId, error: result.error })
      }
    }

    return {
      totalRecords: records.length,
      successCount,
      failureCount: failures.length,
      warningCount: warnings.length,
      failures,
      warnings,
      durationMs: Date.now() - startTime,
    }
  }

  // ── Validation-Only Mode ──────────────────────────────────────────────

  /**
   * Dry-run validation: validates legacy data shapes without persisting.
   * Useful for pre-flight checks before a migration run.
   */
  function validateLegacyData(
    records: readonly {
      request: unknown
      proposal: unknown | null
      client: unknown | null
    }[],
  ): { valid: number; invalid: number; errors: { index: number; error: string }[] } {
    const errors: { index: number; error: string }[] = []
    let valid = 0

    for (let i = 0; i < records.length; i++) {
      const record = records[i]!
      const reqParse = legacyRequestSchema.safeParse(record.request)
      if (!reqParse.success) {
        errors.push({ index: i, error: `Request: ${reqParse.error.message}` })
        continue
      }
      if (record.proposal !== null && record.proposal !== undefined) {
        const propParse = legacyProposalSchema.safeParse(record.proposal)
        if (!propParse.success) {
          errors.push({ index: i, error: `Proposal: ${propParse.error.message}` })
          continue
        }
      }
      if (record.client !== null && record.client !== undefined) {
        const clientParse = legacyClientSchema.safeParse(record.client)
        if (!clientParse.success) {
          errors.push({ index: i, error: `Client: ${clientParse.error.message}` })
          continue
        }
      }
      valid++
    }

    return { valid, invalid: errors.length, errors }
  }

  return {
    importRequest,
    importBatch,
    validateLegacyData,
  }
}
