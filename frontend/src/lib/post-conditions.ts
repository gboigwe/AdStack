/**
 * Post-Condition Builder Helpers for Clarity v4
 * Safely enforce contract call constraints
 */

import {
  makeStandardSTXPostCondition,
  makeContractSTXPostCondition,
  makeStandardFungiblePostCondition,
  makeContractFungiblePostCondition,
  FungibleConditionCode,
  PostCondition,
  createAssetInfo,
} from '@stacks/transactions';
import { CONTRACT_ADDRESS } from './stacks-config';

/**
 * Create STX transfer post-condition (user → contract)
 */
export function createUserSTXPostCondition(
  userAddress: string,
  amount: bigint,
  code: FungibleConditionCode = FungibleConditionCode.Equal
): PostCondition {
  return makeStandardSTXPostCondition(userAddress, code, amount);
}

/**
 * Create STX transfer post-condition (contract → user)
 */
export function createContractSTXPostCondition(
  contractName: string,
  amount: bigint,
  code: FungibleConditionCode = FungibleConditionCode.Equal
): PostCondition {
  return makeContractSTXPostCondition(
    CONTRACT_ADDRESS,
    contractName,
    code,
    amount
  );
}

/**
 * Create fungible token post-condition (user)
 */
export function createUserTokenPostCondition(
  userAddress: string,
  tokenAddress: string,
  tokenName: string,
  amount: bigint,
  code: FungibleConditionCode = FungibleConditionCode.Equal
): PostCondition {
  const assetInfo = createAssetInfo(tokenAddress, tokenName, tokenName);

  return makeStandardFungiblePostCondition(
    userAddress,
    code,
    amount,
    assetInfo
  );
}

/**
 * Create fungible token post-condition (contract)
 */
export function createContractTokenPostCondition(
  contractName: string,
  tokenAddress: string,
  tokenName: string,
  amount: bigint,
  code: FungibleConditionCode = FungibleConditionCode.Equal
): PostCondition {
  const assetInfo = createAssetInfo(tokenAddress, tokenName, tokenName);

  return makeContractFungiblePostCondition(
    CONTRACT_ADDRESS,
    contractName,
    code,
    amount,
    assetInfo
  );
}

/**
 * Create multiple post-conditions for batch operations
 */
export function createBatchSTXPostConditions(
  transfers: Array<{
    from: string;
    to?: string;
    amount: bigint;
    isContract?: boolean;
  }>
): PostCondition[] {
  return transfers.map((transfer) => {
    if (transfer.isContract && transfer.to) {
      return createContractSTXPostCondition(transfer.to, transfer.amount);
    }
    return createUserSTXPostCondition(transfer.from, transfer.amount);
  });
}

/**
 * Create escrow post-conditions (lock funds)
 */
export function createEscrowPostConditions(
  userAddress: string,
  escrowContractName: string,
  amount: bigint
): PostCondition[] {
  return [
    // User must send exactly the amount
    createUserSTXPostCondition(
      userAddress,
      amount,
      FungibleConditionCode.Equal
    ),
  ];
}

/**
 * Create payout post-conditions (release funds)
 */
export function createPayoutPostConditions(
  payoutContractName: string,
  recipients: Array<{ address: string; amount: bigint }>
): PostCondition[] {
  return recipients.map((recipient) =>
    createUserSTXPostCondition(
      recipient.address,
      recipient.amount,
      FungibleConditionCode.GreaterEqual
    )
  );
}

/**
 * Create refund post-conditions
 */
export function createRefundPostConditions(
  userAddress: string,
  refundAmount: bigint,
  contractName: string
): PostCondition[] {
  return [
    createContractSTXPostCondition(
      contractName,
      refundAmount,
      FungibleConditionCode.Equal
    ),
  ];
}

/**
 * Condition code helpers
 */
export const ConditionCodes = {
  EQUAL: FungibleConditionCode.Equal,
  GREATER: FungibleConditionCode.Greater,
  GREATER_EQUAL: FungibleConditionCode.GreaterEqual,
  LESS: FungibleConditionCode.Less,
  LESS_EQUAL: FungibleConditionCode.LessEqual,
} as const;

/**
 * Validate post-condition amount
 */
export function validatePostConditionAmount(amount: bigint): boolean {
  return amount > 0n && amount <= BigInt(Number.MAX_SAFE_INTEGER);
}

/**
 * Calculate total post-condition amount
 */
export function calculateTotalAmount(
  transfers: Array<{ amount: bigint }>
): bigint {
  return transfers.reduce((total, transfer) => total + transfer.amount, 0n);
}
