/**
 * @nzila/commerce-db — Sync repository
 *
 * Org-scoped CRUD for commerce_sync_jobs and commerce_sync_receipts.
 *
 * @module @nzila/commerce-db/sync
 */
import {
  createScopedDb,
  createAuditedScopedDb,
  commerceSyncJobs,
  commerceSyncReceipts,
} from '@nzila/db'
import { eq } from 'drizzle-orm'
import type { CommerceDbContext, CommerceReadContext, PaginationOpts } from '../types'

// ── Sync Jobs — Reads ─────────────────────────────────────────────────────

export async function listSyncJobs(
  ctx: CommerceReadContext,
  opts: PaginationOpts = {},
) {
  const db = createScopedDb({ orgId: ctx.orgId })
  const limit = Math.min(opts.limit ?? 50, 200)
  const offset = opts.offset ?? 0

  const rows = await db.select(commerceSyncJobs)
  const sorted = rows.sort(
    (a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  )
  return {
    rows: sorted.slice(offset, offset + limit),
    total: sorted.length,
    limit,
    offset,
  }
}

export async function getSyncJobById(
  ctx: CommerceReadContext,
  jobId: string,
) {
  const db = createScopedDb({ orgId: ctx.orgId })
  const rows = await db.select(
    commerceSyncJobs,
    eq(commerceSyncJobs.id, jobId),
  )
  return rows[0] ?? null
}

// ── Sync Jobs — Writes ────────────────────────────────────────────────────

export async function createSyncJob(
  ctx: CommerceDbContext,
  values: {
    provider: string
    type: string
    payload?: Record<string, unknown>
    metadata?: Record<string, unknown>
  },
) {
  const db = createAuditedScopedDb({
    orgId: ctx.orgId,
    actorId: ctx.actorId,
    correlationId: ctx.correlationId,
    actorRole: ctx.actorRole,
  })
  return db.insert(commerceSyncJobs, values)
}

export async function updateSyncJob(
  ctx: CommerceDbContext,
  jobId: string,
  values: {
    status?: string
    attempts?: number
    lastError?: string | null
    metadata?: Record<string, unknown>
  },
) {
  const db = createAuditedScopedDb({
    orgId: ctx.orgId,
    actorId: ctx.actorId,
    correlationId: ctx.correlationId,
    actorRole: ctx.actorRole,
  })
  return db.update(
    commerceSyncJobs,
    { ...values, updatedAt: new Date() },
    eq(commerceSyncJobs.id, jobId),
  )
}

// ── Sync Receipts — Reads ─────────────────────────────────────────────────

export async function listSyncReceipts(
  ctx: CommerceReadContext,
  opts: PaginationOpts = {},
) {
  const db = createScopedDb({ orgId: ctx.orgId })
  const limit = Math.min(opts.limit ?? 50, 200)
  const offset = opts.offset ?? 0

  const rows = await db.select(commerceSyncReceipts)
  const sorted = rows.sort(
    (a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  )
  return {
    rows: sorted.slice(offset, offset + limit),
    total: sorted.length,
    limit,
    offset,
  }
}

export async function getSyncReceiptById(
  ctx: CommerceReadContext,
  receiptId: string,
) {
  const db = createScopedDb({ orgId: ctx.orgId })
  const rows = await db.select(
    commerceSyncReceipts,
    eq(commerceSyncReceipts.id, receiptId),
  )
  return rows[0] ?? null
}

export async function listSyncReceiptsByJob(
  ctx: CommerceReadContext,
  syncJobId: string,
) {
  const db = createScopedDb({ orgId: ctx.orgId })
  return db.select(
    commerceSyncReceipts,
    eq(commerceSyncReceipts.syncJobId, syncJobId),
  )
}

// ── Sync Receipts — Writes ────────────────────────────────────────────────

export async function createSyncReceipt(
  ctx: CommerceDbContext,
  values: {
    syncJobId: string
    provider: string
    recordsSynced?: number
    recordsFailed?: number
    snapshot?: Record<string, unknown>
  },
) {
  const db = createAuditedScopedDb({
    orgId: ctx.orgId,
    actorId: ctx.actorId,
    correlationId: ctx.correlationId,
    actorRole: ctx.actorRole,
  })
  return db.insert(commerceSyncReceipts, values)
}
