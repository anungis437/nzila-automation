/**
 * Nzila OS — Failure Simulation Unit Tests
 *
 * Tests for simulation start/stop, environment guards, and effect helpers.
 * No DB dependency — pure logic tests.
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import {
  startSimulation,
  stopSimulation,
  getSimulationState,
  isSimulationActive,
  clearAllSimulations,
  canActivateSimulation,
  isSimulationFlagEnabled,
  isSimulationEnvironmentAllowed,
  getSimulatedLatencyMs,
  shouldSimulateIntegrationFailure,
  getErrorRateMultiplier,
  buildSimulationAuditEvent,
  type SimulationConfig,
  type ActiveSimulation,
} from '../src/failure-simulation'

describe('failure-simulation', () => {
  const originalEnv = { ...process.env }

  beforeEach(() => {
    clearAllSimulations()
    process.env.OPS_SIMULATION_ENABLED = 'true'
    process.env.NODE_ENV = 'development'
    process.env.NZILA_PILOT_MODE = ''
  })

  afterEach(() => {
    clearAllSimulations()
    process.env = { ...originalEnv }
  })

  describe('environment guards', () => {
    it('allows simulation when flag and env are correct', () => {
      expect(isSimulationFlagEnabled()).toBe(true)
      expect(isSimulationEnvironmentAllowed()).toBe(true)
      expect(canActivateSimulation()).toBe(true)
    })

    it('blocks simulation when flag is disabled', () => {
      process.env.OPS_SIMULATION_ENABLED = 'false'
      expect(canActivateSimulation()).toBe(false)
    })

    it('blocks simulation in production environment', () => {
      process.env.NODE_ENV = 'production'
      process.env.NZILA_PILOT_MODE = ''
      expect(isSimulationEnvironmentAllowed()).toBe(false)
      expect(canActivateSimulation()).toBe(false)
    })

    it('allows simulation in pilot environment', () => {
      process.env.NODE_ENV = 'production'
      process.env.NZILA_PILOT_MODE = 'true'
      expect(isSimulationEnvironmentAllowed()).toBe(true)
    })

    it('allows simulation in test environment', () => {
      process.env.NODE_ENV = 'test'
      expect(isSimulationEnvironmentAllowed()).toBe(true)
    })
  })

  describe('startSimulation', () => {
    it('starts a simulation successfully', () => {
      const config: SimulationConfig = {
        type: 'db_latency_spike',
        durationSec: 60,
        intensity: 1.5,
      }
      const result = startSimulation(config)
      expect(result.success).toBe(true)
      expect(result.simulation).toBeDefined()
      expect(result.simulation!.type).toBe('db_latency_spike')
    })

    it('rejects duplicate simulation', () => {
      const config: SimulationConfig = {
        type: 'error_spike',
        durationSec: 60,
        intensity: 2.0,
      }
      startSimulation(config)
      const result = startSimulation(config)
      expect(result.success).toBe(false)
      expect(result.message).toContain('already active')
    })

    it('blocks when flag is disabled', () => {
      process.env.OPS_SIMULATION_ENABLED = 'false'
      const config: SimulationConfig = {
        type: 'integration_failure',
        durationSec: 30,
        intensity: 1.0,
        scope: 'stripe',
      }
      const result = startSimulation(config)
      expect(result.success).toBe(false)
      expect(result.message).toContain('blocked')
    })

    it('allows different types concurrently', () => {
      expect(startSimulation({ type: 'db_latency_spike', durationSec: 60, intensity: 1.0 }).success).toBe(true)
      expect(startSimulation({ type: 'error_spike', durationSec: 60, intensity: 1.0 }).success).toBe(true)
      expect(startSimulation({ type: 'integration_failure', durationSec: 60, intensity: 1.0, scope: 'stripe' }).success).toBe(true)
    })
  })

  describe('stopSimulation', () => {
    it('stops a running simulation', () => {
      startSimulation({ type: 'db_latency_spike', durationSec: 60, intensity: 1.0 })
      const result = stopSimulation('db_latency_spike')
      expect(result.success).toBe(true)
      expect(isSimulationActive('db_latency_spike')).toBe(false)
    })

    it('returns error for non-existent simulation', () => {
      const result = stopSimulation('error_spike')
      expect(result.success).toBe(false)
    })
  })

  describe('getSimulationState', () => {
    it('returns empty state when no simulations active', () => {
      const state = getSimulationState()
      expect(state.active).toBe(false)
      expect(state.simulations).toHaveLength(0)
    })

    it('lists active simulations', () => {
      startSimulation({ type: 'db_latency_spike', durationSec: 60, intensity: 1.0 })
      startSimulation({ type: 'error_spike', durationSec: 60, intensity: 2.0 })
      const state = getSimulationState()
      expect(state.active).toBe(true)
      expect(state.simulations).toHaveLength(2)
    })
  })

  describe('simulation effects', () => {
    it('getSimulatedLatencyMs returns delay when active', () => {
      startSimulation({ type: 'db_latency_spike', durationSec: 60, intensity: 2.0 })
      expect(getSimulatedLatencyMs()).toBe(1000) // 500 * 2.0
    })

    it('getSimulatedLatencyMs returns 0 when inactive', () => {
      expect(getSimulatedLatencyMs()).toBe(0)
    })

    it('shouldSimulateIntegrationFailure returns true when active', () => {
      startSimulation({ type: 'integration_failure', durationSec: 60, intensity: 1.0, scope: 'stripe' })
      expect(shouldSimulateIntegrationFailure('stripe')).toBe(true)
      expect(shouldSimulateIntegrationFailure('hubspot')).toBe(false)
    })

    it('getErrorRateMultiplier returns intensity when active', () => {
      startSimulation({ type: 'error_spike', durationSec: 60, intensity: 3.0 })
      expect(getErrorRateMultiplier()).toBe(3.0)
    })

    it('getErrorRateMultiplier returns 1.0 when inactive', () => {
      expect(getErrorRateMultiplier()).toBe(1.0)
    })
  })

  describe('buildSimulationAuditEvent', () => {
    it('builds a start event', () => {
      const sim: ActiveSimulation = {
        type: 'error_spike',
        startedAt: '2026-03-03T00:00:00.000Z',
        expiresAt: '2026-03-03T00:01:00.000Z',
        intensity: 2.0,
        scope: 'web',
        expired: false,
      }
      const event = buildSimulationAuditEvent('platform.ops.simulation_started', sim, 60)
      expect(event.action).toBe('platform.ops.simulation_started')
      expect(event.simulationType).toBe('error_spike')
      expect(event.durationSec).toBe(60)
    })
  })
})
