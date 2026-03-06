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

/**
 * Read campaign details from the promo-manager contract
 * @param campaignId - The campaign ID to look up
 * @returns Promise with campaign data
 */
export async function readCampaignDetails(campaignId: number): Promise<ReadOnlyResult> {
  return callReadOnly({
    contractName: CONTRACTS.PROMO_MANAGER,
    functionName: 'get-campaign-details',
    functionArgs: [uintCV(BigInt(campaignId))],
  });
}

/**
 * Read user profile from the user-profiles contract
 * @param userAddress - The Stacks address to look up
 * @returns Promise with user profile data
 */
export async function readUserProfile(userAddress: string): Promise<ReadOnlyResult> {
  return callReadOnly({
    contractName: CONTRACTS.USER_PROFILES,
    functionName: 'get-user-details',
    functionArgs: [principalCV(userAddress)],
  });
}

/**
 * Read analytics metrics for a campaign
 * @param campaignId - The campaign ID to get metrics for
 * @returns Promise with analytics data
 */
export async function readAnalyticsMetrics(campaignId: number): Promise<ReadOnlyResult> {
  return callReadOnly({
    contractName: CONTRACTS.STATS_TRACKER,
    functionName: 'get-campaign-metrics',
    functionArgs: [uintCV(BigInt(campaignId))],
  });
}

/**
 * Read escrow balance for a campaign
 * @param campaignId - The campaign ID to check escrow for
 * @returns Promise with escrow balance data
 */
export async function readEscrowBalance(campaignId: number): Promise<ReadOnlyResult> {
  return callReadOnly({
    contractName: CONTRACTS.FUNDS_KEEPER,
    functionName: 'get-escrow-balance',
    functionArgs: [uintCV(BigInt(campaignId))],
  });
}

/**
 * Read publisher earnings for a specific campaign
 * @param publisherAddress - The publisher's Stacks address
 * @param campaignId - The campaign ID
 * @returns Promise with earnings data
 */
export async function readPublisherEarnings(
  publisherAddress: string,
  campaignId: number
): Promise<ReadOnlyResult> {
  return callReadOnly({
    contractName: CONTRACTS.CASH_DISTRIBUTOR,
    functionName: 'get-publisher-earnings',
    functionArgs: [principalCV(publisherAddress), uintCV(BigInt(campaignId))],
  });
}

/**
 * Read fraud score for a campaign
 * @param campaignId - The campaign ID to check
 * @returns Promise with fraud scoring data
 */
export async function readFraudScore(campaignId: number): Promise<ReadOnlyResult> {
  return callReadOnly({
    contractName: CONTRACTS.THREAT_DETECTOR,
    functionName: 'get-fraud-score',
    functionArgs: [uintCV(BigInt(campaignId))],
  });
}
