/**
 * Nzila OS — Integration Runtime: Resilient Dispatcher
 *
 * Wraps the IntegrationDispatcher with CircuitBreaker gating.
 * Before dispatching, checks the circuit. After result, records outcome
 * to the circuit breaker for state transitions.
 *
 * @invariant INTEGRATION_RESILIENCE_001
 */
import type { SendRequest, SendResult, IntegrationProvider } from '@nzila/integrations-core'
import { IntegrationDispatcher, type DispatcherPorts, type DispatcherOptions } from './dispatcher'
import { CircuitBreaker, type CircuitBreakerPorts, type CircuitBreakerConfig } from './circuitBreaker'

export interface ResilientDispatcherPorts extends DispatcherPorts {
  readonly circuitBreaker: CircuitBreakerPorts
}

export interface ResilientDispatcherOptions extends DispatcherOptions {
  readonly circuitBreaker?: Partial<CircuitBreakerConfig>
}

export class ResilientDispatcher {
  private readonly inner: IntegrationDispatcher
  private readonly cb: CircuitBreaker
  private readonly ports: ResilientDispatcherPorts

  constructor(ports: ResilientDispatcherPorts, options?: ResilientDispatcherOptions) {
    this.ports = ports
    this.inner = new IntegrationDispatcher(ports, options)
    this.cb = new CircuitBreaker(ports.circuitBreaker, options?.circuitBreaker)
  }

  async dispatch(request: SendRequest): Promise<SendResult> {
    // Resolve provider for circuit breaker scope
    const config = await this.ports.resolveConfig(request.orgId, request.channel)
    const provider: IntegrationProvider = config.provider

    // 1. Check circuit
    const check = await this.cb.canExecute(request.orgId, provider)
    if (!check.allowed) {
      return {
        ok: false,
        error: `Circuit breaker ${check.state.toUpperCase()} for ${provider}: ${check.reason ?? 'rejected'}`,
      }
    }

    // 2. Dispatch (includes retry + DLQ internally)
    const result = await this.inner.dispatch(request)

    // 3. Record outcome to circuit breaker
    await this.cb.recordResult(request.orgId, provider, result.ok)

    return result
  }

  /**
   * Force-open the circuit for a provider (admin action).
   */
  async forceOpen(orgId: string, provider: IntegrationProvider): Promise<void> {
    await this.cb.forceOpen(orgId, provider)
  }

  /**
   * Reset the circuit for a provider (admin action).
   */
  async forceReset(orgId: string, provider: IntegrationProvider): Promise<void> {
    await this.cb.forceReset(orgId, provider)
  }
}
