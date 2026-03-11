import { z } from 'zod'

// ── Model Registry ──────────────────────────────────────

export interface ModelRegistryEntry {
  id: string
  name: string
  version: string
  provider: string
  capabilities: string[]
  riskLevel: 'low' | 'medium' | 'high'
  approvedForProduction: boolean
  registeredAt: string
  lastAuditedAt?: string
}

export const modelRegistryEntrySchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  version: z.string(),
  provider: z.string(),
  capabilities: z.array(z.string()),
  riskLevel: z.enum(['low', 'medium', 'high']),
  approvedForProduction: z.boolean(),
  registeredAt: z.string().datetime(),
  lastAuditedAt: z.string().datetime().optional(),
})

// ── Prompt Versioning ───────────────────────────────────

export interface PromptVersion {
  id: string
  promptName: string
  version: number
  template: string
  author: string
  createdAt: string
  active: boolean
  changeReason: string
}

export const promptVersionSchema = z.object({
  id: z.string().uuid(),
  promptName: z.string(),
  version: z.number().int().positive(),
  template: z.string(),
  author: z.string(),
  createdAt: z.string().datetime(),
  active: z.boolean(),
  changeReason: z.string(),
})

// ── AI Decision Log ─────────────────────────────────────

export interface AIDecisionLogEntry {
  id: string
  timestamp: string
  modelId: string
  promptId: string
  app: string
  orgId: string
  inputSummary: string
  outputSummary: string
  confidence: number
  requiresHumanReview: boolean
  reviewStatus?: 'pending' | 'approved' | 'rejected'
  reviewedBy?: string
  reviewedAt?: string
}

export const aiDecisionLogEntrySchema = z.object({
  id: z.string().uuid(),
  timestamp: z.string().datetime(),
  modelId: z.string(),
  promptId: z.string(),
  app: z.string(),
  orgId: z.string(),
  inputSummary: z.string(),
  outputSummary: z.string(),
  confidence: z.number().min(0).max(1),
  requiresHumanReview: z.boolean(),
  reviewStatus: z.enum(['pending', 'approved', 'rejected']).optional(),
  reviewedBy: z.string().optional(),
  reviewedAt: z.string().datetime().optional(),
})

// ── Human Review ────────────────────────────────────────

export interface HumanReviewFlag {
  id: string
  decisionId: string
  reason: string
  flaggedAt: string
  flaggedBy: string
  priority: 'low' | 'medium' | 'high' | 'critical'
  resolved: boolean
  resolution?: string
}

export const humanReviewFlagSchema = z.object({
  id: z.string().uuid(),
  decisionId: z.string().uuid(),
  reason: z.string(),
  flaggedAt: z.string().datetime(),
  flaggedBy: z.string(),
  priority: z.enum(['low', 'medium', 'high', 'critical']),
  resolved: z.boolean(),
  resolution: z.string().optional(),
})
