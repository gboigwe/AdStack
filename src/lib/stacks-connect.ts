/**
 * stacks-connect.ts
 * Stacks Connect authentication and wallet interaction utilities.
 * Wraps @stacks/connect for wallet connection, auth requests,
 * and openContractCall/openSTXTransfer flows.
 */

import {
  openContractCall,
  openSTXTransfer,
  openSignTransaction,
  ContractCallOptions,
  STXTransferOptions,
  SignTransactionOptions,
} from '@stacks/connect';
import { PostConditionMode } from '@stacks/transactions';
import { getStacksNetwork, SupportedNetwork } from './stacks-network';
import { CONTRACT_ADDRESS, APP_DETAILS, CONTRACTS } from './stacks-config';
import type { ContractName } from './stacks-config';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ConnectCallOptions {
  contractName: ContractName;
  functionName: string;
  functionArgs: any[];
  postConditions?: any[];
  postConditionMode?: 'allow' | 'deny';
  network?: SupportedNetwork;
  onFinish?: (data: { txId: string; txRaw: string }) => void;
  onCancel?: () => void;
}

export interface ConnectTransferOptions {
  recipient: string;
  amount: bigint;
  memo?: string;
  network?: SupportedNetwork;
  onFinish?: (data: { txId: string; txRaw: string }) => void;
  onCancel?: () => void;
}

// ---------------------------------------------------------------------------
// Contract Call (browser wallet pop-up)
// ---------------------------------------------------------------------------

/**
 * Open a Stacks Connect contract call dialog.
 * This triggers the installed wallet (Leather, Xverse, etc.) to sign.
 */
export function connectContractCall(options: ConnectCallOptions): void {
  if (!options.contractName) throw new Error('connectContractCall: contractName is required');
  if (!options.functionName) throw new Error('connectContractCall: functionName is required');

  const network = getStacksNetwork(options.network);

  const callOptions: ContractCallOptions = {
    contractAddress: CONTRACT_ADDRESS,
    contractName: options.contractName,
    functionName: options.functionName,
    functionArgs: options.functionArgs,
    network,
    appDetails: APP_DETAILS,
    postConditions: options.postConditions ?? [],
    postConditionMode: options.postConditionMode === 'allow' ? PostConditionMode.Allow : PostConditionMode.Deny,
    onFinish: options.onFinish
      ? (data) => options.onFinish!({ txId: data.txId, txRaw: data.txRaw })
      : undefined,
    onCancel: options.onCancel,
  };

  openContractCall(callOptions);
}

/**
 * Open a Stacks Connect STX transfer dialog.
 */
export function connectSTXTransfer(options: ConnectTransferOptions): void {
  const network = getStacksNetwork(options.network);

  const transferOptions: STXTransferOptions = {
    recipient: options.recipient,
    amount: options.amount.toString(),
    memo: options.memo ?? '',
    network,
    appDetails: APP_DETAILS,
    onFinish: options.onFinish
      ? (data) => options.onFinish!({ txId: data.txId, txRaw: data.txRaw })
      : undefined,
    onCancel: options.onCancel,
  };

  openSTXTransfer(transferOptions);
}

// ---------------------------------------------------------------------------
// Transaction Signing (raw transaction)
// ---------------------------------------------------------------------------

/**
 * Open a Stacks Connect transaction signing dialog for a pre-built tx.
 */
export function connectSignTransaction(
  txHex: string,
  options: {
    network?: SupportedNetwork;
    onFinish?: (txId: string) => void;
    onCancel?: () => void;
  } = {},
): void {
  const network = getStacksNetwork(options.network);

  const signOptions: SignTransactionOptions = {
    txHex,
    network,
    appDetails: APP_DETAILS,
    onFinish: options.onFinish
      ? (data) => options.onFinish!(data.txId)
      : undefined,
    onCancel: options.onCancel,
  };

  openSignTransaction(signOptions);
}

// ---------------------------------------------------------------------------
// Post-Condition Mode Helpers
// ---------------------------------------------------------------------------

export const PC_MODE = {
  DENY: PostConditionMode.Deny,
  ALLOW: PostConditionMode.Allow,
};
