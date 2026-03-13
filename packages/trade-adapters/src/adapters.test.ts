import { describe, it, expect } from 'vitest'
import {
  mapLegacyVehicle,
  mapLegacyDoc,
  type LegacyEExportsVehicle,
  type LegacyEExportsDoc,
} from './legacy-eexports/index'

function vehicle(overrides: Partial<LegacyEExportsVehicle> = {}): LegacyEExportsVehicle {
  return {
    id: 1,
    organisation_id: 100,
    vin: 'WVWZZZ3CZWE123456',
    make: 'Volkswagen',
    model: 'Golf',
    year: 2024,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-06-01T00:00:00Z',
    ...overrides,
  }
}

function doc(overrides: Partial<LegacyEExportsDoc> = {}): LegacyEExportsDoc {
  return {
    id: 10,
    vehicle_id: 1,
    organisation_id: 100,
    doc_type: 'title',
    title: 'Title Document',
    file_path: '/docs/title.pdf',
    created_at: '2024-01-15T00:00:00Z',
    ...overrides,
  }
}

describe('mapLegacyVehicle', () => {
  it('maps required fields correctly', () => {
    const result = mapLegacyVehicle(vehicle(), 'org-1', 'listing-1' as never)
    expect(result.orgId).toBe('org-1')
    expect(result.vin).toBe('WVWZZZ3CZWE123456')
    expect(result.make).toBe('Volkswagen')
    expect(result.model).toBe('Golf')
    expect(result.year).toBe(2024)
  })

  it('generates a UUID id', () => {
    const result = mapLegacyVehicle(vehicle(), 'org-1', 'listing-1' as never)
    expect(result.id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,
    )
  })

  it('maps condition values', () => {
    const r1 = mapLegacyVehicle(vehicle({ condition: 'new' }), 'org-1', 'l' as never)
    expect(r1.condition).toBe('new')

    const r2 = mapLegacyVehicle(vehicle({ condition: 'cpo' }), 'org-1', 'l' as never)
    expect(r2.condition).toBe('certified_pre_owned')
  })

  it('defaults condition to used for unknown values', () => {
    const result = mapLegacyVehicle(vehicle({ condition: 'unknown' }), 'org-1', 'l' as never)
    expect(result.condition).toBe('used')
  })

  it('maps transmission values', () => {
    const r1 = mapLegacyVehicle(vehicle({ transmission: 'auto' }), 'org-1', 'l' as never)
    expect(r1.transmission).toBe('automatic')

    const r2 = mapLegacyVehicle(vehicle({ transmission: 'manual' }), 'org-1', 'l' as never)
    expect(r2.transmission).toBe('manual')
  })

  it('maps drivetrain values', () => {
    const r = mapLegacyVehicle(vehicle({ drivetrain: '4x4' }), 'org-1', 'l' as never)
    expect(r.drivetrain).toBe('4wd')
  })

  it('maps fuel type values', () => {
    const r1 = mapLegacyVehicle(vehicle({ fuel_type: 'petrol' }), 'org-1', 'l' as never)
    expect(r1.fuelType).toBe('gasoline')

    const r2 = mapLegacyVehicle(vehicle({ fuel_type: 'phev' }), 'org-1', 'l' as never)
    expect(r2.fuelType).toBe('plugin_hybrid')
  })

  it('handles optional fields with nulls', () => {
    const result = mapLegacyVehicle(vehicle(), 'org-1', 'l' as never)
    expect(result.trim).toBeNull()
    expect(result.exteriorColor).toBeNull()
    expect(result.interiorColor).toBeNull()
    expect(result.engineSize).toBeNull()
  })

  it('defaults mileage to 0 if not provided', () => {
    const result = mapLegacyVehicle(vehicle(), 'org-1', 'l' as never)
    expect(result.mileage).toBe(0)
  })

  it('carries extra_data into metadata', () => {
    const result = mapLegacyVehicle(
      vehicle({ extra_data: { color_code: 'LB5S' } }),
      'org-1',
      'l' as never,
    )
    expect(result.metadata).toEqual({ color_code: 'LB5S' })
  })

  it('maps date strings to Date objects', () => {
    const result = mapLegacyVehicle(vehicle(), 'org-1', 'l' as never)
    expect(result.createdAt).toBeInstanceOf(Date)
    expect(result.updatedAt).toBeInstanceOf(Date)
  })
})

describe('mapLegacyDoc', () => {
  it('maps required fields correctly', () => {
    const result = mapLegacyDoc(doc(), 'org-1', 'listing-1' as never)
    expect(result.orgId).toBe('org-1')
    expect(result.title).toBe('Title Document')
    expect(result.storageKey).toBe('/docs/title.pdf')
    expect(result.docType).toBe('title')
  })

  it('maps doc type aliases', () => {
    const r1 = mapLegacyDoc(doc({ doc_type: 'bos' }), 'org-1', 'l' as never)
    expect(r1.docType).toBe('bill_of_sale')

    const r2 = mapLegacyDoc(doc({ doc_type: 'export_cert' }), 'org-1', 'l' as never)
    expect(r2.docType).toBe('export_certificate')

    const r3 = mapLegacyDoc(doc({ doc_type: 'inspection' }), 'org-1', 'l' as never)
    expect(r3.docType).toBe('inspection_report')
  })

  it('defaults unknown doc types to bill_of_sale', () => {
    const result = mapLegacyDoc(doc({ doc_type: 'random' }), 'org-1', 'l' as never)
    expect(result.docType).toBe('bill_of_sale')
  })

  it('uses checksum as contentHash', () => {
    const result = mapLegacyDoc(
      doc({ checksum: 'abc123' }),
      'org-1',
      'l' as never,
    )
    expect(result.contentHash).toBe('abc123')
  })

  it('defaults contentHash to empty string if no checksum', () => {
    const result = mapLegacyDoc(doc(), 'org-1', 'l' as never)
    expect(result.contentHash).toBe('')
  })

  it('defaults uploadedBy to migration if not provided', () => {
    const result = mapLegacyDoc(doc(), 'org-1', 'l' as never)
    expect(result.uploadedBy).toBe('migration')
  })

  it('generates a UUID id', () => {
    const result = mapLegacyDoc(doc(), 'org-1', 'l' as never)
    expect(result.id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,
    )
  })
})
