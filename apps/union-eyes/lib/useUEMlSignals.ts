/**
 * apps/union-eyes/lib/useUEMlSignals.ts
 *
 * React hooks for fetching UE ML signals from the ML Signals API via @nzila/ml-sdk.
 *
 * CONSTRAINT: This file MUST NOT import from @nzila/db or any ml* schema tables.
 * All ML data must flow through the governed ml-client module.
 */
'use client'

import { useEffect, useState, useCallback } from 'react'
import { makeMlClient } from '@/lib/ml-client'
import type { UEPriorityScoreResponse, UESlaRiskScoreResponse } from '@nzila/ml-sdk'

// Re-export for backwards compatibility — canonical source is now @/lib/ml-client
export { makeMlClient } from '@/lib/ml-client'

// ── Per-case priority signal ──────────────────────────────────────────────────

export interface UseCasePrioritySignalResult {
  score: UEPriorityScoreResponse | null
  isLoading: boolean
  error: string | null
}

/**
 * Fetch the latest priority signal for a specific case.
 * Returns null score with fallback display if no inference has run yet.
 */
export function useCasePrioritySignal(
  orgId: string,
  caseId: string,
  getToken: () => Promise<string | null>,
): UseCasePrioritySignalResult {
  const [score, setScore] = useState<UEPriorityScoreResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!orgId || !caseId) return
    let cancelled = false

    ;(async () => {
      try {
        const client = makeMlClient(getToken)
        // Fetch recent scores for this entity and filter client-side by caseId
        // (The API is date-range based; we use a generous trailing window)
        const today = new Date()
        const startDate = new Date(today.getTime() - 90 * 24 * 3600 * 1000)
          .toISOString()
          .slice(0, 10)
        const endDate = today.toISOString().slice(0, 10)

        const result = await client.getUEPriorityScores({
          orgId,
          startDate,
          endDate,
          limit: 500,
        })

        if (!cancelled) {
          // Find the most-recent score for this specific case
          const caseScore = result.items.find((item) => item.caseId === caseId) ?? null
          setScore(caseScore)
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load priority signal')
        }
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [orgId, caseId, getToken])

  return { score, isLoading, error }
}

// ── Per-case SLA risk signal ──────────────────────────────────────────────────

export interface UseCaseSlaRiskSignalResult {
  score: UESlaRiskScoreResponse | null
  isLoading: boolean
  error: string | null
}

export function useCaseSlaRiskSignal(
  orgId: string,
  caseId: string,
  getToken: () => Promise<string | null>,
): UseCaseSlaRiskSignalResult {
  const [score, setScore] = useState<UESlaRiskScoreResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!orgId || !caseId) return
    let cancelled = false

    ;(async () => {
      try {
        const client = makeMlClient(getToken)
        const today = new Date()
        const startDate = new Date(today.getTime() - 90 * 24 * 3600 * 1000)
          .toISOString()
          .slice(0, 10)
        const endDate = today.toISOString().slice(0, 10)

        const result = await client.getUESlaRiskScores({
          orgId,
          startDate,
          endDate,
          limit: 500,
        })

        if (!cancelled) {
          const caseScore = result.items.find((item) => item.caseId === caseId) ?? null
          setScore(caseScore)
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load SLA risk signal')
        }
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [orgId, caseId, getToken])

  return { score, isLoading, error }
}

// ── Case list batch signals ───────────────────────────────────────────────────

export interface CaseSignalMap {
  priority: Map<string, UEPriorityScoreResponse>
  slaRisk: Map<string, UESlaRiskScoreResponse>
  isLoading: boolean
  error: string | null
}

/**
 * Fetch ML signals for a full case list page (batched).
 * Maps caseId → signal for O(1) lookup in the list render.
 */
export function useCaseListSignals(
  orgId: string,
  startDate: string,
  endDate: string,
  getToken: () => Promise<string | null>,
): CaseSignalMap {
  const [priorityMap, setPriorityMap] = useState<Map<string, UEPriorityScoreResponse>>(new Map())
  const [slaRiskMap, setSlaRiskMap] = useState<Map<string, UESlaRiskScoreResponse>>(new Map())
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetch = useCallback(async () => {
    if (!orgId || !startDate || !endDate) return
    setIsLoading(true)
    setError(null)

    try {
      const client = makeMlClient(getToken)
      const [priorityResult, slaResult] = await Promise.all([
        client.getUEPriorityScores({ orgId, startDate, endDate, limit: 500 }),
        client.getUESlaRiskScores({ orgId, startDate, endDate, limit: 500 }),
      ])

      setPriorityMap(new Map(priorityResult.items.map((s) => [s.caseId, s])))
      setSlaRiskMap(new Map(slaResult.items.map((s) => [s.caseId, s])))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load ML signals')
    } finally {
      setIsLoading(false)
    }
  }, [orgId, startDate, endDate, getToken])

  useEffect(() => {
    void fetch()
  }, [fetch])

  return { priority: priorityMap, slaRisk: slaRiskMap, isLoading, error }
}
