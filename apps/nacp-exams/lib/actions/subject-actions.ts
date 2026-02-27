'use server'

/**
 * Subject actions — NACP Exams.
 *
 * Manages exam subjects (courses/papers), listing, and CRUD.
 */
import { platformDb } from '@nzila/db/platform'
import { sql } from 'drizzle-orm'
import { CreateSubjectSchema } from '@nzila/nacp-core/schemas'
import { resolveOrgContext } from '@/lib/resolve-org'

// ── Types ────────────────────────────────────────────────────────────────────

export interface SubjectRow {
  id: string
  name: string
  code: string
  level: string
  description: string
  questionCount: number
  duration: number
  passRate: number
}

export interface SubjectStats {
  total: number
  byLevel: { level: string; count: number }[]
}

// ── Queries ──────────────────────────────────────────────────────────────────

export async function listSubjects(opts?: {
  level?: string
  search?: string
}): Promise<{ subjects: SubjectRow[] }> {
  const ctx = await resolveOrgContext()

  let filter = sql`s.org_id = ${ctx.entityId}`
  if (opts?.level) {
    filter = sql`${filter} AND s.level = ${opts.level}`
  }
  if (opts?.search) {
    filter = sql`${filter} AND (
      s.name ILIKE ${'%' + opts.search + '%'}
      OR s.code ILIKE ${'%' + opts.search + '%'}
    )`
  }

  const rows = await platformDb.execute(sql`
    SELECT
      s.id,
      s.name,
      s.code,
      s.level,
      COALESCE(s.description, '') as description,
      COALESCE(s.question_count, 0)::int as "questionCount",
      COALESCE(s.duration_minutes, 60)::int as duration,
      COALESCE(s.pass_rate, 0)::numeric as "passRate"
    FROM subjects s
    WHERE ${filter}
    ORDER BY s.level, s.name ASC
    LIMIT 200
  `)

  return { subjects: (rows as unknown as SubjectRow[]) ?? [] }
}

export async function getSubjectStats(): Promise<SubjectStats> {
  const ctx = await resolveOrgContext()

  const [totalRow] = await platformDb.execute(sql`
    SELECT COUNT(*)::int as total FROM subjects
    WHERE org_id = ${ctx.entityId}
  `)

  const levelRows = await platformDb.execute(sql`
    SELECT level, COUNT(*)::int as count
    FROM subjects
    WHERE org_id = ${ctx.entityId}
    GROUP BY level
    ORDER BY level
  `)

  return {
    total: (totalRow as Record<string, number>).total ?? 0,
    byLevel: (levelRows as unknown as { level: string; count: number }[]) ?? [],
  }
}

// ── Mutations ────────────────────────────────────────────────────────────────

export async function createSubject(data: {
  name: string
  code: string
  level: string
  description?: string
  questionCount?: number
  durationMinutes?: number
}) {
  const ctx = await resolveOrgContext()

  const parsed = CreateSubjectSchema.safeParse(data)
  if (!parsed.success) {
    return { success: false, error: parsed.error.flatten().fieldErrors }
  }

  const id = crypto.randomUUID()

  await platformDb.execute(sql`
    INSERT INTO subjects (id, org_id, name, code, level, description, question_count, duration_minutes, created_by, created_at)
    VALUES (
      ${id},
      ${ctx.entityId},
      ${data.name},
      ${data.code},
      ${data.level},
      ${data.description ?? null},
      ${data.questionCount ?? 0},
      ${data.durationMinutes ?? 60},
      ${ctx.actorId},
      NOW()
    )
  `)

  return { success: true, id }
}
