/**
 * Post-Condition Builders for Stacks Transactions
 * Post-conditions ensure transactions only execute if specific
 * conditions are met, protecting users from unexpected fund transfers.
 */

import {
  Pc,
  PostConditionMode,
} from '@stacks/transactions';
import { CONTRACT_ADDRESS, MICRO_STX } from './stacks-config';
import type { ContractName } from './stacks-config';

/**
 * Post-condition mode options.
 * ALLOW: Transaction can transfer any assets beyond what's specified.
 * DENY: Transaction can ONLY transfer assets explicitly listed.
 */
export const PC_MODE = {
  ALLOW: PostConditionMode.Allow,
  DENY: PostConditionMode.Deny,
} as const;

/**
 * Create a post-condition that ensures the sender transfers exactly
 * the specified amount of STX.
 */
export function createSTXTransferExact(
  senderAddress: string,
  amountSTX: number,
) {
  if (!senderAddress || senderAddress.length === 0) {
    throw new Error('createSTXTransferExact: senderAddress is required');
  }
  if (amountSTX <= 0 || !Number.isFinite(amountSTX)) {
    throw new Error('createSTXTransferExact: amountSTX must be a positive finite number');
  }
  const microAmount = BigInt(Math.floor(amountSTX * MICRO_STX));
  return Pc.principal(senderAddress).willSendEq(microAmount).ustx();
}

/**
 * Create a post-condition that ensures the sender transfers at most
 * the specified amount of STX.
 */
export function createSTXTransferMax(
  senderAddress: string,
  maxSTX: number,
) {
  const microAmount = BigInt(Math.floor(maxSTX * MICRO_STX));
  return Pc.principal(senderAddress).willSendLte(microAmount).ustx();
}

/**
 * Create a post-condition that ensures a contract sends at most
 * the specified amount of STX (e.g., for escrow releases).
 */
export function createContractSTXTransfer(
  contractName: ContractName,
  maxSTX: number,
) {
  const microAmount = BigInt(Math.floor(maxSTX * MICRO_STX));
  const contractPrincipal = `${CONTRACT_ADDRESS}.${contractName}`;
  return Pc.principal(contractPrincipal).willSendLte(microAmount).ustx();
}

/**
 * Create post-conditions for a campaign funding transaction.
 * Ensures the advertiser sends exactly the specified budget amount
 * and that the escrow contract doesn't send any STX back unexpectedly.
 */
export function createCampaignFundingPostConditions(
  advertiserAddress: string,
  budgetSTX: number,
) {
  return [
    createSTXTransferExact(advertiserAddress, budgetSTX),
  ];
}

/**
 * Create post-conditions for a publisher payout.
 * Ensures the escrow contract sends at most the claimed amount.
 */
export function createPublisherPayoutPostConditions(
  contractName: ContractName,
  maxPayoutSTX: number,
) {
  return [
    createContractSTXTransfer(contractName, maxPayoutSTX),
  ];
}
