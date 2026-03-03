/**
 * Nzila OS — Platform Ops: Health Alerting
 *
 * Sends ChatOps alerts (Slack / Teams) when anomaly thresholds are breached.
 * Includes Console link for operator drill-down.
 *
 * @module @nzila/platform-ops/health-alerts
 */
import type { Anomaly, HealthDigestSnapshot } from './health-digest'

// ── Types ──────────────────────────────────────────────────────────────────

export interface AlertTarget {
  /** 'slack' | 'teams' */
  provider: 'slack' | 'teams'
  /** Credentials for the adapter (webhookUrl, etc.) */
  credentials: Record<string, unknown>
}

export interface AlertPayload {
  subject: string
  body: string
  severity: 'warning' | 'critical'
  consoleUrl: string
}

export interface AlertResult {
  target: string
  sent: boolean
  error?: string
}

export interface ChatOpsAdapter {
  send(
    request: { subject?: string; body: string; to?: string },
    credentials: Record<string, unknown>,
  ): Promise<{ ok: boolean; error?: string }>
}

// ── Alert Formatting ───────────────────────────────────────────────────────

const CONSOLE_BASE_URL = process.env.NEXT_PUBLIC_CONSOLE_URL ?? 'http://localhost:3001'

/**
 * Format a single anomaly into an alert payload.
 */
export function formatAnomalyAlert(anomaly: Anomaly): AlertPayload {
  const emoji = anomaly.severity === 'critical' ? '🚨' : '⚠️'
  const severityLabel = anomaly.severity.toUpperCase()

  const subject = `${emoji} [${severityLabel}] Health Alert: ${anomaly.scope}/${anomaly.metric}`
  const consoleUrl = `${CONSOLE_BASE_URL}/performance/regressions`

  const body = [
    `**Metric:** ${anomaly.metric}`,
    `**Scope:** ${anomaly.scope}`,
    `**Current Value:** ${anomaly.currentValue}`,
    `**SLO Threshold:** ${anomaly.threshold}`,
    `**Severity:** ${severityLabel}`,
    ``,
    `${anomaly.description}`,
    ``,
    `🔗 [View in Console](${consoleUrl})`,
  ].join('\n')

  return { subject, body, severity: anomaly.severity, consoleUrl }
}

/**
 * Format the daily digest summary as a ChatOps message.
 */
export function formatDigestSummary(snapshot: HealthDigestSnapshot): AlertPayload {
  const { summary, coverageDate } = snapshot
  const status =
    summary.criticals > 0 ? '🚨 CRITICAL' :
    summary.warnings > 0 ? '⚠️ WARNING' :
    '✅ HEALTHY'

  const subject = `📊 Daily Health Digest — ${coverageDate} — ${status}`
  const consoleUrl = `${CONSOLE_BASE_URL}/system-health`

  const lines = [
    `**Coverage Date:** ${coverageDate}`,
    `**Total Metrics:** ${summary.totalMetrics}`,
    `**SLO Violations:** ${summary.sloViolations}`,
    `**Warnings:** ${summary.warnings}`,
    `**Criticals:** ${summary.criticals}`,
    ``,
  ]

  if (snapshot.anomalies.length > 0) {
    lines.push('**Anomalies:**')
    for (const a of snapshot.anomalies) {
      const icon = a.severity === 'critical' ? '🔴' : '🟡'
      lines.push(`${icon} ${a.scope}/${a.metric}: ${a.currentValue} (threshold: ${a.threshold})`)
    }
    lines.push('')
  }

  lines.push(`🔗 [View in Console](${consoleUrl})`)

  const severity = summary.criticals > 0 ? 'critical' : 'warning'
  return { subject, body: lines.join('\n'), severity, consoleUrl }
}

// ── Alert Dispatch ─────────────────────────────────────────────────────────

/**
 * Send alerts to all configured targets for critical/warning anomalies.
 *
 * @param snapshot - The health digest snapshot
 * @param targets - Array of alert targets (Slack/Teams)
 * @param adapters - Map of provider name to ChatOps adapter
 * @returns Results for each alert sent
 */
export async function dispatchAlerts(
  snapshot: HealthDigestSnapshot,
  targets: AlertTarget[],
  adapters: Record<string, ChatOpsAdapter>,
): Promise<AlertResult[]> {
  const results: AlertResult[] = []

  // Always send the daily digest summary
  const digestAlert = formatDigestSummary(snapshot)
  for (const target of targets) {
    const adapter = adapters[target.provider]
    if (!adapter) {
      results.push({ target: target.provider, sent: false, error: 'No adapter available' })
      continue
    }
    try {
      const result = await adapter.send(
        { subject: digestAlert.subject, body: digestAlert.body },
        target.credentials,
      )
      results.push({ target: target.provider, sent: result.ok, error: result.error })
    } catch (err) {
      results.push({
        target: target.provider,
        sent: false,
        error: err instanceof Error ? err.message : String(err),
      })
    }
  }

  // Send immediate alerts for critical anomalies
  const criticalAnomalies = snapshot.anomalies.filter((a) => a.severity === 'critical')
  for (const anomaly of criticalAnomalies) {
    const alert = formatAnomalyAlert(anomaly)
    for (const target of targets) {
      const adapter = adapters[target.provider]
      if (!adapter) continue
      try {
        const result = await adapter.send(
          { subject: alert.subject, body: alert.body },
          target.credentials,
        )
        results.push({ target: `${target.provider}:critical:${anomaly.scope}`, sent: result.ok, error: result.error })
      } catch (err) {
        results.push({
          target: `${target.provider}:critical:${anomaly.scope}`,
          sent: false,
          error: err instanceof Error ? err.message : String(err),
        })
      }
    }
  }

  return results
}
