/**
 * @nzila/os-core — Data Classification Contract Tests
 */
import { describe, it, expect } from 'vitest'
import {
  CLASSIFICATION_LEVELS,
  CLASSIFICATION_RANK,
  MAX_AUTHORIZED_LEVEL,
  isAuthorizedLevel,
  assertAuthorizedLevel,
  compareClassification,
  maxClassification,
  createMarking,
  generatePortionMark,
  getFieldClassification,
  canDeclassify,
  declassify,
  type DataMarking,
} from './index'

describe('Data Classification Taxonomy', () => {
  // ── Level Hierarchy ────────────────────────────────────────────────────

  describe('classification hierarchy', () => {
    it('defines 7 classification levels', () => {
      expect(CLASSIFICATION_LEVELS).toHaveLength(7)
    })

    it('ranks PUBLIC lowest', () => {
      expect(CLASSIFICATION_RANK.PUBLIC).toBe(0)
    })

    it('ranks TOP_SECRET highest', () => {
      expect(CLASSIFICATION_RANK.TOP_SECRET).toBe(6)
    })

    it('maintains ascending order', () => {
      for (let i = 1; i < CLASSIFICATION_LEVELS.length; i++) {
        const prev = CLASSIFICATION_RANK[CLASSIFICATION_LEVELS[i - 1]]
        const curr = CLASSIFICATION_RANK[CLASSIFICATION_LEVELS[i]]
        expect(curr).toBeGreaterThan(prev)
      }
    })

    it('max authorized level is CUI', () => {
      expect(MAX_AUTHORIZED_LEVEL).toBe('CUI')
    })
  })

  // ── Authorization Checks ──────────────────────────────────────────────

  describe('authorization enforcement', () => {
    it('authorizes PUBLIC', () => {
      expect(isAuthorizedLevel('PUBLIC')).toBe(true)
    })

    it('authorizes INTERNAL', () => {
      expect(isAuthorizedLevel('INTERNAL')).toBe(true)
    })

    it('authorizes RESTRICTED', () => {
      expect(isAuthorizedLevel('RESTRICTED')).toBe(true)
    })

    it('authorizes CUI', () => {
      expect(isAuthorizedLevel('CUI')).toBe(true)
    })

    it('rejects CONFIDENTIAL', () => {
      expect(isAuthorizedLevel('CONFIDENTIAL')).toBe(false)
    })

    it('rejects SECRET', () => {
      expect(isAuthorizedLevel('SECRET')).toBe(false)
    })

    it('rejects TOP_SECRET', () => {
      expect(isAuthorizedLevel('TOP_SECRET')).toBe(false)
    })

    it('assertAuthorizedLevel throws for SECRET', () => {
      expect(() => assertAuthorizedLevel('SECRET')).toThrow(/exceeds maximum/)
    })

    it('assertAuthorizedLevel passes for RESTRICTED', () => {
      expect(() => assertAuthorizedLevel('RESTRICTED')).not.toThrow()
    })
  })

  // ── Comparison ────────────────────────────────────────────────────────

  describe('classification comparison', () => {
    it('PUBLIC < CUI', () => {
      expect(compareClassification('PUBLIC', 'CUI')).toBeLessThan(0)
    })

    it('CUI = CUI', () => {
      expect(compareClassification('CUI', 'CUI')).toBe(0)
    })

    it('SECRET > RESTRICTED', () => {
      expect(compareClassification('SECRET', 'RESTRICTED')).toBeGreaterThan(0)
    })

    it('maxClassification returns higher level', () => {
      expect(maxClassification('PUBLIC', 'RESTRICTED')).toBe('RESTRICTED')
      expect(maxClassification('CUI', 'INTERNAL')).toBe('CUI')
    })
  })

  // ── Marking Creation ──────────────────────────────────────────────────

  describe('data markings', () => {
    it('creates a PUBLIC marking', () => {
      const marking = createMarking({
        classification: 'PUBLIC',
        ownerOrgId: 'org_123',
        classifiedBy: 'usr_456',
      })
      expect(marking.classification).toBe('PUBLIC')
      expect(marking.portionMark).toBe('(U)')
    })

    it('creates a CUI marking with default BASIC category', () => {
      const marking = createMarking({
        classification: 'CUI',
        ownerOrgId: 'org_123',
        classifiedBy: 'usr_456',
      })
      expect(marking.cuiCategory).toBe('CUI//BASIC')
    })

    it('creates a CUI marking with specific category', () => {
      const marking = createMarking({
        classification: 'CUI',
        cuiCategory: 'CUI//SP-PRVCY',
        ownerOrgId: 'org_123',
        classifiedBy: 'usr_456',
      })
      expect(marking.cuiCategory).toBe('CUI//SP-PRVCY')
      expect(marking.portionMark).toContain('CUI//SP-PRVCY')
    })

    it('rejects SECRET marking', () => {
      expect(() =>
        createMarking({
          classification: 'SECRET',
          ownerOrgId: 'org_123',
          classifiedBy: 'usr_456',
        }),
      ).toThrow(/exceeds maximum/)
    })

    it('includes dissemination controls in portion mark', () => {
      const marking = createMarking({
        classification: 'RESTRICTED',
        ownerOrgId: 'org_123',
        classifiedBy: 'usr_456',
        disseminationControls: ['NDA_REQUIRED', 'INTERNAL_ONLY'],
      })
      expect(marking.portionMark).toContain('NDA_REQUIRED')
      expect(marking.portionMark).toContain('INTERNAL_ONLY')
    })

    it('sets classifiedAt timestamp', () => {
      const before = new Date().toISOString()
      const marking = createMarking({
        classification: 'INTERNAL',
        ownerOrgId: 'org_123',
        classifiedBy: 'usr_456',
      })
      expect(marking.classifiedAt >= before).toBe(true)
    })
  })

  // ── Portion Marking ───────────────────────────────────────────────────

  describe('portion marking', () => {
    it('generates (U) for PUBLIC', () => {
      const mark = generatePortionMark({
        classification: 'PUBLIC',
        disseminationControls: [],
      })
      expect(mark).toBe('(U)')
    })

    it('generates (R) for RESTRICTED', () => {
      const mark = generatePortionMark({
        classification: 'RESTRICTED',
        disseminationControls: [],
      })
      expect(mark).toBe('(R)')
    })

    it('generates (CUI) for CUI without category', () => {
      const mark = generatePortionMark({
        classification: 'CUI',
        disseminationControls: [],
      })
      expect(mark).toBe('(CUI)')
    })

    it('generates category-specific mark', () => {
      const mark = generatePortionMark({
        classification: 'CUI',
        cuiCategory: 'CUI//SP-HEALTH',
        disseminationControls: [],
      })
      expect(mark).toBe('(CUI//SP-HEALTH)')
    })
  })

  // ── Field Classification ──────────────────────────────────────────────

  describe('field-level classification', () => {
    it('classifies email as CUI', () => {
      expect(getFieldClassification('email')).toBe('CUI')
    })

    it('classifies SSN as CUI', () => {
      expect(getFieldClassification('ssn')).toBe('CUI')
    })

    it('classifies salary as RESTRICTED', () => {
      expect(getFieldClassification('salary')).toBe('RESTRICTED')
    })

    it('classifies createdAt as PUBLIC', () => {
      expect(getFieldClassification('createdAt')).toBe('PUBLIC')
    })

    it('defaults unknown fields to INTERNAL', () => {
      expect(getFieldClassification('unknownField')).toBe('INTERNAL')
    })
  })

  // ── Declassification ──────────────────────────────────────────────────

  describe('declassification', () => {
    it('cannot declassify without date', () => {
      const marking = createMarking({
        classification: 'RESTRICTED',
        ownerOrgId: 'org_123',
        classifiedBy: 'usr_456',
      })
      expect(canDeclassify(marking)).toBe(false)
    })

    it('cannot declassify before date', () => {
      const marking = createMarking({
        classification: 'RESTRICTED',
        ownerOrgId: 'org_123',
        classifiedBy: 'usr_456',
        declassifyOn: '2030-01-01',
      })
      expect(canDeclassify(marking)).toBe(false)
    })

    it('can declassify after date', () => {
      const marking = createMarking({
        classification: 'RESTRICTED',
        ownerOrgId: 'org_123',
        classifiedBy: 'usr_456',
        declassifyOn: '2020-01-01',
      })
      expect(canDeclassify(marking)).toBe(true)
    })

    it('declassify produces PUBLIC marking', () => {
      const marking = createMarking({
        classification: 'RESTRICTED',
        ownerOrgId: 'org_123',
        classifiedBy: 'usr_456',
        declassifyOn: '2020-01-01',
      })
      const declassified = declassify(marking, 'usr_789')
      expect(declassified.classification).toBe('PUBLIC')
      expect(declassified.portionMark).toBe('(U)')
      expect(declassified.classifiedBy).toBe('usr_789')
    })

    it('throws when declassifying before date', () => {
      const marking = createMarking({
        classification: 'RESTRICTED',
        ownerOrgId: 'org_123',
        classifiedBy: 'usr_456',
        declassifyOn: '2030-01-01',
      })
      expect(() => declassify(marking, 'usr_789')).toThrow(/not been reached/)
    })
  })
})
