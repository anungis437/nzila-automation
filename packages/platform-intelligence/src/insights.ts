import { randomUUID } from 'node:crypto'
import type { AggregatedEvent } from './types'
import type { CrossAppInsight, InsightCategory, InsightSeverity } from './types'

export function generateCrossAppInsights(
  events: AggregatedEvent[],
): CrossAppInsight[] {
  const insights: CrossAppInsight[] = []
  const appGroups = new Map<string, AggregatedEvent[]>()

  for (const event of events) {
    const list = appGroups.get(event.app) ?? []
    list.push(event)
    appGroups.set(event.app, list)
  }

  // Detect apps with high event volume
  for (const [app, appEvents] of appGroups) {
    if (appEvents.length > 100) {
      insights.push(
        createInsight({
          category: 'usage',
          severity: 'info',
          apps: [app],
          title: `High event volume in ${app}`,
          description: `${app} generated ${appEvents.length} events in the analysis window`,
          dataPoints: { eventCount: appEvents.length },
          recommendations: ['Review event generation patterns', 'Consider event batching'],
        }),
      )
    }
  }

  // Detect cross-app error correlation
  const errorEvents = events.filter((e) => e.eventType === 'error')
  if (errorEvents.length > 0) {
    const affectedApps = [...new Set(errorEvents.map((e) => e.app))]
    if (affectedApps.length > 1) {
      insights.push(
        createInsight({
          category: 'anomaly',
          severity: 'warning',
          apps: affectedApps,
          title: 'Cross-app error correlation detected',
          description: `Errors detected across ${affectedApps.length} apps simultaneously`,
          dataPoints: { errorCount: errorEvents.length, apps: affectedApps },
          recommendations: [
            'Investigate shared infrastructure dependencies',
            'Check for cascading failures',
          ],
        }),
      )
    }
  }

  // UE grievance spike + CFO overtime increase -> staffing imbalance signal
  const ueGrievances = events.filter(
    (e) => e.app === 'union-eyes' && e.eventType === 'grievance_spike',
  )
  const cfoOvertime = events.filter(
    (e) => e.app === 'cfo' && e.eventType === 'overtime_increase',
  )
  if (ueGrievances.length > 0 && cfoOvertime.length > 0) {
    insights.push(
      createInsight({
        category: 'anomaly',
        severity: 'critical',
        apps: ['union-eyes', 'cfo'],
        title: 'Staffing imbalance signal detected',
        description:
          'Grievance spike in UnionEyes combined with overtime increase in CFO suggests staffing imbalance',
        dataPoints: {
          grievanceCount: ueGrievances.length,
          overtimeCount: cfoOvertime.length,
        },
        recommendations: [
          'Review staffing levels across affected departments',
          'Initiate workforce planning review',
          'Check overtime approval policies',
        ],
      }),
    )
  }

  // Shop Quoter quote volume drop + Web lead decline -> demand weakness signal
  const quoteDrop = events.filter(
    (e) => e.app === 'shop-quoter' && e.eventType === 'quote_volume_drop',
  )
  const leadDecline = events.filter(
    (e) => e.app === 'web' && e.eventType === 'lead_decline',
  )
  if (quoteDrop.length > 0 && leadDecline.length > 0) {
    insights.push(
      createInsight({
        category: 'anomaly',
        severity: 'warning',
        apps: ['shop-quoter', 'web'],
        title: 'Demand weakness signal detected',
        description:
          'Quote volume drop in Shop Quoter combined with lead decline in Web indicates potential demand weakness',
        dataPoints: {
          quoteDropCount: quoteDrop.length,
          leadDeclineCount: leadDecline.length,
        },
        recommendations: [
          'Review marketing pipeline effectiveness',
          'Analyze competitive pricing changes',
          'Conduct demand forecast review',
        ],
      }),
    )
  }

  // Partners underperformance + CFO revenue variance -> partner risk signal
  const partnerIssues = events.filter(
    (e) => e.app === 'partners' && e.eventType === 'performance_drop',
  )
  const revenueVariance = events.filter(
    (e) => e.app === 'cfo' && e.eventType === 'revenue_variance',
  )
  if (partnerIssues.length > 0 && revenueVariance.length > 0) {
    insights.push(
      createInsight({
        category: 'cost',
        severity: 'warning',
        apps: ['partners', 'cfo'],
        title: 'Partner revenue risk detected',
        description:
          'Partner performance drops correlate with CFO revenue variance, indicating partner-linked revenue risk',
        dataPoints: {
          partnerIssueCount: partnerIssues.length,
          revenueVarianceCount: revenueVariance.length,
        },
        recommendations: [
          'Review underperforming partner contracts',
          'Initiate partner performance review process',
          'Evaluate revenue dependency on affected partners',
        ],
      }),
    )
  }

  return insights
}

export function crossAppInsights(
  events: AggregatedEvent[],
): CrossAppInsight[] {
  return generateCrossAppInsights(events)
}

function createInsight(params: {
  category: InsightCategory
  severity: InsightSeverity
  apps: string[]
  title: string
  description: string
  dataPoints: Record<string, unknown>
  recommendations: string[]
}): CrossAppInsight {
  return {
    id: randomUUID(),
    timestamp: new Date().toISOString(),
    ...params,
  }
}
