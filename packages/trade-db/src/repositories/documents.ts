/**
 * @nzila/trade-db — Documents repository
 */

import type { TradeDbContext, TradeReadContext } from '../types'
import { db } from '@nzila/db'
import { tradeDocuments } from '@nzila/db/schema'
import { eq, and } from 'drizzle-orm'

export interface TradeDocumentRow {
  id: string
  orgId: string
  dealId: string
  docType: string
  title: string
  storageKey: string
  contentHash: string
  uploadedBy: string
  createdAt: Date
}

export interface CreateDocumentInput {
  dealId: string
  docType: string
  title: string
  storageKey: string
  contentHash: string
}

export interface TradeDocumentRepository {
  listByDeal(ctx: TradeReadContext, dealId: string): Promise<TradeDocumentRow[]>
  getById(ctx: TradeReadContext, id: string): Promise<TradeDocumentRow | null>
  create(ctx: TradeDbContext, input: CreateDocumentInput): Promise<TradeDocumentRow>
}

// ── Drizzle implementation ──────────────────────────────────────────────────

function toRow(r: typeof tradeDocuments.$inferSelect): TradeDocumentRow {
  return {
    id: r.id, orgId: r.orgId, dealId: r.dealId,
    docType: r.docType, title: r.title,
    storageKey: r.storageKey, contentHash: r.contentHash,
    uploadedBy: r.uploadedBy, createdAt: r.createdAt,
  }
}

export function createTradeDocumentRepository(): TradeDocumentRepository {
  return {
    async listByDeal(ctx, dealId) {
      const rows = await db.select().from(tradeDocuments).where(and(eq(tradeDocuments.orgId, ctx.orgId), eq(tradeDocuments.dealId, dealId)))
      return rows.map(toRow)
    },
    async getById(ctx, id) {
      const [row] = await db.select().from(tradeDocuments).where(and(eq(tradeDocuments.orgId, ctx.orgId), eq(tradeDocuments.id, id)))
      return row ? toRow(row) : null
    },
    async create(ctx, input) {
      const [row] = await db.insert(tradeDocuments).values({
        orgId: ctx.orgId, dealId: input.dealId,
        docType: input.docType as typeof tradeDocuments.$inferInsert.docType,
        title: input.title, storageKey: input.storageKey,
        contentHash: input.contentHash, uploadedBy: ctx.actorId,
      }).returning()
      return toRow(row!)
    },
  }
}
