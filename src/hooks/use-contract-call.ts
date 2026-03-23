'use client';

import { useCallback, useRef, useState } from 'react';
import { openContractCall } from '@stacks/connect';
import { useQueryClient } from '@tanstack/react-query';
import { useWalletStore } from '@/store/wallet-store';
import { useTransactionStore } from '@/store/transaction-store';
import { useToast } from './use-toast';
import { NETWORK } from '@/lib/stacks-config';

/** Minimum interval between contract call submissions (ms). */
const THROTTLE_MS = 2000;

interface ContractCallArgs {
  contractAddress: string;
  contractName: string;
  functionName: string;
  functionArgs: unknown[];
  postConditionMode: number;
  postConditions: unknown[];
}

interface UseContractCallOptions {
  /** Human-readable label for the transaction (e.g. "Create Campaign") */
  label: string;
  /** React Query keys to invalidate on success */
  invalidateKeys?: string[][];
  /** Called after user signs and tx is submitted */
  onSuccess?: (txId: string) => void;
  /** Called if user rejects or tx fails */
  onError?: (error: Error) => void;
}

/**
 * Hook for executing Stacks contract calls via the wallet.
 * Integrates with the transaction store for tracking and the
 * toast system for user feedback.
 *
 * @example
 * const { execute, isLoading } = useContractCall({
 *   label: 'Create Campaign',
 *   invalidateKeys: [['read-only', 'promo-manager']],
 * });
 *
 * const handleCreate = () => {
 *   execute(buildCreateCampaign(address, params));
 * };
 */
export function useContractCall({
  label,
  invalidateKeys,
  onSuccess,
  onError,
}: UseContractCallOptions) {
  const [isLoading, setIsLoading] = useState(false);
  const { isConnected } = useWalletStore();
  const { addTransaction } = useTransactionStore();
  const queryClient = useQueryClient();
  const toast = useToast();
  const lastCallRef = useRef(0);

  const execute = useCallback(
    async (args: ContractCallArgs) => {
      if (!isConnected) {
        toast.error('Please connect your wallet first');
        return;
      }

      // Prevent double-clicks and rapid re-submissions
      const now = Date.now();
      if (now - lastCallRef.current < THROTTLE_MS) {
        toast.warning('Please wait before submitting again');
        return;
      }
      lastCallRef.current = now;

      setIsLoading(true);

      try {
        await openContractCall({
          ...args,
          network: NETWORK,
          onFinish: (data) => {
            const txId = data.txId;
            addTransaction(txId, label);
            toast.success(`${label} submitted! Tx: ${txId.slice(0, 10)}...`);

            // Invalidate related queries so they refetch
            if (invalidateKeys) {
              for (const key of invalidateKeys) {
                queryClient.invalidateQueries({ queryKey: key });
              }
            }

            onSuccess?.(txId);
            setIsLoading(false);
          },
          onCancel: () => {
            toast.warning(`${label} was cancelled`);
            setIsLoading(false);
          },
        });
      } catch (err) {
        const error =
          err instanceof Error ? err : new Error(String(err));
        toast.error(`${label} failed: ${error.message}`);
        onError?.(error);
        setIsLoading(false);
      }
    },
    [isConnected, label, invalidateKeys, onSuccess, onError, addTransaction, queryClient, toast],
  );

  return { execute, isLoading };
}
