/**
 * Trade Server Actions — Documents.
 *
 * Document upload for deals.
 * Every action calls `resolveOrgContext()` first and emits audit.
 */
'use server'

import { resolveOrgContext } from '@/lib/resolve-org'
import { revalidatePath } from 'next/cache'
import {
  uploadDocumentSchema,
  buildActionAuditEntry,
  type TradeServiceResult,
  type TradeDocument,
} from '@nzila/trade-core'
import { createTradeDocumentRepository } from '@nzila/trade-db'

const repo = createTradeDocumentRepository()

export async function uploadDocument(
  data: unknown,
): Promise<TradeServiceResult<{ documentId: string }>> {
  const ctx = await resolveOrgContext()
  const parsed = uploadDocumentSchema.safeParse(data)

  if (!parsed.success) {
    return { ok: false, data: null, error: parsed.error.message, auditEntries: [] }
  }

  const dbCtx = { orgId: ctx.orgId, actorId: ctx.actorId }
  const row = await repo.create(dbCtx, parsed.data)

  const entry = buildActionAuditEntry({
    id: crypto.randomUUID(),
    orgId: ctx.orgId,
    actorId: ctx.actorId,
    role: ctx.role,
    entityType: 'trade_document',
    targetEntityId: row.id,
    action: 'document.uploaded',
    label: `Uploaded ${parsed.data.docType} for deal ${parsed.data.dealId}`,
    metadata: {
      dealId: parsed.data.dealId,
      docType: parsed.data.docType,
      contentHash: parsed.data.contentHash,
    },
  })

  revalidatePath('/trade/deals')

  return { ok: true, data: { documentId: row.id }, error: null, auditEntries: [entry] }
}

export async function listDocumentsForDeal(
  dealId: string,
): Promise<TradeServiceResult<{ documents: TradeDocument[] }>> {
  const ctx = await resolveOrgContext()

  const rows = await repo.listByDeal({ orgId: ctx.orgId }, dealId)

  return {
    ok: true,
    data: { documents: rows as unknown as TradeDocument[] },
    error: null,
    auditEntries: [],
  }
}
