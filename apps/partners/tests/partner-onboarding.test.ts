/**
 * Partners — Partner Onboarding Logic Tests
 */
import { describe, it, expect } from 'vitest'
import { z } from 'zod'

const partnerOnboardingSchema = z.object({
  companyName: z.string().min(1).max(200),
  contactEmail: z.string().email(),
  contactPhone: z.string().optional(),
  tier: z.enum(['BRONZE', 'SILVER', 'GOLD', 'PLATINUM']).default('BRONZE'),
  region: z.string().min(1),
  industryVertical: z.string().optional(),
})

type PartnerStatus = 'PENDING' | 'ACTIVE' | 'SUSPENDED' | 'TERMINATED'

interface Partner {
  id: string
  companyName: string
  contactEmail: string
  tier: string
  status: PartnerStatus
  onboardedAt: string
}

function createPartner(input: z.infer<typeof partnerOnboardingSchema>): Partner {
  return {
    id: `partner-${crypto.randomUUID().slice(0, 8)}`,
    companyName: input.companyName,
    contactEmail: input.contactEmail,
    tier: input.tier,
    status: 'PENDING',
    onboardedAt: new Date().toISOString(),
  }
}

describe('Partner Onboarding Logic', () => {
  it('validates partner onboarding input', () => {
    const result = partnerOnboardingSchema.safeParse({
      companyName: 'Acme Corp',
      contactEmail: 'contact@acme.com',
      region: 'North America',
    })
    expect(result.success).toBe(true)
  })

  it('rejects invalid email', () => {
    const result = partnerOnboardingSchema.safeParse({
      companyName: 'Acme',
      contactEmail: 'not-an-email',
      region: 'EMEA',
    })
    expect(result.success).toBe(false)
  })

  it('defaults tier to BRONZE', () => {
    const result = partnerOnboardingSchema.parse({
      companyName: 'Acme',
      contactEmail: 'a@b.com',
      region: 'NA',
    })
    expect(result.tier).toBe('BRONZE')
  })

  it('creates partner with PENDING status', () => {
    const partner = createPartner({
      companyName: 'TestCo',
      contactEmail: 'test@co.com',
      tier: 'SILVER',
      region: 'EMEA',
    })
    expect(partner.status).toBe('PENDING')
    expect(partner.tier).toBe('SILVER')
  })

  it('generates unique partner ID', () => {
    const p1 = createPartner({ companyName: 'A', contactEmail: 'a@a.com', tier: 'BRONZE', region: 'NA' })
    const p2 = createPartner({ companyName: 'B', contactEmail: 'b@b.com', tier: 'BRONZE', region: 'NA' })
    expect(p1.id).not.toBe(p2.id)
  })
})
