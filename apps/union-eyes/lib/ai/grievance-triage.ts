/**
 * Grievance Triage AI Service
 *
 * Analyses a grievance and recommends:
 *  - Priority (low / medium / high / urgent)
 *  - Category (contract / harassment / safety … )
 *  - Complexity (routine / moderate / complex / unprecedented)
 *  - Estimated days to resolve
 *  - Similar past grievances
 *
 * CONSTRAINTS:
 * - Uses @nzila/ai-sdk via the singleton `getAiClient()`
 * - Every output carries confidence + explanation
 * - No action is auto-applied — results are stored as "pending"
 * - Org-scoped: all queries filter on organizationId
 *
 * @module lib/ai/grievance-triage
 */

import { db } from '@/db/db';
import { eq, and, desc } from 'drizzle-orm';
import { getAiClient, UE_APP_KEY, UE_PROFILES } from '@/lib/ai/ai-client';
import { aiGrievanceTriages, type AiGrievanceTriageInsert } from '@/db/schema/domains/ml/ai-grievance-triage';
import { grievances } from '@/db/schema/domains/claims/grievances';
import { auditAiInteraction, buildAiEnvelope, type AiResponseEnvelope } from './ai-feature-guard';
import { logger } from '@/lib/logger';

// ============================================================================
// TYPES
// ============================================================================

export interface TriageInput {
  grievanceId: string;
  organizationId: string;
  userId: string;
}

export interface TriageResult {
  suggestedPriority: string;
  suggestedCategory: string;
  complexity: 'routine' | 'moderate' | 'complex' | 'unprecedented';
  estimatedDaysToResolve: number | null;
  suggestedStep: string | null;
  similarGrievanceIds: string[];
  factors: Array<{ name: string; weight: number; description: string }>;
}

const MODEL_VERSION = '1.0.0';

// ============================================================================
// SERVICE
// ============================================================================

/**
 * Analyse a grievance and produce a triage recommendation.
 * Returns a full AI envelope with confidence + explanation.
 */
export async function analyzeGrievance(
  input: TriageInput,
): Promise<AiResponseEnvelope<TriageResult>> {
  const { grievanceId, organizationId, userId } = input;

  // 1. Fetch grievance
  const grievance = await db.query.grievances.findFirst({
    where: and(eq(grievances.id, grievanceId), eq(grievances.organizationId, organizationId)),
  });

  if (!grievance) {
    throw new Error(`Grievance ${grievanceId} not found in org ${organizationId}`);
  }

  // 2. Call AI
  const ai = getAiClient();
  const prompt = buildTriagePrompt(grievance);
  const aiResult = await ai.generate({
    orgId: organizationId,
    appKey: UE_APP_KEY,
    profileKey: UE_PROFILES.GRIEVANCE_TRIAGE,
    input: prompt,
    dataClass: 'internal',
  });

  // 3. Parse AI response
  const parsed = parseTriageResponse(aiResult.content ?? '');

  // 4. Audit
  const auditRef = await auditAiInteraction({
    featureName: 'grievance_triage',
    userId,
    organizationId,
    resource: 'grievances',
    resourceId: grievanceId,
    action: 'triage',
    confidence: parsed.confidence,
    modelVersion: MODEL_VERSION,
  });

  // 5. Persist
  const insert: AiGrievanceTriageInsert = {
    organizationId,
    grievanceId,
    suggestedPriority: parsed.triage.suggestedPriority,
    suggestedCategory: parsed.triage.suggestedCategory,
    complexity: parsed.triage.complexity,
    estimatedDaysToResolve: parsed.triage.estimatedDaysToResolve?.toString() ?? null,
    suggestedStep: parsed.triage.suggestedStep,
    confidence: parsed.confidence.toFixed(4),
    explanation: parsed.explanation,
    factorsJson: parsed.triage.factors,
    similarGrievanceIds: parsed.triage.similarGrievanceIds,
    modelVersion: MODEL_VERSION,
    profileKey: UE_PROFILES.GRIEVANCE_TRIAGE,
    auditRef,
    status: 'pending',
  };

  await db.insert(aiGrievanceTriages).values(insert);

  // 6. Envelope
  return buildAiEnvelope(parsed.triage, {
    confidence: parsed.confidence,
    explanation: parsed.explanation,
    modelVersion: MODEL_VERSION,
    auditRef,
  });
}

/**
 * Find past triage results for a grievance.
 */
export async function getTriageHistory(
  grievanceId: string,
  organizationId: string,
) {
  return db.query.aiGrievanceTriages.findMany({
    where: and(
      eq(aiGrievanceTriages.grievanceId, grievanceId),
      eq(aiGrievanceTriages.organizationId, organizationId),
    ),
    orderBy: [desc(aiGrievanceTriages.createdAt)],
  });
}

/**
 * Accept or reject a pending triage.
 */
export async function reviewTriage(
  triageId: string,
  organizationId: string,
  reviewedBy: string,
  accept: boolean,
  notes?: string,
) {
  await db
    .update(aiGrievanceTriages)
    .set({
      status: accept ? 'accepted' : 'rejected',
      reviewedBy,
      reviewedAt: new Date(),
      reviewNotes: notes ?? null,
      humanApproved: accept,
    })
    .where(and(eq(aiGrievanceTriages.id, triageId), eq(aiGrievanceTriages.organizationId, organizationId)));
}

// ============================================================================
// INTERNALS
// ============================================================================

function buildTriagePrompt(g: typeof grievances.$inferSelect): string {
  return [
    'You are a union grievance triage assistant.',
    'Analyse the following grievance and return a JSON object with:',
    '  suggestedPriority (low|medium|high|urgent)',
    '  suggestedCategory (string)',
    '  complexity (routine|moderate|complex|unprecedented)',
    '  estimatedDaysToResolve (number or null)',
    '  suggestedStep (step_1|step_2|step_3|final|arbitration or null)',
    '  similarGrievanceIds (string[] — empty if none)',
    '  factors (array of {name, weight 0-1, description})',
    '  confidence (number 0-1)',
    '  explanation (string — why you reached this assessment)',
    '',
    `Grievance #${g.grievanceNumber}`,
    `Type: ${g.type}`,
    `Current status: ${g.status}`,
    `Priority: ${g.priority ?? 'not set'}`,
    `Title: ${g.title}`,
    `Description: ${g.description}`,
    g.background ? `Background: ${g.background}` : '',
    g.desiredOutcome ? `Desired outcome: ${g.desiredOutcome}` : '',
    g.incidentDate ? `Incident date: ${g.incidentDate.toISOString()}` : '',
    '',
    'Respond ONLY with valid JSON. No markdown.',
  ]
    .filter(Boolean)
    .join('\n');
}

function parseTriageResponse(raw: string): {
  triage: TriageResult;
  confidence: number;
  explanation: string;
} {
  try {
    const json = JSON.parse(raw);
    return {
      triage: {
        suggestedPriority: json.suggestedPriority ?? 'medium',
        suggestedCategory: json.suggestedCategory ?? 'general',
        complexity: json.complexity ?? 'moderate',
        estimatedDaysToResolve: json.estimatedDaysToResolve ?? null,
        suggestedStep: json.suggestedStep ?? null,
        similarGrievanceIds: json.similarGrievanceIds ?? [],
        factors: json.factors ?? [],
      },
      confidence: Math.min(1, Math.max(0, Number(json.confidence) || 0.5)),
      explanation: json.explanation ?? 'No explanation provided by model.',
    };
  } catch {
    logger.warn('Failed to parse triage AI response, using defaults');
    return {
      triage: {
        suggestedPriority: 'medium',
        suggestedCategory: 'general',
        complexity: 'moderate',
        estimatedDaysToResolve: null,
        suggestedStep: null,
        similarGrievanceIds: [],
        factors: [],
      },
      confidence: 0.3,
      explanation: 'AI response could not be parsed. Manual triage recommended.',
    };
  }
}
