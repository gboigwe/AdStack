/**
 * nonce-manager.ts
 * Account nonce management for Stacks transactions.
 * Tracks in-flight transactions to prevent nonce conflicts during rapid submission.
 */

import { getApiUrl, SupportedNetwork } from './stacks-network';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface AccountNonces {
  possible_next_nonce: number;
  last_executed_tx_nonce: number | null;
  last_mempool_tx_nonce: number | null;
  detected_missing_nonces: number[];
  detected_mempool_gap: boolean;
}

// ---------------------------------------------------------------------------
// In-Memory Nonce Tracker
// ---------------------------------------------------------------------------

/** Maps address -> last submitted nonce (for in-flight tracking) */
const pendingNonces = new Map<string, number>();

/**
 * Fetch the current account nonce from the Hiro API.
 */
export async function fetchAccountNonce(
  address: string,
  network?: SupportedNetwork,
): Promise<AccountNonces> {
  if (!address || address.length === 0) {
    throw new Error('fetchAccountNonce: address is required');
  }

  const apiUrl = getApiUrl(network);
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15_000);

  try {
    const response = await fetch(`${apiUrl}/extended/v1/address/${address}/nonces`, {
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch nonce for ${address}: ${response.statusText}`);
    }

    const data: AccountNonces = await response.json();

    if (typeof data.possible_next_nonce !== 'number') {
      throw new Error(`Invalid nonce response for ${address}: missing possible_next_nonce`);
    }

    return data;
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Get the next usable nonce for an address.
 * Considers both on-chain nonces and locally tracked pending transactions.
 *
 * @param address - Stacks principal address
 * @param network - Target network (default: from env)
 */
export async function getNextNonce(
  address: string,
  network?: SupportedNetwork,
): Promise<bigint> {
  const nonces = await fetchAccountNonce(address, network);
  const onChainNonce = nonces.possible_next_nonce;
  const localNonce = pendingNonces.get(address);

  // Use the higher of on-chain or local tracking to avoid gaps
  const nextNonce = localNonce !== undefined
    ? Math.max(onChainNonce, localNonce + 1)
    : onChainNonce;

  return BigInt(nextNonce);
}

/**
 * Reserve a nonce for an address.
 * Call this immediately before broadcasting a transaction to prevent
 * duplicate nonce submission in rapid-fire scenarios.
 */
export function reserveNonce(address: string, nonce: bigint): void {
  pendingNonces.set(address, Number(nonce));
}

/**
 * Release the reserved nonce for an address (on success or failure).
 * Should be called after the transaction is finalized or dropped.
 */
export function releaseNonce(address: string): void {
  pendingNonces.delete(address);
}

/** Lock map to prevent concurrent acquireNonce calls for the same address */
const nonceLocks = new Map<string, Promise<bigint>>();

/**
 * Get and reserve the next nonce atomically.
 * Returns the nonce ready for use in a transaction.
 * Uses a per-address lock to prevent race conditions where two
 * concurrent calls could acquire the same nonce.
 */
export async function acquireNonce(
  address: string,
  network?: SupportedNetwork,
): Promise<bigint> {
  const existingLock = nonceLocks.get(address);

  const acquirePromise = (existingLock ?? Promise.resolve(0n)).then(async () => {
    const nonce = await getNextNonce(address, network);
    reserveNonce(address, nonce);
    return nonce;
  });

  nonceLocks.set(address, acquirePromise);

  try {
    return await acquirePromise;
  } finally {
    if (nonceLocks.get(address) === acquirePromise) {
      nonceLocks.delete(address);
    }
  }
}

/**
 * Reset all locally tracked nonces (useful after wallet reconnect).
 */
export function resetAllNonces(): void {
  pendingNonces.clear();
}

/**
 * Check if there are unresolved nonce gaps that need attention.
 */
export async function hasNonceGap(
  address: string,
  network?: SupportedNetwork,
): Promise<boolean> {
  const nonces = await fetchAccountNonce(address, network);
  return nonces.detected_mempool_gap || nonces.detected_missing_nonces.length > 0;
}
