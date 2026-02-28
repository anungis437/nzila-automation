export interface AgriDbContext {
  readonly orgId: string
  readonly actorId: string
  readonly correlationId?: string
  readonly actorRole?: string
}

export interface AgriReadContext {
  readonly orgId: string
}

export interface PaginationOpts {
  limit?: number    // default: 50, max: 200
  offset?: number
}

export interface PaginatedResult<T> {
  rows: T[]
  total: number
  limit: number
  offset: number
}

export type InsertShape<T> = Omit<T, 'id' | 'orgId' | 'createdAt' | 'updatedAt'>
export type UpdateShape<T> = Partial<Omit<T, 'id' | 'orgId' | 'createdAt'>>
