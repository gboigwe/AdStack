/**
 * use-account-nonce.ts
 * React hook for Stacks account nonce management.
 * Fetches current nonce and exposes reserve/release functions
 * for coordinating rapid transaction submissions.
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  fetchAccountNonce,
  acquireNonce,
  releaseNonce,
  hasNonceGap,
  AccountNonces,
} from '@/lib/nonce-manager';
import { SupportedNetwork } from '@/lib/stacks-network';

export interface AccountNonceState {
  nonces: AccountNonces | null;
  possibleNextNonce: number;
  hasMempoolGap: boolean;
  loading: boolean;
  error: string | null;
  /** Reserve and get the next available nonce for a transaction */
  acquireNonce: () => Promise<bigint>;
  /** Release the reserved nonce (call after tx success or failure) */
  releaseNonce: () => void;
  refetch: () => void;
}

/**
 * Hook to track and manage an account's nonce state.
 * Essential for preventing transaction ordering issues.
 */
export function useAccountNonce(
  address: string | undefined,
  network?: SupportedNetwork,
): AccountNonceState {
  const [nonces, setNonces] = useState<AccountNonces | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMempoolGap, setHasMempoolGap] = useState(false);

  const fetchNonce = useCallback(async () => {
    if (!address) return;

    setLoading(true);
    setError(null);

    try {
      const data = await fetchAccountNonce(address, network);
      setNonces(data);

      const gap = await hasNonceGap(address, network);
      setHasMempoolGap(gap);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch nonce');
    } finally {
      setLoading(false);
    }
  }, [address, network]);

  useEffect(() => {
    fetchNonce();
  }, [fetchNonce]);

  return {
    nonces,
    possibleNextNonce: nonces?.possible_next_nonce ?? 0,
    hasMempoolGap,
    loading,
    error,
    acquireNonce: async () => {
      if (!address) throw new Error('No address provided');
      const nonce = await acquireNonce(address, network);
      await fetchNonce(); // Refresh after acquiring
      return nonce;
    },
    releaseNonce: () => {
      if (address) releaseNonce(address);
      fetchNonce();
    },
    refetch: fetchNonce,
  };
}
