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
