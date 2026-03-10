/**
 * @nzila/agri-core — FSM Tests
 *
 * Tests the Lot quality FSM (pending → certified/rejected)
 * and the Shipment FSM (planned → closed).
 */
import { describe, it, expect } from 'vitest'
import {
  attemptLotTransition,
  getLotTransitions,
  isTerminalLotStatus,
  attemptShipmentTransition,
  getShipmentTransitions,
  isTerminalShipmentStatus,
} from './index'
import { LotStatus, ShipmentStatus } from '../enums'

// ── Lot Quality FSM ─────────────────────────────────────────────────────────

describe('Lot Quality FSM', () => {
  describe('attemptLotTransition', () => {
    it('pending → inspected succeeds', () => {
      const result = attemptLotTransition(LotStatus.PENDING, LotStatus.INSPECTED)
      expect(result.ok).toBe(true)
    })

    it('inspected → graded succeeds', () => {
      const result = attemptLotTransition(LotStatus.INSPECTED, LotStatus.GRADED)
      expect(result.ok).toBe(true)
    })

    it('graded → certified succeeds (evidence required)', () => {
      const result = attemptLotTransition(LotStatus.GRADED, LotStatus.CERTIFIED)
      expect(result.ok).toBe(true)
      if (result.ok) expect(result.transition.evidenceRequired).toBe(true)
    })

    it('graded → rejected succeeds (evidence required)', () => {
      const result = attemptLotTransition(LotStatus.GRADED, LotStatus.REJECTED)
      expect(result.ok).toBe(true)
      if (result.ok) expect(result.transition.evidenceRequired).toBe(true)
    })

    it('inspected → rejected succeeds (early rejection)', () => {
      const result = attemptLotTransition(LotStatus.INSPECTED, LotStatus.REJECTED)
      expect(result.ok).toBe(true)
    })

    it('pending → graded fails (skipping stage)', () => {
      const result = attemptLotTransition(LotStatus.PENDING, LotStatus.GRADED)
      expect(result.ok).toBe(false)
    })

    it('certified → anything fails (terminal)', () => {
      const result = attemptLotTransition(LotStatus.CERTIFIED, LotStatus.GRADED)
      expect(result.ok).toBe(false)
    })

    it('rejected → anything fails (terminal)', () => {
      const result = attemptLotTransition(LotStatus.REJECTED, LotStatus.INSPECTED)
      expect(result.ok).toBe(false)
    })
  })

  describe('getLotTransitions', () => {
    it('returns transitions from pending', () => {
      const transitions = getLotTransitions(LotStatus.PENDING)
      expect(transitions).toHaveLength(1) // → inspected only
      expect(transitions[0]!.to).toBe(LotStatus.INSPECTED)
    })

    it('returns multiple transitions from graded', () => {
      const transitions = getLotTransitions(LotStatus.GRADED)
      expect(transitions).toHaveLength(2) // → certified or rejected
    })

    it('returns empty for terminal states', () => {
      expect(getLotTransitions(LotStatus.CERTIFIED)).toHaveLength(0)
      expect(getLotTransitions(LotStatus.REJECTED)).toHaveLength(0)
    })
  })

  describe('isTerminalLotStatus', () => {
    it('certified is terminal', () => {
      expect(isTerminalLotStatus(LotStatus.CERTIFIED)).toBe(true)
    })

    it('rejected is terminal', () => {
      expect(isTerminalLotStatus(LotStatus.REJECTED)).toBe(true)
    })

    it('pending is not terminal', () => {
      expect(isTerminalLotStatus(LotStatus.PENDING)).toBe(false)
    })

    it('inspected is not terminal', () => {
      expect(isTerminalLotStatus(LotStatus.INSPECTED)).toBe(false)
    })

    it('graded is not terminal', () => {
      expect(isTerminalLotStatus(LotStatus.GRADED)).toBe(false)
    })
  })
})

// ── Shipment FSM ────────────────────────────────────────────────────────────

describe('Shipment FSM', () => {
  describe('attemptShipmentTransition', () => {
    it('planned → packed succeeds', () => {
      const result = attemptShipmentTransition(ShipmentStatus.PLANNED, ShipmentStatus.PACKED)
      expect(result.ok).toBe(true)
    })

    it('packed → dispatched succeeds', () => {
      const result = attemptShipmentTransition(ShipmentStatus.PACKED, ShipmentStatus.DISPATCHED)
      expect(result.ok).toBe(true)
    })

    it('dispatched → arrived succeeds', () => {
      const result = attemptShipmentTransition(ShipmentStatus.DISPATCHED, ShipmentStatus.ARRIVED)
      expect(result.ok).toBe(true)
    })

    it('arrived → closed succeeds (evidence required)', () => {
      const result = attemptShipmentTransition(ShipmentStatus.ARRIVED, ShipmentStatus.CLOSED)
      expect(result.ok).toBe(true)
      if (result.ok) expect(result.transition.evidenceRequired).toBe(true)
    })

    it('planned → dispatched fails (skipping stage)', () => {
      const result = attemptShipmentTransition(ShipmentStatus.PLANNED, ShipmentStatus.DISPATCHED)
      expect(result.ok).toBe(false)
    })

    it('closed → anything fails (terminal)', () => {
      const result = attemptShipmentTransition(ShipmentStatus.CLOSED, ShipmentStatus.PLANNED)
      expect(result.ok).toBe(false)
    })
  })

  describe('getShipmentTransitions', () => {
    it('returns 1 transition from planned', () => {
      const transitions = getShipmentTransitions(ShipmentStatus.PLANNED)
      expect(transitions).toHaveLength(1)
      expect(transitions[0]!.to).toBe(ShipmentStatus.PACKED)
    })

    it('returns empty for closed (terminal)', () => {
      expect(getShipmentTransitions(ShipmentStatus.CLOSED)).toHaveLength(0)
    })
  })

  describe('isTerminalShipmentStatus', () => {
    it('closed is terminal', () => {
      expect(isTerminalShipmentStatus(ShipmentStatus.CLOSED)).toBe(true)
    })

    it('planned is not terminal', () => {
      expect(isTerminalShipmentStatus(ShipmentStatus.PLANNED)).toBe(false)
    })

    it('arrived is not terminal', () => {
      expect(isTerminalShipmentStatus(ShipmentStatus.ARRIVED)).toBe(false)
    })
  })
})
