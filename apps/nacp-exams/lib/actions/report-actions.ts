'use server'

/**
 * Report actions — NACP Exams.
 *
 * Generates exam result summaries, pass-rate analytics, and
 * session completion reports.
 */
import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { platformDb } from '@nzila/db/platform'
import { sql } from 'drizzle-orm'

// ── Types ────────────────────────────────────────────────────────────────────

export interface ReportSummary {
  totalSessions: number
  completedSessions: number
  totalCandidates: number
  passedCandidates: number
  avgScore: number
  passRate: number
}

export interface SubjectPerformance {
  subjectName: string
  subjectCode: string
  candidateCount: number
  avgScore: number
  passRate: number
}

export interface SessionReport {
  sessionId: string
  examName: string
  centerName: string
  scheduledDate: string
  candidateCount: number
  avgScore: number
  passRate: number
  status: string
}

// ── Queries ──────────────────────────────────────────────────────────────────

export async function getReportSummary(): Promise<ReportSummary> {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')

  try {
    const [row] = await platformDb.execute(sql`
      SELECT
        (SELECT COUNT(*)::int FROM exam_sessions) as "totalSessions",
        (SELECT COUNT(*)::int FROM exam_sessions WHERE status = 'completed') as "completedSessions",
        (SELECT COUNT(*)::int FROM candidates) as "totalCandidates",
        (SELECT COUNT(*)::int FROM submissions WHERE status = 'passed') as "passedCandidates",
        (SELECT COALESCE(AVG(score), 0)::numeric FROM submissions WHERE score IS NOT NULL) as "avgScore"
    `)

    const r = row as Record<string, number>
    const total = r.totalCandidates ?? 0
    const passed = r.passedCandidates ?? 0

    return {
      totalSessions: r.totalSessions ?? 0,
      completedSessions: r.completedSessions ?? 0,
      totalCandidates: total,
      passedCandidates: passed,
      avgScore: Number(r.avgScore ?? 0),
      passRate: total > 0 ? Math.round((passed / total) * 100) : 0,
    }
  } catch {
    return {
      totalSessions: 0,
      completedSessions: 0,
      totalCandidates: 0,
      passedCandidates: 0,
      avgScore: 0,
      passRate: 0,
    }
  }
}

export async function getSubjectPerformance(): Promise<{ subjects: SubjectPerformance[] }> {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')

  try {
    const rows = await platformDb.execute(sql`
      SELECT
        s.name as "subjectName",
        s.code as "subjectCode",
        COUNT(sub.id)::int as "candidateCount",
        COALESCE(AVG(sub.score), 0)::numeric as "avgScore",
        CASE
          WHEN COUNT(sub.id) > 0
          THEN ROUND(COUNT(*) FILTER (WHERE sub.status = 'passed')::numeric / COUNT(sub.id) * 100)
          ELSE 0
        END as "passRate"
      FROM subjects s
      LEFT JOIN submissions sub ON sub.subject_id = s.id
      GROUP BY s.id, s.name, s.code
      ORDER BY s.name
    `)

    return { subjects: (rows as unknown as SubjectPerformance[]) ?? [] }
  } catch {
    return { subjects: [] }
  }
}

export async function getSessionReports(opts?: {
  status?: string
}): Promise<{ reports: SessionReport[] }> {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')

  try {
    let filter = sql`1=1`
    if (opts?.status) {
      filter = sql`${filter} AND es.status = ${opts.status}`
    }

    const rows = await platformDb.execute(sql`
      SELECT
        es.id as "sessionId",
        COALESCE(e.name, 'Unknown') as "examName",
        COALESCE(ec.name, 'Unknown') as "centerName",
        es.scheduled_date as "scheduledDate",
        COALESCE(es.candidate_count, 0)::int as "candidateCount",
        COALESCE(
          (SELECT AVG(sub.score) FROM submissions sub WHERE sub.session_id = es.id AND sub.score IS NOT NULL),
          0
        )::numeric as "avgScore",
        CASE
          WHEN COALESCE(es.candidate_count, 0) > 0
          THEN ROUND(
            COALESCE(
              (SELECT COUNT(*) FROM submissions sub WHERE sub.session_id = es.id AND sub.status = 'passed')::numeric
              / NULLIF(es.candidate_count, 0) * 100,
              0
            )
          )
          ELSE 0
        END as "passRate",
        es.status
      FROM exam_sessions es
      LEFT JOIN exams e ON e.id = es.exam_id
      LEFT JOIN exam_centers ec ON ec.id = es.center_id
      WHERE ${filter}
      ORDER BY es.scheduled_date DESC
      LIMIT 50
    `)

    return { reports: (rows as unknown as SessionReport[]) ?? [] }
  } catch {
    return { reports: [] }
  }
}
