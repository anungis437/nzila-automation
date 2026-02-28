import type { AgriReadContext, AgriDbContext } from '../types'
import type { CertificationArtifact, CertifyLotInput } from '@nzila/agri-core'
import { createHash } from 'node:crypto'

export async function listCertifications(
  ctx: AgriReadContext,
  lotId: string,
): Promise<CertificationArtifact[]> {
  void ctx; void lotId
  return []
}

export async function getCertificationById(
  ctx: AgriReadContext,
  certId: string,
): Promise<CertificationArtifact | null> {
  void ctx; void certId
  return null
}

export async function createCertification(
  ctx: AgriDbContext,
  values: CertifyLotInput,
  contentForHash: string,
): Promise<CertificationArtifact> {
  const id = crypto.randomUUID()
  const contentHash = createHash('sha256').update(contentForHash).digest('hex')
  return {
    id,
    orgId: ctx.orgId,
    lotId: values.lotId,
    certificationType: values.certificationType,
    certificateRef: values.certificateRef,
    contentHash,
    storageKey: null,
    issuedAt: new Date().toISOString(),
    expiresAt: null,
    metadata: values.metadata,
    createdAt: new Date().toISOString(),
  }
}
