/**
 * sign-message.ts
 * Off-chain message signing utilities for AdStack.
 * Used for proof-of-ownership, campaign authorization receipts,
 * and anti-spam proof for API endpoints.
 */

import { openSignMessage, openStructuredDataSignature } from '@stacks/connect';
import { APP_DETAILS } from './stacks-config';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface SignMessageOptions {
  message: string;
  onFinish: (result: { signature: string; publicKey: string }) => void;
  onCancel?: () => void;
}

export interface SignedMessage {
  message: string;
  signature: string;
  publicKey: string;
  signerAddress: string;
  signedAt: number;
}

export interface CampaignAuthPayload {
  action: 'create' | 'cancel' | 'pause' | 'resume';
  campaignId?: number;
  advertiser: string;
  timestamp: number;
  nonce: string;
}

// ---------------------------------------------------------------------------
// Message Signing
// ---------------------------------------------------------------------------

/**
 * Open the Stacks wallet to sign an arbitrary UTF-8 message.
 * Returns the signature and public key via onFinish callback.
 */
export function signMessage(options: SignMessageOptions): void {
  openSignMessage({
    message: options.message,
    appDetails: APP_DETAILS,
    onFinish: options.onFinish,
    onCancel: options.onCancel,
  });
}

// ---------------------------------------------------------------------------
// Structured Data (SIP-018)
// ---------------------------------------------------------------------------

/**
 * Build a SIP-018 structured data domain for AdStack.
 */
export function buildAdStackDomain(chainId: number) {
  return {
    name: 'AdStack',
    version: '4.0.0',
    'chain-id': chainId,
  };
}

/**
 * Build a campaign authorization message for off-chain signing.
 * Used to authorize admin operations without on-chain transaction.
 */
export function buildCampaignAuthMessage(
  payload: CampaignAuthPayload,
): string {
  return JSON.stringify({
    domain: 'AdStack v4.0.0',
    action: payload.action,
    campaignId: payload.campaignId,
    advertiser: payload.advertiser,
    timestamp: payload.timestamp,
    nonce: payload.nonce,
  });
}

/**
 * Generate a random nonce for message signing (anti-replay).
 */
export function generateSigningNonce(): string {
  const bytes = new Uint8Array(16);
  if (typeof crypto !== 'undefined') {
    crypto.getRandomValues(bytes);
  }
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Verify a signed message contains the expected content.
 * NOTE: Full cryptographic verification requires @stacks/encryption.
 * This performs structural validation only.
 */
export function validateSignedMessage(
  signed: SignedMessage,
  expectedMessage: string,
  maxAgeSeconds = 300,
): boolean {
  if (signed.message !== expectedMessage) return false;

  const age = Math.floor(Date.now() / 1000) - signed.signedAt;
  if (age > maxAgeSeconds) return false;

  return true;
}
