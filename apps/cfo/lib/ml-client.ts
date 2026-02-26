/**
 * ML client — CFO app.
 *
 * Provides a singleton ML client for financial ML features:
 * anomaly detection models, cash flow prediction, and risk scoring.
 *
 * All ML calls are routed through the governed @nzila/ml-sdk layer.
 */
import { createMlClient, type MlClient } from '@nzila/ml-sdk'

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

/**
 * Retrieve the latest inference result for a named model.
 *
 * The ML platform runs offline inference jobs; this returns the most
 * recent run output (`summaryJson`) for the given model key.
 */
export async function runPrediction(opts: {
  model: string
  features?: Record<string, unknown>
  entityId?: string
}): Promise<Record<string, unknown> | null> {
  const client = getMlClient()
  const runs = await client.getInferenceRuns(opts.entityId ?? 'platform', 10)
  const match = runs.find((r) => r.modelKey === opts.model)
  return match?.summaryJson ?? null
}
