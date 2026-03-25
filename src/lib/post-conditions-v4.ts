/**
 * post-conditions-v4.ts
 * Stacks post-condition builders for AdStack Clarity 4 contracts.
 * In Clarity 4, STX flows through the CONTRACT_OWNER admin wallet
 * instead of the contract itself, so post-conditions target principals.
 */

import {
  makeStandardSTXPostCondition,
  makeContractSTXPostCondition,
  FungibleConditionCode,
  PostConditionMode,
} from '@stacks/transactions';
import { CONTRACT_ADDRESS } from './stacks-config';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

export { PostConditionMode };

export const PostConditionCode = FungibleConditionCode;

// ---------------------------------------------------------------------------
// Campaign Budget Post-Conditions (Clarity 4)
// ---------------------------------------------------------------------------

/**
 * Post-condition ensuring the advertiser sends exactly the campaign budget.
 * Clarity 4: STX goes to CONTRACT_OWNER, not a contract escrow address.
 */
export function campaignBudgetPostCondition(
  advertiserAddress: string,
  budgetMicroStx: bigint,
) {
  return makeStandardSTXPostCondition(
    advertiserAddress,
    FungibleConditionCode.Equal,
    budgetMicroStx,
  );
}

/**
 * Post-condition for publisher payout from admin wallet.
 * Clarity 4: CONTRACT_OWNER issues the release from their STX balance.
 */
export function publisherPayoutPostCondition(
  adminAddress: string,
  amountMicroStx: bigint,
) {
  return makeStandardSTXPostCondition(
    adminAddress,
    FungibleConditionCode.LessEqual,
    amountMicroStx,
  );
}

/**
 * Post-condition ensuring the admin sends at most the refund amount.
 * Clarity 4: Refund is issued by CONTRACT_OWNER to the advertiser.
 */
export function refundPostCondition(
  adminAddress: string,
  maxRefundMicroStx: bigint,
) {
  return makeStandardSTXPostCondition(
    adminAddress,
    FungibleConditionCode.LessEqual,
    maxRefundMicroStx,
  );
}

// ---------------------------------------------------------------------------
// Generic Helpers
// ---------------------------------------------------------------------------

/**
 * Build a post-condition requiring exactly amount STX from a principal.
 */
export function exactSTXFromAddress(
  address: string,
  amountMicroStx: bigint,
) {
  return makeStandardSTXPostCondition(
    address,
    FungibleConditionCode.Equal,
    amountMicroStx,
  );
}

/**
 * Build a post-condition requiring at most amount STX from a contract.
 */
export function maxSTXFromContract(
  contractAddress: string,
  contractName: string,
  amountMicroStx: bigint,
) {
  return makeContractSTXPostCondition(
    contractAddress,
    contractName,
    FungibleConditionCode.LessEqual,
    amountMicroStx,
  );
}

// ---------------------------------------------------------------------------
// Batch Builders
// ---------------------------------------------------------------------------

/**
 * Build full post-conditions for campaign creation (advertiser -> admin).
 */
export function buildCampaignCreationConditions(
  advertiserAddress: string,
  budgetMicroStx: bigint,
): ReturnType<typeof makeStandardSTXPostCondition>[] {
  return [campaignBudgetPostCondition(advertiserAddress, budgetMicroStx)];
}

/**
 * Build post-conditions for payout release (admin -> publisher).
 */
export function buildPayoutReleaseConditions(
  adminAddress: string,
  amountMicroStx: bigint,
): ReturnType<typeof makeStandardSTXPostCondition>[] {
  return [publisherPayoutPostCondition(adminAddress, amountMicroStx)];
}
