import { randomUUID } from 'node:crypto'
import type { OperationalSignal, SignalType } from './types'

export function detectOperationalSignals(
  metrics: Array<{
    app: string
    metric: string
    currentValue: number
    baselineValue: number
  }>,
  thresholdPercent = 20,
): OperationalSignal[] {
  const signals: OperationalSignal[] = []

  for (const m of metrics) {
    if (m.baselineValue === 0) continue

    const deviationPercent =
      ((m.currentValue - m.baselineValue) / m.baselineValue) * 100

    if (Math.abs(deviationPercent) < thresholdPercent) continue

    let signalType: SignalType
    if (deviationPercent > 50) signalType = 'spike'
    else if (deviationPercent < -50) signalType = 'drop'
    else signalType = 'threshold_breach'

    const confidence = Math.min(Math.abs(deviationPercent) / 100, 1)

    signals.push({
      id: randomUUID(),
      timestamp: new Date().toISOString(),
      signalType,
      app: m.app,
      metric: m.metric,
      currentValue: m.currentValue,
      baselineValue: m.baselineValue,
      deviationPercent: Math.round(deviationPercent * 100) / 100,
      confidence: Math.round(confidence * 100) / 100,
    })
  }

  return signals
}
