import { describe, it, expect } from 'vitest'
import {
  CreateCreatorSchema,
  CreateContentAssetSchema,
  PublishAssetSchema,
  CreateReleaseSchema,
  RecordRevenueEventSchema,
  PayoutPreviewRequestSchema,
  ZongaOrgContextSchema,
} from './schemas/index'

const VALID_UUID = '550e8400-e29b-41d4-a716-446655440000'

describe('@nzila/zonga-core — schemas', () => {
  describe('CreateCreatorSchema', () => {
    it('accepts valid input', () => {
      const result = CreateCreatorSchema.safeParse({
        userId: VALID_UUID,
        displayName: 'DJ Kinshasa',
        bio: 'Afrobeats producer',
        genre: 'Afrobeats',
        country: 'CD',
      })
      expect(result.success).toBe(true)
    })

    it('requires userId as UUID', () => {
      const result = CreateCreatorSchema.safeParse({
        userId: 'not-a-uuid',
        displayName: 'DJ Kinshasa',
      })
      expect(result.success).toBe(false)
    })

    it('requires displayName', () => {
      const result = CreateCreatorSchema.safeParse({
        userId: VALID_UUID,
        displayName: '',
      })
      expect(result.success).toBe(false)
    })

    it('bio is optional', () => {
      const result = CreateCreatorSchema.safeParse({
        userId: VALID_UUID,
        displayName: 'Minimal Creator',
      })
      expect(result.success).toBe(true)
    })
  })

  describe('CreateContentAssetSchema', () => {
    it('accepts valid input', () => {
      const result = CreateContentAssetSchema.safeParse({
        creatorId: VALID_UUID,
        title: 'Mama Africa',
        type: 'track',
        description: 'Hit single',
      })
      expect(result.success).toBe(true)
    })

    it('rejects invalid asset type', () => {
      const result = CreateContentAssetSchema.safeParse({
        creatorId: VALID_UUID,
        title: 'Test',
        type: 'movie',
      })
      expect(result.success).toBe(false)
    })

    it('durationSeconds must be non-negative integer', () => {
      const result = CreateContentAssetSchema.safeParse({
        creatorId: VALID_UUID,
        title: 'Test',
        type: 'track',
        durationSeconds: -1,
      })
      expect(result.success).toBe(false)
    })
  })

  describe('PublishAssetSchema', () => {
    it('requires storageUrl as valid URL', () => {
      const result = PublishAssetSchema.safeParse({
        assetId: VALID_UUID,
        storageUrl: 'https://cdn.nzila.app/tracks/123.mp3',
      })
      expect(result.success).toBe(true)
    })

    it('rejects invalid storageUrl', () => {
      const result = PublishAssetSchema.safeParse({
        assetId: VALID_UUID,
        storageUrl: 'not-a-url',
      })
      expect(result.success).toBe(false)
    })
  })

  describe('CreateReleaseSchema', () => {
    it('accepts valid input with optional releaseDate', () => {
      const result = CreateReleaseSchema.safeParse({
        creatorId: VALID_UUID,
        title: 'Debut Album',
      })
      expect(result.success).toBe(true)
    })

    it('releaseDate must be ISO datetime when provided', () => {
      const result = CreateReleaseSchema.safeParse({
        creatorId: VALID_UUID,
        title: 'Debut Album',
        releaseDate: 'not-a-date',
      })
      expect(result.success).toBe(false)
    })
  })

  describe('RecordRevenueEventSchema', () => {
    it('accepts valid revenue event', () => {
      const result = RecordRevenueEventSchema.safeParse({
        creatorId: VALID_UUID,
        type: 'stream',
        amount: 0.003,
      })
      expect(result.success).toBe(true)
    })

    it('defaults currency to USD', () => {
      const result = RecordRevenueEventSchema.safeParse({
        creatorId: VALID_UUID,
        type: 'stream',
        amount: 0.003,
      })
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.currency).toBe('USD')
      }
    })

    it('rejects negative amount', () => {
      const result = RecordRevenueEventSchema.safeParse({
        creatorId: VALID_UUID,
        type: 'stream',
        amount: -5,
      })
      expect(result.success).toBe(false)
    })

    it('rejects invalid revenue type', () => {
      const result = RecordRevenueEventSchema.safeParse({
        creatorId: VALID_UUID,
        type: 'royalty',
        amount: 10,
      })
      expect(result.success).toBe(false)
    })
  })

  describe('PayoutPreviewRequestSchema', () => {
    it('accepts valid preview request', () => {
      const result = PayoutPreviewRequestSchema.safeParse({
        creatorId: VALID_UUID,
        periodStart: '2025-01-01T00:00:00Z',
        periodEnd: '2025-01-31T23:59:59Z',
      })
      expect(result.success).toBe(true)
    })

    it('defaults platformFeePercent to 15', () => {
      const result = PayoutPreviewRequestSchema.safeParse({
        creatorId: VALID_UUID,
        periodStart: '2025-01-01T00:00:00Z',
        periodEnd: '2025-01-31T23:59:59Z',
      })
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.platformFeePercent).toBe(15)
      }
    })

    it('rejects platformFeePercent > 100', () => {
      const result = PayoutPreviewRequestSchema.safeParse({
        creatorId: VALID_UUID,
        periodStart: '2025-01-01T00:00:00Z',
        periodEnd: '2025-01-31T23:59:59Z',
        platformFeePercent: 150,
      })
      expect(result.success).toBe(false)
    })
  })

  describe('ZongaOrgContextSchema', () => {
    it('accepts valid org context', () => {
      const result = ZongaOrgContextSchema.safeParse({
        entityId: VALID_UUID,
        actorId: VALID_UUID,
        role: 'admin',
        permissions: ['content.publish', 'payout.approve'],
        requestId: 'req-123',
      })
      expect(result.success).toBe(true)
    })

    it('rejects invalid role', () => {
      const result = ZongaOrgContextSchema.safeParse({
        entityId: VALID_UUID,
        actorId: VALID_UUID,
        role: 'superadmin',
        permissions: [],
        requestId: 'req-123',
      })
      expect(result.success).toBe(false)
    })
  })
})
