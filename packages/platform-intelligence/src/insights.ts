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

  return insights
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
