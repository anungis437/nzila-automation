import { describe, it, expect } from 'vitest'
import {
  CreatorStatus,
  AssetType,
  AssetStatus,
  ReleaseStatus,
  RevenueType,
  PayoutStatus,
  LedgerEntryType,
  ZongaRole,
} from './enums'

describe('@nzila/zonga-core — enums', () => {
  it('CreatorStatus has all expected values', () => {
    const values = Object.values(CreatorStatus)
    expect(values).toContain('pending')
    expect(values).toContain('active')
    expect(values).toContain('suspended')
    expect(values).toContain('deactivated')
    expect(values).toHaveLength(4)
  })

  it('AssetType has all expected values', () => {
    const values = Object.values(AssetType)
    expect(values).toContain('track')
    expect(values).toContain('album')
    expect(values).toContain('video')
    expect(values).toContain('podcast')
    expect(values).toHaveLength(4)
  })

  it('AssetStatus has all expected values', () => {
    const values = Object.values(AssetStatus)
    expect(values).toContain('draft')
    expect(values).toContain('processing')
    expect(values).toContain('review')
    expect(values).toContain('published')
    expect(values).toContain('taken_down')
    expect(values).toContain('archived')
    expect(values).toHaveLength(6)
  })

  it('ReleaseStatus has all expected values', () => {
    const values = Object.values(ReleaseStatus)
    expect(values).toContain('draft')
    expect(values).toContain('scheduled')
    expect(values).toContain('released')
    expect(values).toContain('withdrawn')
    expect(values).toHaveLength(4)
  })

  it('RevenueType has all expected values', () => {
    const values = Object.values(RevenueType)
    expect(values).toContain('stream')
    expect(values).toContain('download')
    expect(values).toContain('tip')
    expect(values).toContain('subscription_share')
    expect(values).toContain('ticket_sale')
    expect(values).toContain('merchandise')
    expect(values).toContain('sync_license')
    expect(values).toHaveLength(7)
  })

  it('PayoutStatus has all expected values', () => {
    const values = Object.values(PayoutStatus)
    expect(values).toContain('pending')
    expect(values).toContain('previewed')
    expect(values).toContain('approved')
    expect(values).toContain('processing')
    expect(values).toContain('completed')
    expect(values).toContain('failed')
    expect(values).toContain('cancelled')
    expect(values).toHaveLength(7)
  })

  it('LedgerEntryType has all expected values', () => {
    const values = Object.values(LedgerEntryType)
    expect(values).toContain('credit')
    expect(values).toContain('debit')
    expect(values).toContain('hold')
    expect(values).toContain('release')
    expect(values).toHaveLength(4)
  })

  it('ZongaRole has all expected values', () => {
    const values = Object.values(ZongaRole)
    expect(values).toContain('admin')
    expect(values).toContain('manager')
    expect(values).toContain('creator')
    expect(values).toContain('viewer')
    expect(values).toHaveLength(4)
  })

  it('enum values are readonly at type level', () => {
    // Compile-time check — just ensure the const-assertion produces literal types
    const status: CreatorStatus = CreatorStatus.ACTIVE
    expect(status).toBe('active')
  })
})
