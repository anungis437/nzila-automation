import { describe, it, expect } from 'vitest'
import {
  attemptLotTransition, getLotTransitions, isTerminalLotStatus,
  attemptShipmentTransition, getShipmentTransitions, isTerminalShipmentStatus,
} from './index'
import { LotStatus, ShipmentStatus } from '../enums'

describe('LotQualityFSM', () => {
  it('allows pending → inspected', () => {
    const result = attemptLotTransition(LotStatus.PENDING, LotStatus.INSPECTED)
    expect(result.ok).toBe(true)
  })

  it('allows inspected → graded', () => {
    const result = attemptLotTransition(LotStatus.INSPECTED, LotStatus.GRADED)
    expect(result.ok).toBe(true)
  })

  it('allows graded → certified with evidence required', () => {
    const result = attemptLotTransition(LotStatus.GRADED, LotStatus.CERTIFIED)
    expect(result.ok).toBe(true)
    if (result.ok) expect(result.transition.evidenceRequired).toBe(true)
  })

  it('allows graded → rejected with evidence required', () => {
    const result = attemptLotTransition(LotStatus.GRADED, LotStatus.REJECTED)
    expect(result.ok).toBe(true)
    if (result.ok) expect(result.transition.evidenceRequired).toBe(true)
  })

  it('rejects pending → certified (skip grading)', () => {
    const result = attemptLotTransition(LotStatus.PENDING, LotStatus.CERTIFIED)
    expect(result.ok).toBe(false)
  })

  it('rejects certified → pending (backwards)', () => {
    const result = attemptLotTransition(LotStatus.CERTIFIED, LotStatus.PENDING)
    expect(result.ok).toBe(false)
  })

  it('certified is terminal', () => {
    expect(isTerminalLotStatus(LotStatus.CERTIFIED)).toBe(true)
  })

  it('rejected is terminal', () => {
    expect(isTerminalLotStatus(LotStatus.REJECTED)).toBe(true)
  })

  it('pending is not terminal', () => {
    expect(isTerminalLotStatus(LotStatus.PENDING)).toBe(false)
  })

  it('returns valid transitions for pending', () => {
    const transitions = getLotTransitions(LotStatus.PENDING)
    expect(transitions).toHaveLength(1)
    expect(transitions[0]!.to).toBe(LotStatus.INSPECTED)
  })

  it('returns valid transitions for graded', () => {
    const transitions = getLotTransitions(LotStatus.GRADED)
    expect(transitions).toHaveLength(2)
  })
})

describe('ShipmentFSM', () => {
  it('allows planned → packed', () => {
    const result = attemptShipmentTransition(ShipmentStatus.PLANNED, ShipmentStatus.PACKED)
    expect(result.ok).toBe(true)
  })

  it('allows packed → dispatched', () => {
    const result = attemptShipmentTransition(ShipmentStatus.PACKED, ShipmentStatus.DISPATCHED)
    expect(result.ok).toBe(true)
  })

  it('allows dispatched → arrived', () => {
    const result = attemptShipmentTransition(ShipmentStatus.DISPATCHED, ShipmentStatus.ARRIVED)
    expect(result.ok).toBe(true)
  })

  it('allows arrived → closed with evidence required', () => {
    const result = attemptShipmentTransition(ShipmentStatus.ARRIVED, ShipmentStatus.CLOSED)
    expect(result.ok).toBe(true)
    if (result.ok) expect(result.transition.evidenceRequired).toBe(true)
  })

  it('rejects planned → dispatched (skip packing)', () => {
    const result = attemptShipmentTransition(ShipmentStatus.PLANNED, ShipmentStatus.DISPATCHED)
    expect(result.ok).toBe(false)
  })

  it('rejects closed → planned (backwards)', () => {
    const result = attemptShipmentTransition(ShipmentStatus.CLOSED, ShipmentStatus.PLANNED)
    expect(result.ok).toBe(false)
  })

  it('closed is terminal', () => {
    expect(isTerminalShipmentStatus(ShipmentStatus.CLOSED)).toBe(true)
  })

  it('planned is not terminal', () => {
    expect(isTerminalShipmentStatus(ShipmentStatus.PLANNED)).toBe(false)
  })

  it('returns valid transitions for planned', () => {
    const transitions = getShipmentTransitions(ShipmentStatus.PLANNED)
    expect(transitions).toHaveLength(1)
    expect(transitions[0]!.to).toBe(ShipmentStatus.PACKED)
  })
})
