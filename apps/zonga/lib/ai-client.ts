/**
 * AI client — Zonga app.
 *
 * Provides a singleton AI client for content intelligence features:
 * content recommendations, music similarity, and automated tagging.
 *
 * All AI calls are routed through the governed @nzila/ai-sdk layer
 * (profiles, budgets, redaction, auditing).
 */
import { createAiClient, type AiClient, type DataClass } from '@nzila/ai-sdk'

const APP_KEY = 'zonga'

let _client: AiClient | null = null

export function getAiClient(): AiClient {
  if (!_client) {
    _client = createAiClient({
      baseUrl: process.env.AI_CORE_URL ?? 'http://localhost:4100',
      getToken: () => process.env.AI_API_KEY ?? '',
    })
  }
  return _client
}

/**
 * Run text generation and return the content string.
 */
export async function runAICompletion(
  prompt: string,
  opts?: { entityId?: string; profile?: string; dataClass?: DataClass },
): Promise<string> {
  const client = getAiClient()
  const result = await client.generate({
    entityId: opts?.entityId ?? 'platform',
    appKey: APP_KEY,
    profileKey: opts?.profile ?? `${APP_KEY}-default`,
    input: prompt,
    dataClass: opts?.dataClass ?? 'internal',
  })
  return result.content
}

/**
 * Generate embeddings for input text(s).
 */
export async function runAIEmbed(
  input: string | string[],
  opts?: { entityId?: string; profile?: string },
): Promise<number[][]> {
  const client = getAiClient()
  const result = await client.embed({
    entityId: opts?.entityId ?? 'platform',
    appKey: APP_KEY,
    profileKey: opts?.profile ?? `${APP_KEY}-embed`,
    input,
    dataClass: 'internal',
  })
  return result.embeddings
}

/**
 * Extract structured JSON from text using a named prompt template.
 */
export async function runAIExtraction(
  input: string,
  promptKey: string,
  opts?: { entityId?: string; profile?: string; variables?: Record<string, string> },
): Promise<Record<string, unknown>> {
  const client = getAiClient()
  const result = await client.extract({
    entityId: opts?.entityId ?? 'platform',
    appKey: APP_KEY,
    profileKey: opts?.profile ?? `${APP_KEY}-extract`,
    promptKey,
    input,
    variables: opts?.variables,
    dataClass: 'internal',
  })
  return result.data
}
