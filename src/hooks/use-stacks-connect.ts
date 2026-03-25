/**
 * use-stacks-connect.ts
 * Comprehensive React hook for Stacks Connect wallet operations.
 * Combines useWalletAuth with contract call execution and
 * transaction lifecycle management.
 */

'use client';

import { useState, useCallback } from 'react';
import { useWalletAuth } from './use-wallet-auth';
import { connectContractCall, connectSTXTransfer, ConnectCallOptions } from '@/lib/stacks-connect';
import { SupportedNetwork, resolveNetwork } from '@/lib/stacks-network';
import type { ContractName } from '@/lib/stacks-config';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type TxState = 'idle' | 'pending' | 'success' | 'error';

export interface ContractCallState {
  txState: TxState;
  txId: string | null;
  error: string | null;
  execute: (
    contractName: ContractName,
    functionName: string,
    functionArgs: any[],
    postConditions?: any[],
  ) => void;
  reset: () => void;
}

export interface STXTransferState {
  txState: TxState;
  txId: string | null;
  error: string | null;
  transfer: (recipient: string, amount: bigint, memo?: string) => void;
  reset: () => void;
}

// ---------------------------------------------------------------------------
// Hooks
// ---------------------------------------------------------------------------

/**
 * Hook for executing Stacks Connect contract calls with state tracking.
 * Requires an active wallet connection (use useWalletAuth first).
 */
export function useContractCallConnect(): ContractCallState {
  const [txState, setTxState] = useState<TxState>('idle');
  const [txId, setTxId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const network = resolveNetwork() as SupportedNetwork;

  const execute = useCallback(
    (
      contractName: ContractName,
      functionName: string,
      functionArgs: any[],
      postConditions: any[] = [],
    ) => {
      setTxState('pending');
      setError(null);
      setTxId(null);

      connectContractCall({
        contractName,
        functionName,
        functionArgs,
        postConditions,
        network,
        onFinish: ({ txId }) => {
          setTxId(txId);
          setTxState('success');
        },
        onCancel: () => {
          setTxState('idle');
        },
      });
    },
    [network],
  );

  const reset = useCallback(() => {
    setTxState('idle');
    setTxId(null);
    setError(null);
  }, []);

  return { txState, txId, error, execute, reset };
}

/**
 * Hook for Stacks Connect STX transfer with state tracking.
 */
export function useSTXTransferConnect(): STXTransferState {
  const [txState, setTxState] = useState<TxState>('idle');
  const [txId, setTxId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const network = resolveNetwork() as SupportedNetwork;

  const transfer = useCallback(
    (recipient: string, amount: bigint, memo?: string) => {
      setTxState('pending');
      setError(null);

      connectSTXTransfer({
        recipient,
        amount,
        memo,
        network,
        onFinish: ({ txId }) => {
          setTxId(txId);
          setTxState('success');
        },
        onCancel: () => {
          setTxState('idle');
        },
      });
    },
    [network],
  );

  const reset = useCallback(() => {
    setTxState('idle');
    setTxId(null);
    setError(null);
  }, []);

  return { txState, txId, error, transfer, reset };
}

/**
 * Combined hook providing wallet auth + contract call capabilities.
 */
export function useStacksConnect() {
  const auth = useWalletAuth();
  const contractCall = useContractCallConnect();
  const stxTransfer = useSTXTransferConnect();

  return {
    ...auth,
    contractCall,
    stxTransfer,
  };
}
