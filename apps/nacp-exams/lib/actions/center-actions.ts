'use server'

/**
 * Center actions — NACP Exams.
 *
 * Manages exam center registration, listing, and status updates.
 */
import { platformDb } from '@nzila/db/platform'
import { sql } from 'drizzle-orm'
import { CreateCenterSchema } from '@nzila/nacp-core/schemas'
import { CenterStatus } from '@nzila/nacp-core/enums'
import { buildExamEvidencePack } from '@/lib/evidence'
import { resolveOrgContext } from '@/lib/resolve-org'

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
  const ctx = await resolveOrgContext()

  let filter = sql`ec.org_id = ${ctx.orgId}`
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
  const ctx = await resolveOrgContext()

  const [row] = await platformDb.execute(sql`
    SELECT
      COUNT(*)::int as total,
      COUNT(*) FILTER (WHERE status = ${CenterStatus.ACTIVE})::int as active,
      COUNT(*) FILTER (WHERE status = 'pending')::int as pending,
      COUNT(*) FILTER (WHERE status = ${CenterStatus.SUSPENDED})::int as suspended
    FROM exam_centers
    WHERE org_id = ${ctx.orgId}
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
  const ctx = await resolveOrgContext()

  const parsed = CreateCenterSchema.safeParse(data)
  if (!parsed.success) {
    return { success: false, error: parsed.error.flatten().fieldErrors }
  }

  const id = crypto.randomUUID()

  await platformDb.execute(sql`
    INSERT INTO exam_centers (id, org_id, name, code, city, province, capacity, address, contact_email, status, created_by, created_at)
    VALUES (
      ${id},
      ${ctx.orgId},
      ${data.name},
      ${data.code},
      ${data.city},
      ${data.province},
      ${data.capacity},
      ${data.address ?? null},
      ${data.contactEmail ?? null},
      ${CenterStatus.ACTIVE},
      ${ctx.actorId},
      NOW()
    )
  `)

  await buildExamEvidencePack({
    action: 'center.created',
    entityType: 'exam_center',
    orgId: id,
    actorId: ctx.actorId,
    payload: { name: data.name, code: data.code, city: data.city },
  }).catch(() => {})

  return { success: true, id }
}

export async function updateCenterStatus(
  centerId: string,
  status: CenterStatus,
) {
  const ctx = await resolveOrgContext()

  await platformDb.execute(sql`
    UPDATE exam_centers
    SET status = ${status}, updated_at = NOW()
    WHERE id = ${centerId} AND org_id = ${ctx.orgId}
  `)

  return { success: true }
}
