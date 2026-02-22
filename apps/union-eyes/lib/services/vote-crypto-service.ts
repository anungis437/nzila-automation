/**
 * Vote Cryptography Service
 * 
 * Provides cryptographic primitives for anonymous, verifiable voting:
 * - Voter anonymization (hash-based voter IDs)
 * - Vote receipts with verification codes
 * - Cryptographic audit chain (blockchain-style)
 * - Tamper detection
 * 
 * Security Design:
 * - Voter IDs are anonymized using SHA-256 hashing
 * - Each vote gets a unique receipt ID for verification
 * - Audit chain links votes cryptographically (tamper-evident)
 * - Verification codes allow voters to confirm their vote was counted
 * 
 * @module lib/services/vote-crypto-service
 */

import { createHash, randomBytes } from 'crypto';

/**
 * Generate anonymized voter ID from real user ID
 * Uses SHA-256 with session-specific salt to prevent correlation
 */
export function generateAnonymousVoterId(
  realUserId: string,
  sessionId: string,
  sessionSalt: string
): string {
  const hash = createHash('sha256');
  hash.update(`${realUserId}:${sessionId}:${sessionSalt}`);
  return hash.digest('hex').substring(0, 32); // 128-bit anonymized ID
}

/**
 * Generate voter hash for verification without exposing identity
 */
export function generateVoterHash(
  anonymousVoterId: string,
  timestamp: Date
): string {
  const hash = createHash('sha256');
  hash.update(`${anonymousVoterId}:${timestamp.toISOString()}`);
  return hash.digest('hex');
}

/**
 * Generate unique receipt ID for vote verification
 */
export function generateReceiptId(): string {
  return `RCPT-${randomBytes(16).toString('hex').toUpperCase()}`;
}

/**
 * Generate verification code that voters can use to check their vote
 */
export function generateVerificationCode(): string {
  // 6-digit code for easy manual verification
  return randomBytes(3).toString('hex').toUpperCase().substring(0, 6);
}

/**
 * Generate cryptographic signature for vote
 * Includes vote data + timestamp for integrity verification
 */
export function generateVoteSignature(
  sessionId: string,
  optionId: string,
  anonymousVoterId: string,
  timestamp: Date
): string {
  const hash = createHash('sha256');
  hash.update(`${sessionId}:${optionId}:${anonymousVoterId}:${timestamp.toISOString()}`);
  return hash.digest('hex');
}

/**
 * Generate audit hash for blockchain-style vote chain
 * Each vote links to previous vote's hash, creating tamper-evident chain
 */
export function generateAuditHash(
  receiptId: string,
  voteHash: string,
  signature: string,
  previousAuditHash: string | null,
  timestamp: Date
): string {
  const hash = createHash('sha256');
  const data = `${receiptId}:${voteHash}:${signature}:${previousAuditHash || 'GENESIS'}:${timestamp.toISOString()}`;
  hash.update(data);
  return hash.digest('hex');
}

/**
 * Verify audit chain integrity
 * Recalculates hash and compares with stored value
 */
export function verifyAuditChainLink(
  receiptId: string,
  voteHash: string,
  signature: string,
  previousAuditHash: string | null,
  timestamp: Date,
  storedAuditHash: string
): boolean {
  const calculatedHash = generateAuditHash(
    receiptId,
    voteHash,
    signature,
    previousAuditHash,
    timestamp
  );
  return calculatedHash === storedAuditHash;
}

/**
 * Generate session salt for anonymization
 * Called once per session, stored securely
 */
export function generateSessionSalt(): string {
  return randomBytes(32).toString('hex');
}

/**
 * Verify that a verification code matches a vote
 */
export function verifyVoteByCode(
  storedCode: string,
  providedCode: string
): boolean {
  return storedCode.toUpperCase() === providedCode.toUpperCase();
}

/**
 * Create vote metadata object for storage
 */
export interface VoteMetadata {
  receiptId: string;
  verificationCode: string;
  anonymousVoterId: string;
  voterHash: string;
  signature: string;
  auditHash: string;
  timestamp: Date;
}

/**
 * Generate complete vote metadata for a cast ballot
 */
export function generateVoteMetadata(
  sessionId: string,
  optionId: string,
  realUserId: string,
  sessionSalt: string,
  previousAuditHash: string | null
): VoteMetadata {
  const timestamp = new Date();
  const anonymousVoterId = generateAnonymousVoterId(realUserId, sessionId, sessionSalt);
  const voterHash = generateVoterHash(anonymousVoterId, timestamp);
  const receiptId = generateReceiptId();
  const verificationCode = generateVerificationCode();
  const signature = generateVoteSignature(sessionId, optionId, anonymousVoterId, timestamp);
  const auditHash = generateAuditHash(receiptId, voterHash, signature, previousAuditHash, timestamp);

  return {
    receiptId,
    verificationCode,
    anonymousVoterId,
    voterHash,
    signature,
    auditHash,
    timestamp,
  };
}
