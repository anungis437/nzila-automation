/**
 * Zonga Server Actions — Events & Ticketing.
 *
 * Create and manage live events, sell tickets via Stripe checkout,
 * and track ticket inventory / attendance.
 */
'use server'

import { resolveOrgContext } from '@/lib/resolve-org'
import { platformDb } from '@nzila/db/platform'
import { sql } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { logger } from '@/lib/logger'
import {
  buildZongaAuditEvent,
  ZongaAuditAction,
  ZongaEntityType,
} from '@/lib/zonga-services'
import { createCheckoutSession } from '@/lib/stripe'
import { buildEvidencePackFromAction, processEvidencePack } from '@/lib/evidence'

/* ─── Types ─── */

export interface ZongaEvent {
  id: string
  title: string
  description?: string
  venue: string
  city: string
  country: string
  startDate: string
  endDate?: string
  ticketPrice: number
  currency: string
  totalTickets: number
  soldTickets: number
  status: 'draft' | 'published' | 'sold_out' | 'cancelled' | 'completed'
  imageUrl?: string
  performers?: string[]
  genre?: string
  createdAt?: Date
}

export interface Ticket {
  id: string
  eventId: string
  eventTitle: string
  buyerEmail: string
  buyerName?: string
  quantity: number
  totalPrice: number
  currency: string
  status: 'pending' | 'confirmed' | 'cancelled' | 'used'
  stripeSessionId?: string
  createdAt?: Date
}

export interface EventListResult {
  events: ZongaEvent[]
  total: number
}

export interface TicketListResult {
  tickets: Ticket[]
  total: number
  totalRevenue: number
}

/* ─── List Events ─── */

export async function listEvents(opts?: {
  page?: number
  status?: string
}): Promise<EventListResult> {
  const ctx = await resolveOrgContext()

  const page = opts?.page ?? 1
  const offset = (page - 1) * 25

  try {
    const rows = (await platformDb.execute(
      sql`SELECT
        org_id as id,
        metadata->>'title' as title,
        metadata->>'description' as description,
        metadata->>'venue' as venue,
        metadata->>'city' as city,
        metadata->>'country' as country,
        metadata->>'startDate' as "startDate",
        metadata->>'endDate' as "endDate",
        COALESCE(CAST(metadata->>'ticketPrice' AS NUMERIC), 0) as "ticketPrice",
        metadata->>'currency' as currency,
        COALESCE(CAST(metadata->>'totalTickets' AS INTEGER), 0) as "totalTickets",
        COALESCE(CAST(metadata->>'soldTickets' AS INTEGER), 0) as "soldTickets",
        metadata->>'status' as status,
        metadata->>'imageUrl' as "imageUrl",
        metadata->'performers' as performers,
        metadata->>'genre' as genre,
        created_at as "createdAt"
      FROM audit_log
      WHERE (action = 'event.created' OR action = 'event.published') AND org_id = ${ctx.orgId}
      ORDER BY created_at DESC
      LIMIT 25 OFFSET ${offset}`,
    )) as unknown as { rows: ZongaEvent[] }

    const [cnt] = (await platformDb.execute(
      sql`SELECT COUNT(*) as total FROM audit_log WHERE action LIKE 'event.%' AND action != 'event.ticket.purchased' AND org_id = ${ctx.orgId}`,
    )) as unknown as [{ total: number }]

    return {
      events: rows.rows ?? [],
      total: Number(cnt?.total ?? 0),
    }
  } catch (error) {
    logger.error('listEvents failed', { error })
    return { events: [], total: 0 }
  }
}

/* ─── Event Detail ─── */

export async function getEventDetail(eventId: string): Promise<{
  event: ZongaEvent | null
  tickets: Ticket[]
  ticketsSold: number
  ticketRevenue: number
}> {
  const ctx = await resolveOrgContext()

  try {
    const [event] = (await platformDb.execute(
      sql`SELECT
        org_id as id,
        metadata->>'title' as title,
        metadata->>'description' as description,
        metadata->>'venue' as venue,
        metadata->>'city' as city,
        metadata->>'country' as country,
        metadata->>'startDate' as "startDate",
        metadata->>'endDate' as "endDate",
        COALESCE(CAST(metadata->>'ticketPrice' AS NUMERIC), 0) as "ticketPrice",
        metadata->>'currency' as currency,
        COALESCE(CAST(metadata->>'totalTickets' AS INTEGER), 0) as "totalTickets",
        COALESCE(CAST(metadata->>'soldTickets' AS INTEGER), 0) as "soldTickets",
        metadata->>'status' as status,
        metadata->'performers' as performers,
        metadata->>'genre' as genre,
        created_at as "createdAt"
      FROM audit_log
      WHERE org_id = ${eventId} AND action LIKE 'event.%' AND org_id = ${ctx.orgId}
      ORDER BY created_at DESC LIMIT 1`,
    )) as unknown as [ZongaEvent | undefined]

    const ticketRows = (await platformDb.execute(
      sql`SELECT
        org_id as id,
        metadata->>'eventId' as "eventId",
        metadata->>'eventTitle' as "eventTitle",
        metadata->>'buyerEmail' as "buyerEmail",
        metadata->>'buyerName' as "buyerName",
        COALESCE(CAST(metadata->>'quantity' AS INTEGER), 1) as quantity,
        COALESCE(CAST(metadata->>'totalPrice' AS NUMERIC), 0) as "totalPrice",
        metadata->>'currency' as currency,
        metadata->>'status' as status,
        metadata->>'stripeSessionId' as "stripeSessionId",
        created_at as "createdAt"
      FROM audit_log
      WHERE action = 'event.ticket.purchased' AND metadata->>'eventId' = ${eventId} AND org_id = ${ctx.orgId}
      ORDER BY created_at DESC`,
    )) as unknown as { rows: Ticket[] }

    const tickets = ticketRows.rows ?? []
    const ticketsSold = tickets.reduce(
      (sum, t) => sum + Number(t.quantity ?? 0),
      0,
    )
    const ticketRevenue = tickets.reduce(
      (sum, t) => sum + Number(t.totalPrice ?? 0),
      0,
    )

    return {
      event: event ?? null,
      tickets,
      ticketsSold,
      ticketRevenue,
    }
  } catch (error) {
    logger.error('getEventDetail failed', { error })
    return { event: null, tickets: [], ticketsSold: 0, ticketRevenue: 0 }
  }
}

/* ─── Create Event ─── */

export async function createEvent(data: {
  title: string
  description?: string
  venue: string
  city: string
  country: string
  startDate: string
  endDate?: string
  ticketPrice: number
  currency: string
  totalTickets: number
  performers?: string[]
  genre?: string
}): Promise<{ success: boolean; eventId?: string }> {
  const ctx = await resolveOrgContext()

  try {
    const eventId = crypto.randomUUID()

    await platformDb.execute(
      sql`INSERT INTO audit_log (action, actor_id, entity_type, entity_id, org_id, metadata)
      VALUES ('event.created', ${ctx.actorId}, 'event', ${eventId}, ${ctx.orgId},
        ${JSON.stringify({
          ...data,
          id: eventId,
          status: 'draft',
          soldTickets: 0,
        })}::jsonb)`,
    )

    const auditEvent = buildZongaAuditEvent({
      action: 'event.created' as ZongaAuditAction,
      entityType: 'event' as ZongaEntityType,
      orgId: eventId,
      actorId: ctx.actorId,
      targetId: eventId,
      metadata: { title: data.title, venue: data.venue },
    })
    logger.info('Event created', { ...auditEvent })

    const pack = buildEvidencePackFromAction({
      actionType: 'EVENT_CREATED',
      orgId: eventId,
      executedBy: ctx.actorId,
      actionId: crypto.randomUUID(),
    })
    await processEvidencePack(pack)

    revalidatePath('/dashboard/events')
    return { success: true, eventId }
  } catch (error) {
    logger.error('createEvent failed', { error })
    return { success: false }
  }
}

/* ─── Publish Event ─── */

export async function publishEvent(
  eventId: string,
): Promise<{ success: boolean }> {
  const ctx = await resolveOrgContext()

  try {
    await platformDb.execute(
      sql`INSERT INTO audit_log (action, actor_id, entity_type, entity_id, org_id, metadata)
      VALUES ('event.published', ${ctx.actorId}, 'event', ${eventId}, ${ctx.orgId},
        ${JSON.stringify({ status: 'published', publishedAt: new Date().toISOString() })}::jsonb)`,
    )

    logger.info('Event published', { eventId, actorId: ctx.actorId })
    revalidatePath('/dashboard/events')
    return { success: true }
  } catch (error) {
    logger.error('publishEvent failed', { error })
    return { success: false }
  }
}

/* ─── Purchase Ticket (via Stripe Checkout) ─── */

export async function purchaseTicket(data: {
  eventId: string
  eventTitle: string
  quantity: number
  ticketPrice: number
  currency: string
  buyerEmail: string
  buyerName?: string
  successUrl: string
  cancelUrl: string
}): Promise<{ success: boolean; checkoutUrl?: string }> {
  const ctx = await resolveOrgContext()

  try {
    const ticketId = crypto.randomUUID()
    const totalPrice = data.ticketPrice * data.quantity

    // Create Stripe checkout session
    const session = await createCheckoutSession({
      orgId: data.eventId,
      lineItems: [
        {
          name: `${data.eventTitle} — Ticket`,
          amountCents: Math.round(totalPrice * 100), // cents
          quantity: data.quantity,
        },
      ],
      successUrl: data.successUrl,
      cancelUrl: data.cancelUrl,
      metadata: {
        ticketId,
        eventId: data.eventId,
        quantity: String(data.quantity),
      },
    })

    // Record ticket purchase (pending until webhook confirms)
    await platformDb.execute(
      sql`INSERT INTO audit_log (action, actor_id, entity_type, entity_id, org_id, metadata)
      VALUES ('event.ticket.purchased', ${ctx.actorId}, 'ticket', ${ticketId}, ${ctx.orgId},
        ${JSON.stringify({
          eventId: data.eventId,
          eventTitle: data.eventTitle,
          buyerEmail: data.buyerEmail,
          buyerName: data.buyerName,
          quantity: data.quantity,
          totalPrice,
          currency: data.currency,
          status: 'pending',
          stripeSessionId: session?.id ?? null,
        })}::jsonb)`,
    )

    // Record revenue event
    await platformDb.execute(
      sql`INSERT INTO audit_log (action, actor_id, entity_type, entity_id, org_id, metadata)
      VALUES ('revenue.recorded', ${ctx.actorId}, 'revenue', ${crypto.randomUUID()}, ${ctx.orgId},
        ${JSON.stringify({
          type: 'ticket_sale',
          eventId: data.eventId,
          amount: totalPrice,
          currency: data.currency,
        })}::jsonb)`,
    )

    logger.info('Ticket purchase initiated', {
      ticketId,
      eventId: data.eventId,
      quantity: data.quantity,
    })

    revalidatePath('/dashboard/events')
    return { success: true, checkoutUrl: session?.url ?? undefined }
  } catch (error) {
    logger.error('purchaseTicket failed', { error })
    return { success: false }
  }
}

/* ─── List Tickets for Event ─── */

export async function listTickets(opts?: {
  eventId?: string
  page?: number
}): Promise<TicketListResult> {
  const ctx = await resolveOrgContext()

  const page = opts?.page ?? 1
  const offset = (page - 1) * 25

  try {
    const whereClause = opts?.eventId
      ? sql`WHERE action = 'event.ticket.purchased' AND metadata->>'eventId' = ${opts.eventId} AND org_id = ${ctx.orgId}`
      : sql`WHERE action = 'event.ticket.purchased' AND org_id = ${ctx.orgId}`

    const rows = (await platformDb.execute(
      sql`SELECT
        org_id as id,
        metadata->>'eventId' as "eventId",
        metadata->>'eventTitle' as "eventTitle",
        metadata->>'buyerEmail' as "buyerEmail",
        metadata->>'buyerName' as "buyerName",
        COALESCE(CAST(metadata->>'quantity' AS INTEGER), 1) as quantity,
        COALESCE(CAST(metadata->>'totalPrice' AS NUMERIC), 0) as "totalPrice",
        metadata->>'currency' as currency,
        metadata->>'status' as status,
        created_at as "createdAt"
      FROM audit_log
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT 25 OFFSET ${offset}`,
    )) as unknown as { rows: Ticket[] }

    const [totals] = (await platformDb.execute(
      sql`SELECT
        COUNT(*) as total,
        COALESCE(SUM(CAST(metadata->>'totalPrice' AS NUMERIC)), 0) as total_revenue
      FROM audit_log
      ${whereClause}`,
    )) as unknown as [{ total: number; total_revenue: number }]

    return {
      tickets: rows.rows ?? [],
      total: Number(totals?.total ?? 0),
      totalRevenue: Number(totals?.total_revenue ?? 0),
    }
  } catch (error) {
    logger.error('listTickets failed', { error })
    return { tickets: [], total: 0, totalRevenue: 0 }
  }
}
