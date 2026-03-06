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
