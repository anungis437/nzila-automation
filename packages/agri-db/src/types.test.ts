import { describe, it, expect } from 'vitest'
import type {
  AgriDbContext,
  AgriReadContext,
  PaginationOpts,
  PaginatedResult,
  InsertShape,
  UpdateShape,
} from './types'

describe('agri-db types contract', () => {
  it('AgriDbContext requires orgId and actorId', () => {
    const ctx: AgriDbContext = { orgId: 'org-1', actorId: 'actor-1' }
    expect(ctx.orgId).toBe('org-1')
    expect(ctx.actorId).toBe('actor-1')
  })

  it('AgriDbContext supports optional correlationId and actorRole', () => {
    const ctx: AgriDbContext = {
      orgId: 'org-1',
      actorId: 'actor-1',
      correlationId: 'corr-1',
      actorRole: 'admin',
    }
    expect(ctx.correlationId).toBe('corr-1')
    expect(ctx.actorRole).toBe('admin')
  })

  it('AgriReadContext requires only orgId', () => {
    const ctx: AgriReadContext = { orgId: 'org-1' }
    expect(ctx.orgId).toBe('org-1')
  })

  it('PaginationOpts has optional limit and offset', () => {
    const opts: PaginationOpts = {}
    expect(opts.limit).toBeUndefined()
    expect(opts.offset).toBeUndefined()

    const opts2: PaginationOpts = { limit: 10, offset: 20 }
    expect(opts2.limit).toBe(10)
    expect(opts2.offset).toBe(20)
  })

  it('PaginatedResult has correct shape', () => {
    const result: PaginatedResult<{ name: string }> = {
      rows: [{ name: 'test' }],
      total: 1,
      limit: 50,
      offset: 0,
    }
    expect(result.rows).toHaveLength(1)
    expect(result.total).toBe(1)
  })

  it('InsertShape omits id, orgId, createdAt, updatedAt', () => {
    interface Entity {
      id: string
      orgId: string
      name: string
      createdAt: string
      updatedAt: string
    }
    const insert: InsertShape<Entity> = { name: 'test' }
    expect(insert.name).toBe('test')
  })

  it('UpdateShape is partial and omits id, orgId, createdAt', () => {
    interface Entity {
      id: string
      orgId: string
      name: string
      status: string
      createdAt: string
    }
    const update: UpdateShape<Entity> = { name: 'updated' }
    expect(update.name).toBe('updated')
    expect(update.status).toBeUndefined()
  })
})
