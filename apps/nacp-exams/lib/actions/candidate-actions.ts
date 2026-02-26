'use server'

/**
 * Candidate actions — NACP Exams.
 *
 * Manages candidate registration, listing, and status updates.
 */
import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { platformDb } from '@nzila/db/platform'
import { sql } from 'drizzle-orm'
import { CreateCandidateSchema } from '@nzila/nacp-core/schemas'
import { CandidateStatus } from '@nzila/nacp-core/enums'
import { buildExamEvidencePack } from '@/lib/evidence'

// ── Types ────────────────────────────────────────────────────────────────────

export interface CandidateRow {
  id: string
  firstName: string
  lastName: string
  email: string
  candidateNumber: string
  status: string
  sessionCount: number
  registeredAt: string
}

export interface CandidateStats {
  total: number
  registered: number
  active: number
  completed: number
  suspended: number
}

// ── Queries ──────────────────────────────────────────────────────────────────

export async function listCandidates(opts?: {
  status?: string
  search?: string
}): Promise<{ candidates: CandidateRow[] }> {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')

  let filter = sql`1=1`
  if (opts?.status) {
    filter = sql`${filter} AND c.status = ${opts.status}`
  }
  if (opts?.search) {
    filter = sql`${filter} AND (
      c.first_name ILIKE ${'%' + opts.search + '%'}
      OR c.last_name ILIKE ${'%' + opts.search + '%'}
      OR c.email ILIKE ${'%' + opts.search + '%'}
      OR c.candidate_number ILIKE ${'%' + opts.search + '%'}
    )`
  }

  const rows = await platformDb.execute(sql`
    SELECT
      c.id,
      c.first_name as "firstName",
      c.last_name as "lastName",
      c.email,
      c.candidate_number as "candidateNumber",
      c.status,
      COALESCE(c.session_count, 0)::int as "sessionCount",
      c.created_at as "registeredAt"
    FROM candidates c
    WHERE ${filter}
    ORDER BY c.created_at DESC
    LIMIT 200
  `)

  return { candidates: (rows as unknown as CandidateRow[]) ?? [] }
}

export async function getCandidateStats(): Promise<CandidateStats> {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')

  const [row] = await platformDb.execute(sql`
    SELECT
      COUNT(*)::int as total,
      COUNT(*) FILTER (WHERE status = ${CandidateStatus.REGISTERED})::int as registered,
      COUNT(*) FILTER (WHERE status = ${CandidateStatus.VERIFIED})::int as active,
      COUNT(*) FILTER (WHERE status = ${CandidateStatus.ELIGIBLE})::int as completed,
      COUNT(*) FILTER (WHERE status = ${CandidateStatus.SUSPENDED})::int as suspended
    FROM candidates
  `)

  const r = row as Record<string, number>
  return {
    total: r.total ?? 0,
    registered: r.registered ?? 0,
    active: r.active ?? 0,
    completed: r.completed ?? 0,
    suspended: r.suspended ?? 0,
  }
}

// ── Mutations ────────────────────────────────────────────────────────────────

export async function registerCandidate(data: {
  firstName: string
  lastName: string
  email: string
  dateOfBirth: string
  sessionId: string
}) {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')

  const parsed = CreateCandidateSchema.safeParse(data)
  if (!parsed.success) {
    return { success: false, error: parsed.error.flatten().fieldErrors }
  }

  const id = crypto.randomUUID()
  const candidateNumber = `NACP-${Date.now().toString(36).toUpperCase()}`

  await platformDb.execute(sql`
    INSERT INTO candidates (id, first_name, last_name, email, date_of_birth, candidate_number, status, session_id, created_by, created_at)
    VALUES (
      ${id},
      ${data.firstName},
      ${data.lastName},
      ${data.email},
      ${data.dateOfBirth},
      ${candidateNumber},
      ${CandidateStatus.REGISTERED},
      ${data.sessionId},
      ${userId},
      NOW()
    )
  `)

  await buildExamEvidencePack({
    action: 'candidate.registered',
    entityType: 'candidate',
    entityId: id,
    actorId: userId,
    payload: { candidateNumber, sessionId: data.sessionId },
  }).catch(() => {})

  return { success: true, id, candidateNumber }
}

export async function updateCandidateStatus(
  candidateId: string,
  status: CandidateStatus,
) {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')

  await platformDb.execute(sql`
    UPDATE candidates
    SET status = ${status}, updated_at = NOW()
    WHERE id = ${candidateId}
  `)

  await buildExamEvidencePack({
    action: 'candidate.status_changed',
    entityType: 'candidate',
    entityId: candidateId,
    actorId: userId,
    payload: { newStatus: status },
  }).catch(() => {})

  return { success: true }
}
