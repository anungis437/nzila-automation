/**
 * Database helpers for Shop Quoter app.
 *
 * Provides in-memory stubs matching the QuoteRepository and
 * CustomerRepository port interfaces expected by @nzila/shop-quoter adapter.
 * Replace with real Drizzle/Supabase queries when DB layer is ready.
 */
// ── Local types (mirrors @nzila/commerce-core shapes) ──────────────────────

export interface QuoteLine {
  id: string
  description: string
  sku: string
  quantity: number
  unitCost: number
  lineTotal: number
  displayOrder: number
}

export interface Quote {
  id: string
  entityId: string
  reference: string
  status: string
  title: string
  tier: string
  customerId: string
  boxCount: number
  theme: string | null
  notes: string | null
  validUntilDays: number
  lines: QuoteLine[]
  subtotal: number
  gst: number
  qst: number
  total: number
  createdAt: string
  updatedAt: string
  createdBy: string
}

export interface CreateQuoteInput {
  entityId: string
  title?: string
  tier: string
  customerId: string
  boxCount?: number
  theme?: string
  notes?: string
  validUntilDays?: number
  lines?: QuoteLine[]
  subtotal?: number
  gst?: number
  qst?: number
  total?: number
  createdBy?: string
}

export interface CustomerAddress {
  line1?: string
  line2?: string
  city?: string
  province?: string
  postalCode?: string
  country?: string
}

// ── Quote Repository (port) ────────────────────────────────────────────────

export interface QuoteRepository {
  create(input: CreateQuoteInput): Promise<Quote>
  findById(id: string): Promise<Quote | null>
  findAll(entityId: string): Promise<Quote[]>
  update(id: string, patch: Partial<Quote>): Promise<Quote>
}

const quotesStore = new Map<string, Quote>()

function generateRef(): string {
  const n = quotesStore.size + 1
  return `SQ-2026-${String(n).padStart(3, '0')}`
}

export const quoteRepo: QuoteRepository = {
  async create(input) {
    const id = crypto.randomUUID()
    const now = new Date().toISOString()
    const quote: Quote = {
      id,
      entityId: input.entityId,
      reference: generateRef(),
      status: 'DRAFT',
      title: input.title ?? '',
      tier: input.tier,
      customerId: input.customerId,
      boxCount: input.boxCount ?? 1,
      theme: input.theme ?? null,
      notes: input.notes ?? null,
      validUntilDays: input.validUntilDays ?? 30,
      lines: input.lines ?? [],
      subtotal: input.subtotal ?? 0,
      gst: input.gst ?? 0,
      qst: input.qst ?? 0,
      total: input.total ?? 0,
      createdAt: now,
      updatedAt: now,
      createdBy: input.createdBy ?? 'system',
    }
    quotesStore.set(id, quote)
    return quote
  },
  async findById(id) {
    return quotesStore.get(id) ?? null
  },
  async findAll(_entityId) {
    return Array.from(quotesStore.values())
  },
  async update(id, patch) {
    const existing = quotesStore.get(id)
    if (!existing) throw new Error(`Quote ${id} not found`)
    const updated = { ...existing, ...patch, updatedAt: new Date().toISOString() }
    quotesStore.set(id, updated)
    return updated
  },
}

// ── Customer Repository (port) ─────────────────────────────────────────────

export interface CustomerRecord {
  id: string
  entityId: string
  name: string
  email: string | null
  phone: string | null
  address: CustomerAddress | null
  zohoContactId: string | null
  createdAt: string
}

const customersStore = new Map<string, CustomerRecord>()

export const customerRepo = {
  async findByEmail(email: string): Promise<CustomerRecord | null> {
    for (const c of Array.from(customersStore.values())) {
      if (c.email === email) return c
    }
    return null
  },
  async findById(id: string): Promise<CustomerRecord | null> {
    return customersStore.get(id) ?? null
  },
  async findAll(): Promise<CustomerRecord[]> {
    return Array.from(customersStore.values())
  },
  async create(data: Omit<CustomerRecord, 'id' | 'createdAt'>): Promise<CustomerRecord> {
    const id = crypto.randomUUID()
    const record: CustomerRecord = {
      ...data,
      id,
      createdAt: new Date().toISOString(),
    }
    customersStore.set(id, record)
    return record
  },
}
