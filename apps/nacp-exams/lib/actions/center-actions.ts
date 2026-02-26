'use server'

/**
 * Center actions — NACP Exams.
 *
 * Manages exam center registration, listing, and status updates.
 */
import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { platformDb } from '@nzila/db/platform'
import { sql } from 'drizzle-orm'
import { CreateCenterSchema } from '@nzila/nacp-core/schemas'
import { CenterStatus } from '@nzila/nacp-core/enums'
import { buildExamEvidencePack } from '@/lib/evidence'

// ── Types ────────────────────────────────────────────────────────────────────

export interface CenterRow {
  id: string
  name: string
  code: string
  city: string
  province: string
  capacity: number
  status: string
  sessionCount: number
}

export interface CenterStats {
  total: number
  active: number
  pending: number
  suspended: number
}

// ── Queries ──────────────────────────────────────────────────────────────────

export async function listCenters(opts?: {
  status?: string
  search?: string
}): Promise<{ centers: CenterRow[] }> {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')

  let filter = sql`1=1`
  if (opts?.status) {
    filter = sql`${filter} AND ec.status = ${opts.status}`
  }
  if (opts?.search) {
    filter = sql`${filter} AND (
      ec.name ILIKE ${'%' + opts.search + '%'}
      OR ec.code ILIKE ${'%' + opts.search + '%'}
      OR ec.city ILIKE ${'%' + opts.search + '%'}
    )`
  }

  const rows = await platformDb.execute(sql`
    SELECT
      ec.id,
      ec.name,
      ec.code,
      COALESCE(ec.city, '') as city,
      COALESCE(ec.province, '') as province,
      COALESCE(ec.capacity, 0)::int as capacity,
      ec.status,
      COALESCE(ec.session_count, 0)::int as "sessionCount"
    FROM exam_centers ec
    WHERE ${filter}
    ORDER BY ec.name ASC
    LIMIT 200
  `)

  return { centers: (rows as unknown as CenterRow[]) ?? [] }
}

export async function getCenterStats(): Promise<CenterStats> {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')

  const [row] = await platformDb.execute(sql`
    SELECT
      COUNT(*)::int as total,
      COUNT(*) FILTER (WHERE status = ${CenterStatus.ACTIVE})::int as active,
      COUNT(*) FILTER (WHERE status = 'pending')::int as pending,
      COUNT(*) FILTER (WHERE status = ${CenterStatus.SUSPENDED})::int as suspended
    FROM exam_centers
  `)

  const r = row as Record<string, number>
  return {
    total: r.total ?? 0,
    active: r.active ?? 0,
    pending: r.pending ?? 0,
    suspended: r.suspended ?? 0,
  }
}

// ── Mutations ────────────────────────────────────────────────────────────────

export async function createCenter(data: {
  name: string
  code: string
  city: string
  province: string
  capacity: number
  address?: string
  contactEmail?: string
}) {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')

  const parsed = CreateCenterSchema.safeParse(data)
  if (!parsed.success) {
    return { success: false, error: parsed.error.flatten().fieldErrors }
  }

  const id = crypto.randomUUID()

  await platformDb.execute(sql`
    INSERT INTO exam_centers (id, name, code, city, province, capacity, address, contact_email, status, created_by, created_at)
    VALUES (
      ${id},
      ${data.name},
      ${data.code},
      ${data.city},
      ${data.province},
      ${data.capacity},
      ${data.address ?? null},
      ${data.contactEmail ?? null},
      ${CenterStatus.ACTIVE},
      ${userId},
      NOW()
    )
  `)

  await buildExamEvidencePack({
    action: 'center.created',
    entityType: 'exam_center',
    entityId: id,
    actorId: userId,
    payload: { name: data.name, code: data.code, city: data.city },
  }).catch(() => {})

  return { success: true, id }
}

export async function updateCenterStatus(
  centerId: string,
  status: CenterStatus,
) {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')

  await platformDb.execute(sql`
    UPDATE exam_centers
    SET status = ${status}, updated_at = NOW()
    WHERE id = ${centerId}
  `)

  return { success: true }
}
