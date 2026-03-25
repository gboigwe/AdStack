/**
 * stacks-transactions.ts
 * Transaction building utilities for AdStack using @stacks/transactions.
 * Wraps Stacks.js v7 transaction primitives with typed, ergonomic helpers.
 */

import {
  makeContractCall,
  makeSTXTokenTransfer,
  broadcastTransaction,
  AnchorMode,
  PostConditionMode,
  uintCV,
  stringAsciiCV,
  principalCV,
  boolCV,
  noneCV,
  someCV,
  ClarityValue,
  TxBroadcastResult,
  StacksTransaction,
} from '@stacks/transactions';
import { getStacksNetwork, SupportedNetwork } from './stacks-network';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ContractCallParams {
  contractAddress: string;
  contractName: string;
  functionName: string;
  functionArgs: ClarityValue[];
  senderKey: string;
  postConditions?: any[];
  postConditionMode?: PostConditionMode;
  fee?: bigint;
  nonce?: bigint;
  network?: SupportedNetwork;
}

export interface STXTransferParams {
  recipient: string;
  amount: bigint;
  memo?: string;
  senderKey: string;
  fee?: bigint;
  nonce?: bigint;
  network?: SupportedNetwork;
}

export interface BroadcastOptions {
  network?: SupportedNetwork;
  /** Called when broadcast succeeds with txid */
  onSuccess?: (txId: string) => void;
  /** Called when broadcast fails */
  onError?: (error: Error) => void;
}

export interface TransactionResult {
  txId: string;
  success: boolean;
  error?: string;
}

// ---------------------------------------------------------------------------
// Transaction Builders
// ---------------------------------------------------------------------------

/**
 * Build a signed contract call transaction.
 * Uses AnchorMode.Any for compatibility with Stacks epoch 3+.
 */
export async function buildSignedContractCall(
  params: ContractCallParams,
): Promise<StacksTransaction> {
  const network = getStacksNetwork(params.network);

  return makeContractCall({
    contractAddress: params.contractAddress,
    contractName: params.contractName,
    functionName: params.functionName,
    functionArgs: params.functionArgs,
    senderKey: params.senderKey,
    network,
    anchorMode: AnchorMode.Any,
    postConditionMode: params.postConditionMode ?? PostConditionMode.Deny,
    postConditions: params.postConditions ?? [],
    fee: params.fee,
    nonce: params.nonce,
  });
}

/**
 * Build a signed STX token transfer transaction.
 */
export async function buildSignedSTXTransfer(
  params: STXTransferParams,
): Promise<StacksTransaction> {
  const network = getStacksNetwork(params.network);

  return makeSTXTokenTransfer({
    recipient: params.recipient,
    amount: params.amount,
    senderKey: params.senderKey,
    network,
    anchorMode: AnchorMode.Any,
    memo: params.memo ?? '',
    fee: params.fee,
    nonce: params.nonce,
  });
}

// ---------------------------------------------------------------------------
// Broadcast
// ---------------------------------------------------------------------------

/**
 * Broadcast a signed transaction to the Stacks network.
 * Returns a structured result with txId on success.
 */
export async function broadcastSignedTransaction(
  transaction: StacksTransaction,
  options: BroadcastOptions = {},
): Promise<TransactionResult> {
  const network = getStacksNetwork(options.network);

  try {
    const result: TxBroadcastResult = await broadcastTransaction({
      transaction,
      network,
    });

    if ('error' in result) {
      const err = new Error(result.reason ?? result.error);
      options.onError?.(err);
      return { txId: '', success: false, error: err.message };
    }

    const txId: string = result.txid;
    options.onSuccess?.(txId);
    return { txId, success: true };
  } catch (err) {
    const error = err instanceof Error ? err : new Error(String(err));
    options.onError?.(error);
    return { txId: '', success: false, error: error.message };
  }
}

// ---------------------------------------------------------------------------
// Clarity Value Factories (re-exported for convenience)
// ---------------------------------------------------------------------------

export const cv = {
  uint: (n: number | bigint) => uintCV(BigInt(n)),
  stringAscii: (s: string) => stringAsciiCV(s),
  principal: (addr: string) => principalCV(addr),
  bool: (b: boolean) => boolCV(b),
  none: () => noneCV(),
  some: (value: ClarityValue) => someCV(value),
};
