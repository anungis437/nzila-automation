/**
 * @nzila/trade-db — Parties repository
 *
 * Org-scoped CRUD for trade parties (sellers, buyers, brokers, agents).
 * Uses createScopedDb for reads, createAuditedScopedDb for writes.
 */

import type { TradeDbContext, TradeReadContext } from '../types'

// ── Port interface (DI-compatible) ──────────────────────────────────────────

export interface TradePartyRow {
  id: string
  entityId: string
  role: string
  name: string
  contactEmail: string
  contactPhone: string | null
  companyName: string
  country: string
  metadata: Record<string, unknown>
  status: string
  createdAt: Date
  updatedAt: Date
}

export interface CreatePartyInput {
  role: string
  name: string
  contactEmail: string
  contactPhone?: string | null
  companyName: string
  country: string
  metadata?: Record<string, unknown>
}

export interface UpdatePartyInput {
  id: string
  role?: string
  name?: string
  contactEmail?: string
  contactPhone?: string | null
  companyName?: string
  country?: string
  metadata?: Record<string, unknown>
  status?: string
}

// ── Repository port ─────────────────────────────────────────────────────────

export interface TradePartyRepository {
  list(ctx: TradeReadContext): Promise<TradePartyRow[]>
  getById(ctx: TradeReadContext, id: string): Promise<TradePartyRow | null>
  create(ctx: TradeDbContext, input: CreatePartyInput): Promise<TradePartyRow>
  update(ctx: TradeDbContext, input: UpdatePartyInput): Promise<TradePartyRow>
}
