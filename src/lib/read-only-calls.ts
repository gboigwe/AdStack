/**
 * Read-Only Call Utilities for Clarity v4
 * Query contract state without broadcasting transactions
 */

import {
  callReadOnlyFunction,
  ClarityValue,
  cvToValue,
  uintCV,
  principalCV,
} from '@stacks/transactions';
import { StacksNetwork } from '@stacks/network';
import { NETWORK, CONTRACT_ADDRESS, CONTRACTS } from './stacks-config';

export interface ReadOnlyOptions {
  contractName: string;
  functionName: string;
  functionArgs: ClarityValue[];
  network?: StacksNetwork;
  senderAddress?: string;
}

export interface ReadOnlyResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

/** Default sender address for read-only calls (any valid address works) */
const DEFAULT_SENDER = CONTRACT_ADDRESS;

/**
 * Execute a read-only contract function call
 * @param options - Read-only call configuration
 * @returns Promise with typed result data or error
 */
export async function callReadOnly<T = unknown>(
  options: ReadOnlyOptions
): Promise<ReadOnlyResult<T>> {
  try {
    const result = await callReadOnlyFunction({
      contractAddress: CONTRACT_ADDRESS,
      contractName: options.contractName,
      functionName: options.functionName,
      functionArgs: options.functionArgs,
      network: options.network || NETWORK,
      senderAddress: options.senderAddress || DEFAULT_SENDER,
    });

    const value = cvToValue(result);
    return { success: true, data: value as T };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Read-only call failed',
    };
  }
}
