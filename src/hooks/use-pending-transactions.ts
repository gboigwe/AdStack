/**
 * use-pending-transactions.ts
 * React hook for monitoring an address's pending (mempool) transactions.
 * Polls the Hiro mempool endpoint and tracks individual tx status transitions.
 */

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { fetchMempoolTransactions, MempoolTransaction } from '@/lib/hiro-api';
import { SupportedNetwork } from '@/lib/stacks-network';

export interface PendingTransactionState {
  pendingTxs: MempoolTransaction[];
  pendingCount: number;
  hasPendingTx: (txId: string) => boolean;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

/**
 * Hook to monitor pending mempool transactions for an address.
 * Polls every 15 seconds while there are pending transactions,
 * backs off to 60 seconds when idle.
 */
export function usePendingTransactions(
  address: string | undefined,
  network?: SupportedNetwork,
): PendingTransactionState {
  const [pendingTxs, setPendingTxs] = useState<MempoolTransaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchPending = useCallback(async () => {
    if (!address) return;

    setLoading(true);
    setError(null);

    try {
      const data = await fetchMempoolTransactions(address, network);
      setPendingTxs(data.results ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch mempool');
    } finally {
      setLoading(false);
    }
  }, [address, network]);

  useEffect(() => {
    fetchPending();

    // Poll faster when there are pending txs
    const scheduleNext = () => {
      const interval = pendingTxs.length > 0 ? 15_000 : 60_000;
      intervalRef.current = setInterval(fetchPending, interval);
    };

    scheduleNext();

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [fetchPending, pendingTxs.length]);

  const pendingTxIds = new Set(pendingTxs.map((tx) => tx.tx_id));

  return {
    pendingTxs,
    pendingCount: pendingTxs.length,
    hasPendingTx: (txId) => pendingTxIds.has(txId.startsWith('0x') ? txId : `0x${txId}`),
    loading,
    error,
    refetch: fetchPending,
  };
}
