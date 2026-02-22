/**
 * Phase 5B: Arbitration Precedent Document Upload Service
 * Handles document uploads to Vercel Blob Storage
 */

import { put, del } from '@vercel/blob';
import { logger } from '@/lib/logger';

export interface DocumentUploadResult {
  url: string;
  pathname: string;
  contentType: string;
  size: number;
}

export interface DocumentUploadOptions {
  precedentId: string;
  organizationId: string;
  filename: string;
  contentType: string;
  isRedacted?: boolean;
}

/**
 * Upload a precedent document to blob storage
 */
export async function uploadPrecedentDocument(
  file: Buffer | Blob,
  options: DocumentUploadOptions
): Promise<DocumentUploadResult> {
  try {
    const { precedentId, organizationId, filename, contentType, isRedacted = false } = options;
    
    // Generate blob path: precedents/{orgId}/{precedentId}/{redacted?}/{filename}
    const redactedPrefix = isRedacted ? 'redacted/' : '';
    const blobPath = `precedents/${organizationId}/${precedentId}/${redactedPrefix}${filename}`;
    
    // Upload to Vercel Blob
    const blob = await put(blobPath, file, {
      access: 'public', // Can be changed to 'private' if needed with token-based access
      contentType,
      addRandomSuffix: false, // Use exact filename for clarity
    });

    return {
      url: blob.url,
      pathname: blob.pathname,
      contentType: blob.contentType || contentType,
      size: file instanceof Blob ? file.size : file.length, // Blob has size, Buffer has length
    };
  } catch (error) {
    logger.error('[PrecedentDocumentService] Upload failed', {
      error,
      precedentId: options.precedentId,
      organizationId: options.organizationId,
      filename: options.filename,
    });
    throw new Error('Failed to upload document to blob storage');
  }
}

/**
 * Delete a precedent document from blob storage
 */
export async function deletePrecedentDocument(url: string): Promise<void> {
  try {
    await del(url);
  } catch (error) {
    logger.error('[PrecedentDocumentService] Delete failed', { error, url });
    throw new Error('Failed to delete document from blob storage');
  }
}

/**
 * Validate file type and size for precedent documents
 */
export function validatePrecedentDocument(
  fileSize: number,
  fileType: string,
  options?: {
    maxSizeMB?: number;
    allowedTypes?: string[];
  }
): { valid: boolean; error?: string } {
  const maxSizeMB = options?.maxSizeMB || 50; // Default 50MB
  const allowedTypes = options?.allowedTypes || [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
  ];

  // Check file size
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  if (fileSize > maxSizeBytes) {
    return {
      valid: false,
      error: `File size exceeds ${maxSizeMB}MB limit`,
    };
  }

  // Check file type
  if (!allowedTypes.includes(fileType)) {
    return {
      valid: false,
      error: `File type not allowed. Allowed types: ${allowedTypes.join(', ')}`,
    };
  }

  return { valid: true };
}

/**
 * Generate a secure filename for precedent documents
 */
export function generateSecureFilename(originalFilename: string): string {
  // Remove special characters and spaces
  const sanitized = originalFilename
    .replace(/[^a-zA-Z0-9.-]/g, '_')
    .replace(/_{2,}/g, '_');
  
  // Add timestamp to ensure uniqueness
  const timestamp = Date.now();
  const extension = sanitized.split('.').pop();
  const basename = sanitized.replace(/\.[^/.]+$/, '');
  
  return `${basename}_${timestamp}.${extension}`;
}

/**
 * Extract metadata from uploaded file data
 */
export function extractDocumentMetadata(
  filename: string,
  contentType: string,
  size: number
): {
  filename: string;
  contentType: string;
  size: number;
  extension: string;
} {
  const extension = filename.split('.').pop()?.toLowerCase() || '';
  
  return {
    filename,
    contentType,
    size,
    extension,
  };
}

