/* ── AI Advisory Copilot ──────────────────────────────────
 *
 * AI-assisted advisory capabilities for mobility cases.
 * All outputs include confidence score, reasoning trace,
 * and jurisdiction references. AI must NOT issue legal
 * determinations or override compliance controls.
 *
 * @module @nzila/mobility-ai/copilot
 */

import type { AiOutput, EligibilityResult } from '@nzila/mobility-core'

/* ── Output Types ─────────────────────────────────────────── */

export const AI_OUTPUT_TYPES = [
  'client_summary',
  'program_comparison',
  'case_memo',
  'document_request_list',
  'risk_flag_explanation',
] as const
export type AiOutputType = (typeof AI_OUTPUT_TYPES)[number]

/* ── Request / Response ───────────────────────────────────── */

export interface CopilotRequest {
  orgId: string
  actorId: string
  outputType: AiOutputType
  context: CopilotContext
}

export interface CopilotContext {
  caseId?: string
  clientId?: string
  programIds?: string[]
  eligibilityResults?: EligibilityResult[]
  additionalNotes?: string
}

export interface CopilotResponse {
  outputType: AiOutputType
  content: string
  confidenceScore: number
  reasoningTrace: string
  jurisdictionRefs: string[]
  disclaimer: string
}

/* ── Constants ────────────────────────────────────────────── */

const AI_DISCLAIMER =
  'This AI-generated output is for advisory purposes only. ' +
  'It does not constitute legal advice and must not be relied upon as a legal determination. ' +
  'All outputs require human review and approval before use.'

/* ── Copilot Functions ────────────────────────────────────── */

/**
 * Generate a client summary for advisor review.
 * Aggregates client profile, family structure, case history.
 */
export async function generateClientSummary(
  request: CopilotRequest,
  generateFn: (prompt: string) => Promise<{ text: string; confidence: number }>,
): Promise<CopilotResponse> {
  const prompt = buildPrompt('client_summary', request.context)
  const result = await generateFn(prompt)

  return {
    outputType: 'client_summary',
    content: result.text,
    confidenceScore: result.confidence,
    reasoningTrace: `Generated client summary for client ${request.context.clientId}`,
    jurisdictionRefs: [],
    disclaimer: AI_DISCLAIMER,
  }
}

/**
 * Compare programs side by side with eligibility reasoning.
 */
export async function generateProgramComparison(
  request: CopilotRequest,
  generateFn: (prompt: string) => Promise<{ text: string; confidence: number }>,
): Promise<CopilotResponse> {
  const prompt = buildPrompt('program_comparison', request.context)
  const result = await generateFn(prompt)

  const jurisdictionRefs = request.context.programIds ?? []

  return {
    outputType: 'program_comparison',
    content: result.text,
    confidenceScore: result.confidence,
    reasoningTrace: `Compared ${jurisdictionRefs.length} programs for client ${request.context.clientId}`,
    jurisdictionRefs,
    disclaimer: AI_DISCLAIMER,
  }
}

/**
 * Draft a case memo for internal review.
 */
export async function generateCaseMemo(
  request: CopilotRequest,
  generateFn: (prompt: string) => Promise<{ text: string; confidence: number }>,
): Promise<CopilotResponse> {
  const prompt = buildPrompt('case_memo', request.context)
  const result = await generateFn(prompt)

  return {
    outputType: 'case_memo',
    content: result.text,
    confidenceScore: result.confidence,
    reasoningTrace: `Drafted case memo for case ${request.context.caseId}`,
    jurisdictionRefs: [],
    disclaimer: AI_DISCLAIMER,
  }
}

/**
 * Generate a document request checklist tailored to the program.
 */
export async function generateDocumentRequestList(
  request: CopilotRequest,
  generateFn: (prompt: string) => Promise<{ text: string; confidence: number }>,
): Promise<CopilotResponse> {
  const prompt = buildPrompt('document_request_list', request.context)
  const result = await generateFn(prompt)

  return {
    outputType: 'document_request_list',
    content: result.text,
    confidenceScore: result.confidence,
    reasoningTrace: `Document request list for case ${request.context.caseId}`,
    jurisdictionRefs: [],
    disclaimer: AI_DISCLAIMER,
  }
}

/**
 * Explain risk flags in human-readable language.
 */
export async function explainRiskFlags(
  request: CopilotRequest,
  generateFn: (prompt: string) => Promise<{ text: string; confidence: number }>,
): Promise<CopilotResponse> {
  const prompt = buildPrompt('risk_flag_explanation', request.context)
  const result = await generateFn(prompt)

  return {
    outputType: 'risk_flag_explanation',
    content: result.text,
    confidenceScore: result.confidence,
    reasoningTrace: `Risk flag explanation for case ${request.context.caseId}`,
    jurisdictionRefs: [],
    disclaimer: AI_DISCLAIMER,
  }
}

/* ── Prompt Builder ───────────────────────────────────────── */

function buildPrompt(outputType: AiOutputType, context: CopilotContext): string {
  const sections: string[] = [
    `Output type: ${outputType}`,
    `IMPORTANT: Do not provide legal determinations. Provide advisory analysis only.`,
  ]

  if (context.caseId) sections.push(`Case ID: ${context.caseId}`)
  if (context.clientId) sections.push(`Client ID: ${context.clientId}`)
  if (context.programIds?.length) {
    sections.push(`Programs: ${context.programIds.join(', ')}`)
  }
  if (context.eligibilityResults?.length) {
    sections.push(
      `Eligibility results:\n${context.eligibilityResults.map((r) => `  - Program ${r.programId}: eligible=${r.eligible}, score=${r.score}`).join('\n')}`,
    )
  }
  if (context.additionalNotes) {
    sections.push(`Notes: ${context.additionalNotes}`)
  }

  return sections.join('\n\n')
}
