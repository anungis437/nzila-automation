import { describe, it, expect, beforeEach } from 'vitest'
import {
  registerModel,
  approveModel,
  listModels,
  clearRegistry,
} from '../src/modelRegistry'
import {
  createPromptVersion,
  getActivePrompt,
  getPromptHistory,
  clearPromptVersions,
} from '../src/promptVersioning'
import {
  logAIDecision,
  getDecisionsPendingReview,
  reviewDecision,
  clearDecisionLog,
} from '../src/decisionLog'
import {
  flagForReview,
  resolveReviewFlag,
  getPendingReviewFlags,
  clearReviewFlags,
} from '../src/humanReview'

describe('platform-ai-governance', () => {
  beforeEach(() => {
    clearRegistry()
    clearPromptVersions()
    clearDecisionLog()
    clearReviewFlags()
  })

  describe('modelRegistry', () => {
    it('registers a model', () => {
      const model = registerModel({
        name: 'gpt-4o',
        version: '2025-01',
        provider: 'azure-openai',
        capabilities: ['text-generation', 'summarization'],
        riskLevel: 'medium',
      })
      expect(model.id).toBeTruthy()
      expect(model.approvedForProduction).toBe(false)
    })

    it('approves a model for production', () => {
      const model = registerModel({
        name: 'gpt-4o-mini',
        version: '2025-01',
        provider: 'azure-openai',
        capabilities: ['text-generation'],
        riskLevel: 'low',
      })
      const approved = approveModel(model.id)
      expect(approved?.approvedForProduction).toBe(true)
      expect(approved?.lastAuditedAt).toBeTruthy()
    })

    it('filters approved models', () => {
      const m1 = registerModel({ name: 'a', version: '1', provider: 'p', capabilities: [], riskLevel: 'low' })
      registerModel({ name: 'b', version: '1', provider: 'p', capabilities: [], riskLevel: 'low' })
      approveModel(m1.id)

      const approved = listModels({ approvedOnly: true })
      expect(approved).toHaveLength(1)
    })
  })

  describe('promptVersioning', () => {
    it('creates versioned prompts', () => {
      const v1 = createPromptVersion({
        promptName: 'quote-summary',
        template: 'Summarize: {{input}}',
        author: 'admin',
        changeReason: 'Initial version',
      })
      expect(v1.version).toBe(1)
      expect(v1.active).toBe(true)
    })

    it('deactivates previous version on new creation', () => {
      createPromptVersion({
        promptName: 'quote-summary',
        template: 'v1',
        author: 'admin',
        changeReason: 'v1',
      })
      const v2 = createPromptVersion({
        promptName: 'quote-summary',
        template: 'v2',
        author: 'admin',
        changeReason: 'v2',
      })

      expect(v2.version).toBe(2)
      const active = getActivePrompt('quote-summary')
      expect(active?.version).toBe(2)
    })

    it('returns prompt history', () => {
      createPromptVersion({ promptName: 'x', template: 'a', author: 'a', changeReason: 'a' })
      createPromptVersion({ promptName: 'x', template: 'b', author: 'a', changeReason: 'b' })
      const history = getPromptHistory('x')
      expect(history).toHaveLength(2)
      expect(history[0].version).toBe(2) // newest first
    })
  })

  describe('decisionLog', () => {
    it('flags low-confidence decisions for review', () => {
      const decision = logAIDecision({
        modelId: 'm1',
        promptId: 'p1',
        app: 'cfo',
        orgId: 'org-1',
        inputSummary: 'Analyze Q4',
        outputSummary: 'Revenue increased',
        confidence: 0.5,
      })
      expect(decision.requiresHumanReview).toBe(true)
      expect(decision.reviewStatus).toBe('pending')
    })

    it('does not flag high-confidence decisions', () => {
      const decision = logAIDecision({
        modelId: 'm1',
        promptId: 'p1',
        app: 'web',
        orgId: 'org-1',
        inputSummary: 'Test',
        outputSummary: 'Result',
        confidence: 0.95,
      })
      expect(decision.requiresHumanReview).toBe(false)
    })

    it('reviews a decision', () => {
      const decision = logAIDecision({
        modelId: 'm1',
        promptId: 'p1',
        app: 'cfo',
        orgId: 'org-1',
        inputSummary: 'Test',
        outputSummary: 'Result',
        confidence: 0.4,
      })
      const reviewed = reviewDecision(decision.id, {
        status: 'approved',
        reviewedBy: 'analyst',
      })
      expect(reviewed?.reviewStatus).toBe('approved')
      expect(reviewed?.reviewedBy).toBe('analyst')
    })
  })

  describe('humanReview', () => {
    it('flags a decision for review', () => {
      const flag = flagForReview({
        decisionId: 'd1',
        reason: 'Unexpected output',
        flaggedBy: 'admin',
        priority: 'high',
      })
      expect(flag.resolved).toBe(false)
      expect(getPendingReviewFlags()).toHaveLength(1)
    })

    it('resolves a review flag', () => {
      const flag = flagForReview({
        decisionId: 'd1',
        reason: 'Test',
        flaggedBy: 'admin',
        priority: 'medium',
      })
      const resolved = resolveReviewFlag(flag.id, 'Output verified as correct')
      expect(resolved?.resolved).toBe(true)
      expect(getPendingReviewFlags()).toHaveLength(0)
    })
  })
})
