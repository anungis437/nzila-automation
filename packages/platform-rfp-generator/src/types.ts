/**
 * @nzila/platform-rfp-generator — Types
 *
 * Types for auto-generating RFP responses from proof artifacts.
 *
 * @module @nzila/platform-rfp-generator/types
 */
import { z } from 'zod'
import type { ProcurementPack } from '@nzila/platform-procurement-proof/types'
import type { AssuranceDashboard } from '@nzila/platform-assurance/types'

// ── RFP Sections ────────────────────────────────────────────────────────────

export type RfpSection =
  | 'security'
  | 'privacy'
  | 'evidence_auditability'
  | 'operations'
  | 'integration'
  | 'hosting_sovereignty'
  | 'disaster_recovery'
  | 'decision_layer'
  | 'verification'

export const RFP_SECTIONS: readonly RfpSection[] = [
  'security',
  'privacy',
  'evidence_auditability',
  'operations',
  'integration',
  'hosting_sovereignty',
  'disaster_recovery',
  'decision_layer',
  'verification',
]

// ── RFP Answer ──────────────────────────────────────────────────────────────

export interface RfpAnswer {
  readonly section: RfpSection
  readonly question: string
  readonly answer: string
  readonly evidenceRefs: readonly string[]
  readonly confidenceLevel: 'high' | 'medium' | 'low'
}

export interface RfpResponse {
  readonly orgId: string
  readonly generatedAt: string
  readonly generatedBy: string
  readonly sections: readonly RfpSectionResponse[]
  readonly totalQuestions: number
  readonly totalAnswered: number
}

export interface RfpSectionResponse {
  readonly section: RfpSection
  readonly title: string
  readonly answers: readonly RfpAnswer[]
}

// ── Generator Input ─────────────────────────────────────────────────────────

export interface RfpGeneratorInput {
  readonly orgId: string
  readonly generatedBy: string
  readonly procurementPack: ProcurementPack
  readonly assuranceDashboard: AssuranceDashboard
}

// ── Zod Schemas ─────────────────────────────────────────────────────────────

export const rfpAnswerSchema = z.object({
  section: z.enum([
    'security', 'privacy', 'evidence_auditability', 'operations',
    'integration', 'hosting_sovereignty',
    'disaster_recovery', 'decision_layer', 'verification',
  ]),
  question: z.string(),
  answer: z.string(),
  evidenceRefs: z.array(z.string()),
  confidenceLevel: z.enum(['high', 'medium', 'low']),
})
