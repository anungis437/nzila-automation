/**
 * @nzila/trade-db — Documents repository
 */

import type { TradeDbContext, TradeReadContext } from '../types'

export interface TradeDocumentRow {
  id: string
  entityId: string
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
