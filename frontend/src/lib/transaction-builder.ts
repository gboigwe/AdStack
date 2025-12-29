/**
 * Transaction Builder Utilities for Clarity v4
 * Simplified contract interaction with Stacks.js v7+
 */

import {
  makeContractCall,
  broadcastTransaction,
  AnchorMode,
  PostConditionMode,
  ClarityValue,
  makeContractSTXPostCondition,
  FungibleConditionCode,
} from '@stacks/transactions';
import { StacksNetwork } from '@stacks/network';
import { userSession } from './wallet';
import { NETWORK, CONTRACT_ADDRESS, TX_OPTIONS } from './stacks-config';

export interface TransactionOptions {
  contractName: string;
  functionName: string;
  functionArgs: ClarityValue[];
  network?: StacksNetwork;
  postConditions?: any[];
  fee?: bigint;
  anchorMode?: AnchorMode;
  postConditionMode?: PostConditionMode;
}

export interface TransactionResult {
  txId: string;
  success: boolean;
  error?: string;
}

/**
 * Build and broadcast a contract call transaction
 */
export async function callContract(
  options: TransactionOptions
): Promise<TransactionResult> {
  try {
    if (!userSession.isUserSignedIn()) {
      throw new Error('User not signed in');
    }

    const userData = userSession.loadUserData();

    const txOptions = {
      contractAddress: CONTRACT_ADDRESS,
      contractName: options.contractName,
      functionName: options.functionName,
      functionArgs: options.functionArgs,
      senderKey: userData.appPrivateKey,
      network: options.network || NETWORK,
      anchorMode: options.anchorMode || AnchorMode.Any,
      postConditionMode: options.postConditionMode || PostConditionMode.Deny,
      postConditions: options.postConditions || [],
      fee: options.fee || TX_OPTIONS.DEFAULT_FEE,
    };

    const transaction = await makeContractCall(txOptions);
    const broadcastResponse = await broadcastTransaction({
      transaction,
      network: txOptions.network,
    });

    if ('error' in broadcastResponse) {
      return {
        txId: '',
        success: false,
        error: broadcastResponse.error,
      };
    }

    return {
      txId: broadcastResponse.txid,
      success: true,
    };
  } catch (error) {
    return {
      txId: '',
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Create STX post-condition for contract calls
 */
export function createSTXPostCondition(
  address: string,
  amount: bigint,
  code: FungibleConditionCode = FungibleConditionCode.LessEqual
) {
  return makeContractSTXPostCondition(
    CONTRACT_ADDRESS,
    address,
    code,
    amount
  );
}

/**
 * Estimate transaction fee
 */
export function estimateFee(baselineFee: bigint): bigint {
  const multiplier = BigInt(Math.floor(TX_OPTIONS.FEE_MULTIPLIER * 100));
  const estimatedFee = (baselineFee * multiplier) / 100n;
  return estimatedFee > TX_OPTIONS.MAX_FEE
    ? TX_OPTIONS.MAX_FEE
    : estimatedFee;
}

/**
 * Wait for transaction confirmation
 */
export async function waitForTransactionConfirmation(
  txId: string,
  network: StacksNetwork = NETWORK,
  maxAttempts: number = 30,
  delayMs: number = 10000
): Promise<boolean> {
  for (let i = 0; i < maxAttempts; i++) {
    try {
      const response = await fetch(
        `${network.client.baseUrl}/extended/v1/tx/${txId}`
      );
      const data = await response.json();

      if (data.tx_status === 'success') {
        return true;
      }

      if (data.tx_status === 'abort_by_response' || data.tx_status === 'abort_by_post_condition') {
        return false;
      }

      await new Promise((resolve) => setTimeout(resolve, delayMs));
    } catch (error) {
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }

  return false;
}

/**
 * Get transaction details
 */
export async function getTransactionDetails(
  txId: string,
  network: StacksNetwork = NETWORK
): Promise<any> {
  try {
    const response = await fetch(
      `${network.client.baseUrl}/extended/v1/tx/${txId}`
    );
    return await response.json();
  } catch (error) {
    throw new Error(`Failed to fetch transaction: ${error}`);
  }
}

/**
 * Get transaction result
 */
export async function getTransactionResult(
  txId: string,
  network: StacksNetwork = NETWORK
): Promise<{ success: boolean; value?: any; error?: string }> {
  try {
    const tx = await getTransactionDetails(txId, network);

    if (tx.tx_status === 'success') {
      return {
        success: true,
        value: tx.tx_result,
      };
    }

    return {
      success: false,
      error: tx.tx_status,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
