'use server'

/**
 * Server Actions — Shop Quoter
 *
 * These Next.js server actions handle form submissions and mutations from the
 * client-side UI. They bridge React forms to the NzilaOS commerce engine via
 * the @nzila/shop-quoter adapter and the pricing-engine.
 */
import { quoteRepo, customerRepo } from '@/lib/db'
import type { CustomerRecord } from '@/lib/db'

// ── Types ──────────────────────────────────────────────────────────────────

interface LineInput {
  description: string
  sku: string
  quantity: number
  unitCost: number
}

interface CreateQuoteFormData {
  clientName: string
  clientEmail: string
  clientPhone: string
  title: string
  tier: 'BUDGET' | 'STANDARD' | 'PREMIUM'
  boxCount: number
  theme: string
  notes: string
  lines: LineInput[]
}

export interface ActionResult<T = unknown> {
  ok: boolean
  data?: T
  error?: string
}

// GST/QST rates (Quebec)
const GST_RATE = 0.05
const QST_RATE = 0.09975

// ── Create Quote ───────────────────────────────────────────────────────────

export async function createQuoteAction(
  formData: CreateQuoteFormData,
): Promise<ActionResult<{ id: string; reference: string }>> {
  try {
    // 1. Resolve or create customer
    let customer: CustomerRecord | null = null
    if (formData.clientEmail) {
      customer = await customerRepo.findByEmail(formData.clientEmail)
    }
    if (!customer) {
      customer = await customerRepo.create({
        entityId: 'default', // TODO: pull from Clerk org
        name: formData.clientName,
        email: formData.clientEmail || null,
        phone: formData.clientPhone || null,
        address: null,
        zohoContactId: null,
      })
    }

    // 2. Calculate totals
    const subtotal = formData.lines.reduce(
      (sum, l) => sum + l.quantity * l.unitCost,
      0,
    )
    const gst = subtotal * GST_RATE
    const qst = (subtotal + gst) * QST_RATE
    const total = subtotal + gst + qst

    // 3. Create quote via repository
    const quote = await quoteRepo.create({
      entityId: 'default',
      title: formData.title,
      tier: formData.tier,
      customerId: customer.id,
      boxCount: formData.boxCount,
      theme: formData.theme || undefined,
      notes: formData.notes || undefined,
      lines: formData.lines.map((l, idx) => ({
        id: crypto.randomUUID(),
        description: l.description,
        sku: l.sku,
        quantity: l.quantity,
        unitCost: l.unitCost,
        lineTotal: l.quantity * l.unitCost,
        displayOrder: idx + 1,
      })),
      subtotal,
      gst,
      qst,
      total,
    })

    return { ok: true, data: { id: quote.id, reference: quote.reference } }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to create quote'
    return { ok: false, error: message }
  }
}

// ── Import Legacy Records ──────────────────────────────────────────────────

interface LegacyRecord {
  id: string
  client_id: string
  title: string
  box_count: number
  budget_range?: string
  theme?: string
  notes?: string | null
  status?: string
  created_by?: string
  created_at?: string
  updated_at?: string
}

export interface ImportResult {
  totalRecords: number
  successCount: number
  failureCount: number
  warningCount: number
  failures: { legacyId: string; error: string }[]
  warnings: { legacyId: string; message: string }[]
  durationMs: number
}

export async function importLegacyRecordsAction(
  records: LegacyRecord[],
): Promise<ActionResult<ImportResult>> {
  const start = Date.now()
  const failures: ImportResult['failures'] = []
  const warnings: ImportResult['warnings'] = []
  let successCount = 0

  for (const record of records) {
    try {
      // Map tier from budget_range
      let tier: 'BUDGET' | 'STANDARD' | 'PREMIUM' = 'STANDARD'
      const range = record.budget_range?.toLowerCase()
      if (range === 'budget' || range === 'economy' || range === 'basic') {
        tier = 'BUDGET'
      } else if (range === 'premium' || range === 'luxury' || range === 'vip') {
        tier = 'PREMIUM'
      }

      await quoteRepo.create({
        entityId: 'default',
        title: record.title,
        tier,
        customerId: record.client_id,
        boxCount: record.box_count,
        theme: record.theme ?? undefined,
        notes: record.notes ?? undefined,
        lines: [],
      })

      successCount++
    } catch (err) {
      failures.push({
        legacyId: record.id,
        error: err instanceof Error ? err.message : 'Unknown error',
      })
    }
  }

  return {
    ok: true,
    data: {
      totalRecords: records.length,
      successCount,
      failureCount: failures.length,
      warningCount: warnings.length,
      failures,
      warnings,
      durationMs: Date.now() - start,
    },
  }
}

// ── Validate Legacy Data (dry-run) ─────────────────────────────────────────

export async function validateLegacyDataAction(
  records: LegacyRecord[],
): Promise<ActionResult<{ valid: boolean; errors: string[] }>> {
  const errors: string[] = []

  records.forEach((record, idx) => {
    if (!record.id) errors.push(`Record ${idx}: missing "id"`)
    if (!record.title) errors.push(`Record ${idx}: missing "title"`)
    if (!record.client_id) errors.push(`Record ${idx}: missing "client_id"`)
    if (typeof record.box_count !== 'number') {
      errors.push(`Record ${idx}: "box_count" must be a number`)
    }
  })

  return { ok: true, data: { valid: errors.length === 0, errors } }
}

// ── Update Quote Status ────────────────────────────────────────────────────

export async function updateQuoteStatusAction(
  quoteId: string,
  newStatus: string,
): Promise<ActionResult<{ id: string; status: string }>> {
  try {
    const quote = await quoteRepo.findById(quoteId)
    if (!quote) return { ok: false, error: `Quote ${quoteId} not found` }

    const updated = await quoteRepo.update(quoteId, {
      status: newStatus,
    })
    return { ok: true, data: { id: updated.id, status: newStatus } }
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Failed to update status',
    }
  }
}
