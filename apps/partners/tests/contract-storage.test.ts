/**
 * Partners — Contract Storage Tests
 */
import { describe, it, expect } from 'vitest'

interface ContractMetadata {
  id: string
  partnerId: string
  filename: string
  contentType: string
  sizeBytes: number
  uploadedAt: string
  expiresAt: string | null
  checksum: string
}

function validateContractUpload(file: { name: string; size: number; type: string }): { valid: boolean; error?: string } {
  const MAX_SIZE = 50 * 1024 * 1024 // 50MB
  const ALLOWED_TYPES = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']

  if (file.size > MAX_SIZE) {
    return { valid: false, error: 'File exceeds 50MB limit' }
  }
  if (!ALLOWED_TYPES.includes(file.type)) {
    return { valid: false, error: 'Only PDF and DOCX files are allowed' }
  }
  if (!file.name || file.name.length === 0) {
    return { valid: false, error: 'Filename is required' }
  }
  return { valid: true }
}

function createContractMetadata(partnerId: string, file: { name: string; size: number; type: string }): ContractMetadata {
  return {
    id: `contract-${crypto.randomUUID().slice(0, 8)}`,
    partnerId,
    filename: file.name,
    contentType: file.type,
    sizeBytes: file.size,
    uploadedAt: new Date().toISOString(),
    expiresAt: null,
    checksum: Math.random().toString(36).slice(2, 10),
  }
}

describe('Contract Storage', () => {
  it('accepts valid PDF upload', () => {
    const result = validateContractUpload({ name: 'contract.pdf', size: 1024, type: 'application/pdf' })
    expect(result.valid).toBe(true)
  })

  it('accepts valid DOCX upload', () => {
    const result = validateContractUpload({
      name: 'agreement.docx',
      size: 2048,
      type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    })
    expect(result.valid).toBe(true)
  })

  it('rejects oversized files', () => {
    const result = validateContractUpload({ name: 'big.pdf', size: 60 * 1024 * 1024, type: 'application/pdf' })
    expect(result.valid).toBe(false)
    expect(result.error).toContain('50MB')
  })

  it('rejects unsupported file types', () => {
    const result = validateContractUpload({ name: 'script.js', size: 100, type: 'application/javascript' })
    expect(result.valid).toBe(false)
    expect(result.error).toContain('PDF and DOCX')
  })

  it('creates contract metadata with partner reference', () => {
    const meta = createContractMetadata('partner-001', { name: 'nda.pdf', size: 5000, type: 'application/pdf' })
    expect(meta.partnerId).toBe('partner-001')
    expect(meta.filename).toBe('nda.pdf')
    expect(meta.uploadedAt).toBeDefined()
  })
})
