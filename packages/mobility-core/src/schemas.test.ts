import { describe, it, expect } from 'vitest'
import {
  uuidSchema,
  paginationSchema,
  countryCodeSchema,
  createFirmSchema,
  createClientSchema,
  createFamilyMemberSchema,
  createCaseSchema,
  updateCaseStatusSchema,
  createCaseTaskSchema,
  createDocumentSchema,
  createComplianceEventSchema,
  createCommunicationSchema,
  clientProfileSchema,
} from './schemas'

/* ── Primitives ───────────────────────────────────────────── */

describe('primitive schemas', () => {
  it('uuidSchema accepts valid UUIDs', () => {
    expect(uuidSchema.parse('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11')).toBeDefined()
  })

  it('uuidSchema rejects non-UUID strings', () => {
    expect(() => uuidSchema.parse('not-a-uuid')).toThrow()
  })

  it('paginationSchema applies defaults', () => {
    const result = paginationSchema.parse({})
    expect(result).toEqual({ page: 1, pageSize: 20 })
  })

  it('paginationSchema rejects page < 1', () => {
    expect(() => paginationSchema.parse({ page: 0 })).toThrow()
  })

  it('paginationSchema rejects pageSize > 100', () => {
    expect(() => paginationSchema.parse({ pageSize: 200 })).toThrow()
  })

  it('countryCodeSchema accepts 2–3 char codes', () => {
    expect(countryCodeSchema.parse('ZA')).toBe('ZA')
    expect(countryCodeSchema.parse('USA')).toBe('USA')
  })

  it('countryCodeSchema rejects single char', () => {
    expect(() => countryCodeSchema.parse('X')).toThrow()
  })
})

/* ── Firm ──────────────────────────────────────────────────── */

describe('createFirmSchema', () => {
  it('parses valid firm input', () => {
    const result = createFirmSchema.parse({
      name: 'Acme Advisory',
      jurisdiction: 'MT',
      licenseType: 'regulated_agent',
    })
    expect(result.name).toBe('Acme Advisory')
  })

  it('rejects missing license type', () => {
    expect(() =>
      createFirmSchema.parse({ name: 'X', jurisdiction: 'MT' }),
    ).toThrow()
  })
})

/* ── Client ───────────────────────────────────────────────── */

describe('createClientSchema', () => {
  it('parses valid client input with defaults', () => {
    const result = createClientSchema.parse({
      firmId: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
      primaryNationality: 'ZA',
      residenceCountry: 'ZA',
      wealthTier: 'hnw',
      riskProfile: 'low',
    })
    expect(result.hubspotContactId).toBeNull()
  })

  it('rejects invalid wealthTier', () => {
    expect(() =>
      createClientSchema.parse({
        firmId: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
        primaryNationality: 'ZA',
        residenceCountry: 'ZA',
        wealthTier: 'ultra',
        riskProfile: 'low',
      }),
    ).toThrow()
  })
})

/* ── Family Member ────────────────────────────────────────── */

describe('createFamilyMemberSchema', () => {
  it('parses valid family member with nullable defaults', () => {
    const result = createFamilyMemberSchema.parse({
      clientId: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
      relation: 'spouse',
      nationality: 'GB',
    })
    expect(result.dob).toBeNull()
    expect(result.passportExpiry).toBeNull()
  })

  it('rejects invalid relation type', () => {
    expect(() =>
      createFamilyMemberSchema.parse({
        clientId: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
        relation: 'cousin',
        nationality: 'GB',
      }),
    ).toThrow()
  })
})

/* ── Case ─────────────────────────────────────────────────── */

describe('createCaseSchema', () => {
  const validCase = {
    clientId: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    advisorId: 'b1ffcd00-0d1c-4ef9-ac7e-7cc0ce491b22',
    programId: 'c2aade11-1e2d-4a00-8d8f-8dd1df502c33',
  }

  it('parses valid case with hubspotDealId default', () => {
    const result = createCaseSchema.parse(validCase)
    expect(result.hubspotDealId).toBeNull()
  })

  it('rejects missing advisorId', () => {
    expect(() =>
      createCaseSchema.parse({ clientId: validCase.clientId, programId: validCase.programId }),
    ).toThrow()
  })
})

/* ── updateCaseStatusSchema ───────────────────────────────── */

describe('updateCaseStatusSchema', () => {
  it('accepts valid status', () => {
    const result = updateCaseStatusSchema.parse({ status: 'approved' })
    expect(result.status).toBe('approved')
  })

  it('accepts status with optional stage', () => {
    const result = updateCaseStatusSchema.parse({ status: 'kyc_pending', stage: 'due_diligence' })
    expect(result.stage).toBe('due_diligence')
  })

  it('rejects invalid status', () => {
    expect(() => updateCaseStatusSchema.parse({ status: 'invalid' })).toThrow()
  })
})

/* ── Compliance Event ─────────────────────────────────────── */

describe('createComplianceEventSchema', () => {
  it('parses valid event with metadata default', () => {
    const result = createComplianceEventSchema.parse({
      caseId: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
      eventType: 'aml_flag',
      severity: 'critical',
    })
    expect(result.metadata).toEqual({})
  })
})

/* ── Client Profile (eligibility) ─────────────────────────── */

describe('clientProfileSchema', () => {
  it('parses valid profile with defaults', () => {
    const result = clientProfileSchema.parse({
      primaryNationality: 'ZA',
      residenceCountry: 'ZA',
      wealthTier: 'hnw',
      riskProfile: 'low',
    })
    expect(result.familySize).toBe(0)
    expect(result.preferredRegions).toEqual([])
    expect(result.physicalPresenceOk).toBe(true)
  })

  it('rejects invalid riskProfile', () => {
    expect(() =>
      clientProfileSchema.parse({
        primaryNationality: 'ZA',
        residenceCountry: 'ZA',
        wealthTier: 'hnw',
        riskProfile: 'extreme',
      }),
    ).toThrow()
  })
})
