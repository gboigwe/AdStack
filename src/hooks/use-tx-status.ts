'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchTransaction, type ApiTransaction } from '@/lib/stacks-api';
import { CURRENT_NETWORK } from '@/lib/stacks-config';

/** Transaction status as observed from the API. */
export type TxStatus = 'pending' | 'success' | 'abort_by_response' | 'abort_by_post_condition' | 'dropped' | 'unknown';

/** Parsed transaction status info. */
export interface TxStatusInfo {
  txId: string;
  status: TxStatus;
  blockHeight: number | null;
  raw: ApiTransaction | null;
  isFinalized: boolean;
}

/**
 * Normalize the raw API tx_status string to our enum.
 */
function normalizeStatus(apiStatus: string): TxStatus {
  if (apiStatus === 'success') return 'success';
  if (apiStatus === 'pending') return 'pending';
  if (apiStatus === 'abort_by_response') return 'abort_by_response';
  if (apiStatus === 'abort_by_post_condition') return 'abort_by_post_condition';
  if (apiStatus === 'dropped' || apiStatus === 'dropped_replace_by_fee' || apiStatus === 'dropped_replace_across_fork' || apiStatus === 'dropped_too_expensive' || apiStatus === 'dropped_stale_garbage_collect') return 'dropped';
  return 'unknown';
}

/**
 * Hook to poll transaction status until it confirms or fails.
 * Automatically stops polling once the transaction reaches a final state.
 *
 * Useful after submitting a contract call to show real-time confirmation
 * status in the UI without requiring the user to check the explorer.
 *
 * @param txId - The transaction ID to track (pass undefined to disable)
 * @param pollInterval - Polling interval in ms (default 5000)
 *
 * @example
 * const { data: status } = useTxStatus(pendingTxId);
 * if (status?.isFinalized) {
 *   // Transaction confirmed or failed
 * }
 */
export function useTxStatus(txId: string | undefined, pollInterval = 5000) {
  return useQuery({
    queryKey: ['tx-status', CURRENT_NETWORK, txId],
    queryFn: async (): Promise<TxStatusInfo> => {
      if (!txId) {
        return { txId: '', status: 'unknown', blockHeight: null, raw: null, isFinalized: false };
      }

      const result = await fetchTransaction(txId);

      if (!result.ok || !result.data) {
        // Transaction not yet indexed (still in mempool) - treat as pending
        return {
          txId,
          status: 'pending',
          blockHeight: null,
          raw: null,
          isFinalized: false,
        };
      }

      const tx = result.data;
      const status = normalizeStatus(tx.tx_status);
      const isFinalized = status !== 'pending' && status !== 'unknown' && status !== 'dropped';

      return {
        txId,
        status,
        blockHeight: isFinalized ? tx.block_height : null,
        raw: tx,
        isFinalized,
      };
    },
    enabled: !!txId,
    staleTime: 3_000,
    // Stop polling once the transaction is finalized
    refetchInterval: (query) => {
      const data = query.state.data;
      if (data?.isFinalized) return false;
      return pollInterval;
    },
  });
}

/**
 * Hook to track multiple transaction statuses at once.
 * Returns a map of txId -> TxStatusInfo.
 *
 * @param txIds - Array of transaction IDs to track
 */
export function useBatchTxStatus(txIds: string[]) {
  const queryClient = useQueryClient();

  const queries = txIds.map((txId) => ({
    queryKey: ['tx-status', CURRENT_NETWORK, txId] as const,
    queryFn: async (): Promise<TxStatusInfo> => {
      const result = await fetchTransaction(txId);
      if (!result.ok || !result.data) {
        return { txId, status: 'pending' as TxStatus, blockHeight: null, raw: null, isFinalized: false };
      }
      const tx = result.data;
      const status = normalizeStatus(tx.tx_status);
      const isFinalized = status !== 'pending' && status !== 'unknown' && status !== 'dropped';
      return { txId, status, blockHeight: isFinalized ? tx.block_height : null, raw: tx, isFinalized };
    },
  }));

  // Use individual useQuery calls but expose a combined interface
  const results = useQuery({
    queryKey: ['batch-tx-status', CURRENT_NETWORK, ...txIds],
    queryFn: async () => {
      const statuses: Record<string, TxStatusInfo> = {};
      await Promise.all(
        txIds.map(async (txId) => {
          const result = await fetchTransaction(txId);
          if (!result.ok || !result.data) {
            statuses[txId] = { txId, status: 'pending', blockHeight: null, raw: null, isFinalized: false };
            return;
          }
          const tx = result.data;
          const status = normalizeStatus(tx.tx_status);
          const isFinalized = status !== 'pending' && status !== 'unknown' && status !== 'dropped';
          statuses[txId] = { txId, status, blockHeight: isFinalized ? tx.block_height : null, raw: tx, isFinalized };
        }),
      );
      return statuses;
    },
    enabled: txIds.length > 0,
    staleTime: 3_000,
    refetchInterval: (query) => {
      const data = query.state.data;
      if (!data) return 5_000;
      // Stop polling only when all transactions are finalized
      const allFinalized = txIds.every((id) => data[id]?.isFinalized);
      return allFinalized ? false : 5_000;
    },
  });

  return results;
}

/**
 * Manually invalidate a tx status query (e.g., when a new block arrives).
 */
export function useInvalidateTxStatus() {
  const queryClient = useQueryClient();

  return (txId?: string) => {
    if (txId) {
      queryClient.invalidateQueries({ queryKey: ['tx-status', CURRENT_NETWORK, txId] });
    } else {
      queryClient.invalidateQueries({ queryKey: ['tx-status'] });
      queryClient.invalidateQueries({ queryKey: ['batch-tx-status'] });
    }
  };
}
