/**
 * Compute a SHA-256 Merkle root from an array of hex-encoded hashes.
 * Returns a zero-hash when given an empty array.
 */
export declare function computeMerkleRoot(hashes: string[]): string;

export interface SealEnvelope {
  sealVersion: string;
  algorithm: string;
  packDigest: string;
  artifactsMerkleRoot: string;
  artifactCount: number;
  sealedAt: string;
  hmacSignature?: string;
  hmacKeyId?: string;
}

export interface VerifySealResult {
  valid: boolean;
  digestMatch: boolean;
  merkleMatch: boolean;
  signatureVerified: boolean | 'no-key' | 'unsigned';
  errors: string[];
}

export interface PackIndexInput {
  artifacts?: Array<{ sha256: string }>;
  seal?: Record<string, unknown>;
  [key: string]: unknown;
}

export interface GenerateSealOptions {
  hmacKey?: string;
  sealedAt?: string;
}

export interface VerifySealOptions {
  hmacKey?: string;
}

/**
 * Generate a cryptographic seal for an evidence pack index.
 */
export declare function generateSeal(
  packIndex: PackIndexInput,
  opts?: GenerateSealOptions,
): SealEnvelope;

/**
 * Verify the integrity seal embedded in a pack index.
 */
export declare function verifySeal(
  packIndex: PackIndexInput,
  opts?: VerifySealOptions,
): VerifySealResult;
