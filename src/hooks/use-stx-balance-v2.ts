/**
 * use-stx-balance-v2.ts
 * Enhanced STX balance hook with locked/unlocked breakdown and USD value.
 * Extends the base useStxBalance with stacking info and USD conversion.
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { fetchSTXBalance, STXBalance } from '@/lib/hiro-api';
import { SupportedNetwork } from '@/lib/stacks-network';
import { microStxToStx } from '@/lib/stx-price';

export interface EnhancedSTXBalance {
  raw: STXBalance | null;
  /** Total balance in micro-STX (including stacking locked) */
  totalMicroStx: bigint;
  /** Available (unlocked) balance in micro-STX */
  availableMicroStx: bigint;
  /** Locked balance in micro-STX (stacking) */
  lockedMicroStx: bigint;
  /** Total balance in STX */
  totalStx: number;
  /** Available balance in STX */
  availableStx: number;
  /** Total USD value (requires usdPerStx) */
  totalUsd: number;
  /** True if account has an active stacking lock */
  isStacking: boolean;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

/**
 * Enhanced hook to fetch STX balance with stacking breakdown and USD value.
 *
 * @param address - Stacks principal address to query
 * @param usdPerStx - Current STX/USD price (from useSTXPrice)
 * @param pollIntervalMs - How often to refresh (0 to disable)
 * @param network - Target network
 */
export function useEnhancedSTXBalance(
  address: string | undefined,
  usdPerStx = 0,
  pollIntervalMs = 60_000,
  network?: SupportedNetwork,
): EnhancedSTXBalance {
  const [raw, setRaw] = useState<STXBalance | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchBalance = useCallback(async () => {
    if (!address) return;

    setLoading(true);
    setError(null);

    try {
      const data = await fetchSTXBalance(address, network);
      setRaw(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch balance');
    } finally {
      setLoading(false);
    }
  }, [address, network]);

  useEffect(() => {
    fetchBalance();

    if (pollIntervalMs > 0) {
      const interval = setInterval(fetchBalance, pollIntervalMs);
      return () => clearInterval(interval);
    }
  }, [fetchBalance, pollIntervalMs]);

  const totalMicroStx = raw ? BigInt(raw.balance) : 0n;
  const lockedMicroStx = raw ? BigInt(raw.locked) : 0n;
  const availableMicroStx = totalMicroStx - lockedMicroStx;

  return {
    raw,
    totalMicroStx,
    availableMicroStx,
    lockedMicroStx,
    totalStx: microStxToStx(totalMicroStx),
    availableStx: microStxToStx(availableMicroStx),
    totalUsd: usdPerStx > 0 ? microStxToStx(totalMicroStx) * usdPerStx : 0,
    isStacking: lockedMicroStx > 0n,
    loading,
    error,
    refetch: fetchBalance,
  };
}

/**
 * Quick check: does an address have sufficient STX for a transaction?
 */
export function useHasSufficientBalance(
  address: string | undefined,
  requiredMicroStx: bigint,
  network?: SupportedNetwork,
): boolean {
  const { availableMicroStx, loading } = useEnhancedSTXBalance(
    address, 0, 30_000, network,
  );
  if (loading || !address) return false;
  return availableMicroStx >= requiredMicroStx;
}
