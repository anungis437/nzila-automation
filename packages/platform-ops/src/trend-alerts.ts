/**
 * Nzila OS — Platform Ops: Trend Warning Alerts
 *
 * ChatOps alerting for trend-based degradation warnings.
 * Dispatches to Slack/Teams when trend severity >= configured threshold.
 *
 * Complements health-alerts.ts (which handles SLO-breach anomalies)
 * by covering *pre-breach* trend warnings for predictive ops.
 *
 * @module @nzila/platform-ops/trend-alerts
 */
import type { TrendResult, TrendWarningAuditEvent } from './trend-detection'
import type { AlertTarget, AlertPayload, AlertResult, ChatOpsAdapter } from './health-alerts'

// ── Types ──────────────────────────────────────────────────────────────────

export type TrendAlertSeverity = 'info' | 'warning' | 'critical'

export interface TrendAlertConfig {
  /** Minimum trend count to trigger an alert (default: 1) */
  minDegradingCount: number
  /** Severity to assign when alerting (default: 'warning') */
  severity: TrendAlertSeverity
  /** Console URL base for deep-link */
  consoleBaseUrl: string
}

// ── Defaults ───────────────────────────────────────────────────────────────

const DEFAULT_CONSOLE_BASE_URL =
  process.env.NEXT_PUBLIC_CONSOLE_URL ?? 'http://localhost:3001'

export const DEFAULT_TREND_ALERT_CONFIG: TrendAlertConfig = {
  minDegradingCount: 1,
  severity: 'warning',
  consoleBaseUrl: DEFAULT_CONSOLE_BASE_URL,
}

// ── Formatting ─────────────────────────────────────────────────────────────

/**
 * Format a single trend warning as a ChatOps alert payload.
 */
export function formatTrendWarningAlert(
  warning: TrendResult,
  config: TrendAlertConfig = DEFAULT_TREND_ALERT_CONFIG,
): AlertPayload {
  const emoji = config.severity === 'critical' ? '🚨' : '📈'
  const severityLabel = config.severity.toUpperCase()

  const subject = `${emoji} [${severityLabel}] Trend Warning: ${warning.scope}/${warning.metric}`
  const consoleUrl = `${config.consoleBaseUrl}/trend-detection`

  const body = [
    `**Trend Degradation Detected**`,
    ``,
    `**Metric:** ${warning.metric}`,
    `**Scope:** ${warning.scope}`,
    `**Direction:** ${warning.direction}`,
    `**Slope:** ${warning.slopePerDay}/day`,
    `**Normalised Slope:** ${warning.normalisedSlope}`,
    `**R²:** ${warning.rSquared}`,
    `**Data Points:** ${warning.dataPointCount}`,
    ``,
    `> ${warning.summary}`,
    ``,
    `⚠️ This trend warning was detected **before** an SLO breach occurred.`,
    ``,
    `🔗 [View Trends in Console](${consoleUrl})`,
  ].join('\n')

  return {
    subject,
    body,
    severity: config.severity === 'critical' ? 'critical' : 'warning',
    consoleUrl,
  }
}

/**
 * Format a summary alert for multiple trend warnings.
 */
export function formatTrendWarningSummary(
  warnings: TrendResult[],
  event: TrendWarningAuditEvent,
  config: TrendAlertConfig = DEFAULT_TREND_ALERT_CONFIG,
): AlertPayload {
  const emoji = warnings.length >= 3 ? '🚨' : '📈'
  const severityLabel =
    warnings.length >= 3 ? 'CRITICAL' : config.severity.toUpperCase()
  const actualSeverity = warnings.length >= 3 ? 'critical' : 'warning'

  const subject = `${emoji} [${severityLabel}] ${event.degradingCount} Trend Warning(s) Detected`
  const consoleUrl = `${config.consoleBaseUrl}/ops`

  const lines = [
    `**Trend Degradation Summary**`,
    ``,
    `**Degrading Metrics:** ${event.degradingCount}`,
    `**Generated:** ${event.timestamp}`,
    ``,
  ]

  for (const w of warnings) {
    const icon = w.normalisedSlope > 0.05 ? '🔴' : '🟡'
    lines.push(
      `${icon} **${w.scope}/${w.metric}** — slope ${w.slopePerDay}/day (R²=${w.rSquared})`,
    )
  }

  lines.push('')
  lines.push(`🔗 [View Ops Dashboard](${consoleUrl})`)

  return {
    subject,
    body: lines.join('\n'),
    severity: actualSeverity,
    consoleUrl,
  }
}

// ── Dispatch ───────────────────────────────────────────────────────────────

/**
 * Dispatch trend warning alerts to all configured ChatOps targets.
 *
 * Only dispatches when degrading count meets the minimum threshold.
 */
export async function dispatchTrendAlerts(
  warnings: TrendResult[],
  event: TrendWarningAuditEvent,
  targets: AlertTarget[],
  adapters: Record<string, ChatOpsAdapter>,
  config: TrendAlertConfig = DEFAULT_TREND_ALERT_CONFIG,
): Promise<AlertResult[]> {
  const results: AlertResult[] = []

  if (warnings.length < config.minDegradingCount) {
    return results
  }

  // Send summary alert
  const summaryAlert = formatTrendWarningSummary(warnings, event, config)
  for (const target of targets) {
    const adapter = adapters[target.provider]
    if (!adapter) {
      results.push({
        target: target.provider,
        sent: false,
        error: 'No adapter available',
      })
      continue
    }
    try {
      const result = await adapter.send(
        { subject: summaryAlert.subject, body: summaryAlert.body },
        target.credentials,
      )
      results.push({
        target: `${target.provider}:trend_summary`,
        sent: result.ok,
        error: result.error,
      })
    } catch (err) {
      results.push({
        target: `${target.provider}:trend_summary`,
        sent: false,
        error: err instanceof Error ? err.message : String(err),
      })
    }
  }

  // Send individual alerts for high-slope degradations
  const highSlope = warnings.filter((w) => w.normalisedSlope > 0.05)
  for (const warning of highSlope) {
    const alert = formatTrendWarningAlert(warning, {
      ...config,
      severity: 'critical',
    })
    for (const target of targets) {
      const adapter = adapters[target.provider]
      if (!adapter) continue
      try {
        const result = await adapter.send(
          { subject: alert.subject, body: alert.body },
          target.credentials,
        )
        results.push({
          target: `${target.provider}:trend:${warning.scope}/${warning.metric}`,
          sent: result.ok,
          error: result.error,
        })
      } catch (err) {
        results.push({
          target: `${target.provider}:trend:${warning.scope}/${warning.metric}`,
          sent: false,
          error: err instanceof Error ? err.message : String(err),
        })
      }
    }
  }

  return results
}
