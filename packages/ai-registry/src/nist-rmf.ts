/**
 * NIST AI Risk Management Framework (AI RMF) Alignment
 *
 * Maps Nzila's AI governance to the four NIST AI RMF functions:
 * - GOVERN: Organizational practices and culture
 * - MAP: Context and risk framing
 * - MEASURE: Metrics and evaluation
 * - MANAGE: Ongoing risk treatments
 *
 * Reference: NIST AI 100-1 (AI Risk Management Framework 1.0)
 */

import { z } from 'zod';
import type { ModelCard } from './model-card.js';

// ── Types ────────────────────────────────────────────────────────────────────

export type NistRmfFunction = 'GOVERN' | 'MAP' | 'MEASURE' | 'MANAGE';

export interface NistRmfCategory {
  id: string;
  function: NistRmfFunction;
  name: string;
  description: string;
  nzilaImplementation: string;
  maturityLevel: 'not-started' | 'partial' | 'implemented' | 'verified';
  evidenceFiles: string[];
}

export interface NistRmfAssessment {
  modelId: string;
  assessedAt: string;
  assessedBy: string;
  overallMaturity: number; // 0-100
  categories: NistRmfCategory[];
  gaps: string[];
  recommendations: string[];
}

// ── NIST AI RMF Function Catalogue ──────────────────────────────────────────

export const NIST_AI_RMF_FUNCTIONS: NistRmfCategory[] = [
  // GOVERN
  {
    id: 'GOVERN-1',
    function: 'GOVERN',
    name: 'AI Risk Management Policies',
    description: 'Policies and procedures for AI risk management are established',
    nzilaImplementation: 'governance/ai/AI_SAFETY_PROTOCOLS.md + ai-core/policy/actionsPolicy.ts',
    maturityLevel: 'implemented',
    evidenceFiles: [
      'governance/ai/AI_SAFETY_PROTOCOLS.md',
      'packages/ai-core/src/policy/actionsPolicy.ts',
    ],
  },
  {
    id: 'GOVERN-2',
    function: 'GOVERN',
    name: 'AI Accountability',
    description: 'Roles and responsibilities for AI governance are defined',
    nzilaImplementation: 'CODEOWNERS + governance/ai/README.md + model card ownership',
    maturityLevel: 'implemented',
    evidenceFiles: ['CODEOWNERS', 'governance/ai/README.md'],
  },
  {
    id: 'GOVERN-3',
    function: 'GOVERN',
    name: 'AI Workforce Diversity',
    description: 'AI development teams are diverse and inclusive',
    nzilaImplementation: 'Organizational policy (outside codebase)',
    maturityLevel: 'partial',
    evidenceFiles: [],
  },
  {
    id: 'GOVERN-4',
    function: 'GOVERN',
    name: 'Organizational Commitment',
    description: 'Senior leadership commitment to responsible AI',
    nzilaImplementation: 'governance/ai/ docs suite + README.business.md',
    maturityLevel: 'implemented',
    evidenceFiles: ['governance/ai/AI_DATA_GOVERNANCE.md', 'README.business.md'],
  },

  // MAP
  {
    id: 'MAP-1',
    function: 'MAP',
    name: 'Context Establishment',
    description: 'AI system context, intended purpose, and stakeholders identified',
    nzilaImplementation: 'Model cards (purpose, intendedUse, outOfScopeUse)',
    maturityLevel: 'implemented',
    evidenceFiles: ['packages/ai-registry/src/model-card.ts'],
  },
  {
    id: 'MAP-2',
    function: 'MAP',
    name: 'Risk Categorization',
    description: 'AI risks are categorized and documented',
    nzilaImplementation: 'Risk classification engine + model card limitations',
    maturityLevel: 'implemented',
    evidenceFiles: ['packages/ai-registry/src/risk-classification.ts'],
  },
  {
    id: 'MAP-3',
    function: 'MAP',
    name: 'Bias Assessment',
    description: 'AI systems assessed for bias and fairness',
    nzilaImplementation: 'Model card limitations (bias category) + red team tests',
    maturityLevel: 'partial',
    evidenceFiles: [
      'governance/ai/AI_SAFETY_PROTOCOLS.md',
      '.github/workflows/red-team.yml',
    ],
  },

  // MEASURE
  {
    id: 'MEASURE-1',
    function: 'MEASURE',
    name: 'Performance Metrics',
    description: 'AI system performance is measured against objectives',
    nzilaImplementation: 'Model card metrics + AI evals + OTel spans',
    maturityLevel: 'implemented',
    evidenceFiles: [
      'packages/ai-registry/src/model-card.ts',
      'packages/otel-core/src/spans.ts',
    ],
  },
  {
    id: 'MEASURE-2',
    function: 'MEASURE',
    name: 'Safety Testing',
    description: 'AI systems undergo safety and security testing',
    nzilaImplementation: 'Red team adversarial tests + content safety filters',
    maturityLevel: 'implemented',
    evidenceFiles: [
      '.github/workflows/red-team.yml',
      'packages/ai-core/src/redact.ts',
    ],
  },
  {
    id: 'MEASURE-3',
    function: 'MEASURE',
    name: 'Ongoing Monitoring',
    description: 'AI systems are continuously monitored post-deployment',
    nzilaImplementation: 'OTel AI spans + SLO monitoring + budget tracking',
    maturityLevel: 'implemented',
    evidenceFiles: [
      'packages/otel-core/src/slo.ts',
      'packages/ai-core/src/budgets.ts',
    ],
  },

  // MANAGE
  {
    id: 'MANAGE-1',
    function: 'MANAGE',
    name: 'Risk Prioritization',
    description: 'AI risks are prioritized for treatment',
    nzilaImplementation: 'Risk tiers (low/medium/high/critical) with escalation policies',
    maturityLevel: 'implemented',
    evidenceFiles: [
      'packages/ai-core/src/policy/actionsPolicy.ts',
      'packages/ai-registry/src/risk-classification.ts',
    ],
  },
  {
    id: 'MANAGE-2',
    function: 'MANAGE',
    name: 'Risk Treatment',
    description: 'Risk treatments are applied and tracked',
    nzilaImplementation: 'PII redaction + budget caps + human-in-the-loop + circuit breakers',
    maturityLevel: 'implemented',
    evidenceFiles: [
      'packages/ai-core/src/redact.ts',
      'packages/ai-core/src/budgets.ts',
    ],
  },
  {
    id: 'MANAGE-3',
    function: 'MANAGE',
    name: 'Incident Response',
    description: 'AI incident response procedures are established',
    nzilaImplementation: 'ops/incident-response/ + hash-chained audit logging',
    maturityLevel: 'implemented',
    evidenceFiles: [
      'ops/incident-response/',
      'packages/ai-core/src/logging.ts',
    ],
  },
  {
    id: 'MANAGE-4',
    function: 'MANAGE',
    name: 'Model Lifecycle',
    description: 'AI models have defined lifecycle with retirement procedures',
    nzilaImplementation: 'Governance lifecycle (draft → review → approved → deployed → retired)',
    maturityLevel: 'implemented',
    evidenceFiles: ['packages/ai-registry/src/governance-lifecycle.ts'],
  },
];

// ── Assessment Engine ────────────────────────────────────────────────────────

/**
 * Evaluate a model against the NIST AI RMF framework.
 * Returns a maturity assessment with gaps and recommendations.
 */
export function evaluateNistRmf(
  modelCard: ModelCard,
  assessedBy: string,
): NistRmfAssessment {
  const gaps: string[] = [];
  const recommendations: string[] = [];

  // Check governance invariants
  if (!modelCard.governance.humanOversight && modelCard.riskTier !== 'low') {
    gaps.push('GOVERN-2: No human oversight for non-low-risk model');
    recommendations.push('Enable humanOversight in model governance settings');
  }

  if (!modelCard.governance.auditLogging) {
    gaps.push('MANAGE-3: Audit logging not enabled');
    recommendations.push('Enable auditLogging for incident response capability');
  }

  if (modelCard.limitations.length === 0) {
    gaps.push('MAP-3: No limitations documented');
    recommendations.push('Document at least known biases and accuracy limitations');
  }

  if (!modelCard.metrics) {
    gaps.push('MEASURE-1: No evaluation metrics provided');
    recommendations.push('Run model evaluation and record accuracy, latency, and cost metrics');
  }

  if (modelCard.safetyMeasures.length === 0) {
    gaps.push('MEASURE-2: No safety measures documented');
    recommendations.push('Add input-filtering, output-validation, and pii-redaction measures');
  }

  if (modelCard.governance.complianceFrameworks.length === 0) {
    gaps.push('GOVERN-1: No compliance frameworks referenced');
    recommendations.push('Map model to applicable frameworks (NIST AI RMF, SOC 2, ISO 27001)');
  }

  // Calculate maturity score
  const totalCategories = NIST_AI_RMF_FUNCTIONS.length;
  const implementedCount = NIST_AI_RMF_FUNCTIONS.filter(
    (c) => c.maturityLevel === 'implemented' || c.maturityLevel === 'verified',
  ).length;
  const partialCount = NIST_AI_RMF_FUNCTIONS.filter(
    (c) => c.maturityLevel === 'partial',
  ).length;

  const overallMaturity = Math.round(
    ((implementedCount + partialCount * 0.5) / totalCategories) * 100,
  );

  return {
    modelId: modelCard.modelId,
    assessedAt: new Date().toISOString(),
    assessedBy,
    overallMaturity,
    categories: NIST_AI_RMF_FUNCTIONS,
    gaps,
    recommendations,
  };
}
