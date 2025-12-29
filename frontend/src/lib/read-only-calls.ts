/**
 * Read-Only Contract Call Utilities for Clarity v4
 * Query contract state without transactions
 */

import {
  callReadOnlyFunction,
  ClarityValue,
  cvToValue,
} from '@stacks/transactions';
import { StacksNetwork } from '@stacks/network';
import { NETWORK, CONTRACT_ADDRESS, ContractName } from './stacks-config';
import { parseResponse, parseTuple, parseList } from './clarity-converters';

export interface ReadOnlyOptions {
  contractName: ContractName;
  functionName: string;
  functionArgs: ClarityValue[];
  senderAddress?: string;
  network?: StacksNetwork;
}

export interface ReadOnlyResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Call read-only contract function
 */
export async function callReadOnly<T = any>(
  options: ReadOnlyOptions
): Promise<ReadOnlyResult<T>> {
  try {
    const result = await callReadOnlyFunction({
      contractAddress: CONTRACT_ADDRESS,
      contractName: options.contractName,
      functionName: options.functionName,
      functionArgs: options.functionArgs,
      network: options.network || NETWORK,
      senderAddress: options.senderAddress || CONTRACT_ADDRESS,
    });

    const value = cvToValue(result);

    return {
      success: true,
      data: value as T,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Read-only call failed',
    };
  }
}

/**
 * Get campaign details from promo-manager contract
 */
export async function getCampaignDetails(
  campaignId: number
): Promise<ReadOnlyResult> {
  return callReadOnly({
    contractName: 'promo-manager',
    functionName: 'get-campaign-details',
    functionArgs: [{ type: 'uint', value: BigInt(campaignId) }],
  });
}

/**
 * Get user profile from user-profiles contract
 */
export async function getUserProfile(
  userAddress: string
): Promise<ReadOnlyResult> {
  return callReadOnly({
    contractName: 'user-profiles',
    functionName: 'get-user-details',
    functionArgs: [
      {
        type: 'principal',
        value: { address: userAddress },
      },
    ],
  });
}

/**
 * Get analytics metrics from stats-tracker
 */
export async function getAnalyticsMetrics(
  campaignId: number
): Promise<ReadOnlyResult> {
  return callReadOnly({
    contractName: 'stats-tracker',
    functionName: 'get-campaign-metrics',
    functionArgs: [{ type: 'uint', value: BigInt(campaignId) }],
  });
}

/**
 * Get escrow balance from funds-keeper
 */
export async function getEscrowBalance(
  campaignId: number
): Promise<ReadOnlyResult<bigint>> {
  const result = await callReadOnly({
    contractName: 'funds-keeper',
    functionName: 'get-escrow-balance',
    functionArgs: [{ type: 'uint', value: BigInt(campaignId) }],
  });

  if (result.success && result.data) {
    return {
      success: true,
      data: BigInt(result.data),
    };
  }

  return result;
}

/**
 * Check if user is verified
 */
export async function isUserVerified(
  userAddress: string
): Promise<ReadOnlyResult<boolean>> {
  const result = await callReadOnly({
    contractName: 'user-profiles',
    functionName: 'is-user-verified',
    functionArgs: [
      {
        type: 'principal',
        value: { address: userAddress },
      },
    ],
  });

  if (result.success) {
    return {
      success: true,
      data: Boolean(result.data),
    };
  }

  return result;
}

/**
 * Get publisher earnings
 */
export async function getPublisherEarnings(
  publisherAddress: string,
  campaignId: number
): Promise<ReadOnlyResult<bigint>> {
  const result = await callReadOnly({
    contractName: 'cash-distributor',
    functionName: 'get-publisher-earnings',
    functionArgs: [
      {
        type: 'principal',
        value: { address: publisherAddress },
      },
      { type: 'uint', value: BigInt(campaignId) },
    ],
  });

  if (result.success && result.data) {
    return {
      success: true,
      data: BigInt(result.data),
    };
  }

  return result;
}

/**
 * Get auction bid details
 */
export async function getAuctionBid(
  auctionId: number,
  bidder: string
): Promise<ReadOnlyResult> {
  return callReadOnly({
    contractName: 'offer-exchange',
    functionName: 'get-bid-details',
    functionArgs: [
      { type: 'uint', value: BigInt(auctionId) },
      {
        type: 'principal',
        value: { address: bidder },
      },
    ],
  });
}

/**
 * Get fraud score for campaign
 */
export async function getFraudScore(
  campaignId: number
): Promise<ReadOnlyResult<number>> {
  const result = await callReadOnly({
    contractName: 'threat-detector',
    functionName: 'get-fraud-score',
    functionArgs: [{ type: 'uint', value: BigInt(campaignId) }],
  });

  if (result.success && result.data) {
    return {
      success: true,
      data: Number(result.data),
    };
  }

  return result;
}

/**
 * Batch read-only calls
 */
export async function batchReadOnly<T = any>(
  calls: ReadOnlyOptions[]
): Promise<ReadOnlyResult<T>[]> {
  return Promise.all(calls.map((call) => callReadOnly<T>(call)));
}

/**
 * Get contract info
 */
export async function getContractInfo(
  contractName: ContractName
): Promise<ReadOnlyResult> {
  try {
    const response = await fetch(
      `${NETWORK.client.baseUrl}/v2/contracts/interface/${CONTRACT_ADDRESS}/${contractName}`
    );

    const data = await response.json();

    return {
      success: true,
      data,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch contract info',
    };
  }
}
