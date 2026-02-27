/**
 * CFO Server Actions — Client management CRUD.
 *
 * All actions are auth-gated and entity-scoped via @nzila/db
 * and @nzila/os-core/evidence for governance trail.
 */
'use server'

import { auth } from '@clerk/nextjs/server'
import { requirePermission } from '@/lib/rbac'
import { revalidatePath } from 'next/cache'
import { platformDb } from '@nzila/db/platform'
import { entities, entityMembers } from '@nzila/db/schema'
import { eq, and, ilike, desc, sql, count, type SQL } from 'drizzle-orm'
import { logger } from '@/lib/logger'

export interface Client {
  id: string
  name: string
  contactEmail: string | null
  status: string
  createdAt: Date
  memberCount: number
}

export interface ClientListResult {
  clients: Client[]
  total: number
}

export async function listClients(opts?: {
  search?: string
  status?: string
  page?: number
  pageSize?: number
}): Promise<ClientListResult> {
  const { userId } = await auth()
  if (!userId) throw new Error('Unauthorized')
  await requirePermission('clients:view')

  const page = opts?.page ?? 1
  const pageSize = opts?.pageSize ?? 20
  const offset = (page - 1) * pageSize

  try {
    const conditions: SQL[] = []
    if (opts?.search) {
      conditions.push(ilike(entities.legalName, `%${opts.search}%`))
    }
    if (opts?.status) {
      conditions.push(eq(entities.status, opts.status as typeof entities.status._.data))
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined

    const [clientRows, totalResult] = await Promise.all([
      platformDb
        .select({
          id: entities.id,
          name: entities.legalName,
          status: entities.status,
          createdAt: entities.createdAt,
        })
        .from(entities)
        .where(whereClause)
        .orderBy(desc(entities.createdAt))
        .limit(pageSize)
        .offset(offset),
      platformDb
        .select({ count: count() })
        .from(entities)
        .where(whereClause),
    ])

    // Enrich with member counts
    const clientsWithMembers = await Promise.all(
      clientRows.map(async (client) => {
        const [memberResult] = await platformDb
          .select({ count: count() })
          .from(entityMembers)
          .where(
            and(
              eq(entityMembers.entityId, client.id),
              eq(entityMembers.status, 'active'),
            ),
          )
        return {
          ...client,
          contactEmail: null as string | null,
          memberCount: memberResult?.count ?? 0,
          createdAt: client.createdAt ?? new Date(),
        }
      }),
    )

    return {
      clients: clientsWithMembers,
      total: totalResult[0]?.count ?? 0,
    }
  } catch (error) {
    logger.error('Failed to list clients', { error })
    return { clients: [], total: 0 }
  }
}

export async function createClient(data: {
  name: string
  contactEmail?: string
  jurisdiction?: string
  incorporationNumber?: string
  fiscalYearEnd?: string
  industry?: string
  businessType?: string
  phone?: string
  servicesNeeded?: string[]
  notes?: string
}): Promise<{ ok: boolean; id?: string; error?: string }> {
  const { userId } = await auth()
  if (!userId) return { ok: false, error: 'Unauthorized' }
  await requirePermission('clients:create')

  try {
    const [entity] = await platformDb
      .insert(entities)
      .values({
        legalName: data.name,
        jurisdiction: data.jurisdiction || 'CA-ON',
        incorporationNumber: data.incorporationNumber || null,
        fiscalYearEnd: data.fiscalYearEnd || null,
        status: 'active',
        policyConfig: {
          contactEmail: data.contactEmail || null,
          industry: data.industry || null,
          businessType: data.businessType || null,
          phone: data.phone || null,
          servicesNeeded: data.servicesNeeded || [],
          notes: data.notes || null,
        },
      })
      .returning({ id: entities.id })

    logger.info('Client created', { clientId: entity.id, actorId: userId })
    revalidatePath('/dashboard/clients')
    return { ok: true, id: entity.id }
  } catch (error) {
    logger.error('Failed to create client', { error })
    return { ok: false, error: 'Failed to create client' }
  }
}

export async function getClientDetail(clientId: string) {
  const { userId } = await auth()
  if (!userId) throw new Error('Unauthorized')
  await requirePermission('clients:view')

  try {
    const [client] = await platformDb
      .select()
      .from(entities)
      .where(eq(entities.id, clientId))
      .limit(1)

    if (!client) return null

    const members = await platformDb
      .select()
      .from(entityMembers)
      .where(eq(entityMembers.entityId, clientId))
      .orderBy(desc(entityMembers.createdAt))

    // Financial summary from audit log
    const [financials] = await platformDb.execute(
      sql`SELECT
        COALESCE(SUM(CAST(metadata->>'amount' AS NUMERIC)) FILTER (WHERE action LIKE 'revenue.%' AND entity_id = ${clientId}), 0) as total_revenue,
        COUNT(*) FILTER (WHERE action LIKE 'document.%' AND entity_id = ${clientId}) as document_count,
        COUNT(*) FILTER (WHERE entity_id = ${clientId}) as audit_event_count
      FROM audit_log`,
    ) as unknown as [{ total_revenue: number; document_count: number; audit_event_count: number }]

    const recentActivityRows = (await platformDb.execute(
      sql`SELECT id, action, created_at as "createdAt"
      FROM audit_log WHERE entity_id = ${clientId}
      ORDER BY created_at DESC LIMIT 10`,
    )) as unknown as { rows: Array<{ id: string; action: string; createdAt: Date }> }

    return {
      ...client,
      members,
      financialSummary: {
        totalRevenue: Number(financials?.total_revenue ?? 0),
        documentCount: Number(financials?.document_count ?? 0),
        auditEventCount: Number(financials?.audit_event_count ?? 0),
        recentActivity: recentActivityRows.rows ?? [],
      },
    }
  } catch (error) {
    logger.error('Failed to get client detail', { error, clientId })
    return null
  }
}
