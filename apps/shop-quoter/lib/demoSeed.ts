/**
 * Shop Quoter — Demo Seed Data
 *
 * Creates demo org, users, workflow examples, and analytics data
 * for pilot demonstrations.
 *
 * Includes the full ShopMoiCa lifecycle samples:
 * - Draft quote
 * - Revision flow (sent → revision → re-sent → accepted)
 * - Deposit-required flow (accepted → deposit → ready for PO)
 * - In-production flow (PO → production → shipped → delivered)
 * - Invoice-linked (closed with payment)
 */
import { logger } from '@/lib/logger'
import {
  db,
  commerceCustomers,
  commerceQuotes,
  commerceQuoteLines,
  commerceTimelineEvents,
} from '@nzila/db'

export interface DemoOrg {
  id: string
  name: string
  tier: string
}

export interface DemoUser {
  id: string
  email: string
  role: string
  orgId: string
}

export interface DemoCustomer {
  id: string
  name: string
  email: string
  company: string
}

export interface DemoQuote {
  id: string
  ref: string
  orgId: string
  customerId: string
  title: string
  status: string
  lines: Array<{ productId: string; description: string; quantity: number; unitPrice: number }>
  total: number
  notes?: string
}

export interface DemoTimeline {
  quoteId: string
  events: Array<{ event: string; description: string; actor: string }>
}

export function createDemoOrg(): DemoOrg {
  return { id: 'demo-org-quoter', name: 'ShopMoiCa Demo Corp', tier: 'PREMIUM' }
}

export function createDemoUsers(orgId: string): DemoUser[] {
  return [
    { id: 'demo-admin', email: 'admin@shopmoica.demo', role: 'admin', orgId },
    { id: 'demo-sales', email: 'sales@shopmoica.demo', role: 'sales', orgId },
    { id: 'demo-finance', email: 'finance@shopmoica.demo', role: 'finance', orgId },
    { id: 'demo-production', email: 'production@shopmoica.demo', role: 'production', orgId },
  ]
}

export function createDemoCustomers(): DemoCustomer[] {
  return [
    { id: 'demo-customer-1', name: 'Marie Tremblay', email: 'marie@example.ca', company: 'Tremblay & Fils' },
    { id: 'demo-customer-2', name: 'Jean-Paul Bergeron', email: 'jp@example.ca', company: 'Bergeron Industriel' },
    { id: 'demo-customer-3', name: 'Sophie Lavoie', email: 'sophie@example.ca', company: 'Lavoie Imports' },
    { id: 'demo-customer-4', name: 'Pierre Gagnon', email: 'pierre@example.ca', company: 'Gagnon Construction' },
    { id: 'demo-customer-5', name: 'Isabelle Roy', email: 'isabelle@example.ca', company: 'Roy Distribution' },
  ]
}

export function createDemoQuotes(orgId: string): DemoQuote[] {
  return [
    // 1. Fresh draft
    {
      id: 'demo-quote-001',
      ref: 'SQ-2026-001',
      orgId,
      customerId: 'demo-customer-1',
      title: 'Custom Signage Package — Tremblay',
      status: 'DRAFT',
      lines: [
        { productId: 'prod-sign-lg', description: 'Large Exterior Sign', quantity: 2, unitPrice: 1200 },
        { productId: 'prod-sign-sm', description: 'Interior Directional Sign', quantity: 8, unitPrice: 150 },
      ],
      total: 3600,
      notes: 'Client prefers blue/white colour scheme',
    },
    // 2. Revision flow — currently back in REVISION_REQUESTED
    {
      id: 'demo-quote-002',
      ref: 'SQ-2026-002',
      orgId,
      customerId: 'demo-customer-2',
      title: 'Industrial Shelving — Bergeron',
      status: 'REVISION_REQUESTED',
      lines: [
        { productId: 'prod-shelf-hd', description: 'Heavy-Duty Shelving Unit', quantity: 20, unitPrice: 450 },
        { productId: 'prod-bracket', description: 'Wall Bracket Kit', quantity: 20, unitPrice: 35 },
      ],
      total: 9700,
      notes: 'Client wants revised delivery timeline',
    },
    // 3. Deposit-required flow — awaiting deposit
    {
      id: 'demo-quote-003',
      ref: 'SQ-2026-003',
      orgId,
      customerId: 'demo-customer-3',
      title: 'Office Furniture Set — Lavoie',
      status: 'DEPOSIT_REQUIRED',
      lines: [
        { productId: 'prod-desk-exec', description: 'Executive Desk', quantity: 5, unitPrice: 2200 },
        { productId: 'prod-chair-ergo', description: 'Ergonomic Chair', quantity: 10, unitPrice: 850 },
      ],
      total: 19500,
      notes: '30% deposit required before production',
    },
    // 4. Ready for PO — deposit cleared
    {
      id: 'demo-quote-004',
      ref: 'SQ-2026-004',
      orgId,
      customerId: 'demo-customer-4',
      title: 'Construction Equipment — Gagnon',
      status: 'READY_FOR_PO',
      lines: [
        { productId: 'prod-drill-ind', description: 'Industrial Drill Press', quantity: 2, unitPrice: 4500 },
        { productId: 'prod-saw-band', description: 'Band Saw Professional', quantity: 1, unitPrice: 3200 },
      ],
      total: 12200,
    },
    // 5. In production
    {
      id: 'demo-quote-005',
      ref: 'SQ-2026-005',
      orgId,
      customerId: 'demo-customer-5',
      title: 'Distribution Center Racking — Roy',
      status: 'IN_PRODUCTION',
      lines: [
        { productId: 'prod-rack-pallet', description: 'Pallet Racking System', quantity: 50, unitPrice: 320 },
        { productId: 'prod-rack-wire', description: 'Wire Decking', quantity: 100, unitPrice: 45 },
      ],
      total: 20500,
    },
    // 6. Shipped
    {
      id: 'demo-quote-006',
      ref: 'SQ-2026-006',
      orgId,
      customerId: 'demo-customer-1',
      title: 'Replacement Signs — Tremblay (follow-up)',
      status: 'SHIPPED',
      lines: [
        { productId: 'prod-sign-sm', description: 'Interior Directional Sign', quantity: 4, unitPrice: 150 },
      ],
      total: 600,
    },
    // 7. Delivered + closed — full lifecycle complete
    {
      id: 'demo-quote-007',
      ref: 'SQ-2026-007',
      orgId,
      customerId: 'demo-customer-2',
      title: 'Shelving Phase 1 — Bergeron (historical)',
      status: 'CLOSED',
      lines: [
        { productId: 'prod-shelf-hd', description: 'Heavy-Duty Shelving Unit', quantity: 10, unitPrice: 450 },
      ],
      total: 4500,
    },
  ]
}

export function createDemoTimelines(): DemoTimeline[] {
  return [
    {
      quoteId: 'demo-quote-002',
      events: [
        { event: 'created', description: 'Quote created', actor: 'demo-sales' },
        { event: 'submitted_for_review', description: 'Submitted for internal review', actor: 'demo-sales' },
        { event: 'sent_to_client', description: 'Sent to Jean-Paul Bergeron', actor: 'demo-admin' },
        { event: 'revision_requested', description: 'Client requested revised delivery timeline', actor: 'client' },
      ],
    },
    {
      quoteId: 'demo-quote-003',
      events: [
        { event: 'created', description: 'Quote created', actor: 'demo-sales' },
        { event: 'sent_to_client', description: 'Sent to Sophie Lavoie', actor: 'demo-sales' },
        { event: 'accepted', description: 'Client accepted', actor: 'client' },
        { event: 'deposit_requirement_set', description: 'Deposit: 30% ($5,850.00)', actor: 'demo-finance' },
      ],
    },
    {
      quoteId: 'demo-quote-005',
      events: [
        { event: 'created', description: 'Quote created', actor: 'demo-sales' },
        { event: 'accepted', description: 'Client accepted', actor: 'client' },
        { event: 'deposit_cleared', description: 'Deposit $6,150 received', actor: 'demo-finance' },
        { event: 'po_created', description: 'PO-2026-012 created', actor: 'demo-admin' },
        { event: 'production_started', description: 'Production started', actor: 'demo-production' },
      ],
    },
    {
      quoteId: 'demo-quote-007',
      events: [
        { event: 'created', description: 'Quote created', actor: 'demo-sales' },
        { event: 'accepted', description: 'Client accepted', actor: 'client' },
        { event: 'po_created', description: 'PO-2026-005 created', actor: 'demo-admin' },
        { event: 'production_started', description: 'Production started', actor: 'demo-production' },
        { event: 'order_shipped', description: 'Shipped via Purolator', actor: 'demo-production' },
        { event: 'order_delivered', description: 'Delivered to client', actor: 'demo-production' },
        { event: 'quote_closed', description: 'Quote closed — lifecycle complete', actor: 'demo-admin' },
      ],
    },
  ]
}

export function createDemoAnalytics() {
  return {
    quotesThisMonth: 47,
    conversionRate: 0.68,
    avgQuoteValue: 8500,
    topProducts: ['Heavy-Duty Shelving Unit', 'Executive Desk', 'Industrial Drill Press'],
    statusBreakdown: {
      DRAFT: 12,
      INTERNAL_REVIEW: 3,
      SENT_TO_CLIENT: 8,
      REVISION_REQUESTED: 2,
      ACCEPTED: 5,
      DEPOSIT_REQUIRED: 3,
      READY_FOR_PO: 4,
      IN_PRODUCTION: 6,
      SHIPPED: 2,
      DELIVERED: 1,
      CLOSED: 1,
    },
  }
}

export async function seedDemo() {
  const org = createDemoOrg()
  const users = createDemoUsers(org.id)
  const customers = createDemoCustomers()
  const quotes = createDemoQuotes(org.id)
  const timelines = createDemoTimelines()
  const analytics = createDemoAnalytics()

  // Insert customers into DB
  for (const c of customers) {
    await db
      .insert(commerceCustomers)
      .values({
        id: c.id,
        orgId: org.id,
        name: c.name,
        email: c.email,
        metadata: { company: c.company },
      })
      .onConflictDoNothing()
  }

  // Insert quotes + lines into DB
  for (const q of quotes) {
    const subtotal = q.lines.reduce((s, l) => s + l.quantity * l.unitPrice, 0)
    const gst = subtotal * 0.05
    const qst = subtotal * 0.09975
    const total = subtotal + gst + qst

    await db
      .insert(commerceQuotes)
      .values({
        id: q.id,
        orgId: q.orgId,
        ref: q.ref,
        customerId: q.customerId,
        status: q.status.toLowerCase() as 'draft',
        pricingTier: 'standard',
        currency: 'CAD',
        subtotal: String(subtotal),
        taxTotal: String(gst + qst),
        total: String(total),
        notes: q.notes ?? null,
        metadata: { title: q.title, boxCount: 1, gst, qst },
        createdBy: 'demo-seed',
      })
      .onConflictDoNothing()

    for (const line of q.lines) {
      await db
        .insert(commerceQuoteLines)
        .values({
          id: crypto.randomUUID(),
          orgId: q.orgId,
          quoteId: q.id,
          description: line.description,
          quantity: line.quantity,
          unitPrice: String(line.unitPrice),
          lineTotal: String(line.quantity * line.unitPrice),
          sortOrder: 0,
        })
        .onConflictDoNothing()
    }
  }

  // Insert timeline events into DB
  for (const tl of timelines) {
    for (const evt of tl.events) {
      await db
        .insert(commerceTimelineEvents)
        .values({
          orgId: org.id,
          quoteId: tl.quoteId,
          event: evt.event,
          description: evt.description,
          actor: evt.actor,
        })
        .onConflictDoNothing()
    }
  }

  logger.info(
    'Shop Quoter demo data seeded to database',
    {
      org: org.name,
      users: users.length,
      customers: customers.length,
      quotes: quotes.length,
      timelines: timelines.length,
    },
  )

  return { org, users, customers, quotes, timelines, analytics }
}

if (process.argv[1]?.includes('demoSeed')) {
  seedDemo().catch((err) => logger.error('Demo seed failed', { error: err }))
}
