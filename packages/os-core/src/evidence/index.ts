/**
 * @nzila/os-core — Evidence module barrel export
 */
export {
  ControlFamily,
  EvidenceEventType,
  RetentionClass,
  Classification,
  BlobContainer,
  ArtifactDescriptor,
  EvidencePackRequest,
  GOVERNANCE_EVIDENCE_MAPPINGS,
} from './types'
export type {
  UploadedArtifact,
  EvidencePackResult,
  GovernanceEvidenceMapping,
} from './types'
export {
  buildEvidencePackFromAction,
  computeBasePath,
  listMappedActionTypes,
  getEvidenceMapping,
} from './builder'
export type { GovernanceActionContext } from './builder'
export { processEvidencePack, buildLocalEvidencePackIndex } from './generate-evidence-index'
export type { LocalEvidencePackIndex } from './generate-evidence-index'
export {
  generateSeal,
  verifySeal,
  computeMerkleRoot,
  canonicalize,
} from './seal'
export type { SealEnvelope, SealablePackIndex, SealOptions, VerifySealResult } from './seal'
export {
  createEvidencePackDraft,
  assertValidTransition,
  assertSealed,
  isSealedEvidencePack,
  LifecycleTransitionError,
  SealOnceViolationError,
  DraftMutationError,
} from './lifecycle'
export type {
  EvidencePackStatus,
  EvidencePackDraft,
  SealedEvidencePack,
  EvidencePackDraftOptions,
} from './lifecycle'
export {
  redactArtifact,
  redactArtifacts,
  redactAndReseal,
  PARTNER_RESTRICTED_ARTIFACT_TYPES,
} from './redaction'
export type { RedactionMode, RedactedPackIndex } from './redaction'
export { verifyPackIndex } from './verify-pack'
