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
  PostCondition,
  makeContractSTXPostCondition,
  FungibleConditionCode,
} from '@stacks/transactions';
import { StacksNetwork } from '@stacks/network';
import { userSession } from './wallet';
import { NETWORK, CONTRACT_ADDRESS, TX_OPTIONS } from './stacks-config';

/** Default maximum polling attempts for transaction confirmation */
const DEFAULT_MAX_ATTEMPTS = 30;

/** Default delay between polling attempts in milliseconds */
const DEFAULT_DELAY_MS = 10000;

/** Default fetch timeout in milliseconds */
const FETCH_TIMEOUT_MS = 15000;

/** Transaction ID format regex */
const TX_ID_PATTERN = /^0x[a-fA-F0-9]{64}$/;

export interface TransactionOptions {
  contractName: string;
  functionName: string;
  functionArgs: ClarityValue[];
  network?: StacksNetwork;
  postConditions?: PostCondition[];
  fee?: bigint;
  anchorMode?: AnchorMode;
  postConditionMode?: PostConditionMode;
}

export interface TransactionDetailsResponse {
  tx_id: string;
  tx_status: 'success' | 'pending' | 'abort_by_response' | 'abort_by_post_condition';
  tx_result?: { repr: string; hex: string };
  sender_address: string;
  fee_rate: string;
  block_height?: number;
  burn_block_time?: number;
}

export interface TransactionResult {
  txId: string;
  success: boolean;
  error?: string;
}

/**
 * Build and broadcast a contract call transaction to the Stacks network
 * @param options - Transaction configuration including contract name, function, and arguments
 * @returns Promise resolving to TransactionResult with txId and success status
 * @throws Error if wallet is not connected or inputs are invalid
 */
export async function callContract(options: TransactionOptions): Promise<TransactionResult> {
  try {
    if (!userSession.isUserSignedIn()) {
      throw new Error('User not signed in');
    }

    if (!options.contractName || options.contractName.trim() === '') {
      throw new Error('Contract name is required');
    }

    if (!options.functionName || options.functionName.trim() === '') {
      throw new Error('Function name is required');
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
      return { txId: '', success: false, error: `Broadcast failed: ${broadcastResponse.error}` };
    }

    return { txId: broadcastResponse.txid, success: true };
  } catch (error) {
    return {
      txId: '',
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Create an STX post-condition to protect users from unexpected transfers
 * @param address - The contract address to apply the post-condition to
 * @param amount - Maximum STX amount in microstacks
 * @param code - Fungible condition code specifying the comparison type
 * @returns A contract STX post-condition for transaction safety
 */
export function createSTXPostCondition(
  address: string,
  amount: bigint,
  code: FungibleConditionCode = FungibleConditionCode.LessEqual
) {
  return makeContractSTXPostCondition(CONTRACT_ADDRESS, address, code, amount);
}

/**
 * Estimate the transaction fee based on a baseline with configured multiplier
 * @param baselineFee - The baseline fee amount in microstacks
 * @returns Estimated fee capped at the configured maximum fee
 */
export function estimateFee(baselineFee: bigint): bigint {
  const multiplier = BigInt(Math.floor(TX_OPTIONS.FEE_MULTIPLIER * 100));
  const estimatedFee = (baselineFee * multiplier) / 100n;
  return estimatedFee > TX_OPTIONS.MAX_FEE ? TX_OPTIONS.MAX_FEE : estimatedFee;
}
