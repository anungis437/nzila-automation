/* ── Document Checklist Generation ─────────────────────────
 *
 * Programme-aware document checklist builder.
 * Uses the ProgramDefinition's requiredDocuments as a base
 * and enriches with family-member-specific requirements.
 *
 * @module @nzila/mobility-ai/checklist
 */

import type { DocumentType, FamilyRelation } from '@nzila/mobility-core'

/* ── Types ────────────────────────────────────────────────── */

export interface ChecklistItem {
  documentType: DocumentType
  target: 'primary_applicant' | 'dependent'
  memberId?: string
  relation?: FamilyRelation
  required: boolean
  description: string
  status: 'pending' | 'uploaded' | 'verified' | 'rejected'
}

export interface DocumentChecklist {
  caseId: string
  programCountryCode: string
  items: ChecklistItem[]
  totalRequired: number
  uploaded: number
  verified: number
  completionPercent: number
}

/* ── Dependent Document Rules ─────────────────────────────── */

const DEPENDENT_DOCUMENTS: Record<FamilyRelation, DocumentType[]> = {
  spouse: ['passport', 'birth_certificate', 'marriage_certificate', 'police_clearance'],
  child: ['passport', 'birth_certificate'],
  parent: ['passport', 'birth_certificate', 'medical_report'],
  sibling: ['passport', 'birth_certificate', 'police_clearance'],
  dependent: ['passport', 'birth_certificate'],
}

/* ── Checklist Builder ────────────────────────────────────── */

/**
 * Generate a complete document checklist for a case.
 * Combines programme-required documents for the primary applicant
 * with dependent-specific documents for each family member.
 */
export function generateDocumentChecklist(
  caseId: string,
  programCountryCode: string,
  requiredDocuments: readonly DocumentType[],
  dependents: Array<{
    memberId: string
    relation: FamilyRelation
  }> = [],
): DocumentChecklist {
  const items: ChecklistItem[] = []

  // Primary applicant documents
  for (const docType of requiredDocuments) {
    items.push({
      documentType: docType,
      target: 'primary_applicant',
      required: true,
      description: `${formatDocType(docType)} — Primary applicant`,
      status: 'pending',
    })
  }

  // Dependent documents
  for (const dep of dependents) {
    const depDocs = DEPENDENT_DOCUMENTS[dep.relation] ?? ['passport', 'birth_certificate']
    for (const docType of depDocs) {
      items.push({
        documentType: docType,
        target: 'dependent',
        memberId: dep.memberId,
        relation: dep.relation,
        required: true,
        description: `${formatDocType(docType)} — ${dep.relation} (${dep.memberId})`,
        status: 'pending',
      })
    }
  }

  return {
    caseId,
    programCountryCode,
    items,
    totalRequired: items.filter((i) => i.required).length,
    uploaded: 0,
    verified: 0,
    completionPercent: 0,
  }
}

/**
 * Update checklist completion stats from current item statuses.
 */
export function updateChecklistStats(checklist: DocumentChecklist): DocumentChecklist {
  const uploaded = checklist.items.filter(
    (i) => i.status === 'uploaded' || i.status === 'verified',
  ).length
  const verified = checklist.items.filter((i) => i.status === 'verified').length
  const totalRequired = checklist.items.filter((i) => i.required).length

  return {
    ...checklist,
    uploaded,
    verified,
    totalRequired,
    completionPercent: totalRequired > 0 ? Math.round((uploaded / totalRequired) * 100) : 0,
  }
}

function formatDocType(dt: DocumentType): string {
  return dt.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}
