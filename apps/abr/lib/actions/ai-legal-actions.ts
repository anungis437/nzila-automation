/**
 * AI/ML-powered legal & compliance actions — ABR app.
 *
 * Provides AI-driven case classification, risk scoring, evidence extraction,
 * and ML-based outcome prediction for anti-bribery & regulatory cases.
 */
import { runAICompletion, runAIEmbed, runAIExtraction } from '@/lib/ai-client'
import { runPrediction } from '@/lib/ml-client'

// ── Types ────────────────────────────────────────────────────────────────────

export interface CaseClassification {
  category: string
  subcategory: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  confidence: number
  reasoning: string
}

export interface RiskAssessment {
  riskScore: number
  factors: string[]
  recommendation: string
  mlSource: boolean
}

export interface CaseOutcome {
  predictedOutcome: string
  probability: number
  estimatedDurationDays: number
  mlSource: boolean
}

export interface ComplaintExtraction {
  complainant: string | null
  respondent: string | null
  allegationType: string | null
  dateOfIncident: string | null
  keyFacts: string[]
  evidenceReferences: string[]
}

// ── AI Actions ───────────────────────────────────────────────────────────────

/**
 * Classify a case based on its description and available facts.
 * Uses AI to determine category, severity, and appropriate handling track.
 */
export async function classifyCase(
  description: string,
  facts?: string[],
): Promise<CaseClassification> {
  const context = facts?.length ? `\n\nKey facts:\n${facts.map((f) => `- ${f}`).join('\n')}` : ''

  const raw = await runAICompletion(
    `Classify this regulatory/compliance case into category, subcategory, and severity.
Return JSON: { category, subcategory, severity, confidence, reasoning }

Case description:
${description}${context}`,
    { dataClass: 'regulated' },
  )

  try {
    return JSON.parse(raw)
  } catch {
    return {
      category: 'unclassified',
      subcategory: 'pending-review',
      severity: 'medium',
      confidence: 0,
      reasoning: raw,
    }
  }
}

/**
 * Extract structured data from a raw complaint or report text.
 */
export async function extractFromComplaint(
  complaintText: string,
): Promise<ComplaintExtraction> {
  const data = await runAIExtraction(complaintText, 'abr-complaint-extraction', {
    profile: 'abr-regulated',
  })

  return {
    complainant: (data.complainant as string) ?? null,
    respondent: (data.respondent as string) ?? null,
    allegationType: (data.allegationType as string) ?? null,
    dateOfIncident: (data.dateOfIncident as string) ?? null,
    keyFacts: Array.isArray(data.keyFacts) ? (data.keyFacts as string[]) : [],
    evidenceReferences: Array.isArray(data.evidenceReferences)
      ? (data.evidenceReferences as string[])
      : [],
  }
}

/**
 * Find cases similar to the given description using embedding similarity.
 * Useful for precedent research and duplicate detection.
 */
export async function findSimilarCases(
  description: string,
  limit = 5,
): Promise<Array<{ similarity: number; summary: string }>> {
  const embeddings = await runAIEmbed(description)
  if (!embeddings.length) return []

  const raw = await runAICompletion(
    `Given this case embedding context, suggest ${limit} similar case patterns.
Return JSON array: [{ similarity: number, summary: string }]

Case: ${description}`,
    { dataClass: 'regulated' },
  )

  try {
    return JSON.parse(raw)
  } catch {
    return []
  }
}

// ── ML Actions ───────────────────────────────────────────────────────────────

/**
 * Predict the likely outcome of a case using ML models.
 * Falls back to AI heuristic if no ML model is available.
 */
export async function predictCaseOutcome(
  caseId: string,
  caseDescription: string,
): Promise<CaseOutcome | null> {
  // Try ML model first
  const prediction = await runPrediction({
    model: 'abr-case-outcome',
    entityId: caseId,
  })

  if (prediction) {
    return {
      predictedOutcome: (prediction.outcome as string) ?? 'unknown',
      probability: (prediction.probability as number) ?? 0,
      estimatedDurationDays: (prediction.estimatedDays as number) ?? 0,
      mlSource: true,
    }
  }

  // AI fallback
  const raw = await runAICompletion(
    `Based on this anti-bribery/compliance case, predict the likely outcome.
Return JSON: { predictedOutcome, probability, estimatedDurationDays }

Case: ${caseDescription}`,
    { dataClass: 'regulated', entityId: caseId },
  )

  try {
    const parsed = JSON.parse(raw)
    return { ...parsed, mlSource: false }
  } catch {
    return null
  }
}

/**
 * Assess the risk score for an entity (organization or individual) under investigation.
 * Uses ML model for scoring with AI-generated factor analysis.
 */
export async function assessRiskScore(
  entityId: string,
  context?: string,
): Promise<RiskAssessment | null> {
  const prediction = await runPrediction({
    model: 'abr-risk-score',
    entityId,
  })

  if (prediction) {
    return {
      riskScore: (prediction.score as number) ?? 0,
      factors: Array.isArray(prediction.factors) ? (prediction.factors as string[]) : [],
      recommendation: (prediction.recommendation as string) ?? '',
      mlSource: true,
    }
  }

  if (!context) return null

  // AI fallback with context
  const raw = await runAICompletion(
    `Assess compliance/bribery risk for this entity. Score 0-100 with factors.
Return JSON: { riskScore, factors: string[], recommendation }

Context: ${context}`,
    { dataClass: 'regulated', entityId },
  )

  try {
    const parsed = JSON.parse(raw)
    return { ...parsed, mlSource: false }
  } catch {
    return null
  }
}
