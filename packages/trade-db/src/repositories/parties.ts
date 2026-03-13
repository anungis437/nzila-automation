/**
 * @nzila/trade-db — Parties repository
 *
 * Org-scoped CRUD for trade parties (sellers, buyers, brokers, agents).
 * Uses createScopedDb for reads, createAuditedScopedDb for writes.
 */

import type { TradeDbContext, TradeReadContext } from '../types'
import { db } from '@nzila/db'
import { tradeParties } from '@nzila/db/schema'
import { eq, and } from 'drizzle-orm'

// ── Port interface (DI-compatible) ──────────────────────────────────────────

export interface TradePartyRow {
  id: string
  orgId: string
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

// ── Drizzle implementation ──────────────────────────────────────────────────

function toRow(r: typeof tradeParties.$inferSelect): TradePartyRow {
  return {
    id: r.id,
    orgId: r.orgId,
    role: r.role,
    name: r.name,
    contactEmail: r.contactEmail,
    contactPhone: r.contactPhone,
    companyName: r.companyName,
    country: r.country,
    metadata: (r.metadata ?? {}) as Record<string, unknown>,
    status: r.status,
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
  }
}

export function createTradePartyRepository(): TradePartyRepository {
  return {
    async list(ctx) {
      const rows = await db.select().from(tradeParties).where(eq(tradeParties.orgId, ctx.orgId))
      return rows.map(toRow)
    },
    async getById(ctx, id) {
      const [row] = await db.select().from(tradeParties).where(and(eq(tradeParties.orgId, ctx.orgId), eq(tradeParties.id, id)))
      return row ? toRow(row) : null
    },
    async create(ctx, input) {
      const [row] = await db.insert(tradeParties).values({
        orgId: ctx.orgId,
        role: input.role as typeof tradeParties.$inferInsert.role,
        name: input.name,
        contactEmail: input.contactEmail,
        contactPhone: input.contactPhone ?? null,
        companyName: input.companyName,
        country: input.country,
        metadata: input.metadata ?? {},
      }).returning()
      return toRow(row!)
    },
    async update(ctx, input) {
      const updates: Record<string, unknown> = { updatedAt: new Date() }
      if (input.role !== undefined) updates.role = input.role
      if (input.name !== undefined) updates.name = input.name
      if (input.contactEmail !== undefined) updates.contactEmail = input.contactEmail
      if (input.contactPhone !== undefined) updates.contactPhone = input.contactPhone
      if (input.companyName !== undefined) updates.companyName = input.companyName
      if (input.country !== undefined) updates.country = input.country
      if (input.metadata !== undefined) updates.metadata = input.metadata
      if (input.status !== undefined) updates.status = input.status
      const [row] = await db.update(tradeParties).set(updates).where(and(eq(tradeParties.orgId, ctx.orgId), eq(tradeParties.id, input.id))).returning()
      return toRow(row!)
    },
  }
}
