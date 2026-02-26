/**
 * Next.js Instrumentation Hook — Web (marketing) app.
 *
 * Initializes OpenTelemetry distributed tracing via @nzila/os-core.
 * Lighter than business apps — no boot invariants or SLO metrics needed.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME !== 'nodejs') return
  if (process.env.NEXT_PHASE === 'phase-production-build') return

  try {
    const { initOtel } = await import('@nzila/os-core/telemetry')
    await initOtel({ appName: 'web' })
  } catch {
    // Non-critical — tracing degrades gracefully
  }
}
