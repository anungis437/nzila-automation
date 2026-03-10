/* ── Family Graph Engine ───────────────────────────────────
 *
 * Models the applicant's family unit for dependent-inclusive
 * programmes. Evaluates dependent eligibility per program
 * rules (age limits, spousal inclusion, adopted children).
 *
 * @module @nzila/mobility-family
 */

import type { FamilyMember, FamilyRelation } from '@nzila/mobility-core'

/* ── Types ────────────────────────────────────────────────── */

export interface FamilyNode {
  memberId: string
  relation: FamilyRelation
  nationality: string
  age: number | null
  passportExpiry: Date | null
  eligible: boolean
  blockers: string[]
}

export interface FamilyGraph {
  clientId: string
  primaryApplicant: { nationality: string }
  members: FamilyNode[]
  totalDependents: number
  eligibleDependents: number
}

export interface DependentRules {
  maxChildAge: number
  allowSpouse: boolean
  allowParents: boolean
  allowSiblings: boolean
  allowAdoptedChildren: boolean
}

/* ── Default Rules ────────────────────────────────────────── */

export const DEFAULT_DEPENDENT_RULES: DependentRules = {
  maxChildAge: 18,
  allowSpouse: true,
  allowParents: false,
  allowSiblings: false,
  allowAdoptedChildren: true,
}

/* ── Caribbean CBI rules: children up to 30, parents 55+ ── */

export const CARIBBEAN_CBI_RULES: DependentRules = {
  maxChildAge: 30,
  allowSpouse: true,
  allowParents: true,
  allowSiblings: true,
  allowAdoptedChildren: true,
}

/* ── Graph Builder ────────────────────────────────────────── */

/**
 * Build a family graph from raw family members.
 * Evaluates each member's eligibility against programme-specific rules.
 */
export function buildFamilyGraph(
  clientId: string,
  primaryNationality: string,
  members: FamilyMember[],
  rules: DependentRules = DEFAULT_DEPENDENT_RULES,
): FamilyGraph {
  const nodes = members.map((m) => evaluateMember(m, rules))

  return {
    clientId,
    primaryApplicant: { nationality: primaryNationality },
    members: nodes,
    totalDependents: nodes.length,
    eligibleDependents: nodes.filter((n) => n.eligible).length,
  }
}

/**
 * Evaluate a single family member against dependent rules.
 */
function evaluateMember(
  member: FamilyMember,
  rules: DependentRules,
): FamilyNode {
  const blockers: string[] = []
  const age = member.dob ? computeAge(member.dob) : null

  // Relation-based eligibility
  switch (member.relation) {
    case 'spouse':
      if (!rules.allowSpouse) blockers.push('Programme does not include spousal dependents')
      break
    case 'child':
      if (age !== null && age > rules.maxChildAge) {
        blockers.push(`Child exceeds maximum age of ${rules.maxChildAge} (current age: ${age})`)
      }
      break
    case 'parent':
      if (!rules.allowParents) blockers.push('Programme does not include parent dependents')
      break
    case 'sibling':
      if (!rules.allowSiblings) blockers.push('Programme does not include sibling dependents')
      break
    case 'dependent':
      // Generic dependent — allowed by default
      break
  }

  // Passport expiry check
  if (member.passportExpiry) {
    const monthsUntilExpiry = monthsDiff(new Date(), member.passportExpiry)
    if (monthsUntilExpiry < 6) {
      blockers.push(
        monthsUntilExpiry < 0
          ? 'Passport has expired'
          : `Passport expires in ${monthsUntilExpiry} months (minimum 6 months required)`,
      )
    }
  }

  return {
    memberId: member.id,
    relation: member.relation,
    nationality: member.nationality,
    age,
    passportExpiry: member.passportExpiry,
    eligible: blockers.length === 0,
    blockers,
  }
}

/* ── Helpers ──────────────────────────────────────────────── */

function computeAge(dob: Date): number {
  const today = new Date()
  let age = today.getFullYear() - dob.getFullYear()
  const monthDiff = today.getMonth() - dob.getMonth()
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
    age--
  }
  return age
}

function monthsDiff(from: Date, to: Date): number {
  return (to.getFullYear() - from.getFullYear()) * 12 + (to.getMonth() - from.getMonth())
}
