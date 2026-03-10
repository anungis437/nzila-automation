import { describe, it, expect } from 'vitest'
import {
  buildFamilyGraph,
  DEFAULT_DEPENDENT_RULES,
  CARIBBEAN_CBI_RULES,
} from './graph'
import type { FamilyMember } from '@nzila/mobility-core'

describe('buildFamilyGraph', () => {
  const baseMember = (overrides: Partial<FamilyMember> & { id: string; relation: FamilyMember['relation']; nationality: string }): FamilyMember => ({
    dob: new Date('1990-01-01'),
    passportExpiry: new Date('2030-01-01'),
    ...overrides,
  } as FamilyMember)

  it('returns all eligible when members meet default rules', () => {
    const members: FamilyMember[] = [
      baseMember({ id: 'spouse-1', relation: 'spouse', nationality: 'NG' }),
      baseMember({ id: 'child-1', relation: 'child', nationality: 'NG', dob: new Date('2015-06-01') }),
    ]

    const graph = buildFamilyGraph('client-1', 'NG', members, DEFAULT_DEPENDENT_RULES)

    expect(graph.clientId).toBe('client-1')
    expect(graph.primaryApplicant.nationality).toBe('NG')
    expect(graph.totalDependents).toBe(2)
    expect(graph.eligibleDependents).toBe(2)
    expect(graph.members.every(m => m.eligible)).toBe(true)
  })

  it('blocks child over max age', () => {
    const members: FamilyMember[] = [
      baseMember({ id: 'child-1', relation: 'child', nationality: 'NG', dob: new Date('2000-01-01') }),
    ]

    const graph = buildFamilyGraph('client-1', 'NG', members, DEFAULT_DEPENDENT_RULES)

    expect(graph.eligibleDependents).toBe(0)
    expect(graph.members[0].eligible).toBe(false)
    expect(graph.members[0].blockers[0]).toContain('exceeds maximum age')
  })

  it('allows older children under Caribbean CBI rules', () => {
    const members: FamilyMember[] = [
      baseMember({ id: 'child-1', relation: 'child', nationality: 'NG', dob: new Date('2000-01-01') }),
    ]

    const graph = buildFamilyGraph('client-1', 'NG', members, CARIBBEAN_CBI_RULES)

    expect(graph.eligibleDependents).toBe(1)
    expect(graph.members[0].eligible).toBe(true)
  })

  it('blocks parents under default rules', () => {
    const members: FamilyMember[] = [
      baseMember({ id: 'parent-1', relation: 'parent', nationality: 'NG', dob: new Date('1960-01-01') }),
    ]

    const graph = buildFamilyGraph('client-1', 'NG', members, DEFAULT_DEPENDENT_RULES)

    expect(graph.eligibleDependents).toBe(0)
    expect(graph.members[0].blockers[0]).toContain('does not include parent')
  })

  it('allows parents under Caribbean CBI rules', () => {
    const members: FamilyMember[] = [
      baseMember({ id: 'parent-1', relation: 'parent', nationality: 'NG', dob: new Date('1960-01-01') }),
    ]

    const graph = buildFamilyGraph('client-1', 'NG', members, CARIBBEAN_CBI_RULES)

    expect(graph.eligibleDependents).toBe(1)
  })

  it('flags expired passport', () => {
    const members: FamilyMember[] = [
      baseMember({
        id: 'spouse-1', relation: 'spouse', nationality: 'NG',
        passportExpiry: new Date('2020-01-01'),
      }),
    ]

    const graph = buildFamilyGraph('client-1', 'NG', members, DEFAULT_DEPENDENT_RULES)

    expect(graph.members[0].eligible).toBe(false)
    expect(graph.members[0].blockers[0]).toContain('expired')
  })

  it('flags passport expiring within 6 months', () => {
    const soon = new Date()
    soon.setMonth(soon.getMonth() + 3)

    const members: FamilyMember[] = [
      baseMember({
        id: 'spouse-1', relation: 'spouse', nationality: 'NG',
        passportExpiry: soon,
      }),
    ]

    const graph = buildFamilyGraph('client-1', 'NG', members, DEFAULT_DEPENDENT_RULES)

    expect(graph.members[0].eligible).toBe(false)
    expect(graph.members[0].blockers[0]).toContain('months')
  })

  it('handles empty members list', () => {
    const graph = buildFamilyGraph('client-1', 'NG', [], DEFAULT_DEPENDENT_RULES)

    expect(graph.totalDependents).toBe(0)
    expect(graph.eligibleDependents).toBe(0)
  })
})
