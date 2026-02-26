/**
 * Orchestrator API — OpenTelemetry instrumentation
 *
 * Extracted from index.ts for standard module layout.
 * Called at startup to initialize OTel tracing + metrics.
 */
import { createLogger } from '@nzila/os-core'

const logger = createLogger('orchestrator-api:otel')

export async function initInstrumentation() {
  try {
    const { initOtel, initMetrics } = await import('@nzila/os-core/telemetry')
    await initOtel({ appName: 'orchestrator-api' })
    initMetrics('orchestrator-api')
    logger.info('OpenTelemetry + metrics initialized')
  } catch (err) {
    logger.warn('OTel initialization skipped', { error: err })
  }
}
