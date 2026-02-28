/**
 * ML client — Union-Eyes.
 *
 * Provides both a server-side singleton and a client-side factory
 * for ML model inference via @nzila/ml-sdk.
 *
 * Server actions → getMlClient() / runPrediction()
 * React hooks   → makeMlClient(getToken)
 */
import { createMlClient, type MlClient } from '@nzila/ml-sdk'

// ── Server-side singleton ──────────────────────────────────────────────────

let _client: MlClient | null = null

export function getMlClient(): MlClient {
  if (!_client) {
    _client = createMlClient({
      baseUrl: process.env.ML_CORE_URL ?? 'http://localhost:4200',
      getToken: () => process.env.ML_API_KEY ?? '',
    })
  }
  return _client
}

// ── Client-side factory ────────────────────────────────────────────────────

/**
 * Creates an ML client bound to the current session token.
 * Used by React hooks (e.g. useUEMlSignals) that need Clerk-scoped auth.
 */
export function makeMlClient(getToken: () => Promise<string | null>) {
  return createMlClient({
    baseUrl: process.env.NEXT_PUBLIC_CONSOLE_URL ?? 'http://localhost:3001',
    getToken: async () => {
      const token = await getToken()
      return token ?? ''
    },
  })
}

// ── Convenience wrapper ────────────────────────────────────────────────────

/**
 * Retrieve the latest inference result for a named model.
 */
export async function runPrediction(opts: {
  model: string
  features?: Record<string, unknown>
  orgId?: string
}): Promise<Record<string, unknown> | null> {
  const client = getMlClient()
  const runs = await client.getInferenceRuns(opts.orgId ?? 'platform', 10)
  const match = runs.find((r) => r.modelKey === opts.model)
  return match?.summaryJson ?? null
}
