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
