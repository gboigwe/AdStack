/**
 * stacks-types.ts
 * Shared TypeScript types for Stacks blockchain integration in AdStack.
 * Provides branded types, discriminated unions, and utility types
 * for working with Stacks chain data.
 */

// ---------------------------------------------------------------------------
// Branded Primitive Types
// ---------------------------------------------------------------------------

/** A Stacks principal address (SP... or ST...) */
export type StacksAddress = string & { readonly _brand: 'StacksAddress' };

/** A Stacks transaction ID (0x-prefixed 64 hex chars) */
export type StacksTxId = string & { readonly _brand: 'StacksTxId' };

/** A Stacks block hash (0x-prefixed) */
export type StacksBlockHash = string & { readonly _brand: 'StacksBlockHash' };

/** Micro-STX amount (uint, never negative) */
export type MicroSTX = bigint & { readonly _brand: 'MicroSTX' };

/** Stacks block height */
export type BlockHeight = number & { readonly _brand: 'BlockHeight' };

/** Unix timestamp in seconds (from stacks-block-time) */
export type UnixTimestamp = number & { readonly _brand: 'UnixTimestamp' };

// ---------------------------------------------------------------------------
// Type Guards
// ---------------------------------------------------------------------------

export function isStacksAddress(s: string): s is StacksAddress {
  return /^S[MP][0-9A-Z]{38,39}$/.test(s);
}

export function isStacksTxId(s: string): s is StacksTxId {
  return /^(0x)?[0-9a-f]{64}$/i.test(s);
}

export function normalizeTxId(txId: string): StacksTxId {
  const normalized = txId.startsWith('0x') ? txId : `0x${txId}`;
  return normalized.toLowerCase() as StacksTxId;
}

// ---------------------------------------------------------------------------
// Transaction Status
// ---------------------------------------------------------------------------

export type TxStatus =
  | 'pending'
  | 'success'
  | 'abort_by_response'
  | 'abort_by_post_condition'
  | 'dropped_replace_by_fee'
  | 'dropped_replace_across_fork'
  | 'dropped_expired'
  | 'dropped_too_expensive'
  | 'dropped_stale_garbage_collect';

export type TxStatusCategory = 'pending' | 'success' | 'failed' | 'dropped';

export function categorizeTxStatus(status: TxStatus): TxStatusCategory {
  if (status === 'pending') return 'pending';
  if (status === 'success') return 'success';
  if (status.startsWith('dropped')) return 'dropped';
  return 'failed';
}

export function isTxFinalized(status: TxStatus): boolean {
  return status !== 'pending';
}

export function isTxSuccessful(status: TxStatus): boolean {
  return status === 'success';
}

// ---------------------------------------------------------------------------
// Stacks Epoch Types
// ---------------------------------------------------------------------------

export type StacksEpoch =
  | '1.0'
  | '2.0'
  | '2.05'
  | '2.1'
  | '2.2'
  | '2.3'
  | '2.4'
  | '2.5'
  | '3.0'
  | '3.1'
  | 'latest';

export type ClarityVersion = 1 | 2 | 3 | 4;

export interface ContractVersion {
  clarityVersion: ClarityVersion;
  epoch: StacksEpoch;
  contractVersion: string; // e.g. "4.0.0"
}

// ---------------------------------------------------------------------------
// Network Event Types
// ---------------------------------------------------------------------------

export type StacksEventType =
  | 'new_block'
  | 'mempool_push'
  | 'microblock_push'
  | 'burn_block';

export interface StacksChainEvent {
  type: StacksEventType;
  blockHeight?: number;
  txCount?: number;
  timestamp: number;
}

// ---------------------------------------------------------------------------
// Campaign Chain State
// ---------------------------------------------------------------------------

/** On-chain status constants matching Clarity contract constants */
export const CAMPAIGN_STATUS = {
  DRAFT: 0,
  ACTIVE: 1,
  PAUSED: 2,
  COMPLETED: 3,
  CANCELLED: 4,
} as const;

export type CampaignStatusCode = typeof CAMPAIGN_STATUS[keyof typeof CAMPAIGN_STATUS];

export function campaignStatusToString(code: CampaignStatusCode): string {
  const map: Record<CampaignStatusCode, string> = {
    0: 'draft',
    1: 'active',
    2: 'paused',
    3: 'completed',
    4: 'cancelled',
  };
  return map[code] ?? 'unknown';
}

/** On-chain escrow status constants */
export const ESCROW_STATUS = {
  ACTIVE: 1,
  COMPLETED: 2,
  REFUNDED: 3,
} as const;

export type EscrowStatusCode = typeof ESCROW_STATUS[keyof typeof ESCROW_STATUS];
